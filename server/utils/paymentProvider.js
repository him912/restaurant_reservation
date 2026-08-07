const getPaymentProvider = () => {
  const explicit = (process.env.PAYMENT_PROVIDER || "").toLowerCase();
  if (["razorpay", "stripe", "demo"].includes(explicit)) {
    return explicit;
  }

  if ((process.env.PAYMENT_CURRENCY || "inr").toLowerCase() === "inr") {
    return "razorpay";
  }

  return "stripe";
};

const isRazorpayConfigured = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

const isStripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);

const isPaymentEnabled = () => {
  const provider = getPaymentProvider();
  if (provider === "demo") return false;
  if (provider === "razorpay") return isRazorpayConfigured();
  return isStripeConfigured();
};

module.exports = {
  getPaymentProvider,
  isRazorpayConfigured,
  isStripeConfigured,
  isPaymentEnabled,
};
