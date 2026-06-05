export function formatINR(amount: number, showDecimals = true): string {
  if (showDecimals) {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}
