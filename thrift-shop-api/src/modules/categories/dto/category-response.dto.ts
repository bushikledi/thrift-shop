import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'clothing' })
  slug!: string;

  @ApiProperty({ example: 'Clothing' })
  name!: string;

  @ApiPropertyOptional({ example: 'All types of clothing items' })
  description?: string;

  @ApiPropertyOptional()
  image?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  parentId?: string;

  @ApiProperty({ example: 0 })
  sortOrder!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: '2023-01-01T00:00:00Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2023-01-01T00:00:00Z' })
  updatedAt!: Date;

  @ApiPropertyOptional({ type: [CategoryResponseDto] })
  children?: CategoryResponseDto[];
}
