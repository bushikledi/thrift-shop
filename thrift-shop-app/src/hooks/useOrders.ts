/**
 * Orders Hooks
 * React Query hooks for orders operations
 */
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ordersApi } from "@/lib/api/orders";
import { usersApi } from "@/lib/api/users";
import { queryKeys } from "./queryKeys";
import type {
  CreateOrderDto,
  UpdateOrderStatusDto,
  OrderResponseDto,
  PaginationParams,
} from "@/types";
import { ApiError } from "@/lib/apiClient";

/**
 * Create order / checkout
 */
export function useCheckout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: CreateOrderDto) => {
      console.log("Checkout mutation called with:", data);
      return ordersApi.checkout(data);
    },
    onSuccess: (orders: OrderResponseDto[]) => {
      console.log("Checkout success, orders received:", orders);

      // Clear cart after successful checkout
      queryClient.setQueryData(queryKeys.cart.current(), null);
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });

      // Invalidate orders
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.orders() });

      toast.success("Order placed successfully!");

      // Redirect to first order details
      if (orders && orders.length > 0) {
        router.push(`/orders/${orders[0].id}`);
      } else {
        router.push("/orders");
      }
    },
    onError: (error: ApiError) => {
      console.error("Checkout mutation error:", error);
      const errorMessage = error.message || "Failed to place order";
      toast.error(errorMessage);
    },
  });
}

/**
 * Track order by order number
 */
export function useTrackOrder(orderNumber: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.orders.track(orderNumber),
    queryFn: () => ordersApi.track(orderNumber),
    enabled: !!orderNumber && enabled,
    staleTime: 30 * 1000, // 30 seconds - tracking should be fresh
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.statusCode === 404) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Get user's orders
 */
export function useOrders(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.users.orders(
      params ? { page: params.page, limit: params.limit } : {}
    ),
    queryFn: () => usersApi.getOrders(params || { page: 1, limit: 10 }),
    staleTime: 30 * 1000,
  });
}

/**
 * Get order by ID
 */
export function useOrder(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => ordersApi.getById(id),
    enabled: !!id && enabled,
    staleTime: 30 * 1000,
  });
}

/**
 * Get vendor orders
 */
export function useVendorOrders(
  params: PaginationParams & { status?: string }
) {
  return useQuery({
    queryKey: queryKeys.orders.list(
      params as unknown as Record<string, unknown>
    ),
    queryFn: () => ordersApi.getVendorOrders(params),
    staleTime: 30 * 1000,
  });
}

/**
 * Update order status (vendor)
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderStatusDto }) =>
      ordersApi.updateStatus(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.orders.detail(id),
      });

      const previousOrder = queryClient.getQueryData<OrderResponseDto>(
        queryKeys.orders.detail(id)
      );

      if (previousOrder) {
        queryClient.setQueryData<OrderResponseDto>(
          queryKeys.orders.detail(id),
          {
            ...previousOrder,
            status: data.status as OrderResponseDto["status"],
          }
        );
      }

      return { previousOrder };
    },
    onError: (error: ApiError, { id }, context) => {
      if (context?.previousOrder) {
        queryClient.setQueryData(
          queryKeys.orders.detail(id),
          context.previousOrder
        );
      }
      toast.error(error.message || "Failed to update order status");
    },
    onSuccess: (order: OrderResponseDto) => {
      queryClient.setQueryData(queryKeys.orders.detail(order.id), order);
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.vendors.me.orders(),
      });
      toast.success(`Order status updated to ${order.status}`);
    },
  });
}

/**
 * Helper to get order status color
 */
export function getOrderStatusColor(
  status: OrderResponseDto["status"]
): string {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    PROCESSING: "bg-indigo-100 text-indigo-800",
    SHIPPED: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    RETURNED: "bg-orange-100 text-orange-800",
    REFUNDED: "bg-gray-100 text-gray-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

/**
 * Helper to get payment status color
 */
export function getPaymentStatusColor(
  status: OrderResponseDto["paymentStatus"]
): string {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PAID: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
    REFUNDED: "bg-gray-100 text-gray-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}
