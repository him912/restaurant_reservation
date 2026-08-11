const Reservation = require("../models/Reservation");
const { isPaymentEnabled } = require("./paymentProvider");

const parseTimeParts = (time) => {
  const raw = String(time || "").trim();
  const match24 = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    return { hours: Number(match24[1]), minutes: Number(match24[2]) };
  }

  const match12 = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (match12) {
    let hours = Number(match12[1]);
    const minutes = match12[2] ? Number(match12[2]) : 0;
    const meridiem = match12[3].toUpperCase();
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    return { hours, minutes };
  }

  return null;
};

const getReservationDateTime = (reservation) => {
  const date = new Date(reservation.date);
  if (Number.isNaN(date.getTime())) return null;

  const parts = parseTimeParts(reservation.time);
  if (!parts) return null;

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  return new Date(year, month, day, parts.hours, parts.minutes, 0, 0);
};

const isReservationPast = (reservation) => {
  const bookingDateTime = getReservationDateTime(reservation);
  if (!bookingDateTime) return false;
  return bookingDateTime.getTime() < Date.now();
};

const assertCanAcceptReservation = (reservation) => {
  if (isReservationPast(reservation)) {
    const error = new Error(
      "Cannot accept — booking date and time have already passed",
    );
    error.statusCode = 400;
    throw error;
  }

  if (isPaymentEnabled() && reservation.paymentStatus !== "paid") {
    const error = new Error(
      "Cannot accept — deposit payment has not been completed",
    );
    error.statusCode = 400;
    throw error;
  }
};

const reconcileReservations = async (filter = {}) => {
  const paymentRequired = isPaymentEnabled();
  const candidates = await Reservation.find({
    ...filter,
    status: { $in: ["pending", "reserved"] },
  });

  const toCancel = [];
  const toPending = [];

  for (const reservation of candidates) {
    if (isReservationPast(reservation)) {
      toCancel.push(reservation._id);
      continue;
    }

    if (
      paymentRequired &&
      reservation.status === "reserved" &&
      reservation.paymentStatus !== "paid"
    ) {
      toPending.push(reservation._id);
    }
  }

  if (toCancel.length > 0) {
    await Reservation.updateMany(
      { _id: { $in: toCancel } },
      { $set: { status: "cancelled" } },
    );
  }

  if (toPending.length > 0) {
    await Reservation.updateMany(
      { _id: { $in: toPending } },
      { $set: { status: "pending" } },
    );
  }

  return { cancelled: toCancel.length, reverted: toPending.length };
};

module.exports = {
  getReservationDateTime,
  isReservationPast,
  assertCanAcceptReservation,
  reconcileReservations,
};
