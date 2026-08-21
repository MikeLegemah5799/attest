"use client";

import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfidenceBadge } from "@/components/attest/ConfidenceBadge";
import type { Field, FieldSection, TrackerCategory } from "../../_lib/review-data";
import { PdfViewer, type PdfHighlight } from "./PdfViewer";

function FieldCard({ field, active, onSelect }: { field: Field; active: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`field-card field-card--clickable${active ? " field-card--active" : ""}`}
    >
      <div className="field-card-head">
        <span className="field-label">{field.label}</span>
        <ConfidenceBadge status={field.status} />
      </div>
      <div className="field-value">{field.value}</div>
      <div className={`field-cite${field.status === "blocked" ? " error" : ""}`}>{field.citation}</div>
    </button>
  );
}

function TrackerRow({
  label,
  grounded,
  total,
  summary,
}: {
  label: string;
  grounded: number;
  total: number;
  summary: string;
}) {
  return (
    <div className="tracker-row">
      <span className="tracker-label">
        <ChevronDown className="tracker-chevron" />
        {label}
      </span>
      <span className="tracker-summary">
        <span className="dots dots--sm">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={i < grounded ? "dot dot-filled" : "dot dot-empty"} />
          ))}
        </span>
        {summary}
      </span>
    </div>
  );
}

/**
 * Owns the click-to-source interaction (ui-context.md: "Clicking a field on
 * the right scrolls and highlights its source span on the left") — the one
 * piece of state (which field is selected, which page the viewer shows)
 * that has to live above both panes, so it's the client boundary
 * (code-standards.md: "Only the PDF viewer, field-click highlighting...
 * need 'use client'"); page.tsx stays a server component for the actual
 * data fetch.
 */
export function ReviewWorkspace({
  pdfUrl,
  pageCount,
  fieldSections,
  trackerCategories,
}: {
  pdfUrl: string;
  pageCount: number;
  fieldSections: FieldSection[];
  trackerCategories: TrackerCategory[];
}) {
  const firstField = fieldSections[0]?.fields[0];
  const [pageNumber, setPageNumber] = useState(firstField?.pageNumber ?? 1);
  const [highlight, setHighlight] = useState<PdfHighlight | null>(
    firstField?.boundingBox ? { pageNumber: firstField.pageNumber, box: firstField.boundingBox } : null,
  );
  const [selectedLabel, setSelectedLabel] = useState<string | null>(firstField?.label ?? null);

  function selectField(field: Field) {
    setPageNumber(field.pageNumber);
    setHighlight(field.boundingBox ? { pageNumber: field.pageNumber, box: field.boundingBox } : null);
    setSelectedLabel(field.label);
  }

  return (
    <div className="review-layout">
      <div>
        <PdfViewer pdfUrl={pdfUrl} pageNumber={pageNumber} highlight={highlight} />

        <div className="pager">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="font-mono text-secondary-foreground"
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft /> prev
          </Button>
          <span>
            page {pageCount === 0 ? "—" : pageNumber} / {pageCount === 0 ? "—" : pageCount}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="font-mono text-secondary-foreground"
            disabled={pageCount === 0 || pageNumber >= pageCount}
            onClick={() => setPageNumber((p) => Math.min(pageCount, p + 1))}
          >
            next <ChevronRight />
          </Button>
        </div>
      </div>

      <div>
        {fieldSections.length === 0 ? (
          <p className="muted">No fields extracted yet — the pipeline hasn&apos;t run against this document.</p>
        ) : (
          fieldSections.map((section) => (
            <div className="field-section" key={section.title}>
              <div className="section-title">{section.title}</div>
              {section.fields.map((field) => (
                <FieldCard
                  key={field.label}
                  field={field}
                  active={selectedLabel === field.label}
                  onSelect={() => selectField(field)}
                />
              ))}
            </div>
          ))
        )}

        <div className="tracker">
          {trackerCategories.map((category) => (
            <TrackerRow
              key={category.label}
              label={category.label}
              grounded={category.grounded}
              total={category.total}
              summary={category.summary}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
