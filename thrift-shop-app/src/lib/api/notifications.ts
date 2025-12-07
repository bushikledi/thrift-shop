/**
 * Notifications API Service
 */
import { post } from "../apiClient";
import type {
  SendNotificationDto,
  SendEmailDto,
  NotificationResponseDto,
} from "@/types";

export const notificationsApi = {
  /**
   * Send a notification (Admin only)
   */
  send: (data: SendNotificationDto): Promise<NotificationResponseDto> =>
    post<NotificationResponseDto, SendNotificationDto>(
      "/notifications/send",
      data
    ),

  /**
   * Send an email (Admin only)
   */
  sendEmail: (data: SendEmailDto): Promise<NotificationResponseDto> =>
    post<NotificationResponseDto, SendEmailDto>("/notifications/email", data),

  /**
   * Send order confirmation email
   */
  sendOrderConfirmation: (orderId: string): Promise<NotificationResponseDto> =>
    post<NotificationResponseDto>(
      `/notifications/order-confirmation/${orderId}`
    ),

  /**
   * Send order shipped email
   */
  sendOrderShipped: (orderId: string): Promise<NotificationResponseDto> =>
    post<NotificationResponseDto>(`/notifications/order-shipped/${orderId}`),
};

export default notificationsApi;
