/**
 * Orders API Service
 */
import { get, post, put } from "../apiClient";
import type {
  OrderResponseDto,
  CreateOrderDto,
  UpdateOrderStatusDto,
  PaginationParams,
} from "@/types";

export const ordersApi = {
  /**
   * Create order (supports guest checkout)
   */
  checkout: (data: CreateOrderDto): Promise<OrderResponseDto[]> =>
    post<OrderResponseDto[], CreateOrderDto>("/orders/checkout", data),

  /**
   * Track order by order number
   */
  track: (orderNumber: string): Promise<OrderResponseDto> =>
    get<OrderResponseDto>(`/orders/track/${orderNumber}`),

  /**
   * Get order by ID
   */
  getById: (id: string): Promise<OrderResponseDto> =>
    get<OrderResponseDto>(`/orders/${id}`),

  /**
   * Get vendor orders
   */
  getVendorOrders: (
    params: PaginationParams & { status?: string }
  ): Promise<OrderResponseDto[]> =>
    get<OrderResponseDto[]>("/orders", { params }),

  /**
   * Update order status (vendor)
   */
  updateStatus: (
    id: string,
    data: UpdateOrderStatusDto
  ): Promise<OrderResponseDto> =>
    put<OrderResponseDto, UpdateOrderStatusDto>(`/orders/${id}/status`, data),
};

export default ordersApi;
