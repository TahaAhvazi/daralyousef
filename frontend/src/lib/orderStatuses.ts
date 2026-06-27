/** Order-level lifecycle statuses (aligned with backend ORDER_STATUSES). */
export const ORDER_STATUSES = [
  "draft",
  "pending_review",
  "awaiting_customer",
  "customer_approved",
  "confirmed",
  "paid",
  "in_production",
  "delivered",
  "closed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Statuses shown in the orders list filter. */
export const ORDER_LIST_FILTER_STATUSES: OrderStatus[] = [
  "draft",
  "pending_review",
  "awaiting_customer",
  "customer_approved",
  "confirmed",
  "paid",
  "in_production",
  "delivered",
  "closed",
  "cancelled",
];

/** Orders that have entered production (paid or actively executing). */
export const PRODUCTION_ORDER_STATUSES = new Set<string>([
  "paid",
  "in_production",
  "delivered",
  "closed",
]);

export function orderStatusOptionsForUser(
  current: string,
  canAdmin: boolean,
  _canPaid?: boolean,
): OrderStatus[] {
  const workflow = ORDER_STATUSES.filter((s) => s !== "paid") as OrderStatus[];
  if (canAdmin) return workflow;
  return [];
}

/** Workflow status shown in UI (paid is a payment flag, not a project stage). */
export function displayOrderStatus(status: string): string {
  return status === "paid" ? "confirmed" : status;
}

/** Whether payment has been confirmed for this order. */
export function isOrderPaymentConfirmed(status: string): boolean {
  return ["paid", "in_production", "delivered", "closed"].includes(status);
}

/** Status value for the workflow dropdown. */
export function workflowStatusValue(status: string): OrderStatus {
  return (status === "paid" ? "confirmed" : status) as OrderStatus;
}
