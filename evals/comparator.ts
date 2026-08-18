/**
 * Type-aware comparator for scoring an extracted field value against its
 * gold label (project-overview.md — "a type-aware comparator", not a bare
 * string equality check, so e.g. dates and money amounts in different but
 * equivalent formats still score as correct).
 */

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Parses a handful of common lease-date formats to an ISO (YYYY-MM-DD) string. */
function tryParseDate(value: string): string | null {
  const trimmed = value.trim();

  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return trimmed;

  const slash = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const [, month, day, year] = slash;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const named = trimmed.match(/^([A-Za-z]+\.?)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (named) {
    const date = new Date(`${named[1]} ${named[2]}, ${named[3]}`);
    if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  }

  return null;
}

/** True only when `value`, after stripping currency/percent/unit noise, is exactly a number. */
function looksNumeric(value: string): boolean {
  const stripped = value
    .replace(/[$,%]/g, "")
    .replace(/\b(per|sq|ft|month|monthly|year|annum|annually|days?|months?|years?)\b/gi, "")
    .trim();
  return /^-?\d+(\.\d+)?$/.test(stripped);
}

function tryParseNumber(value: string): number | null {
  if (!looksNumeric(value)) return null;
  const cleaned = value.replace(/[$,%]/g, "").trim();
  const match = cleaned.match(/-?\d+(\.\d+)?/);
  return match ? Number.parseFloat(match[0]) : null;
}

export function fieldsMatch(expected: string, actual: string): boolean {
  const expectedDate = tryParseDate(expected);
  const actualDate = tryParseDate(actual);
  if (expectedDate && actualDate) return expectedDate === actualDate;

  const expectedNumber = tryParseNumber(expected);
  const actualNumber = tryParseNumber(actual);
  if (expectedNumber !== null && actualNumber !== null) {
    return Math.abs(expectedNumber - actualNumber) < 0.005;
  }

  return normalizeText(expected) === normalizeText(actual);
}
