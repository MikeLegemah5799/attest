/**
 * Type-aware comparator for scoring an extracted field value against its
 * gold label (project-overview.md — "a type-aware comparator", not a bare
 * string equality check, so e.g. dates and money amounts in different but
 * equivalent formats still score as correct).
 */
export function fieldsMatch(_expected: string, _actual: string): boolean {
  throw new Error("not implemented");
}
