/**
 * Health Hooks
 * React Query hooks for health check operations
 */
"use client";

import { useQuery } from "@tanstack/react-query";
import { healthApi } from "@/lib/api/health";
import { queryKeys } from "./queryKeys";

/**
 * Get API health status
 */
export function useHealthCheck() {
  return useQuery({
    queryKey: queryKeys.health.check(),
    queryFn: () => healthApi.check(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Refresh every minute
  });
}

/**
 * Get database health status
 */
export function useDatabaseHealth() {
  return useQuery({
    queryKey: queryKeys.health.db(),
    queryFn: () => healthApi.checkDatabase(),
    staleTime: 30 * 1000,
  });
}

/**
 * Get Redis health status
 */
export function useRedisHealth() {
  return useQuery({
    queryKey: queryKeys.health.redis(),
    queryFn: () => healthApi.checkRedis(),
    staleTime: 30 * 1000,
  });
}

/**
 * Get object store health status
 */
export function useObjectStoreHealth() {
  return useQuery({
    queryKey: queryKeys.health.objectStore(),
    queryFn: () => healthApi.checkObjectStore(),
    staleTime: 30 * 1000,
  });
}

/**
 * Combined health status
 */
export function useAllHealthChecks() {
  const api = useHealthCheck();
  const db = useDatabaseHealth();
  const redis = useRedisHealth();
  const objectStore = useObjectStoreHealth();

  const isHealthy =
    api.data?.status === "ok" &&
    db.data?.status === "ok" &&
    redis.data?.status === "ok" &&
    objectStore.data?.status === "ok";

  const isLoading =
    api.isLoading || db.isLoading || redis.isLoading || objectStore.isLoading;

  return {
    api,
    db,
    redis,
    objectStore,
    isHealthy,
    isLoading,
  };
}
