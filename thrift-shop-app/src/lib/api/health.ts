/**
 * Health API Service
 */
import { get } from "../apiClient";
import type { HealthResponseDto } from "@/types";

export const healthApi = {
  /**
   * Health check endpoint
   */
  check: (): Promise<HealthResponseDto> => get<HealthResponseDto>("/health"),

  /**
   * Database health check
   */
  checkDatabase: (): Promise<HealthResponseDto> =>
    get<HealthResponseDto>("/health/db"),

  /**
   * Redis health check
   */
  checkRedis: (): Promise<HealthResponseDto> =>
    get<HealthResponseDto>("/health/redis"),

  /**
   * S3/Object storage health check
   */
  checkObjectStore: (): Promise<HealthResponseDto> =>
    get<HealthResponseDto>("/health/object-store"),

  /**
   * Readiness probe for Kubernetes
   */
  readiness: (): Promise<void> => get<void>("/health/ready"),

  /**
   * Liveness probe for Kubernetes
   */
  liveness: (): Promise<void> => get<void>("/health/live"),
};

export default healthApi;
