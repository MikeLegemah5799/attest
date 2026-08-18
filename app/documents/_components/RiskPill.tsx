import type { RiskSeverity } from "../_lib/review-data";

export function RiskPill({ label, severity }: { label: string; severity: RiskSeverity }) {
  const cls = severity === "flag" ? "state-review" : "state-neutral";
  const icon = severity === "flag" ? "▲" : "—";
  return (
    <span className={`state-pill ${cls}`}>
      <span>{icon}</span>
      {label}
    </span>
  );
}
