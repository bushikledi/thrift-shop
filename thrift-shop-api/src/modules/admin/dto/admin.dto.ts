import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsIn,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  UserRole,
  OrderStatus,
  ProductCondition,
} from '../../../generated/prisma/client';
import { ToBoolean } from '../../../common/decorators';

export class AdminUserQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  emailVerified?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}

export class AdminUpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class AdminVendorQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  verified?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}

export class AdminUpdateVendorDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}

export const ADMIN_PRODUCT_SORT_FIELDS = [
  'createdAt',
  'price',
  'viewCount',
  'title',
] as const;
export type AdminProductSortField = (typeof ADMIN_PRODUCT_SORT_FIELDS)[number];

export class AdminProductQueryDto {
  @ApiPropertyOptional({ description: 'Product title or brand' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ enum: ProductCondition })
  @IsOptional()
  @IsEnum(ProductCondition)
  condition?: ProductCondition;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  includeInactive?: boolean;

  @ApiPropertyOptional({
    enum: ADMIN_PRODUCT_SORT_FIELDS,
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(ADMIN_PRODUCT_SORT_FIELDS)
  sortBy?: AdminProductSortField;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}

export class AdminReviewQueryDto {
  @ApiPropertyOptional({ description: 'Review text, title, or reviewer name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}

export const ADMIN_ORDER_SORT_FIELDS = [
  'createdAt',
  'total',
  'status',
] as const;
export type AdminOrderSortField = (typeof ADMIN_ORDER_SORT_FIELDS)[number];

export class AdminOrderQueryDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Order number or buyer name/email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ADMIN_ORDER_SORT_FIELDS, default: 'createdAt' })
  @IsOptional()
  @IsIn(ADMIN_ORDER_SORT_FIELDS)
  sortBy?: AdminOrderSortField;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  buyerId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}

export class AdminStatsDto {
  totalUsers!: number;
  totalVendors!: number;
  totalProducts!: number;
  totalOrders!: number;
  totalRevenue!: number;
  newUsersThisMonth!: number;
  newOrdersThisMonth!: number;
  pendingVendorVerifications!: number;
}
