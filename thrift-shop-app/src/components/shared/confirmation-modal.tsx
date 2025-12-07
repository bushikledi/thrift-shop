/**
 * Confirmation Modal Component
 * Reusable confirmation dialog for destructive actions
 */
"use client";

import { useState, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  variant?: "default" | "destructive";
  isLoading?: boolean;
}

export function ConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  variant = "default",
  isLoading = false,
}: ConfirmationModalProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = isLoading || internalLoading;

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
      onOpenChange(false);
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={
              variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : ""
            }
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Hook for managing confirmation modal state
 */
interface UseConfirmationOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "default" | "destructive";
}

export function useConfirmation() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<UseConfirmationOptions | null>(null);
  const [resolveRef, setResolveRef] = useState<
    ((value: boolean) => void) | null
  >(null);

  const confirm = useCallback(
    (opts: UseConfirmationOptions): Promise<boolean> => {
      setOptions(opts);
      setIsOpen(true);

      return new Promise((resolve) => {
        setResolveRef(() => resolve);
      });
    },
    []
  );

  const handleConfirm = useCallback(() => {
    resolveRef?.(true);
    setIsOpen(false);
    setResolveRef(null);
  }, [resolveRef]);

  const handleCancel = useCallback(() => {
    resolveRef?.(false);
    setIsOpen(false);
    setResolveRef(null);
  }, [resolveRef]);

  const ConfirmationDialog = useCallback(() => {
    if (!options) return null;

    return (
      <AlertDialog
        open={isOpen}
        onOpenChange={(open: boolean) => !open && handleCancel()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {options.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={
                options.variant === "destructive"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {options.confirmLabel || "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }, [isOpen, options, handleConfirm, handleCancel]);

  return {
    confirm,
    ConfirmationDialog,
    isOpen,
  };
}

/**
 * Pre-configured delete confirmation
 */
interface DeleteConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName?: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export function DeleteConfirmation({
  open,
  onOpenChange,
  itemName = "this item",
  onConfirm,
  isLoading,
}: DeleteConfirmationProps) {
  return (
    <ConfirmationModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Delete ${itemName}?`}
      description={`Are you sure you want to delete ${itemName}? This action cannot be undone.`}
      confirmLabel="Delete"
      variant="destructive"
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  );
}

/**
 * Pre-configured logout confirmation
 */
interface LogoutConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export function LogoutConfirmation({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: LogoutConfirmationProps) {
  return (
    <ConfirmationModal
      open={open}
      onOpenChange={onOpenChange}
      title="Log out?"
      description="Are you sure you want to log out of your account?"
      confirmLabel="Log out"
      variant="default"
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  );
}

/**
 * Pre-configured cancel order confirmation
 */
interface CancelOrderConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export function CancelOrderConfirmation({
  open,
  onOpenChange,
  orderId,
  onConfirm,
  isLoading,
}: CancelOrderConfirmationProps) {
  return (
    <ConfirmationModal
      open={open}
      onOpenChange={onOpenChange}
      title="Cancel order?"
      description={`Are you sure you want to cancel order #${orderId}? This action cannot be undone.`}
      confirmLabel="Cancel Order"
      variant="destructive"
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  );
}

export default ConfirmationModal;
