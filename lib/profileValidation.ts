export class ProfileValidationError extends Error {}

type NumberRule = { min: number; max: number; integer: boolean };

export const PROFILE_NUMBER_RULES = {
  age: { min: 1, max: 120, integer: true },
  // The GPA columns are numeric(3,2), so anything above 9.99 overflows
  gpa: { min: 0, max: 9.99, integer: false },
  sat: { min: 400, max: 1600, integer: true },
  act: { min: 1, max: 36, integer: true },
  psat: { min: 320, max: 1520, integer: true },
} satisfies Record<string, NumberRule>;

// The app sends these for an unanswered field, including when it echoes back a stored value
const BLANK_VALUES = new Set(["", "none", "nan", "null", "undefined"]);

/**
 * Parses a numeric profile answer. Returns null for a blank answer and throws
 * ProfileValidationError when the number is missing or out of range.
 *
 * Score dropdowns send ranges like "1200-1390" or "1500+", so only the leading
 * number is read.
 */
export function parseProfileNumber(
  value: unknown,
  label: string,
  { min, max, integer }: NumberRule,
): number | null {
  const text = String(value ?? "").trim();
  if (BLANK_VALUES.has(text.toLowerCase())) return null;

  const parsed = integer ? parseInt(text, 10) : parseFloat(text);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new ProfileValidationError(
      `${label} must be a number between ${min} and ${max}`,
    );
  }

  return parsed;
}
