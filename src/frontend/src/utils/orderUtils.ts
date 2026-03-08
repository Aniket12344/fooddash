/**
 * Generate or retrieve a unique human-readable order ID for a given backend order ID.
 * IDs are persisted in localStorage and never change for the same backend order.
 * Format: FD-YYYYMMDD-XXXX (e.g. FD-20260308-0001)
 */
export function getUniqueOrderId(orderId: bigint): string {
  const key = `fooddash_order_uid_${orderId.toString()}`;
  const existing = localStorage.getItem(key);
  if (existing) return existing;

  const counterKey = "fooddash_order_counter";
  const counter = Number.parseInt(localStorage.getItem(counterKey) ?? "1", 10);
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const uid = `FD-${y}${m}${d}-${String(counter).padStart(4, "0")}`;
  localStorage.setItem(key, uid);
  localStorage.setItem(counterKey, String(counter + 1));
  return uid;
}
