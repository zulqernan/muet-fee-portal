export function lateFee(
  dueDate: Date,
  perDay: number,
  now: Date = new Date()
) {
  const ms = now.getTime() - dueDate.getTime();
  if (ms <= 0) return 0;
  const days = Math.ceil(ms / 86400000);
  return days * perDay;
}