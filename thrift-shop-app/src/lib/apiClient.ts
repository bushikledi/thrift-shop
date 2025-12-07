/**
 * Production-ready API Client
 * Features:
 * - Typed requests/responses from OpenAPI spec
 * - Authentication with bearer token and httpOnly cookies
 * - Automatic retry with exponential backoff for 5xx errors
 * - Request/response interceptors
 * - Error handling and transformation
 */

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import type { ErrorResponseDto } from "@/types";
import { logger } from "./logger";

// ============================================
// Configuration
// ============================================
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000/api/v1";
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// ============================================
// Custom Error Class
// ============================================
export class ApiError extends Error {
  public statusCode: number;
  public errorCode?: string;
  public correlationId?: string;
  public details?: unknown;
  public originalError?: AxiosError;

  constructor(
    message: string,
    statusCode: number,
    errorCode?: string,
    correlationId?: string,
    details?: unknown,
    originalError?: AxiosError
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.correlationId = correlationId;
    this.details = details;
    this.originalError = originalError;
  }

  static fromAxiosError(error: AxiosError<ErrorResponseDto>): ApiError {
    const response = error.response;
    const data = response?.data;

    return new ApiError(
      Array.isArray(data?.message)
        ? data.message.join(", ")
        : data?.message || error.message || "An unexpected error occurred",
      response?.status || 500,
      data?.errorCode,
      data?.correlationId,
      data?.details,
      error
    );
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }
}

// ============================================
// Retry logic with exponential backoff
// ============================================
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetry = (error: AxiosError): boolean => {
  // Retry on network errors or 5xx server errors
  if (!error.response) return true;
  return error.response.status >= 500 && error.response.status < 600;
};

const retryRequest = async <T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = INITIAL_RETRY_DELAY
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && error instanceof AxiosError && shouldRetry(error)) {
      const retryContext: Record<string, unknown> = {};
      if (error.response?.status !== undefined) {
        retryContext.status = error.response.status;
      }
      logger.warn(
        `Retrying request, ${retries} attempts remaining`,
        Object.keys(retryContext).length > 0 ? retryContext : undefined
      );
      await sleep(delay);
      return retryRequest(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

// ============================================
// Create Axios Instance
// ============================================
function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    withCredentials: true, // Send cookies with requests
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request interceptor
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Log request in development
      logger.debug(
        `API Request: ${config.method?.toUpperCase()} ${config.url}`,
        {
          params: config.params,
        }
      );

      // If we have a token in memory (for SSR), add it to the header
      if (typeof window === "undefined") {
        // Server-side: token might be passed via custom header
        const serverToken = (
          config as AxiosRequestConfig & { _serverToken?: string }
        )._serverToken;
        if (serverToken) {
          config.headers.Authorization = `Bearer ${serverToken}`;
        }
      }

      return config;
    },
    (error) => {
      // Build proper context for request errors
      const requestErrorContext: Record<string, unknown> = {};
      if (error.config?.url) {
        requestErrorContext.url = error.config.url;
      }
      if (error.config?.method) {
        requestErrorContext.method = error.config.method;
      }
      if (error.message) {
        requestErrorContext.errorMessage = error.message;
      }
      
      const hasRequestContext = Object.keys(requestErrorContext).length > 0;
      if (hasRequestContext) {
        logger.error("Request error", requestErrorContext);
      } else {
        logger.error("Request error");
      }
      return Promise.reject(error);
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    (response) => {
      logger.debug(`API Response: ${response.status}`, {
        url: response.config.url,
      });
      return response;
    },
    (error: AxiosError<ErrorResponseDto>) => {
      const status = error.response?.status;

      // Build context object with only meaningful values
      const errorContext: Record<string, unknown> = {};
      if (status !== undefined && status !== null && status !== 0) {
        errorContext.status = status;
      }
      if (
        error.config?.url &&
        typeof error.config.url === "string" &&
        error.config.url.trim() !== ""
      ) {
        errorContext.url = error.config.url;
      }
      if (
        error.response?.data?.message &&
        typeof error.response.data.message === "string" &&
        error.response.data.message.trim() !== ""
      ) {
        errorContext.message = error.response.data.message;
      }
      if (
        error.response?.data?.correlationId &&
        String(error.response.data.correlationId).trim() !== ""
      ) {
        errorContext.correlationId = error.response.data.correlationId;
      }
      if (
        error.message &&
        typeof error.message === "string" &&
        error.message.trim() !== ""
      ) {
        errorContext.errorMessage = error.message;
      }

      // Only log if we have meaningful context - verify it's not empty
      const contextKeys = Object.keys(errorContext);
      const hasContext =
        contextKeys.length > 0 &&
        Object.values(errorContext).some(
          (v) => v !== undefined && v !== null && v !== ""
        );

      // Never pass an empty object - only pass context if it has valid keys and values
      if (hasContext && contextKeys.length > 0) {
        logger.error("API Error", errorContext);
      } else {
        // Explicitly don't pass context if empty
        logger.error("API Error");
      }

      // Handle specific status codes
      if (status === 401) {
        // Emit event for auth handling
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("auth:unauthorized"));
        }
      }

      return Promise.reject(ApiError.fromAxiosError(error));
    }
  );

  return client;
}

// ============================================
// API Client Instance
// ============================================
export const apiClient = createApiClient();

// ============================================
// Typed request helpers
// ============================================
export async function get<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  return retryRequest(async () => {
    const response = await apiClient.get<T>(url, config);
    return response.data;
  });
}

export async function post<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
}

export async function put<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
}

export async function patch<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.patch<T>(url, data, config);
  return response.data;
}

export async function del<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
}

// For file uploads
export async function upload<T>(
  url: string,
  formData: FormData,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.post<T>(url, formData, {
    ...config,
    headers: {
      ...config?.headers,
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

// ============================================
// Server-side helpers
// ============================================
export function createServerClient(token?: string): {
  get: <T>(url: string, config?: AxiosRequestConfig) => Promise<T>;
  post: <T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ) => Promise<T>;
} {
  const serverConfig: AxiosRequestConfig = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };

  return {
    get: <T>(url: string, config?: AxiosRequestConfig) =>
      get<T>(url, { ...serverConfig, ...config }),
    post: <T, D = unknown>(
      url: string,
      data?: D,
      config?: AxiosRequestConfig
    ) => post<T, D>(url, data, { ...serverConfig, ...config }),
  };
}

// Default export
export default apiClient;
