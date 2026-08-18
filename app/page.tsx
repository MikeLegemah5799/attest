type Document = {
  name: string;
  type: string;
  verifiedFilled: number;
  verifiedTotal: number;
  verifiedPercent: number;
  flags: number;
  expires: string;
};

const documents: Document[] = [
  {
    name: "123 Main St — Office",
    type: "Office",
    verifiedFilled: 3,
    verifiedTotal: 5,
    verifiedPercent: 82,
    flags: 2,
    expires: "Mar 2027",
  },
  {
    name: "400 Park Ave — Suite 1200",
    type: "Office",
    verifiedFilled: 5,
    verifiedTotal: 5,
    verifiedPercent: 100,
    flags: 0,
    expires: "Nov 2028",
  },
  {
    name: "Riverside Plaza — Bldg C",
    type: "Office",
    verifiedFilled: 2,
    verifiedTotal: 5,
    verifiedPercent: 44,
    flags: 4,
    expires: "Jun 2026",
  },
  {
    name: "Harbor Point — Floor 3",
    type: "Office",
    verifiedFilled: 4,
    verifiedTotal: 5,
    verifiedPercent: 91,
    flags: 1,
    expires: "Aug 2029",
  },
];

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
              <tr key={doc.name}>
                <td>{doc.name}</td>
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
