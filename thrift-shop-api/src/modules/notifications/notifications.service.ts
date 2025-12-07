import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma';
import {
  SendNotificationDto,
  SendEmailDto,
  SendSmsDto,
  NotificationType,
  NotificationChannel,
} from './dto';

interface GuestInfo {
  email?: string;
  name?: string;
  phone?: string;
}

// Email templates
const EMAIL_TEMPLATES: Record<
  NotificationType,
  { subject: string; template: string }
> = {
  [NotificationType.ORDER_CONFIRMATION]: {
    subject: 'Order Confirmation - Thrift Shop',
    template: 'order-confirmation',
  },
  [NotificationType.ORDER_SHIPPED]: {
    subject: 'Your Order Has Been Shipped!',
    template: 'order-shipped',
  },
  [NotificationType.ORDER_DELIVERED]: {
    subject: 'Your Order Has Been Delivered',
    template: 'order-delivered',
  },
  [NotificationType.ORDER_CANCELLED]: {
    subject: 'Order Cancelled - Thrift Shop',
    template: 'order-cancelled',
  },
  [NotificationType.PASSWORD_RESET]: {
    subject: 'Reset Your Password - Thrift Shop',
    template: 'password-reset',
  },
  [NotificationType.WELCOME]: {
    subject: 'Welcome to Thrift Shop!',
    template: 'welcome',
  },
  [NotificationType.VENDOR_NEW_ORDER]: {
    subject: 'New Order Received!',
    template: 'vendor-new-order',
  },
  [NotificationType.VENDOR_REVIEW]: {
    subject: 'You Have a New Review',
    template: 'vendor-review',
  },
  [NotificationType.PRODUCT_REVIEW]: {
    subject: 'Your Product Received a Review',
    template: 'product-review',
  },
  [NotificationType.LOW_STOCK]: {
    subject: 'Low Stock Alert',
    template: 'low-stock',
  },
  [NotificationType.PROMOTIONAL]: {
    subject: 'Special Offer from Thrift Shop',
    template: 'promotional',
  },
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly sendgridApiKey: string;
  private readonly emailFrom: string;
  private readonly twilioSid: string;
  private readonly twilioToken: string;
  private readonly twilioPhone: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.sendgridApiKey = this.configService.get<string>(
      'SENDGRID_API_KEY',
      '',
    );
    this.emailFrom = this.configService.get<string>(
      'EMAIL_FROM',
      'noreply@thriftshop.com',
    );
    this.twilioSid = this.configService.get<string>('TWILIO_SID', '');
    this.twilioToken = this.configService.get<string>('TWILIO_TOKEN', '');
    this.twilioPhone = this.configService.get<string>('TWILIO_PHONE', '');
  }

  async send(dto: SendNotificationDto) {
    this.logger.log(`Sending ${dto.type} notification via ${dto.channel}`);

    // Get recipient info if userId provided
    let recipientEmail = dto.email;
    let recipientPhone = dto.phone;

    if (dto.userId && (!recipientEmail || !recipientPhone)) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
        select: { email: true, phone: true, name: true },
      });

      if (user) {
        recipientEmail = recipientEmail || user.email;
        recipientPhone = recipientPhone || user.phone || undefined;
        const currentUserName = dto.data.userName as string | undefined;
        dto.data.userName = currentUserName || user.name;
      }
    }

    switch (dto.channel) {
      case NotificationChannel.EMAIL:
        if (!recipientEmail) {
          throw new Error('Email address required for email notification');
        }
        return this.sendEmail({
          to: recipientEmail,
          subject: dto.subject || EMAIL_TEMPLATES[dto.type].subject,
          template: EMAIL_TEMPLATES[dto.type].template,
          data: dto.data,
        });

      case NotificationChannel.SMS:
        if (!recipientPhone) {
          throw new Error('Phone number required for SMS notification');
        }
        return this.sendSms({
          to: recipientPhone,
          message: this.buildSmsMessage(dto.type, dto.data),
        });

      case NotificationChannel.PUSH:
        // TODO: Implement push notifications
        this.logger.warn('Push notifications not yet implemented');
        return {
          success: false,
          message: 'Push notifications not implemented',
        };

      default:
        throw new Error(
          `Unknown notification channel: ${dto.channel as string}`,
        );
    }
  }

  async sendEmail(dto: SendEmailDto) {
    this.logger.log(`Sending email to ${dto.to}: ${dto.subject}`);

    // Build HTML content from template
    const htmlContent = this.buildEmailHtml(dto.template, dto.data);

    // Use SendGrid if API key is configured
    if (this.sendgridApiKey) {
      try {
        // Dynamic import to avoid issues if package isn't installed
        const sgMail = await import('@sendgrid/mail');
        sgMail.default.setApiKey(this.sendgridApiKey);

        await sgMail.default.send({
          to: dto.to,
          from: this.emailFrom,
          subject: dto.subject,
          html: htmlContent,
        });

        this.logger.log(`Email sent successfully to ${dto.to}`);
        return { success: true, message: 'Email sent' };
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to send email: ${errorMessage}`);
        return { success: false, message: errorMessage };
      }
    }

    // Development mode: log email content
    this.logger.debug('Development mode - Email content:');
    this.logger.debug(`To: ${dto.to}`);
    this.logger.debug(`Subject: ${dto.subject}`);
    this.logger.debug(`Content: ${htmlContent.substring(0, 200)}...`);

    return { success: true, message: 'Email logged (development mode)' };
  }

  async sendSms(dto: SendSmsDto) {
    this.logger.log(`Sending SMS to ${dto.to}`);

    // Use Twilio if credentials are configured
    if (this.twilioSid && this.twilioToken) {
      try {
        // Dynamic import to avoid issues if package isn't installed
        const twilio = await import('twilio');
        const client = twilio.default(this.twilioSid, this.twilioToken);

        await client.messages.create({
          body: dto.message,
          from: this.twilioPhone,
          to: dto.to,
        });

        this.logger.log(`SMS sent successfully to ${dto.to}`);
        return { success: true, message: 'SMS sent' };
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to send SMS: ${errorMessage}`);
        return { success: false, message: errorMessage };
      }
    }

    // Development mode: log SMS content
    this.logger.debug('Development mode - SMS content:');
    this.logger.debug(`To: ${dto.to}`);
    this.logger.debug(`Message: ${dto.message}`);

    return { success: true, message: 'SMS logged (development mode)' };
  }

  // Order-specific notifications
  async sendOrderConfirmation(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: { select: { id: true, email: true, name: true } },
        vendor: { select: { displayName: true } },
        items: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const recipientEmail =
      order.buyer?.email || (order.guestInfo as unknown as GuestInfo)?.email;
    const recipientName =
      order.buyer?.name || (order.guestInfo as unknown as GuestInfo)?.name;

    return this.send({
      type: NotificationType.ORDER_CONFIRMATION,
      channel: NotificationChannel.EMAIL,
      userId: order.buyer?.id,
      email: recipientEmail,
      data: {
        orderNumber: order.orderNumber,
        userName: recipientName,
        vendorName: order.vendor.displayName,
        items: order.items,
        total: order.total,
        shippingAddress: order.shippingAddress,
      },
    });
  }

  async sendOrderShipped(orderId: string, trackingNumber?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: { select: { id: true, email: true, name: true } },
        vendor: { select: { displayName: true } },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const recipientEmail =
      order.buyer?.email || (order.guestInfo as unknown as GuestInfo)?.email;

    return this.send({
      type: NotificationType.ORDER_SHIPPED,
      channel: NotificationChannel.EMAIL,
      userId: order.buyer?.id,
      email: recipientEmail,
      data: {
        orderNumber: order.orderNumber,
        trackingNumber: trackingNumber || order.trackingNumber,
        vendorName: order.vendor.displayName,
      },
    });
  }

  async sendVendorNewOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        vendor: {
          include: {
            user: { select: { email: true, name: true } },
          },
        },
        items: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return this.send({
      type: NotificationType.VENDOR_NEW_ORDER,
      channel: NotificationChannel.EMAIL,
      email: order.vendor.user.email,
      data: {
        orderNumber: order.orderNumber,
        vendorName: order.vendor.displayName,
        itemCount: order.items.length,
        total: order.total,
      },
    });
  }

  async sendPasswordReset(email: string, resetToken: string, resetUrl: string) {
    return this.send({
      type: NotificationType.PASSWORD_RESET,
      channel: NotificationChannel.EMAIL,
      email,
      data: {
        resetToken,
        resetUrl,
        expiresIn: '1 hour',
      },
    });
  }

  async sendWelcome(userId: string) {
    return this.send({
      type: NotificationType.WELCOME,
      channel: NotificationChannel.EMAIL,
      userId,
      data: {},
    });
  }

  private buildEmailHtml(template: string, data: Record<string, any>): string {
    // In production, use a proper templating engine like Handlebars or EJS
    // This is a simplified implementation

    const baseStyles = `
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 4px; }
      </style>
    `;

    const templates: Record<string, string> = {
      'order-confirmation': `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>Order Confirmed!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName || 'there'},</p>
            <p>Thank you for your order! Your order <strong>#${data.orderNumber}</strong> has been confirmed.</p>
            <p><strong>Vendor:</strong> ${data.vendorName}</p>
            <p><strong>Total:</strong> $${data.total}</p>
            <p>We'll send you another email when your order ships.</p>
          </div>
          <div class="footer">
            <p>Thrift Shop - Sustainable Fashion</p>
          </div>
        </div>
      `,
      'order-shipped': `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>Your Order Has Shipped!</h1>
          </div>
          <div class="content">
            <p>Great news! Your order <strong>#${data.orderNumber}</strong> is on its way.</p>
            ${data.trackingNumber ? `<p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>` : ''}
            <p><strong>Shipped by:</strong> ${data.vendorName}</p>
          </div>
          <div class="footer">
            <p>Thrift Shop - Sustainable Fashion</p>
          </div>
        </div>
      `,
      'password-reset': `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <p>You requested to reset your password. Click the button below to create a new password:</p>
            <p style="text-align: center;">
              <a href="${data.resetUrl}" class="button">Reset Password</a>
            </p>
            <p>This link will expire in ${data.expiresIn}.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>Thrift Shop - Sustainable Fashion</p>
          </div>
        </div>
      `,
      welcome: `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>Welcome to Thrift Shop!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName || 'there'},</p>
            <p>Welcome to Thrift Shop! We're excited to have you join our community of sustainable fashion enthusiasts.</p>
            <p>Start browsing our collection of unique, pre-loved items and find your next favorite piece!</p>
            <p style="text-align: center;">
              <a href="${data.shopUrl || '#'}" class="button">Start Shopping</a>
            </p>
          </div>
          <div class="footer">
            <p>Thrift Shop - Sustainable Fashion</p>
          </div>
        </div>
      `,
      'vendor-new-order': `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>New Order Received!</h1>
          </div>
          <div class="content">
            <p>Congratulations! You have a new order.</p>
            <p><strong>Order Number:</strong> #${data.orderNumber}</p>
            <p><strong>Items:</strong> ${data.itemCount}</p>
            <p><strong>Total:</strong> $${data.total}</p>
            <p>Please process this order as soon as possible.</p>
          </div>
          <div class="footer">
            <p>Thrift Shop - Vendor Portal</p>
          </div>
        </div>
      `,
    };

    return templates[template] || `<p>Notification: ${template}</p>`;
  }

  private buildSmsMessage(
    type: NotificationType,
    data: Record<string, any>,
  ): string {
    const messages: Record<NotificationType, string> = {
      [NotificationType.ORDER_CONFIRMATION]: `Thrift Shop: Your order #${data.orderNumber} has been confirmed. Total: $${data.total}`,
      [NotificationType.ORDER_SHIPPED]: `Thrift Shop: Your order #${data.orderNumber} has shipped! ${data.trackingNumber ? `Tracking: ${data.trackingNumber}` : ''}`,
      [NotificationType.ORDER_DELIVERED]: `Thrift Shop: Your order #${data.orderNumber} has been delivered. Enjoy!`,
      [NotificationType.ORDER_CANCELLED]: `Thrift Shop: Your order #${data.orderNumber} has been cancelled.`,
      [NotificationType.PASSWORD_RESET]: `Thrift Shop: Use this link to reset your password: ${data.resetUrl}`,
      [NotificationType.WELCOME]: `Welcome to Thrift Shop! Start exploring unique pre-loved fashion.`,
      [NotificationType.VENDOR_NEW_ORDER]: `Thrift Shop: New order #${data.orderNumber} received! ${data.itemCount} items, $${data.total}`,
      [NotificationType.VENDOR_REVIEW]: `Thrift Shop: You received a new ${data.rating}-star review!`,
      [NotificationType.PRODUCT_REVIEW]: `Thrift Shop: Your product received a new ${data.rating}-star review!`,
      [NotificationType.LOW_STOCK]: `Thrift Shop: Low stock alert for ${data.productTitle}`,
      [NotificationType.PROMOTIONAL]:
        (data.message as string) ||
        'Check out our latest offers at Thrift Shop!',
    };

    return messages[type] || 'Notification from Thrift Shop';
  }
}
