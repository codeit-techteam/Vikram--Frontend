export function formatINR(amount: number, showDecimals = true): string {
  const n = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
  if (showDecimals) {
    return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}
