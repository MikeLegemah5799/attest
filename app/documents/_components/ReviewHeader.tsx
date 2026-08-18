import Link from "next/link";
import type { DocumentSummary } from "../../lib/documents";

export function ReviewTopbar({ doc }: { doc: DocumentSummary }) {
  return (
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
  );
}

export function ReviewTabbar({
  slug,
  active,
  queueCount,
}: {
  slug: string;
  active: "review" | "queue";
  queueCount: number;
}) {
  return (
    <nav className="tabbar">
      <Link href={`/documents/${slug}`} className={`tab${active === "review" ? " active" : ""}`}>
        Review
      </Link>
      <Link href={`/documents/${slug}/queue`} className={`tab${active === "queue" ? " active" : ""}`}>
        Review queue <span className="tab-count">{queueCount}</span>
      </Link>
      <span className="tab">Critical dates &amp; risk</span>
    </nav>
  );
}
