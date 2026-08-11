export function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function startOfQuarter(d: Date) {
  const quarterMonth = Math.floor(d.getMonth() / 3) * 3;
  return new Date(d.getFullYear(), quarterMonth, 1);
}

export function startOfYear(d: Date) {
  return new Date(d.getFullYear(), 0, 1);
}
