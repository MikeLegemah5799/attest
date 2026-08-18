import { AlertTriangle, FileCheck, FileX, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ConfidenceStatus = "grounded" | "review" | "blocked" | "neutral";

const config: Record<ConfidenceStatus, { icon: typeof FileCheck; className: string; label: string }> = {
  grounded: {
    icon: FileCheck,
    className: "bg-(--bg-success) text-(--state-success)",
    label: "grounded",
  },
  review: {
    icon: AlertTriangle,
    className: "bg-(--bg-warning) text-(--state-warning)",
    label: "review",
  },
  blocked: {
    icon: FileX,
    className: "bg-(--bg-error) text-(--state-error)",
    label: "blocked",
  },
  neutral: {
    icon: Minus,
    className: "bg-(--border-default) text-(--text-muted)",
    label: "neutral",
  },
};

export function ConfidenceBadge({
  status,
  label,
  className,
}: {
  status: ConfidenceStatus;
  label?: string;
  className?: string;
}) {
  const { icon: Icon, className: statusClassName, label: defaultLabel } = config[status];
  return (
    <Badge variant="outline" className={cn("rounded-md border-transparent font-mono", statusClassName, className)}>
      <Icon />
      {label ?? defaultLabel}
    </Badge>
  );
}
