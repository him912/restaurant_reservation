const crypto = require("crypto");
const Stripe = require("stripe");
const Razorpay = require("razorpay");
const Reservation = require("../models/Reservation");
const {
  PAYMENT_CURRENCY,
  depositPerGuestMinorUnits,
  formatMajorUnits,
} = require("../utils/currency");
const {
  getPaymentProvider,
  isRazorpayConfigured,
  isStripeConfigured,
  isPaymentEnabled,
} = require("../utils/paymentProvider");

const getStripe = () => {
  if (!isStripeConfigured()) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

const getRazorpay = () => {
  if (!isRazorpayConfigured()) return null;
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const clientBaseUrl = () =>
  (process.env.CLIENT_URL || "http://localhost:3000").replace(/\/$/, "");

const loadReservationForPayment = async (reservationId, userId) => {
  const reservation = await Reservation.findById(reservationId).populate(
    "restaurantId",
    "name",
  );

  if (!reservation) {
    const error = new Error("Reservation not found");
    error.statusCode = 404;
    throw error;
  }

  if (reservation.userId.toString() !== userId) {
    const error = new Error("Not authorized for this reservation");
    error.statusCode = 403;
    throw error;
  }

  return reservation;
};

const markDemoPaid = async (reservation, amount) => {
  reservation.paymentStatus = "paid";
  reservation.paymentProvider = "demo";
  reservation.paidAt = new Date();
  reservation.paymentAmount = amount;
  reservation.paymentCurrency = PAYMENT_CURRENCY;
  await reservation.save();

  return {
    demoMode: true,
    alreadyPaid: true,
    reservation,
    checkoutUrl: null,
    amount,
    provider: "demo",
  };
};

const createRazorpayOrder = async (reservation, amount, userId) => {
  const razorpay = getRazorpay();
  const restaurantName =
    reservation.restaurantId?.name || "Restaurant reservation";

  if (!razorpay) {
    return markDemoPaid(reservation, amount);
  }

  const order = await razorpay.orders.create({
    amount,
    currency: PAYMENT_CURRENCY.toUpperCase(),
    receipt: `res_${reservation._id.toString().slice(-12)}`,
    notes: {
      reservationId: reservation._id.toString(),
      userId: String(userId),
    },
  });

  reservation.paymentStatus = "pending";
  reservation.paymentProvider = "razorpay";
  reservation.paymentAmount = amount;
  reservation.paymentCurrency = PAYMENT_CURRENCY;
  reservation.razorpayOrderId = order.id;
  await reservation.save();

  return {
    demoMode: false,
    alreadyPaid: false,
    provider: "razorpay",
    keyId: process.env.RAZORPAY_KEY_ID,
    checkoutUrl: null,
    amount,
    reservation,
    razorpayOrder: {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    },
    orderDescription: `Booking deposit — ${restaurantName}`,
  };
};

const createStripeSession = async (reservation, amount, userId, req) => {
  const stripe = getStripe();
  const restaurantName =
    reservation.restaurantId?.name || "Restaurant reservation";
  const restaurantId =
    reservation.restaurantId?._id?.toString() ||
    reservation.restaurantId?.toString();

  if (!stripe) {
    return markDemoPaid(reservation, amount);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: req.user?.email || undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: PAYMENT_CURRENCY,
          unit_amount: amount,
          product_data: {
            name: `Booking deposit — ${restaurantName}`,
            description: `${reservation.partySize} guest(s) on ${reservation.date
              .toISOString()
              .split("T")[0]} at ${reservation.time}`,
          },
        },
      },
    ],
    metadata: {
      reservationId: reservation._id.toString(),
      userId: String(userId),
    },
    success_url: `${clientBaseUrl()}/#/restaurant/${restaurantId}?payment=success&reservationId=${reservation._id}`,
    cancel_url: `${clientBaseUrl()}/#/restaurant/${restaurantId}?payment=cancelled&reservationId=${reservation._id}`,
  });

  reservation.paymentStatus = "pending";
  reservation.paymentProvider = "stripe";
  reservation.paymentAmount = amount;
  reservation.paymentCurrency = PAYMENT_CURRENCY;
  reservation.stripeSessionId = session.id;
  await reservation.save();

  return {
    demoMode: false,
    alreadyPaid: false,
    provider: "stripe",
    checkoutUrl: session.url,
    sessionId: session.id,
    amount,
    reservation,
  };
};

exports.createCheckoutSession = async (req, res) => {
  try {
    const { reservationId } = req.body;
    const userId = req.user?.id;

    if (!reservationId) {
      return res.status(400).json({
        success: false,
        message: "reservationId is required",
      });
    }

    const reservation = await loadReservationForPayment(reservationId, userId);

    if (reservation.paymentStatus === "paid") {
      return res.status(200).json({
        success: true,
        message: "Reservation already paid",
        data: {
          alreadyPaid: true,
          reservation,
          checkoutUrl: null,
          provider: reservation.paymentProvider || getPaymentProvider(),
        },
      });
    }

    const amount =
      depositPerGuestMinorUnits() * Number(reservation.partySize || 1);
    const provider = getPaymentProvider();

    let data;
    if (provider === "razorpay") {
      data = await createRazorpayOrder(reservation, amount, userId);
    } else if (provider === "stripe") {
      data = await createStripeSession(reservation, amount, userId, req);
    } else {
      data = await markDemoPaid(reservation, amount);
    }

    res.status(200).json({
      success: true,
      message: data.demoMode
        ? "Payment recorded (demo mode — payment keys not configured)"
        : "Checkout session created",
      data,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      reservationId,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = req.body;
    const userId = req.user?.id;

    if (!reservationId || !orderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay payment verification fields",
      });
    }

    const reservation = await Reservation.findById(reservationId)
      .populate("restaurantId", "name cuisineType restaurantImage")
      .populate("userId", "username email");

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      });
    }

    if (reservation.userId?._id?.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(503).json({
        success: false,
        message: "Razorpay is not configured on the server",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (expectedSignature !== signature) {
      reservation.paymentStatus = "failed";
      await reservation.save();
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    reservation.paymentStatus = "paid";
    reservation.paidAt = new Date();
    reservation.paymentProvider = "razorpay";
    reservation.razorpayOrderId = orderId;
    reservation.razorpayPaymentId = paymentId;
    await reservation.save();

    res.status(200).json({
      success: true,
      message: "Payment verified",
      data: reservation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const userId = req.user?.id;

    const reservation = await Reservation.findById(reservationId)
      .populate("restaurantId", "name cuisineType restaurantImage")
      .populate("userId", "username email");

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      });
    }

    const isOwner = reservation.userId?._id?.toString() === userId;
    const isAdmin = req.user?.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const stripe = getStripe();
    if (
      stripe &&
      reservation.stripeSessionId &&
      reservation.paymentStatus !== "paid"
    ) {
      const session = await stripe.checkout.sessions.retrieve(
        reservation.stripeSessionId,
      );

      if (session.payment_status === "paid") {
        reservation.paymentStatus = "paid";
        reservation.paidAt = new Date();
        reservation.stripePaymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id || "";
        await reservation.save();
      } else if (session.status === "expired") {
        reservation.paymentStatus = "failed";
        await reservation.save();
      }
    }

    const razorpay = getRazorpay();
    if (
      razorpay &&
      reservation.razorpayOrderId &&
      reservation.paymentStatus !== "paid"
    ) {
      const payments = await razorpay.orders.fetchPayments(
        reservation.razorpayOrderId,
      );
      const captured = payments.items?.find((item) => item.status === "captured");
      if (captured) {
        reservation.paymentStatus = "paid";
        reservation.paidAt = new Date();
        reservation.razorpayPaymentId = captured.id;
        if (captured.amount) {
          reservation.paymentAmount = captured.amount;
        }
        await reservation.save();
      }
    }

    res.status(200).json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.stripeWebhook = async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(200).json({ received: true, skipped: true });
  }

  const signature = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret,
      );
    } else {
      event = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    }
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const reservationId = session.metadata?.reservationId;
      if (reservationId) {
        const reservation = await Reservation.findById(reservationId);
        if (reservation) {
          reservation.paymentStatus = "paid";
          reservation.paidAt = new Date();
          reservation.paymentProvider = "stripe";
          reservation.stripeSessionId = session.id;
          reservation.stripePaymentIntentId =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : "";
          if (session.amount_total) {
            reservation.paymentAmount = session.amount_total;
          }
          await reservation.save();
        }
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      const reservationId = session.metadata?.reservationId;
      if (reservationId) {
        await Reservation.findByIdAndUpdate(reservationId, {
          paymentStatus: "failed",
        });
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getPaymentConfig = async (_req, res) => {
  const perGuest = depositPerGuestMinorUnits();
  const provider = getPaymentProvider();

  res.status(200).json({
    success: true,
    data: {
      provider,
      enabled: isPaymentEnabled(),
      keyId:
        provider === "razorpay" ? process.env.RAZORPAY_KEY_ID || "" : "",
      currency: PAYMENT_CURRENCY,
      depositPerGuestCents: perGuest,
      depositPerGuestMinorUnits: perGuest,
      depositPerGuestDisplay: formatMajorUnits(perGuest),
      depositPerGuestDollars: (perGuest / 100).toFixed(2),
    },
  });
};
