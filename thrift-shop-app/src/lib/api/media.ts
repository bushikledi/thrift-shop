/**
 * Media API Service
 */
import { get, del, upload } from "../apiClient";
import type { MediaResponseDto } from "@/types";

export const mediaApi = {
  /**
   * Get all media
   */
  list: (): Promise<MediaResponseDto[]> => get<MediaResponseDto[]>("/media"),

  /**
   * Get media by ID
   */
  getById: (id: string): Promise<MediaResponseDto> =>
    get<MediaResponseDto>(`/media/${id}`),

  /**
   * Get media by owner
   */
  getByOwner: (
    ownerType: string,
    ownerId: string
  ): Promise<MediaResponseDto[]> =>
    get<MediaResponseDto[]>(`/media/owner/${ownerType}/${ownerId}`),

  /**
   * Upload a single file
   */
  upload: (
    file: File,
    ownerType?: string,
    ownerId?: string
  ): Promise<MediaResponseDto> => {
    const formData = new FormData();
    formData.append("file", file);
    if (ownerType) formData.append("ownerType", ownerType);
    if (ownerId) formData.append("ownerId", ownerId);
    return upload<MediaResponseDto>("/media/upload", formData);
  },

  /**
   * Upload multiple files
   */
  uploadMultiple: (
    files: File[],
    ownerType?: string,
    ownerId?: string
  ): Promise<MediaResponseDto[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    if (ownerType) formData.append("ownerType", ownerType);
    if (ownerId) formData.append("ownerId", ownerId);
    return upload<MediaResponseDto[]>("/media/upload/multiple", formData);
  },

  /**
   * Get a presigned URL for direct upload
   */
  getPresignedUrl: (
    filename: string,
    mimeType: string
  ): Promise<{ url: string; key: string }> => {
    const formData = new FormData();
    formData.append("filename", filename);
    formData.append("mimeType", mimeType);
    return upload<{ url: string; key: string }>(
      "/media/presigned-url",
      formData
    );
  },

  /**
   * Delete media
   */
  delete: (id: string): Promise<void> => del<void>(`/media/${id}`),
};

export default mediaApi;
