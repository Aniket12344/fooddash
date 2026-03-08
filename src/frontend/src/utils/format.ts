import type { OrderStatus } from "../hooks/useQueries";

/** Convert paise (bigint) to Indian Rupee string */
export function formatPrice(paise: bigint): string {
  return `₹${(Number(paise) / 100).toFixed(0)}`;
}

/** Convert paise (number) to Indian Rupee string */
export function formatPriceNum(paise: number): string {
  return `₹${(paise / 100).toFixed(0)}`;
}

export function formatDate(nanoseconds: bigint): string {
  const ms = Number(nanoseconds / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  readyForPickup: "Ready for Pickup",
  pickedUp: "Picked Up",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_CLASSES: Record<OrderStatus, string> = {
  pending: "status-pending",
  accepted: "status-accepted",
  preparing: "status-preparing",
  readyForPickup: "status-readyForPickup",
  pickedUp: "status-pickedUp",
  delivered: "status-delivered",
  cancelled: "status-cancelled",
};
