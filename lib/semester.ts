export function currentSemester(
  batch: number,
  override?: number | null,
  now: Date = new Date()
) {
  if (override) return override;
  const years = now.getFullYear() - batch;
  // September ya uske baad naya semester (odd) shuru hota hai
  const sem = now.getMonth() >= 8 ? years * 2 + 1 : years * 2;
  return Math.max(1, sem);
}