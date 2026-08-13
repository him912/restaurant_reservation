import {
  isDateWithinBookingWindow,
  isPastBookingSlot,
  BOOKING_WINDOW_MONTHS,
} from "./bookingDate";
import { isValidPhone } from "./contactValidation";
import { getFirstFormError } from "./restaurantFormValidation";

export const MAX_SPECIAL_REQUESTS_LENGTH = 500;

export const validateReservationEditForm = (fields, options = {}) => {
  const errors = {};
  const maxGuests = Number(options.maxGuests) || 10;

  if (!String(fields.date || "").trim()) {
    errors.date = "Date is required.";
  } else if (!isDateWithinBookingWindow(fields.date)) {
    errors.date = `Choose a date within the next ${BOOKING_WINDOW_MONTHS} months.`;
  }

  if (!String(fields.time || "").trim()) {
    errors.time = "Time is required.";
  } else if (fields.date && isPastBookingSlot(fields.date, fields.time)) {
    errors.time = "This time has already passed.";
  }

  const guests = Number(fields.guests);
  if (!Number.isFinite(guests) || guests < 1) {
    errors.guests = "Select at least 1 guest.";
  } else if (guests > maxGuests) {
    errors.guests = `Maximum ${maxGuests} guests allowed.`;
  }

  if (!String(fields.customerPhone || "").trim()) {
    errors.customerPhone = "Phone number is required.";
  } else if (!isValidPhone(fields.customerPhone)) {
    errors.customerPhone = "Enter a valid phone number (at least 10 digits).";
  }

  const special = String(fields.specialRequests || "").trim();
  if (special.length > MAX_SPECIAL_REQUESTS_LENGTH) {
    errors.specialRequests = `Keep special requests under ${MAX_SPECIAL_REQUESTS_LENGTH} characters.`;
  }

  return errors;
};

export { getFirstFormError };
