import type { ConfidenceStatus } from "@/components/attest/ConfidenceBadge";

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
  field: string;
  group: string;
  status: ConfidenceStatus;
  page: string;
};

export const fieldSections: FieldSection[] = [
  {
    title: "Parties & Premises",
    fields: [
      {
        label: "Landlord",
        value: "Meridian Holdings LLC",
        citation: 'p.1 · "the Landlord..."',
        status: "grounded",
      },
      {
        label: "Tenant",
        value: "Fulcrum Analytics Inc.",
        citation: 'p.1 · "the Tenant..."',
        status: "grounded",
      },
      {
        label: "Premises",
        value: "Suite 1200, 4th Floor",
        citation: 'p.1 · "approximately 12,400 rentable square feet..."',
        status: "review",
      },
    ],
  },
  {
    title: "Term",
    fields: [
      { label: "Commencement", value: "Jan 15, 2024", citation: "p.2", status: "grounded" },
      { label: "Expiration", value: "Mar 14, 2027", citation: "p.2", status: "grounded" },
      {
        label: "Renewal Option",
        value: "Notice period unverified",
        citation: "Base commencement date confidence too low",
        status: "blocked",
      },
    ],
  },
];

export const trackerCategories: TrackerCategory[] = [
  { label: "Parties & Premises", grounded: 2, total: 3, summary: "2 grounded · 1 review" },
  { label: "Term", grounded: 2, total: 3, summary: "2 grounded · 1 blocked" },
  { label: "Expenses", grounded: 2, total: 4, summary: "2 grounded · 2 review" },
  { label: "Risk Clauses", grounded: 3, total: 5, summary: "3 grounded · 2 review" },
];

export const queueItems: QueueItem[] = [
  { field: "Premises", group: "Parties/premises", status: "review", page: "p.1" },
  { field: "Renewal option", group: "Term", status: "blocked", page: "p.2" },
  { field: "Base year expenses", group: "Expenses", status: "review", page: "p.14" },
  { field: "CAM cap", group: "Expenses", status: "review", page: "p.15" },
  { field: "Co-tenancy clause", group: "Risk clauses", status: "review", page: "p.22" },
  { field: "Assignment consent", group: "Risk clauses", status: "review", page: "p.23" },
];

export type CriticalDate = {
  date: string;
  label: string;
  position: number;
};

export const timelineYears = [2024, 2025, 2026, 2027, 2028];

export const criticalDates: CriticalDate[] = [
  { date: "Jan 15", label: "Commencement", position: 0 },
  { date: "Mar 14", label: "Expiration", position: 79 },
];

export const renewalNoticeCallout = {
  title: "Renewal notice window",
  body: "Blocked — commencement confidence too low to compute notice deadline",
  position: 62,
};

export type RiskFlag = {
  label: string;
  severity: ConfidenceStatus;
  detail: string;
  source: string | null;
};

export const riskFlags: RiskFlag[] = [
  {
    label: "Co-tenancy clause",
    severity: "review",
    detail: "Rent abatement if anchor tenant vacates",
    source: "p.22",
  },
  {
    label: "Assignment consent required",
    severity: "review",
    detail: "Landlord consent required, not unreasonably withheld",
    source: "p.23",
  },
  {
    label: "No early termination",
    severity: "neutral",
    detail: "Standard fixed term",
    source: "p.2",
  },
  {
    label: "Percentage rent: none",
    severity: "neutral",
    detail: "Flat base rent structure",
    source: null,
  },
];
