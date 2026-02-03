/**
 * Format duration in seconds to "Xh Ym" or "Xm" string.
 */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Format lesson duration in seconds to "M:SS" string.
 */
export function formatLessonDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Format a price amount with currency symbol.
 * KRW: no decimals, comma-separated, "Won" suffix (e.g. "50,000원")
 * USD: 2 decimals, dollar prefix (e.g. "$49.99")
 */
export function formatPrice(amount: number, currency: "KRW" | "USD" = "KRW"): string {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }
  return new Intl.NumberFormat("ko-KR").format(amount) + "원";
}
