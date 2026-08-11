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

export const getReservationDateTime = (reservation) => {
  const dateSource = reservation?.date || reservation?.bookingDate;
  if (!dateSource) return null;

  const date = new Date(dateSource);
  if (Number.isNaN(date.getTime())) return null;

  const time = reservation?.time || reservation?.bookingTime;
  const parts = parseTimeParts(time);
  if (!parts) return null;

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  return new Date(year, month, day, parts.hours, parts.minutes, 0, 0);
};

export const isReservationPast = (reservation) => {
  const bookingDateTime = getReservationDateTime(reservation);
  if (!bookingDateTime) return false;
  return bookingDateTime.getTime() < Date.now();
};

export const canAcceptReservation = (reservation, paymentConfig) => {
  if (reservation?.status !== "pending") return false;
  if (isReservationPast(reservation)) return false;
  if (paymentConfig?.enabled && reservation.paymentStatus !== "paid") return false;
  return true;
};
