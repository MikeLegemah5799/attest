import type { FieldGroup } from "@/lib/types";

export type FieldSpec = {
  fieldGroup: FieldGroup;
  fieldKey: string;
  label: string;
  description: string;
};

/**
 * The 18 fields extraction targets — locked in project-overview.md's
 * "Field List" section, which is the source of truth if this list ever
 * needs to change (gold-labeling targets this exact set).
 */
export const FIELD_SPECS: FieldSpec[] = [
  // parties_premises
  {
    fieldGroup: "parties_premises",
    fieldKey: "landlord_name",
    label: "Landlord",
    description: "The legal name of the landlord/lessor entity.",
  },
  {
    fieldGroup: "parties_premises",
    fieldKey: "tenant_name",
    label: "Tenant",
    description: "The legal name of the tenant/lessee entity.",
  },
  {
    fieldGroup: "parties_premises",
    fieldKey: "premises_address",
    label: "Premises Address",
    description: "The street address (and suite/floor if given) of the leased premises.",
  },
  {
    fieldGroup: "parties_premises",
    fieldKey: "rentable_square_feet",
    label: "Rentable Square Feet",
    description: "The rentable square footage of the leased premises, as a number.",
  },
  // term
  {
    fieldGroup: "term",
    fieldKey: "commencement_date",
    label: "Commencement Date",
    description: "The date the lease term begins.",
  },
  {
    fieldGroup: "term",
    fieldKey: "expiration_date",
    label: "Expiration Date",
    description: "The date the lease term ends.",
  },
  {
    fieldGroup: "term",
    fieldKey: "initial_term_length",
    label: "Initial Term Length",
    description: 'The stated length of the initial lease term (e.g. "5 years").',
  },
  // rent_escalation
  {
    fieldGroup: "rent_escalation",
    fieldKey: "base_rent",
    label: "Base Rent",
    description:
      'The base/minimum rent amount and the period it applies to (e.g. "$12,500/month" or "$18.50/sq ft/year").',
  },
  {
    fieldGroup: "rent_escalation",
    fieldKey: "escalation_type",
    label: "Escalation Type",
    description:
      "How base rent increases over the term (e.g. fixed percentage, fixed step schedule, CPI-indexed, none).",
  },
  {
    fieldGroup: "rent_escalation",
    fieldKey: "escalation_schedule",
    label: "Escalation Schedule",
    description: "The specific escalation amounts, dates, or percentage, as stated.",
  },
  // options_notice
  {
    fieldGroup: "options_notice",
    fieldKey: "renewal_option_terms",
    label: "Renewal Option",
    description:
      "Whether a renewal/extension option exists and its terms (number of options, length of each).",
  },
  {
    fieldGroup: "options_notice",
    fieldKey: "renewal_notice_deadline",
    label: "Renewal Notice Deadline",
    description:
      'How much advance written notice the tenant must give to exercise a renewal option (e.g. "180 days before expiration").',
  },
  // expenses
  {
    fieldGroup: "expenses",
    fieldKey: "expense_structure",
    label: "Expense Structure",
    description:
      "How operating expenses/CAM/taxes/insurance are allocated (e.g. NNN, gross, base year, expense stop).",
  },
  {
    fieldGroup: "expenses",
    fieldKey: "security_deposit",
    label: "Security Deposit",
    description: "The security deposit amount required.",
  },
  // risk_clauses
  {
    fieldGroup: "risk_clauses",
    fieldKey: "early_termination_right",
    label: "Early Termination Right",
    description:
      "Whether either party has a right to terminate the lease early, and under what conditions.",
  },
  {
    fieldGroup: "risk_clauses",
    fieldKey: "co_tenancy_clause",
    label: "Co-Tenancy Clause",
    description:
      "Whether a co-tenancy requirement exists (rent relief or termination right if certain other tenants/anchors leave).",
  },
  {
    fieldGroup: "risk_clauses",
    fieldKey: "assignment_subletting_consent",
    label: "Assignment/Subletting Consent",
    description:
      "Whether landlord consent is required for the tenant to assign the lease or sublet the premises.",
  },
  {
    fieldGroup: "risk_clauses",
    fieldKey: "percentage_rent_clause",
    label: "Percentage Rent Clause",
    description: "Whether percentage rent (rent tied to the tenant's sales) applies.",
  },
];

export const FIELD_GROUPS: FieldGroup[] = [
  "parties_premises",
  "term",
  "rent_escalation",
  "options_notice",
  "expenses",
  "risk_clauses",
];

export function fieldSpecsForGroup(fieldGroup: FieldGroup): FieldSpec[] {
  return FIELD_SPECS.filter((spec) => spec.fieldGroup === fieldGroup);
}
