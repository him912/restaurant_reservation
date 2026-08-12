const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidRestaurantEmail = (email) =>
  EMAIL_PATTERN.test(String(email || "").trim());

const hasText = (value) => String(value || "").trim().length > 0;

export const validateOwnerRestaurantCreateForm = (fields) => {
  const errors = {};

  if (!hasText(fields.name)) {
    errors.name = "Restaurant name is required.";
  }

  if (!hasText(fields.description)) {
    errors.description = "About / description is required.";
  }

  if (!hasText(fields.openingTime)) {
    errors.openingTime = "Opening time is required.";
  }

  if (!hasText(fields.closingTime)) {
    errors.closingTime = "Closing time is required.";
  }

  if (!hasText(fields.phone)) {
    errors.phone = "Phone number is required.";
  }

  if (!hasText(fields.email)) {
    errors.email = "Email address is required.";
  } else if (!isValidRestaurantEmail(fields.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!hasText(fields.address)) {
    errors.address = "Address is required.";
  }

  if (!hasText(fields.city)) {
    errors.city = "City is required.";
  }

  if (!hasText(fields.cuisine)) {
    errors.cuisine = "Cuisine type is required.";
  }

  const capacity = Number(fields.capacity);
  if (!Number.isFinite(capacity) || capacity < 1) {
    errors.capacity = "Seating capacity must be at least 1.";
  }

  return errors;
};

export const validateOwnerRestaurantEditForm = (fields) => {
  const errors = {};

  if (!hasText(fields.name)) {
    errors.name = "Restaurant name is required.";
  }

  if (!hasText(fields.description)) {
    errors.description = "About / description is required.";
  }

  if (!hasText(fields.openingHours)) {
    errors.openingHours = "Core operations hours are required.";
  } else {
    const parts = String(fields.openingHours)
      .split("-")
      .map((part) => part.trim());
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      errors.openingHours =
        "Use format: opening - closing (e.g. 9:00 AM - 10:00 PM).";
    }
  }

  if (!hasText(fields.phone)) {
    errors.phone = "Phone number is required.";
  }

  if (!hasText(fields.email)) {
    errors.email = "Email address is required.";
  } else if (!isValidRestaurantEmail(fields.email)) {
    errors.email = "Enter a valid email address.";
  }

  const capacity = Number(fields.capacity);
  if (!Number.isFinite(capacity) || capacity < 1) {
    errors.capacity = "Seating capacity must be at least 1.";
  }

  return errors;
};

export const getFirstFormError = (errors) => {
  const values = Object.values(errors || {});
  return values.length > 0 ? values[0] : null;
};

export const validateMenuItemForm = (fields) => {
  const errors = {};

  if (!hasText(fields.name)) {
    errors.name = "Dish name is required.";
  }

  if (!hasText(fields.category)) {
    errors.category = "Category is required.";
  }

  if (!hasText(fields.description)) {
    errors.description = "Description is required.";
  }

  const priceRaw = String(fields.price ?? "").trim();
  if (!priceRaw) {
    errors.price = "Price is required.";
  } else {
    const price = Number(priceRaw);
    if (!Number.isFinite(price) || price <= 0) {
      errors.price = "Price must be greater than 0.";
    }
  }

  return errors;
};
