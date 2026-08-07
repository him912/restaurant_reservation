import { formatMoney } from "../utils/currency";
import { getPaymentStatusLabel } from "../utils/paymentFlow";

const LIGHT_STYLES = {
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-rose-50 text-rose-600 border-rose-100",
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  refunded: "bg-slate-100 text-slate-600 border-slate-200",
  default: "bg-slate-100 text-slate-600 border-slate-200",
};

const DARK_STYLES = {
  paid: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  failed: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  pending: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  refunded: "bg-slate-600/20 text-slate-400 border-slate-600/30",
  default: "bg-slate-600/20 text-slate-400 border-slate-600/30",
};

export const PaymentStatusBadge = ({
  paymentStatus,
  paymentAmount = 0,
  paymentCurrency = "inr",
  theme = "light",
  className = "",
}) => {
  const styles = theme === "dark" ? DARK_STYLES : LIGHT_STYLES;
  const statusClass =
    styles[paymentStatus] || styles.default;

  const label =
    paymentStatus === "paid"
      ? `paid ${formatMoney(paymentAmount, paymentCurrency)}`
      : getPaymentStatusLabel(paymentStatus);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider border shrink-0 ${statusClass} ${className}`}
    >
      {label}
    </span>
  );
};
