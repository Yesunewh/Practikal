/** Progress % within the current XP tier (matches backend `gamificationService.computeLevel` thresholds). */
export function xpProgressInCurrentTier(xp: number): number {
  const n = Math.max(0, Number(xp) || 0);
  if (n < 1000) return Math.min(100, Math.round((n / 1000) * 100));
  if (n < 5000) return Math.min(100, Math.round(((n - 1000) / 4000) * 100));
  if (n < 10000) return Math.min(100, Math.round(((n - 5000) / 5000) * 100));
  if (n < 20000) return Math.min(100, Math.round(((n - 10000) / 10000) * 100));
  if (n < 35000) return Math.min(100, Math.round(((n - 20000) / 15000) * 100));
  if (n < 50000) return Math.min(100, Math.round(((n - 35000) / 15000) * 100));
  return 100;
}
