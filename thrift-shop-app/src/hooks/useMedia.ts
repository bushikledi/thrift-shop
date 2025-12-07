/**
 * Media Hooks
 * React Query hooks for media operations
 */
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { mediaApi } from "@/lib/api/media";
import { queryKeys } from "./queryKeys";
import type { MediaResponseDto } from "@/types";
import { ApiError } from "@/lib/apiClient";

/**
 * Get all media
 */
export function useMedia() {
  return useQuery({
    queryKey: queryKeys.media.lists(),
    queryFn: () => mediaApi.list(),
    staleTime: 60 * 1000,
  });
}

/**
 * Get media by ID
 */
export function useMediaById(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.media.detail(id),
    queryFn: () => mediaApi.getById(id),
    enabled: !!id && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get media by owner
 */
export function useMediaByOwner(ownerType: string, ownerId: string) {
  return useQuery({
    queryKey: queryKeys.media.owner(ownerType, ownerId),
    queryFn: () => mediaApi.getByOwner(ownerType, ownerId),
    enabled: !!ownerType && !!ownerId,
    staleTime: 60 * 1000,
  });
}

/**
 * Upload single file
 */
export function useUploadMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      ownerType,
      ownerId,
    }: {
      file: File;
      ownerType?: string;
      ownerId?: string;
    }) => mediaApi.upload(file, ownerType, ownerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media.all });
      toast.success("File uploaded successfully");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to upload file");
    },
  });
}

/**
 * Upload multiple files
 */
export function useUploadMultipleMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      files,
      ownerType,
      ownerId,
    }: {
      files: File[];
      ownerType?: string;
      ownerId?: string;
    }) => mediaApi.uploadMultiple(files, ownerType, ownerId),
    onSuccess: (mediaList: MediaResponseDto[]) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media.all });
      toast.success(`${mediaList.length} files uploaded successfully`);
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to upload files");
    },
  });
}

/**
 * Delete media
 */
export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => mediaApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media.all });
      toast.success("File deleted successfully");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to delete file");
    },
  });
}

/**
 * Get presigned URL for direct upload
 */
export function useGetPresignedUrl() {
  return useMutation({
    mutationFn: ({
      filename,
      mimeType,
    }: {
      filename: string;
      mimeType: string;
    }) => mediaApi.getPresignedUrl(filename, mimeType),
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to get upload URL");
    },
  });
}
