/**
 * Display amounts in rupees (Rs.). Values in the API stay numeric.
 */
export function formatMoney(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "Rs. 0.00";
  return `Rs. ${num.toFixed(2)}`;
}

/** For optional / missing numbers in staff UIs. */
export function formatMoneyOrDash(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return formatMoney(num);
}
