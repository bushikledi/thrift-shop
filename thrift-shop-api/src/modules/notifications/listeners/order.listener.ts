import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
import {
  OrderCreatedEvent,
  OrderStatusChangedEvent,
  OrderCancelledEvent,
} from '../events';
import { NotificationType, NotificationChannel } from '../dto';

@Injectable()
export class OrderEventListener {
  private readonly logger = new Logger(OrderEventListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent('order.created')
  async handleOrderCreated(event: OrderCreatedEvent) {
    this.logger.log(
      `Handling order.created event for order ${event.orderNumber}`,
    );

    // Send confirmation email to buyer
    try {
      await this.notificationsService.send({
        type: NotificationType.ORDER_CONFIRMATION,
        channel: NotificationChannel.EMAIL,
        email: event.buyerEmail,
        userId: event.buyerId || undefined,
        data: {
          orderNumber: event.orderNumber,
          total: event.total,
          items: event.items,
        },
      });
      this.logger.log(`Order confirmation sent to buyer: ${event.buyerEmail}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to send order confirmation to buyer: ${errorMessage}`,
      );
    }

    // Send new order notification to vendor
    try {
      await this.notificationsService.send({
        type: NotificationType.VENDOR_NEW_ORDER,
        channel: NotificationChannel.EMAIL,
        email: event.vendorEmail,
        data: {
          orderNumber: event.orderNumber,
          total: event.total,
          items: event.items,
        },
      });
      this.logger.log(
        `New order notification sent to vendor: ${event.vendorEmail}`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to send new order notification to vendor: ${message}`,
      );
    }
  }

  @OnEvent('order.status_changed')
  async handleOrderStatusChanged(event: OrderStatusChangedEvent) {
    this.logger.log(
      `Handling order.status_changed event for order ${event.orderNumber}: ${event.previousStatus} -> ${event.newStatus}`,
    );

    // Map status to notification type
    let notificationType: NotificationType | null = null;

    switch (event.newStatus) {
      case 'SHIPPED':
        notificationType = NotificationType.ORDER_SHIPPED;
        break;
      case 'DELIVERED':
        notificationType = NotificationType.ORDER_DELIVERED;
        break;
      case 'CANCELLED':
        notificationType = NotificationType.ORDER_CANCELLED;
        break;
      default:
        this.logger.log(
          `No notification configured for status: ${event.newStatus}`,
        );
        return;
    }

    // Send notification to buyer
    try {
      await this.notificationsService.send({
        type: notificationType,
        channel: NotificationChannel.EMAIL,
        email: event.buyerEmail,
        userId: event.buyerId || undefined,
        data: {
          orderNumber: event.orderNumber,
          status: event.newStatus,
          trackingNumber: event.trackingNumber,
        },
      });
      this.logger.log(
        `Status change notification sent to buyer: ${event.buyerEmail}`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to send status change notification: ${message}`,
      );
    }
  }

  @OnEvent('order.cancelled')
  async handleOrderCancelled(event: OrderCancelledEvent) {
    this.logger.log(
      `Handling order.cancelled event for order ${event.orderNumber}`,
    );

    // Send cancellation email to buyer
    try {
      await this.notificationsService.send({
        type: NotificationType.ORDER_CANCELLED,
        channel: NotificationChannel.EMAIL,
        email: event.buyerEmail,
        userId: event.buyerId || undefined,
        data: {
          orderNumber: event.orderNumber,
          reason: event.reason || 'No reason provided',
        },
      });
      this.logger.log(
        `Cancellation notification sent to buyer: ${event.buyerEmail}`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to send cancellation notification to buyer: ${message}`,
      );
    }

    // Send cancellation notification to vendor
    try {
      await this.notificationsService.send({
        type: NotificationType.ORDER_CANCELLED,
        channel: NotificationChannel.EMAIL,
        email: event.vendorEmail,
        data: {
          orderNumber: event.orderNumber,
          reason: event.reason || 'No reason provided',
        },
      });
      this.logger.log(
        `Cancellation notification sent to vendor: ${event.vendorEmail}`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to send cancellation notification to vendor: ${message}`,
      );
    }
  }
}
