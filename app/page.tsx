import Link from "next/link";
import { documents } from "./lib/documents";

function VerifiedDots({ filled, total, percent }: { filled: number; total: number; percent: number }) {
  return (
    <span className="verify-badge">
      <span className="dots">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={i < filled ? "dot-filled" : "dot-empty"}>
            ●
          </span>
        ))}
      </span>
      <span className="mono">{percent}%</span>
    </span>
  );
}

function FlagCount({ count }: { count: number }) {
  if (count === 0) {
    return <span className="muted">—</span>;
  }
  return (
    <span className="flag-count">
      <svg className="icon" viewBox="0 0 12 12" fill="none">
        <path d="M6 1.5L11 10.5H1L6 1.5Z" fill="currentColor" />
      </svg>
      {count}
    </span>
  );
}

export default function Home() {
  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-left">
          <span className="wordmark">ATTEST</span>
        </div>
      </header>

      <main className="content">
        <div className="page-header">
          <h1 className="page-title">Documents</h1>
          <button className="btn-import" type="button">
            + Import
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Document</th>
              <th>Type</th>
              <th>Verified</th>
              <th>Flags</th>
              <th>Expires</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.slug}>
                <td>
                  <Link href={`/documents/${doc.slug}`} className="row-link">
                    {doc.name}
                  </Link>
                </td>
                <td>{doc.type}</td>
                <td>
                  <VerifiedDots
                    filled={doc.verifiedFilled}
                    total={doc.verifiedTotal}
                    percent={doc.verifiedPercent}
                  />
                </td>
                <td>
                  <FlagCount count={doc.flags} />
                </td>
                <td className="muted">{doc.expires}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
