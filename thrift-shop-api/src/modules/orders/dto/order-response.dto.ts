import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, PaymentStatus } from '../../../generated/prisma/client';

/**
 * Order item product summary
 */
export class OrderItemProductDto {
  @ApiProperty({ description: 'Product ID' })
  id!: string;

  @ApiProperty({ description: 'Product name' })
  name!: string;

  @ApiProperty({ description: 'Product slug' })
  slug!: string;

  @ApiPropertyOptional({ description: 'Product images', type: [String] })
  images?: string[];
}

/**
 * Order item response
 */
export class OrderItemResponseDto {
  @ApiProperty({ description: 'Order item ID' })
  id!: string;

  @ApiProperty({ description: 'Quantity ordered', example: 2 })
  quantity!: number;

  @ApiProperty({
    description: 'Price per unit at time of order',
    example: 29.99,
  })
  price!: number;

  @ApiProperty({
    description: 'Product name snapshot at time of order',
    example: 'Levi\'s Vintage Denim Jacket',
  })
  title!: string;

  @ApiProperty({
    description: 'Product information',
    type: OrderItemProductDto,
  })
  product!: OrderItemProductDto;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt!: Date;
}

/**
 * Vendor summary in order
 */
export class OrderVendorDto {
  @ApiProperty({ description: 'Vendor ID' })
  id!: string;

  @ApiProperty({ description: 'Vendor display name' })
  displayName!: string;

  @ApiProperty({ description: 'Vendor name (slug)' })
  name!: string;
}

/**
 * Customer summary in order (for vendors viewing orders)
 */
export class OrderCustomerDto {
  @ApiProperty({ description: 'Customer ID' })
  id!: string;

  @ApiProperty({ description: 'Customer name' })
  name!: string;

  @ApiProperty({ description: 'Customer email' })
  email!: string;
}

/**
 * Shipping address
 */
export class ShippingAddressDto {
  @ApiProperty({ description: 'Full name', example: 'John Doe' })
  fullName!: string;

  @ApiProperty({ description: 'Street address', example: '123 Main St' })
  address!: string;

  @ApiProperty({ description: 'City', example: 'New York' })
  city!: string;

  @ApiProperty({ description: 'State/Province', example: 'NY' })
  state!: string;

  @ApiProperty({ description: 'Postal/ZIP code', example: '10001' })
  postalCode!: string;

  @ApiProperty({ description: 'Country', example: 'US' })
  country!: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+1234567890' })
  phone?: string;
}

/**
 * Full order response
 */
export class OrderResponseDto {
  @ApiProperty({ description: 'Order ID' })
  id!: string;

  @ApiProperty({
    description: 'Order number for tracking',
    example: 'TS-2024-00001',
  })
  orderNumber!: string;

  @ApiProperty({
    description: 'Order status',
    enum: OrderStatus,
    example: OrderStatus.PENDING,
  })
  status!: OrderStatus;

  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.PENDING,
  })
  paymentStatus!: PaymentStatus;

  @ApiProperty({ description: 'Order subtotal', example: 59.98 })
  subtotal!: number;

  @ApiProperty({ description: 'Shipping cost', example: 5.99 })
  shipping!: number;

  @ApiProperty({ description: 'Tax amount', example: 5.4 })
  tax!: number;

  @ApiProperty({ description: 'Order total', example: 71.37 })
  total!: number;

  @ApiProperty({ description: 'Shipping address', type: ShippingAddressDto })
  shippingAddress!: ShippingAddressDto;

  @ApiPropertyOptional({ description: 'Order notes' })
  notes?: string;

  @ApiProperty({ description: 'Order items', type: [OrderItemResponseDto] })
  items!: OrderItemResponseDto[];

  @ApiPropertyOptional({
    description: 'Vendor information',
    type: OrderVendorDto,
  })
  vendor?: OrderVendorDto;

  @ApiPropertyOptional({
    description: 'Customer information (for vendors)',
    type: OrderCustomerDto,
  })
  customer?: OrderCustomerDto;

  @ApiProperty({ description: 'Order creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;
}

/**
 * Order tracking response (public, limited info)
 */
export class OrderTrackingResponseDto {
  @ApiProperty({
    description: 'Order number',
    example: 'TS-2024-00001',
  })
  orderNumber!: string;

  @ApiProperty({
    description: 'Order status',
    enum: OrderStatus,
    example: OrderStatus.PROCESSING,
  })
  status!: OrderStatus;

  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.PAID,
  })
  paymentStatus!: PaymentStatus;

  @ApiProperty({ description: 'Order total', example: 71.37 })
  total!: number;

  @ApiProperty({ description: 'Number of items', example: 2 })
  itemCount!: number;

  @ApiProperty({ description: 'Order creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;
}

/**
 * Checkout response with created orders
 */
export class CheckoutResponseDto {
  @ApiProperty({
    description: 'Created orders (one per vendor)',
    type: [OrderResponseDto],
  })
  orders!: OrderResponseDto[];

  @ApiProperty({ description: 'Total amount charged', example: 142.74 })
  totalAmount!: number;

  @ApiProperty({
    description: 'Order numbers for tracking',
    type: [String],
    example: ['TS-2024-00001', 'TS-2024-00002'],
  })
  orderNumbers!: string[];
}

/**
 * Paginated orders response
 */
export class PaginatedOrdersResponseDto {
  @ApiProperty({ description: 'List of orders', type: [OrderResponseDto] })
  data!: OrderResponseDto[];

  @ApiProperty({ description: 'Total number of orders', example: 150 })
  total!: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit!: number;

  @ApiProperty({ description: 'Total number of pages', example: 8 })
  totalPages!: number;
}
