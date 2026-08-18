import type { ConfidenceStatus } from "@/components/attest/ConfidenceBadge";
import type { SurfacePrepResult } from "@/lib/pipeline/surfacePrep";
import type { DerivedDate, ExtractionField, RiskFlag as DomainRiskFlag } from "@/lib/types";

import { FIELD_GROUP_LABELS } from "../../lib/documents";

/**
 * View-shaping only — formatted labels, citation strings, timeline
 * positions — for the three per-document review screens. Domain data comes
 * from lib/pipeline/surfacePrep; this module never touches lib/db directly
 * (code-standards.md: app/ owns final view formatting, not derivation).
 */

export type Field = {
  label: string;
  value: string;
  citation: string;
  status: ConfidenceStatus;
};

export type FieldSection = {
  title: string;
  fields: Field[];
};

export type TrackerCategory = {
  label: string;
  grounded: number;
  total: number;
  summary: string;
};

export type QueueItem = {
  id: string;
  field: string;
  group: string;
  status: ConfidenceStatus;
  page: string;
};

export type CriticalDate = {
  date: string;
  label: string;
  position: number;
};

export type BlockedDate = {
  label: string;
  reason: string;
};

export type Timeline = {
  years: number[];
  markers: CriticalDate[];
  blocked: BlockedDate[];
};

export type RiskFlag = {
  label: string;
  severity: ConfidenceStatus;
  detail: string;
  source: string | null;
};

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function toFieldSections(sections: SurfacePrepResult["fieldSections"]): FieldSection[] {
  return sections
    .filter((section) => section.fields.length > 0)
    .map((section) => ({
      title: FIELD_GROUP_LABELS[section.fieldGroup],
      fields: section.fields.map((field) => ({
        label: field.label,
        value: field.value,
        citation: `p.${field.pageNumber} · "${truncate(field.evidenceText, 40)}"`,
        status: field.status,
      })),
    }));
}

export function toTrackerCategories(
  categories: SurfacePrepResult["trackerCategories"],
): TrackerCategory[] {
  return categories.map((category) => ({
    label: FIELD_GROUP_LABELS[category.fieldGroup],
    grounded: category.grounded,
    total: category.total,
    summary:
      category.total === 0
        ? "no fields defined"
        : category.grounded === category.total
          ? "all grounded"
          : `${category.grounded} of ${category.total} grounded`,
  }));
}

export function toQueueItems(items: ExtractionField[]): QueueItem[] {
  return items.map((field) => ({
    id: field.id,
    field: field.label,
    group: FIELD_GROUP_LABELS[field.fieldGroup],
    status: field.status,
    page: `p.${field.pageNumber}`,
  }));
}

/**
 * Places `computed` dates on a timeline spanning their min/max year (padded
 * by a year on each side); `blocked` dates have no position to plot, so
 * they're surfaced as reasoned callouts instead of guessed onto the line.
 */
export function toTimeline(dates: DerivedDate[]): Timeline {
  const computed = dates.filter(
    (date): date is DerivedDate & { value: string } => date.status === "computed" && date.value !== null,
  );
  const blocked = dates
    .filter((date) => date.status === "blocked")
    .map((date) => ({ label: date.label, reason: date.reason ?? "blocked" }));

  if (computed.length === 0) {
    return { years: [], markers: [], blocked };
  }

  const years = computed.map((date) => new Date(date.value).getUTCFullYear());
  const minYear = Math.min(...years) - 1;
  const maxYear = Math.max(...years) + 1;
  const rangeStartMs = Date.UTC(minYear, 0, 1);
  const rangeEndMs = Date.UTC(maxYear + 1, 0, 1);
  const totalMs = rangeEndMs - rangeStartMs;

  const markers = computed.map((date) => {
    const dateMs = new Date(date.value).getTime();
    const position = Math.round(((dateMs - rangeStartMs) / totalMs) * 100);
    return {
      date: new Date(date.value).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      label: date.label,
      position: Math.min(100, Math.max(0, position)),
    };
  });

  const yearList: number[] = [];
  for (let year = minYear; year <= maxYear; year++) yearList.push(year);

  return { years: yearList, markers, blocked };
}

export function toRiskFlagViews(flags: DomainRiskFlag[]): RiskFlag[] {
  return flags.map((flag) => ({
    label: flag.label,
    severity: flag.status,
    detail:
      flag.present && flag.evidenceText
        ? truncate(flag.evidenceText, 80)
        : "Not found in the pages reviewed.",
    source: flag.present && flag.pageNumber ? `p.${flag.pageNumber}` : null,
  }));
}
