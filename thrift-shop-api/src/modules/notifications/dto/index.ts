import {
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export * from './notification-response.dto';

export enum NotificationType {
  ORDER_CONFIRMATION = 'ORDER_CONFIRMATION',
  ORDER_SHIPPED = 'ORDER_SHIPPED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  WELCOME = 'WELCOME',
  VENDOR_NEW_ORDER = 'VENDOR_NEW_ORDER',
  VENDOR_REVIEW = 'VENDOR_REVIEW',
  PRODUCT_REVIEW = 'PRODUCT_REVIEW',
  LOW_STOCK = 'LOW_STOCK',
  PROMOTIONAL = 'PROMOTIONAL',
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

export class SendNotificationDto {
  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsEnum(NotificationChannel)
  channel!: NotificationChannel;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsObject()
  data!: Record<string, any>;
}

export class SendEmailDto {
  @IsEmail()
  to!: string;

  @IsString()
  subject!: string;

  @IsString()
  template!: string;

  @IsObject()
  data!: Record<string, any>;
}

export class SendSmsDto {
  @IsString()
  to!: string;

  @IsString()
  message!: string;
}
