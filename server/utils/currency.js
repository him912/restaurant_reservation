const PAYMENT_CURRENCY = (process.env.PAYMENT_CURRENCY || "inr").toLowerCase();

const CURRENCY_META = {
  inr: { symbol: "₹", locale: "en-IN", name: "Indian Rupee" },
  usd: { symbol: "$", locale: "en-US", name: "US Dollar" },
};

const getCurrencyMeta = (currency = PAYMENT_CURRENCY) =>
  CURRENCY_META[currency] || {
    symbol: currency.toUpperCase(),
    locale: "en-IN",
    name: currency,
  };

const depositPerGuestMinorUnits = () => {
  const fromEnv =
    process.env.BOOKING_DEPOSIT_MINOR_UNITS_PER_GUEST ||
    process.env.BOOKING_DEPOSIT_CENTS_PER_GUEST;

  if (fromEnv) {
    const value = Number(fromEnv);
    if (Number.isFinite(value) && value > 0) return value;
  }

  return PAYMENT_CURRENCY === "inr" ? 50000 : 1000;
};

const formatMajorUnits = (minorUnits, currency = PAYMENT_CURRENCY) => {
  const meta = getCurrencyMeta(currency);
  const major = Number(minorUnits || 0) / 100;

  return new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(major);
};

module.exports = {
  PAYMENT_CURRENCY,
  getCurrencyMeta,
  depositPerGuestMinorUnits,
  formatMajorUnits,
};
