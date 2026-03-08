import type { OrderStatus } from "../hooks/useQueries";
import { ORDER_STATUS_CLASSES, ORDER_STATUS_LABELS } from "../utils/format";

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const cls = ORDER_STATUS_CLASSES[status] ?? "";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls} ${className}`}
    >
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}
