import type { BoundingBox, ConfidenceStatus, FieldGroup } from "@/lib/types";

/** A field as returned by the extract stage, before grounding/verification. */
export type RawExtractedField = {
  fieldGroup: FieldGroup;
  fieldKey: string;
  label: string;
  value: string;
  evidenceText: string;
  pageNumber: number;
  confidence: number;
};

/** A field after the grounding check and verifier pass. */
export type VerifiedField = RawExtractedField & {
  boundingBox: BoundingBox | null;
  groundingStatus: "grounded" | "ungrounded";
  verifierStatus: "confirmed" | "rejected" | null;
  status: ConfidenceStatus;
};
