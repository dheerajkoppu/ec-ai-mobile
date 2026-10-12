/** Renders a 0 to 5 rating as five filled or empty stars, or "N/A" when there is none. */
export function renderStars(rating?: number): string {
  if (rating === undefined || rating === null) return "N/A";
  // Clamped because repeat() throws on a negative count
  const fullStars = Math.min(5, Math.max(0, Math.round(rating)));
  return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
}

/**
 * Formats a Date to YYYY-MM-DD using local time.
 * Uses manual formatting (not toISOString()) to avoid UTC offset shifting the date.
 */
export function formatDateToYMD(date: Date): string {
  if (isNaN(date.getTime())) throw new Error("Invalid date");
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
