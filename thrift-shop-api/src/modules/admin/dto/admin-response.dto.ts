import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminStatsResponseDto {
  @ApiProperty()
  totalUsers!: number;

  @ApiProperty()
  totalVendors!: number;

  @ApiProperty()
  totalProducts!: number;

  @ApiProperty()
  totalOrders!: number;

  @ApiProperty()
  totalRevenue!: number;

  @ApiProperty()
  newUsersThisMonth!: number;

  @ApiProperty()
  newOrdersThisMonth!: number;

  @ApiProperty()
  pendingVendorVerifications!: number;
}

export class AdminReviewResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  rating!: number;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  comment?: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  user!: any;

  @ApiPropertyOptional()
  vendor?: any;

  @ApiPropertyOptional()
  product?: any;
}
