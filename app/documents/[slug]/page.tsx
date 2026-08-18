import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfidenceBadge, type ConfidenceStatus } from "@/components/attest/ConfidenceBadge";
import { getDocumentDetail } from "../../lib/documents";
import { ReviewTopbar, ReviewTabbar } from "../_components/ReviewHeader";
import { toFieldSections, toTrackerCategories } from "../_lib/review-data";

function FieldCard({
  label,
  value,
  citation,
  status,
}: {
  label: string;
  value: string;
  citation: string;
  status: ConfidenceStatus;
}) {
  return (
    <div className="field-card">
      <div className="field-card-head">
        <span className="field-label">{label}</span>
        <ConfidenceBadge status={status} />
      </div>
      <div className="field-value">{value}</div>
      <div className={`field-cite${status === "blocked" ? " error" : ""}`}>{citation}</div>
    </div>
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

export default async function DocumentReview(props: PageProps<"/documents/[slug]">) {
  const { slug } = await props.params;
  const detail = await getDocumentDetail(slug);
  if (!detail) notFound();

  const fieldSections = toFieldSections(detail.result.fieldSections);
  const trackerCategories = toTrackerCategories(detail.result.trackerCategories);

  return (
    <div className="shell">
      <ReviewTopbar doc={detail.summary} />
      <ReviewTabbar slug={slug} active="review" queueCount={detail.result.queueItems.length} />

      <main className="content">
        <div className="review-layout">
          <div>
            <div className="doc-viewer">
              <p className="doc-paragraph muted">
                PDF preview and click-to-source highlighting aren&apos;t wired up yet — see
                progress-tracker.md. Field values and citations below are real, persisted
                extraction results.
              </p>
            </div>

            <div className="pager">
              <Button type="button" variant="ghost" size="sm" className="font-mono text-secondary-foreground">
                <ChevronLeft /> prev
              </Button>
              <span>page — / —</span>
              <Button type="button" variant="ghost" size="sm" className="font-mono text-secondary-foreground">
                next <ChevronRight />
              </Button>
            </div>
          </div>

          <div>
            {fieldSections.length === 0 ? (
              <p className="muted">
                No fields extracted yet — the pipeline hasn&apos;t run against this document.
              </p>
            ) : (
              fieldSections.map((section) => (
                <div className="field-section" key={section.title}>
                  <div className="section-title">{section.title}</div>
                  {section.fields.map((field) => (
                    <FieldCard
                      key={field.label}
                      label={field.label}
                      value={field.value}
                      citation={field.citation}
                      status={field.status}
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
      </main>
    </div>
  );
}
