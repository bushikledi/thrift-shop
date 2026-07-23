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

/**
 * Reduced order shape returned by the public tracking endpoint. Deliberately
 * excludes contact details and the shipping address.
 */
export interface OrderTrackingResponse {
  orderNumber: string;
  status: OrderResponseDto["status"];
  paymentStatus: OrderResponseDto["paymentStatus"];
  paymentMethod: string;
  shippingMethod: string | null;
  trackingNumber: string | null;
  subtotal: number;
  shippingAmount: number;
  discount: number;
  total: number;
  createdAt: string;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  vendor: { displayName: string };
  items: { title: string; quantity: number; price: number }[];
}

/**
 * Checkout result. For card payments the API returns a Stripe Checkout URL to
 * redirect to; cash-on-delivery orders come back with `payment: null`.
 */
export interface CheckoutResponse {
  orders: OrderResponseDto[];
  payment: { checkoutUrl: string } | null;
}

export const ordersApi = {
  /**
   * Create order (supports guest checkout)
   */
  checkout: (data: CreateOrderDto): Promise<CheckoutResponse> =>
    post<CheckoutResponse, CreateOrderDto>("/orders/checkout", data),

  /**
   * Track an order.
   *
   * Requires the email used to place the order as proof of ownership; sent in
   * the body so it never appears in a URL or request log. Returns fulfilment
   * status only (no contact details or shipping address).
   */
  track: (
    orderNumber: string,
    email: string
  ): Promise<OrderTrackingResponse> =>
    post<OrderTrackingResponse, { orderNumber: string; email: string }>(
      "/orders/track",
      { orderNumber, email }
    ),

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
