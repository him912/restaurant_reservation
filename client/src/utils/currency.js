const CURRENCY_META = {
  inr: { symbol: "₹", locale: "en-IN" },
  usd: { symbol: "$", locale: "en-US" },
};

export const DEFAULT_CURRENCY = "inr";

const getMeta = (currency = DEFAULT_CURRENCY) =>
  CURRENCY_META[(currency || DEFAULT_CURRENCY).toLowerCase()] ||
  CURRENCY_META[DEFAULT_CURRENCY];

/** Amount stored in paise/cents (Stripe minor units). */
export const formatMoney = (minorUnits, currency = DEFAULT_CURRENCY) => {
  const code = (currency || DEFAULT_CURRENCY).toLowerCase();
  const meta = getMeta(code);
  const major = Number(minorUnits || 0) / 100;

  try {
    return new Intl.NumberFormat(meta.locale, {
      style: "currency",
      currency: code.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(major);
  } catch {
    return `${meta.symbol}${major.toFixed(2)}`;
  }
};

/** Menu prices stored as whole rupees/dollars in MongoDB. */
export const formatMenuPrice = (price, currency = DEFAULT_CURRENCY) => {
  const code = (currency || DEFAULT_CURRENCY).toLowerCase();
  const meta = getMeta(code);
  const amount = Number(price || 0);

  try {
    return new Intl.NumberFormat(meta.locale, {
      style: "currency",
      currency: code.toUpperCase(),
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${meta.symbol}${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
  }
};

export const formatDepositTotal = (
  perGuestMinorUnits,
  guests,
  currency = DEFAULT_CURRENCY,
) =>
  formatMoney(
    Number(perGuestMinorUnits || 0) * Number(guests || 1),
    currency,
  );
