/**
 * Utility functions for input sanitization to prevent SQL injection,
 * XSS, and other injection attacks.
 */

/**
 * Characters that could be dangerous in search queries
 */
const DANGEROUS_CHARS = /[<>{}[\]\\^~`|]/g;

/**
 * SQL-like patterns that could indicate injection attempts
 */
const SQL_PATTERNS =
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|EXEC|EXECUTE|TRUNCATE|CREATE)\b|--|;|\/\*|\*\/)/gi;

/**
 * Sanitize a search query string to prevent injection attacks.
 *
 * @param input - The raw input string
 * @param options - Sanitization options
 * @returns Sanitized string safe for database queries
 */
export function sanitizeSearchQuery(
  input: string,
  options: {
    maxLength?: number;
    trimWhitespace?: boolean;
    removeDangerousChars?: boolean;
    collapseWhitespace?: boolean;
  } = {},
): string {
  const {
    maxLength = 200,
    trimWhitespace = true,
    removeDangerousChars = true,
    collapseWhitespace = true,
  } = options;

  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Trim leading and trailing whitespace
  if (trimWhitespace) {
    sanitized = sanitized.trim();
  }

  // Remove dangerous characters
  if (removeDangerousChars) {
    sanitized = sanitized.replace(DANGEROUS_CHARS, '');
  }

  // Remove SQL-like patterns
  sanitized = sanitized.replace(SQL_PATTERNS, '');

  // Collapse multiple spaces into single space
  if (collapseWhitespace) {
    sanitized = sanitized.replace(/\s+/g, ' ');
  }

  // Enforce maximum length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Escape special characters for use in LIKE queries.
 * This prevents users from using wildcards in unexpected ways.
 *
 * @param input - The input string to escape
 * @returns String with special chars escaped for LIKE patterns
 */
export function escapeLikePattern(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Escape %, _, and \ which have special meaning in LIKE patterns
  return input.replace(/[%_\\]/g, '\\$&');
}

/**
 * Strip HTML tags from a string to prevent XSS.
 *
 * @param input - The input string
 * @returns String with HTML tags removed
 */
export function stripHtmlTags(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input.replace(/<[^>]*>/g, '');
}

/**
 * Encode HTML entities to prevent XSS when displaying user input.
 *
 * @param input - The input string
 * @returns String with HTML entities encoded
 */
export function encodeHtmlEntities(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  };

  return input.replace(/[&<>"'/]/g, (char) => entities[char] || char);
}

/**
 * Custom transformer for class-transformer to sanitize search queries
 */
export function SanitizeSearchQuery(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    // This is a marker decorator - actual transformation happens in the DTO
    Reflect.defineMetadata('sanitize:search', true, target, propertyKey);
  };
}
