import Link from "next/link";
import { notFound } from "next/navigation";
import { documents } from "../../lib/documents";

type Status = "grounded" | "review" | "blocked";

const statusConfig: Record<Status, { cls: string; icon: string; label: string }> = {
  grounded: { cls: "state-grounded", icon: "●", label: "grounded" },
  review: { cls: "state-review", icon: "▲", label: "review" },
  blocked: { cls: "state-blocked", icon: "✕", label: "blocked" },
};

function StatusPill({ status }: { status: Status }) {
  const { cls, icon, label } = statusConfig[status];
  return (
    <span className={`state-pill ${cls}`}>
      <span>{icon}</span>
      {label}
    </span>
  );
}

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
      <header className="topbar">
        <div className="topbar-left">
          <Link href="/" className="row-link">
            <span className="wordmark">ATTEST</span>
          </Link>
          <span className="topbar-doc-title">{doc.title}</span>
        </div>
        <span className="verify-badge">
          <span className="dots">
            {Array.from({ length: doc.verifiedTotal }, (_, i) => (
              <span key={i} className={i < doc.verifiedFilled ? "dot-filled" : "dot-empty"}>
                ●
              </span>
            ))}
          </span>
          <span className="mono">{doc.verifiedPercent}% verified</span>
        </span>
      </header>

      <nav className="tabbar">
        <span className="tab active">Review</span>
        <span className="tab">
          Review queue <span className="tab-count">6</span>
        </span>
        <span className="tab">Critical dates &amp; risk</span>
      </nav>

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
            <div className="field-section">
              <div className="section-title">Parties &amp; Premises</div>
              <FieldCard
                label="Landlord"
                value="Meridian Holdings LLC"
                citation={'p.1 · "the Landlord..."'}
                status="grounded"
              />
              <FieldCard
                label="Tenant"
                value="Fulcrum Analytics Inc."
                citation={'p.1 · "the Tenant..."'}
                status="grounded"
              />
              <FieldCard
                label="Premises"
                value="Suite 1200, 4th Floor"
                citation={'p.1 · "approximately 12,400 rentable square feet..."'}
                status="review"
                active
              />
            </div>

            <div className="field-section">
              <div className="section-title">Term</div>
              <FieldCard label="Commencement" value="Jan 15, 2024" citation="p.2" status="grounded" />
              <FieldCard label="Expiration" value="Mar 14, 2027" citation="p.2" status="grounded" />
              <FieldCard
                label="Renewal Option"
                value="Notice period unverified"
                citation="Base commencement date confidence too low"
                status="blocked"
                error
              />
            </div>

            <div className="tracker">
              <TrackerRow label="Rent & Escalation" grounded={3} total={4} summary="3 grounded · 1 review" />
              <TrackerRow label="Options & Notice" grounded={2} total={3} summary="2 grounded · 1 blocked" />
              <TrackerRow label="Expenses" grounded={2} total={4} summary="2 grounded · 2 review" />
              <TrackerRow label="Risk Clauses" grounded={3} total={5} summary="3 grounded · 2 review" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
