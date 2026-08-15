export function money(n: number | string) {
  const value = Number(n);
  return `SAR ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
