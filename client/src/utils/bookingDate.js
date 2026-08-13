const parseBookingTimeParts = (time) => {
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

export const BOOKING_WINDOW_MONTHS = 2;

const formatDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getTodayDateString = () => formatDateString(new Date());

export const getMaxBookingDateString = () => {
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + BOOKING_WINDOW_MONTHS);
  return formatDateString(maxDate);
};

export const isPastBookingDate = (dateStr) => {
  if (!dateStr) return false;
  return dateStr < getTodayDateString();
};

export const isBeyondBookingWindow = (dateStr) => {
  if (!dateStr) return false;
  return dateStr > getMaxBookingDateString();
};

export const isDateWithinBookingWindow = (dateStr) => {
  if (!dateStr) return false;
  return !isPastBookingDate(dateStr) && !isBeyondBookingWindow(dateStr);
};

export const isPastBookingSlot = (dateStr, time) => {
  if (!dateStr || !time) return false;

  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return false;

  const timeParts = parseBookingTimeParts(time);
  if (!timeParts) return false;

  const slotDateTime = new Date(
    parts[0],
    parts[1] - 1,
    parts[2],
    timeParts.hours,
    timeParts.minutes,
    0,
    0,
  );
  return slotDateTime.getTime() < Date.now();
};
