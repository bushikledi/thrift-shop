/**
 * The one way a form field reports a validation problem.
 *
 * Before this, every form hand-rolled its own `{errors.x && <p …>}` block with
 * four different class combinations, and several fields had no message at all —
 * submitting just did nothing. Rendering through one component keeps the
 * wording, spacing and colour identical across auth, checkout, account, vendor
 * and admin forms.
 */
import type { FieldError as RHFFieldError } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldErrorProps {
  /** The react-hook-form error for this field, if any. */
  error?: RHFFieldError | { message?: string };
  /** Ties the message to its input via aria-describedby. */
  id?: string;
  className?: string;
}

export function FieldError({ error, id, className }: FieldErrorProps) {
  const message = error?.message;
  if (!message) return null;

  return (
    <p
      id={id}
      role="alert"
      className={cn(
        "flex items-center gap-1.5 text-sm font-medium text-destructive",
        className
      )}
    >
      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {message}
    </p>
  );
}

export default FieldError;
