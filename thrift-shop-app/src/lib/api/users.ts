/**
 * Users API Service
 */
import { get, put, patch, post, del } from "../apiClient";
import type {
  UserProfileResponseDto,
  UpdateUserDto,
  SavedItemResponseDto,
  OrderResponseDto,
  PaginationParams,
} from "@/types";

export interface AddressDto {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface NotificationToggles {
  orders: boolean;
  promotions: boolean;
  reviews: boolean;
  messages: boolean;
}

export type NotificationChannel = "email" | "sms";

export interface UserPreferences {
  notifications: Record<NotificationChannel, NotificationToggles>;
}

/** Any subset of preferences, for partial updates. */
export interface PartialUserPreferences {
  notifications?: Partial<
    Record<NotificationChannel, Partial<NotificationToggles>>
  >;
}

export const usersApi = {
  /**
   * Get current user profile
   */
  getProfile: (): Promise<UserProfileResponseDto> =>
    get<UserProfileResponseDto>("/users/me"),

  /**
   * Update current user profile
   */
  updateProfile: (data: UpdateUserDto): Promise<UserProfileResponseDto> =>
    put<UserProfileResponseDto, UpdateUserDto>("/users/me", data),

  /**
   * Get saved/wishlist items
   */
  getSavedItems: (): Promise<SavedItemResponseDto[]> =>
    get<SavedItemResponseDto[]>("/users/me/saved"),

  /**
   * Save an item to wishlist
   */
  saveItem: (productId: string): Promise<SavedItemResponseDto> =>
    post<SavedItemResponseDto>(`/users/me/saved/${productId}`),

  /**
   * Remove item from wishlist
   */
  removeSavedItem: (productId: string): Promise<SavedItemResponseDto> =>
    del<SavedItemResponseDto>(`/users/me/saved/${productId}`),

  /**
   * Get user orders
   */
  getOrders: (params: PaginationParams): Promise<OrderResponseDto[]> =>
    get<OrderResponseDto[]>("/users/me/orders", { params }),

  /**
   * Get current user address
   */
  getAddress: (): Promise<AddressDto | null> =>
    get<AddressDto | null>("/users/me/address"),

  /**
   * Update current user address
   */
  updateAddress: (data: AddressDto): Promise<AddressDto> =>
    put<AddressDto, AddressDto>("/users/me/address", data),

  /**
   * Get notification preferences (defaults applied server-side)
   */
  getPreferences: (): Promise<UserPreferences> =>
    get<UserPreferences>("/users/me/preferences"),

  /**
   * Update notification preferences. Partial: only the channels/categories
   * included are changed.
   */
  updatePreferences: (data: PartialUserPreferences): Promise<UserPreferences> =>
    patch<UserPreferences, PartialUserPreferences>(
      "/users/me/preferences",
      data
    ),
};

export default usersApi;
