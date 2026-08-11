import { openRazorpayCheckout } from "./razorpayCheckout";
import { api } from "../api";

const mergeReservation = (reservation, paymentReservation) => {
  if (!paymentReservation) return reservation;

  return {
    ...reservation,
    paymentStatus: paymentReservation.paymentStatus || reservation.paymentStatus,
    paymentAmount: Number(
      paymentReservation.paymentAmount ?? reservation.paymentAmount ?? 0,
    ),
    paymentCurrency:
      paymentReservation.paymentCurrency || reservation.paymentCurrency || "inr",
    paidAt: paymentReservation.paidAt || reservation.paidAt || null,
    status:
      paymentReservation.status === "reserved"
        ? "confirmed"
        : paymentReservation.status || reservation.status,
  };
};

export const canRetryPayment = (reservation, paymentConfig) =>
  Boolean(paymentConfig?.enabled) &&
  reservation?.paymentStatus !== "paid" &&
  reservation?.status !== "cancelled";

export const isReservationConfirmed = (reservation) =>
  reservation?.status === "confirmed" || reservation?.status === "reserved";

export const isPaidAndConfirmed = (reservation) =>
  reservation?.paymentStatus === "paid" && isReservationConfirmed(reservation);

export const canCustomerEditReservation = (reservation) =>
  reservation?.status !== "cancelled" && !isPaidAndConfirmed(reservation);

export const canCustomerCancelReservation = (reservation) =>
  reservation?.status !== "cancelled" && !isPaidAndConfirmed(reservation);

export const getPaymentStatusLabel = (paymentStatus) => {
  switch (paymentStatus) {
    case "paid":
      return "paid";
    case "pending":
      return "payment pending";
    case "failed":
      return "payment failed";
    case "refunded":
      return "refunded";
    default:
      return "unpaid";
  }
};

export const processReservationPayment = async ({
  reservation,
  currentUser,
  paymentConfig,
  existingPayment = null,
  onPaid,
  onFailed,
}) => {
  const payment =
    existingPayment || (await api.createPaymentCheckout(reservation.id));

  if (payment?.reservation) {
    Object.assign(reservation, mergeReservation(reservation, payment.reservation));
  }

  if (payment?.alreadyPaid || payment?.demoMode) {
    const updated = mergeReservation(reservation, payment.reservation);
    onPaid?.(updated);
    return updated;
  }

  if (payment?.checkoutUrl) {
    window.location.href = payment.checkoutUrl;
    return null;
  }

  if (payment?.razorpayOrder) {
    const keyId = payment.keyId || paymentConfig?.keyId;
    if (!keyId) {
      throw new Error("Payment is not configured on the server.");
    }

    const verified = await openRazorpayCheckout({
      keyId,
      order: payment.razorpayOrder,
      reservationId: reservation.id,
      user: {
        name: currentUser?.name || reservation.customerName,
        email: currentUser?.email || reservation.customerEmail,
        phone: currentUser?.phone || reservation.customerPhone,
      },
      restaurantName: reservation.restaurantName,
      verifyPayment: api.verifyRazorpayPayment,
      onSuccess: (paidReservation) => {
        const updated = mergeReservation(reservation, paidReservation);
        onPaid?.(updated);
      },
      onDismiss: async () => {
        try {
          await api.markPaymentFailed(reservation.id);
        } catch (error) {
          console.error(error);
        }
        onFailed?.("cancelled");
      },
      onPaymentFailed: async () => {
        try {
          await api.markPaymentFailed(reservation.id);
        } catch (error) {
          console.error(error);
        }
        onFailed?.("failed");
      },
    });

    return verified;
  }

  return null;
};
