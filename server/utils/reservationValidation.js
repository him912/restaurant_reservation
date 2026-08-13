const { isBeyondBookingWindow } = require("./bookingRules");
const { getReservationDateTime } = require("./reservationLifecycle");

const MAX_SPECIAL_REQUESTS_LENGTH = 500;

const hasText = (value) => String(value || "").trim().length > 0;

const isValidPhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
};

const validateReservationContactFields = ({
  customerPhone,
  specialRequests,
  requirePhone = true,
}) => {
  if (requirePhone && !hasText(customerPhone)) {
    return "Phone number is required";
  }

  if (hasText(customerPhone) && !isValidPhone(customerPhone)) {
    return "Enter a valid phone number (at least 10 digits)";
  }

  const special = String(specialRequests || "").trim();
  if (special.length > MAX_SPECIAL_REQUESTS_LENGTH) {
    return `Special requests must be ${MAX_SPECIAL_REQUESTS_LENGTH} characters or fewer`;
  }

  return null;
};

const validatePartySize = (partySize, maxCapacity = 20) => {
  const size = Number(partySize);
  if (!Number.isFinite(size) || size < 1) {
    return "Party size must be at least 1";
  }
  if (size > maxCapacity) {
    return `This restaurant only seats up to ${maxCapacity} guests`;
  }
  return null;
};

const validateReservationDateTime = ({ date, time, dateStr }) => {
  if (!dateStr && !date) {
    return "Date is required";
  }

  const dateForWindow =
    dateStr || (date instanceof Date ? date.toISOString().split("T")[0] : String(date));

  if (isBeyondBookingWindow(dateForWindow)) {
    return "Bookings can only be made up to 2 months in advance";
  }

  if (!hasText(time)) {
    return "Time is required";
  }

  const bookingDateTime = getReservationDateTime({ date: dateForWindow, time });
  if (!bookingDateTime || bookingDateTime.getTime() <= Date.now()) {
    return "Cannot book for a past date or time";
  }

  return null;
};

module.exports = {
  MAX_SPECIAL_REQUESTS_LENGTH,
  isValidPhone,
  validateReservationContactFields,
  validatePartySize,
  validateReservationDateTime,
};
