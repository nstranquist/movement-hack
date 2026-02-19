import { STATUS_LABEL, STATUS_COLOR } from "@/types/bounty";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: number;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_COLOR[status] ?? "bg-gray-100 text-gray-600",
        className
      )}
    >
      {STATUS_LABEL[status] ?? "Unknown"}
    </span>
  );
}
