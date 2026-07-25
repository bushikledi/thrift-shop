/**
 * Order status control for the vendor screens.
 *
 * Two things this fixes over the previous inline selects: the trigger shows the
 * order's *current* status rather than an empty "Change status…" placeholder,
 * and the menu only offers transitions the API will accept — picking an
 * illegal one used to come back as a 400 with no way to tell in advance.
 */
"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { ConfirmationModal } from "@/components/shared";
import { useUpdateOrderStatus } from "@/hooks/useOrders";
import {
  isDestructiveTransition,
  nextOrderStatuses,
  orderStatusMeta,
  type UpdatableOrderStatus,
} from "@/lib/order-status";
import { cn } from "@/lib/utils";

interface OrderStatusSelectProps {
  orderId: string;
  status: string;
  /** Compact sizing for use inside a list row. */
  size?: "sm" | "default";
  className?: string;
}

export function OrderStatusSelect({
  orderId,
  status,
  size = "default",
  className,
}: OrderStatusSelectProps) {
  const updateStatus = useUpdateOrderStatus();
  const [confirming, setConfirming] = useState<UpdatableOrderStatus | null>(
    null
  );

  const options = nextOrderStatuses(status);
  const current = orderStatusMeta(status);
  // A terminal order (cancelled, refunded) has nowhere left to go. Say so
  // instead of offering a menu that would reject everything in it.
  const isTerminal = options.length === 0;

  const apply = (next: UpdatableOrderStatus) => {
    updateStatus.mutate(
      { id: orderId, data: { status: next } },
      {
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Failed to update status"
          ),
      }
    );
  };

  const handleChange = (value: string) => {
    const next = value as UpdatableOrderStatus;
    if (next === status) return;
    if (isDestructiveTransition(next)) {
      setConfirming(next);
      return;
    }
    apply(next);
  };

  return (
    <>
      <Select
        value={status}
        onValueChange={handleChange}
        disabled={isTerminal || updateStatus.isPending}
      >
        <SelectTrigger
          aria-label="Order status"
          className={cn(
            size === "sm" && "h-8 w-[150px] text-xs",
            size === "default" && "w-full",
            className
          )}
        >
          {/* Render the label directly rather than <SelectValue />: the menu
              item reads "Confirmed (current)", which the trigger truncates. */}
          {updateStatus.isPending ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Updating…
            </span>
          ) : (
            <span className="truncate">{current.label}</span>
          )}
        </SelectTrigger>
        <SelectContent>
          {/* The current status is listed so the trigger has something to
              render, but it is not a transition the vendor can pick. */}
          <SelectItem value={status} disabled>
            {current.label} (current)
          </SelectItem>
          {options.map((option) => {
            const meta = orderStatusMeta(option);
            return (
              <SelectItem key={option} value={option}>
                Mark as {meta.label.toLowerCase()}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <ConfirmationModal
        open={confirming !== null}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={
          confirming === "CANCELLED" ? "Cancel this order?" : "Refund this order?"
        }
        description={
          confirming === "CANCELLED"
            ? "The items go back into your stock and the customer is notified. This cannot be undone."
            : "The order is marked refunded and the customer is notified. This cannot be undone."
        }
        confirmLabel={confirming === "CANCELLED" ? "Cancel order" : "Refund"}
        cancelLabel="Keep as is"
        variant="destructive"
        onConfirm={() => {
          if (confirming) apply(confirming);
          setConfirming(null);
        }}
      />
    </>
  );
}

export default OrderStatusSelect;
