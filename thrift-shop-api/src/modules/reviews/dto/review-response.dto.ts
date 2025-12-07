import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserProfileResponseDto } from '../../users/dto/user-response.dto';

export class ReviewResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 5 })
  rating!: number;

  @ApiPropertyOptional({ example: 'Great product!' })
  title?: string;

  @ApiPropertyOptional({ example: 'The quality exceeded my expectations...' })
  comment?: string;

  @ApiProperty({ example: '2023-01-01T00:00:00Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2023-01-01T00:00:00Z' })
  updatedAt!: Date;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId!: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  vendorId?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  productId?: string;

  @ApiProperty({ type: () => UserProfileResponseDto })
  user!: UserProfileResponseDto;
}

export class ReviewListResponseDto {
  @ApiProperty({ type: [ReviewResponseDto] })
  data!: ReviewResponseDto[];

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
