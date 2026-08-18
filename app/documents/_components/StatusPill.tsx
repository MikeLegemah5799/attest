export type Status = "grounded" | "review" | "blocked";

const statusConfig: Record<Status, { cls: string; icon: string; label: string }> = {
  grounded: { cls: "state-grounded", icon: "●", label: "grounded" },
  review: { cls: "state-review", icon: "▲", label: "review" },
  blocked: { cls: "state-blocked", icon: "✕", label: "blocked" },
};

export function StatusPill({ status }: { status: Status }) {
  const { cls, icon, label } = statusConfig[status];
  return (
    <span className={`state-pill ${cls}`}>
      <span>{icon}</span>
      {label}
    </span>
  );
}
