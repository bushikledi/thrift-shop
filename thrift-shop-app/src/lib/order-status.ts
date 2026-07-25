/**
 * Order status vocabulary shared by the vendor screens.
 *
 * The transition map mirrors `validTransitions` in the API's
 * `OrdersService.updateStatus`. Offering a status the server will reject turns
 * a mis-click into a 400 and a red toast, so the UI only ever shows moves that
 * are actually allowed. If the server's map changes, change this one too.
 */
import {
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  RotateCcw,
  Truck,
  Undo2,
  XCircle,
  type LucideIcon,
} from "lucide-react";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"
  | "REFUNDED";

/**
 * PENDING is the state an order starts in, never one it can be moved back to —
 * matching the API's UpdateOrderStatusDto.
 */
export type UpdatableOrderStatus = Exclude<OrderStatus, "PENDING">;

export const ORDER_STATUS_TRANSITIONS: Record<
  OrderStatus,
  UpdatableOrderStatus[]
> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: ["REFUNDED"],
  REFUNDED: [],
};

interface StatusMeta {
  label: string;
  icon: LucideIcon;
  /** Badge classes; kept legible in both themes. */
  className: string;
}

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  PENDING: {
    label: "Pending",
    icon: Clock,
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  CONFIRMED: {
    label: "Confirmed",
    icon: CheckCircle2,
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  PROCESSING: {
    label: "Processing",
    icon: Loader2,
    className:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  SHIPPED: {
    label: "Shipped",
    icon: Truck,
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  },
  DELIVERED: {
    label: "Delivered",
    icon: Package,
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  RETURNED: {
    label: "Returned",
    icon: Undo2,
    className:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  },
  REFUNDED: {
    label: "Refunded",
    icon: RotateCcw,
    className:
      "bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-300",
  },
};

export const ORDER_STATUSES = Object.keys(ORDER_STATUS_META) as OrderStatus[];

export function isOrderStatus(value: string): value is OrderStatus {
  return value in ORDER_STATUS_META;
}

export function orderStatusMeta(status: string): StatusMeta {
  return isOrderStatus(status)
    ? ORDER_STATUS_META[status]
    : ORDER_STATUS_META.PENDING;
}

export function nextOrderStatuses(status: string): UpdatableOrderStatus[] {
  return isOrderStatus(status) ? ORDER_STATUS_TRANSITIONS[status] : [];
}

/**
 * Transitions that destroy work or money and deserve a confirmation step:
 * cancelling restores stock and re-activates the products.
 */
export function isDestructiveTransition(next: UpdatableOrderStatus): boolean {
  return next === "CANCELLED" || next === "REFUNDED";
}
