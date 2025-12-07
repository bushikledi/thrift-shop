/**
 * Form Field Components
 * Reusable form fields with react-hook-form integration
 */
"use client";

import * as React from "react";
import {
  useFormContext,
  Controller,
  FieldPath,
  FieldValues,
} from "react-hook-form";
import { cn } from "@/lib/utils";

// ============================================
// Form Context and Components
// ============================================

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

interface FormItemContextValue {
  id: string;
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

export const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = React.ComponentProps<typeof Controller<TFieldValues, TName>>;

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ ...props }: FormFieldProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}

export function FormItem({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  );
}

export function FormLabel({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  const { error, formItemId } = useFormField();

  return (
    <label
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        error && "text-destructive",
        className
      )}
      htmlFor={formItemId}
      {...props}
    />
  );
}

export function FormControl({ ...props }: React.ComponentProps<"div">) {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <div
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
}

export function FormDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const { formDescriptionId } = useFormField();

  return (
    <p
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export function FormMessage({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message) : children;

  if (!body) {
    return null;
  }

  return (
    <p
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  );
}

// ============================================
// Input Components
// ============================================

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

export function TextInput({
  label,
  description,
  className,
  type = "text",
  ...props
}: TextInputProps) {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={formItemId}
          className={cn(
            "text-sm font-medium leading-none",
            error && "text-destructive"
          )}
        >
          {label}
        </label>
      )}
      <input
        id={formItemId}
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId
        }
        {...props}
      />
      {description && !error && (
        <p id={formDescriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <p id={formMessageId} className="text-sm font-medium text-destructive">
          {String(error.message)}
        </p>
      )}
    </div>
  );
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
}

export function Textarea({
  label,
  description,
  className,
  ...props
}: TextareaProps) {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={formItemId}
          className={cn(
            "text-sm font-medium leading-none",
            error && "text-destructive"
          )}
        >
          {label}
        </label>
      )}
      <textarea
        id={formItemId}
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        aria-invalid={!!error}
        {...props}
      />
      {description && !error && (
        <p id={formDescriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <p id={formMessageId} className="text-sm font-medium text-destructive">
          {String(error.message)}
        </p>
      )}
    </div>
  );
}

// ============================================
// Select Component
// ============================================

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectInputProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  description?: string;
  options: SelectOption[];
  placeholder?: string;
}

export function SelectInput({
  label,
  description,
  options,
  placeholder,
  className,
  ...props
}: SelectInputProps) {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={formItemId}
          className={cn(
            "text-sm font-medium leading-none",
            error && "text-destructive"
          )}
        >
          {label}
        </label>
      )}
      <select
        id={formItemId}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        aria-invalid={!!error}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      {description && !error && (
        <p id={formDescriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <p id={formMessageId} className="text-sm font-medium text-destructive">
          {String(error.message)}
        </p>
      )}
    </div>
  );
}

// ============================================
// Checkbox Component
// ============================================

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}

export function Checkbox({
  label,
  description,
  className,
  ...props
}: CheckboxProps) {
  const { error, formItemId } = useFormField();

  return (
    <div className="flex items-start space-x-3">
      <input
        id={formItemId}
        type="checkbox"
        className={cn(
          "h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary",
          className
        )}
        {...props}
      />
      <div className="space-y-1 leading-none">
        <label
          htmlFor={formItemId}
          className={cn(
            "text-sm font-medium leading-none cursor-pointer",
            error && "text-destructive"
          )}
        >
          {label}
        </label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

// ============================================
// Number Input Component
// ============================================

interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
}

export function NumberInput({
  label,
  description,
  className,
  ...props
}: NumberInputProps) {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={formItemId}
          className={cn(
            "text-sm font-medium leading-none",
            error && "text-destructive"
          )}
        >
          {label}
        </label>
      )}
      <input
        id={formItemId}
        type="number"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        aria-invalid={!!error}
        {...props}
      />
      {description && !error && (
        <p id={formDescriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <p id={formMessageId} className="text-sm font-medium text-destructive">
          {String(error.message)}
        </p>
      )}
    </div>
  );
}
