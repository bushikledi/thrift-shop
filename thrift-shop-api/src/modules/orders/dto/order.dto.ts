import {
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  PaymentMethod,
  OrderStatus,
  Prisma,
} from '../../../generated/prisma/client';

export interface ShippingAddress extends Prisma.JsonObject {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface GuestInfo extends Prisma.JsonObject {
  name: string;
  email: string;
  phone: string;
}

class AddressDto {
  @ApiProperty()
  @IsString()
  street!: string;

  @ApiProperty()
  @IsString()
  city!: string;

  @ApiProperty()
  @IsString()
  state!: string;

  @ApiProperty()
  @IsString()
  zip!: string;

  @ApiProperty()
  @IsString()
  country!: string;
}

class GuestInfoDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  phone!: string;
}

export class CreateOrderDto {
  @ApiPropertyOptional({ description: 'Required for guest checkout' })
  @IsOptional()
  @ValidateNested()
  @Type(() => GuestInfoDto)
  guestInfo?: GuestInfoDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => AddressDto)
  shippingAddress!: AddressDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shippingMethod?: string;

  @ApiProperty({ enum: PaymentMethod, default: 'COD' })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerNotes?: string;

  @ApiPropertyOptional({
    description: 'Promo code to apply to the whole cart',
    example: 'WELCOME10',
  })
  @IsOptional()
  @IsString()
  promoCode?: string;

  @ApiProperty({ description: 'Cart session ID' })
  @IsString()
  cartSessionId!: string;
}

/**
 * Valid status transitions for order updates
 */
const VALID_UPDATE_STATUSES = [
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
] as const;

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: VALID_UPDATE_STATUSES,
    description: 'New status for the order',
  })
  @IsEnum(OrderStatus, {
    message: `status must be one of: ${VALID_UPDATE_STATUSES.join(', ')}`,
  })
  status!: OrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorNotes?: string;
}
