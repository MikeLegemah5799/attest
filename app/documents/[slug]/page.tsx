import { notFound } from "next/navigation";
import { documents } from "../../lib/documents";
import { ReviewTopbar, ReviewTabbar } from "../_components/ReviewHeader";
import { StatusPill, type Status } from "../_components/StatusPill";
import { fieldSections, trackerCategories, queueItems } from "../_lib/review-data";

function FieldCard({
  label,
  value,
  citation,
  status,
  active,
  error,
}: {
  label: string;
  value: string;
  citation: string;
  status: Status;
  active?: boolean;
  error?: boolean;
}) {
  return (
    <div className={`field-card${active ? " field-card--active" : ""}`}>
      <div className="field-card-head">
        <span className="field-label">{label}</span>
        <StatusPill status={status} />
      </div>
      <div className="field-value">{value}</div>
      <div className={`field-cite${error ? " error" : ""}`}>{citation}</div>
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
        <span className="tracker-chevron">▼</span>
        {label}
      </span>
      <span className="tracker-summary">
        <span className="tracker-dots">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={i < grounded ? "dot-filled" : "dot-empty"}>
              ●
            </span>
          ))}
        </span>
        {summary}
      </span>
    </div>
  );
}

export default async function DocumentReview(props: PageProps<"/documents/[slug]">) {
  const { slug } = await props.params;
  const doc = documents.find((d) => d.slug === slug);
  if (!doc) notFound();

  return (
    <div className="shell">
      <ReviewTopbar doc={doc} />
      <ReviewTabbar slug={slug} active="review" queueCount={queueItems.length} />

      <main className="content">
        <div className="review-layout">
          <div>
            <div className="doc-viewer">
              <div className="skeleton-line" style={{ width: "40%" }} />
              <div className="skeleton-line" style={{ width: "88%" }} />
              <div className="skeleton-line" style={{ width: "72%" }} />
              <div className="skeleton-line" style={{ width: "82%" }} />

              <p className="doc-paragraph">
                The Premises shall consist of{" "}
                <span className="doc-highlight">
                  approximately 12,400 rentable square feet located on the fourth (4th) floor
                </span>{" "}
                of the Building, as more particularly shown on Exhibit A attached hereto and made a part
                hereof for all purposes.
              </p>

              <div className="skeleton-line" style={{ width: "92%" }} />
              <div className="skeleton-line" style={{ width: "78%" }} />
              <div className="skeleton-line" style={{ width: "36%" }} />
              <div className="skeleton-line" style={{ width: "84%" }} />
            </div>

            <div className="pager">
              <button type="button">◀ prev</button>
              <span>page 4 / 38</span>
              <button type="button">next ▶</button>
            </div>
          </div>

          <div>
            {fieldSections.map((section) => (
              <div className="field-section" key={section.title}>
                <div className="section-title">{section.title}</div>
                {section.fields.map((field) => (
                  <FieldCard
                    key={field.label}
                    label={field.label}
                    value={field.value}
                    citation={field.citation}
                    status={field.status}
                    active={field.label === "Premises"}
                    error={field.status === "blocked"}
                  />
                ))}
              </div>
            ))}

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
