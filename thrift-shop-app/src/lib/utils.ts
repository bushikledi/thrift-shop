import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(
  // The API serializes money as strings (Prisma Decimal), so accept both and
  // coerce defensively — passing a string straight to `.toFixed()` throws.
  price: number | string | null | undefined,
  currency = "ALL",
  locale = "en-US"
): string {
  const value = typeof price === "number" ? price : Number(price ?? 0);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatDate(date: string | Date, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

export const conditionLabels: Record<string, string> = {
  LIKE_NEW: "Like New",
  VERY_GOOD: "Very Good",
  GOOD: "Good",
  FAIR: "Fair",
  POOR: "Poor",
};

export const conditionColors: Record<string, string> = {
  LIKE_NEW: "bg-green-100 text-green-800",
  VERY_GOOD: "bg-blue-100 text-blue-800",
  GOOD: "bg-yellow-100 text-yellow-800",
  FAIR: "bg-orange-100 text-orange-800",
  POOR: "bg-red-100 text-red-800",
};

// Alias for formatPrice
export const formatCurrency = formatPrice;

/**
 * Format phone number as (XXX) XXX-XXXX
 */
export function formatPhoneNumber(value: string): string {
  const cleaned = value.replace(/\D/g, "");
  const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
  if (!match) return value;
  
  const formatted = [
    match[1] && `(${match[1]}`,
    match[2] && `) ${match[2]}`,
    match[3] && `-${match[3]}`,
  ]
    .filter(Boolean)
    .join("");
  
  return formatted || value;
}

/**
 * Format credit card number with spaces every 4 digits
 */
export function formatCardNumber(value: string): string {
  const cleaned = value.replace(/\D/g, "");
  const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
  return formatted;
}

/**
 * Format expiry date as MM/YY
 */
export function formatExpiryDate(value: string): string {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length >= 2) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
  }
  return cleaned;
}

/**
 * Format ZIP code (5 digits or 5+4 format)
 */
export function formatZipCode(value: string): string {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length > 5) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 9)}`;
  }
  return cleaned;
}