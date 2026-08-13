const Reservation = require("../models/Reservation");
const { getReservationDateTime } = require("./reservationLifecycle");

const BOOKING_WINDOW_MONTHS = 2;
const ACTIVE_RESERVATION_STATUSES = ["pending", "reserved"];

const formatDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayDateString = () => formatDateString(new Date());

const getMaxBookingDateString = () => {
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + BOOKING_WINDOW_MONTHS);
  return formatDateString(maxDate);
};

const getMaxBookingDate = () => {
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + BOOKING_WINDOW_MONTHS);
  maxDate.setHours(23, 59, 59, 999);
  return maxDate;
};

const isBeyondBookingWindow = (dateInput) => {
  const dateStr =
    typeof dateInput === "string"
      ? dateInput.trim()
      : dateInput instanceof Date
        ? dateInput.toISOString().split("T")[0]
        : "";

  if (!dateStr) return false;
  return dateStr > getMaxBookingDateString();
};

const isWithinBookingWindow = (dateInput, time) => {
  const bookingDateTime = getReservationDateTime({
    date: dateInput,
    time: time || "23:59",
  });

  if (!bookingDateTime) return false;

  const now = Date.now();
  const maxDate = getMaxBookingDate();

  return bookingDateTime.getTime() > now && bookingDateTime.getTime() <= maxDate.getTime();
};

const findActiveUserRestaurantReservation = async (
  userId,
  restaurantId,
  excludeReservationId = null,
) => {
  const query = {
    userId,
    restaurantId,
    status: { $in: ACTIVE_RESERVATION_STATUSES },
  };

  if (excludeReservationId) {
    query._id = { $ne: excludeReservationId };
  }

  return Reservation.findOne(query);
};

module.exports = {
  BOOKING_WINDOW_MONTHS,
  ACTIVE_RESERVATION_STATUSES,
  getTodayDateString,
  getMaxBookingDateString,
  getMaxBookingDate,
  isBeyondBookingWindow,
  isWithinBookingWindow,
  findActiveUserRestaurantReservation,
};
