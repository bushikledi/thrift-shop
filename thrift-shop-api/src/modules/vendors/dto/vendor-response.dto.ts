import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VendorResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'vintage-shop' })
  name!: string;

  @ApiProperty({ example: 'Vintage Shop' })
  displayName!: string;

  @ApiPropertyOptional({ example: 'Best vintage items' })
  bio?: string;

  @ApiPropertyOptional()
  logo?: string;

  @ApiPropertyOptional()
  banner?: string;

  @ApiProperty({ example: true })
  verified!: boolean;

  @ApiProperty({ example: 4.5 })
  rating!: number;

  @ApiProperty({ example: 100 })
  reviewCount!: number;

  @ApiProperty({ example: '2023-01-01T00:00:00Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2023-01-01T00:00:00Z' })
  updatedAt!: Date;
}

export class VendorListResponseDto {
  @ApiProperty({ type: [VendorResponseDto] })
  data!: VendorResponseDto[];

  @ApiProperty({
    example: {
      total: 10,
      page: 1,
      limit: 10,
      totalPages: 1,
    },
  })
  meta!: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class VendorDashboardStatsDto {
  @ApiProperty()
  totalProducts!: number;

  @ApiProperty()
  totalOrders!: number;

  @ApiProperty()
  pendingOrders!: number;

  @ApiProperty()
  totalRevenue!: number;
}
