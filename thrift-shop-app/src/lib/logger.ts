/**
 * Simple logging service with Sentry stub
 * In production, replace console calls with actual logging service
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

interface Logger {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
  setUser: (user: { id: string; email?: string } | null) => void;
}

// Debug mode from environment
const isDebugMode =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_DEBUG === "true";

// Sentry stub - replace with actual Sentry SDK in production
const SentryStub = {
  captureException: (error: Error, context?: LogContext) => {
    if (isDebugMode) {
      console.error("[Sentry Stub] Would capture exception:", error, context);
    }
  },
  captureMessage: (message: string, level: LogLevel) => {
    if (isDebugMode) {
      console.log(`[Sentry Stub] Would capture message (${level}):`, message);
    }
  },
  setUser: (user: { id: string; email?: string } | null) => {
    if (isDebugMode) {
      console.log("[Sentry Stub] Would set user:", user);
    }
  },
};

// Current user context for logging
let currentUser: { id: string; email?: string } | null = null;

function formatMessage(level: LogLevel, message: string): string {
  const timestamp = new Date().toISOString();
  const userInfo = currentUser ? ` [user:${currentUser.id}]` : "";
  return `[${timestamp}] [${level.toUpperCase()}]${userInfo} ${message}`;
}

function shouldLog(level: LogLevel): boolean {
  if (level === "debug") {
    return isDebugMode;
  }
  return true;
}

function sanitizeContext(context?: LogContext): LogContext | undefined {
  if (!context) return undefined;

  // If context is an empty object, return undefined immediately
  if (Object.keys(context).length === 0) {
    return undefined;
  }

  // Filter out undefined, null, empty strings, and empty objects
  const sanitized = Object.entries(context).reduce((acc, [key, value]) => {
    // Skip undefined, null, empty strings
    if (value === undefined || value === null || value === "") {
      return acc;
    }

    // Skip empty objects
    if (
      typeof value === "object" &&
      !Array.isArray(value) &&
      value !== null &&
      Object.keys(value).length === 0
    ) {
      return acc;
    }

    // Skip empty arrays
    if (Array.isArray(value) && value.length === 0) {
      return acc;
    }

    acc[key] = value;
    return acc;
  }, {} as LogContext);

  // Return undefined if object is empty (double-check)
  const hasKeys = Object.keys(sanitized).length > 0;
  return hasKeys ? sanitized : undefined;
}

export const logger: Logger = {
  debug: (message: string, context?: LogContext) => {
    if (shouldLog("debug")) {
      const sanitized = sanitizeContext(context);
      if (sanitized) {
        console.debug(formatMessage("debug", message), sanitized);
      } else {
        console.debug(formatMessage("debug", message));
      }
    }
  },

  info: (message: string, context?: LogContext) => {
    if (shouldLog("info")) {
      const sanitized = sanitizeContext(context);
      if (sanitized) {
        console.info(formatMessage("info", message), sanitized);
      } else {
        console.info(formatMessage("info", message));
      }
    }
  },

  warn: (message: string, context?: LogContext) => {
    if (shouldLog("warn")) {
      const sanitized = sanitizeContext(context);
      if (sanitized) {
        console.warn(formatMessage("warn", message), sanitized);
      } else {
        console.warn(formatMessage("warn", message));
      }
      SentryStub.captureMessage(message, "warn");
    }
  },

  error: (message: string, context?: LogContext) => {
    if (shouldLog("error")) {
      // Early check: if context is an empty object, treat as no context
      if (
        context &&
        typeof context === "object" &&
        !Array.isArray(context) &&
        Object.keys(context).length === 0
      ) {
        console.error(formatMessage("error", message));
        SentryStub.captureMessage(message, "error");
        return;
      }

      const sanitized = sanitizeContext(context);

      // If sanitized is undefined or empty, log without context
      if (!sanitized || Object.keys(sanitized).length === 0) {
        console.error(formatMessage("error", message));
        SentryStub.captureMessage(message, "error");
        return;
      }

      // Verify we have valid values
      const hasValidValues = Object.values(sanitized).some(
        (v) => v !== undefined && v !== null && v !== ""
      );

      if (hasValidValues) {
        if (sanitized.error instanceof Error) {
          console.error(formatMessage("error", message), sanitized);
          SentryStub.captureException(sanitized.error as Error, sanitized);
        } else {
          SentryStub.captureMessage(message, "error");
        }
      } else {
        // Log without context if all values are empty
        console.error(formatMessage("error", message));
        SentryStub.captureMessage(message, "error");
      }
    }
  },

  setUser: (user: { id: string; email?: string } | null) => {
    currentUser = user;
    SentryStub.setUser(user);
  },
};

// Network profiler for debugging
export const networkProfiler = {
  requests: [] as Array<{
    url: string;
    method: string;
    duration: number;
    status: number;
    timestamp: Date;
  }>,

  record: (url: string, method: string, duration: number, status: number) => {
    if (isDebugMode) {
      networkProfiler.requests.push({
        url,
        method,
        duration,
        status,
        timestamp: new Date(),
      });
      // Keep only last 100 requests
      if (networkProfiler.requests.length > 100) {
        networkProfiler.requests.shift();
      }
    }
  },

  getSlowRequests: (thresholdMs: number = 1000) => {
    return networkProfiler.requests.filter((r) => r.duration > thresholdMs);
  },

  getSummary: () => {
    const requests = networkProfiler.requests;
    if (requests.length === 0) return null;

    const durations = requests.map((r) => r.duration);
    return {
      total: requests.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
      errorCount: requests.filter((r) => r.status >= 400).length,
    };
  },

  clear: () => {
    networkProfiler.requests = [];
  },
};

export default logger;
