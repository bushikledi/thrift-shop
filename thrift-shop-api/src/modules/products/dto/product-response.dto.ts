import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductCondition } from '../../../generated/prisma/client';

/**
 * Vendor summary included in product responses
 */
export class VendorSummaryDto {
  @ApiProperty({ description: 'Vendor unique identifier' })
  id!: string;

  @ApiProperty({ description: 'URL-friendly vendor slug' })
  name!: string;

  @ApiProperty({ description: 'Display name for the vendor' })
  displayName!: string;

  @ApiProperty({ description: 'Whether the vendor is verified' })
  verified!: boolean;
}

/**
 * Extended vendor info for product detail page
 */
export class VendorDetailDto extends VendorSummaryDto {
  @ApiPropertyOptional({ description: 'Vendor biography/description' })
  bio?: string;

  @ApiPropertyOptional({ description: 'Vendor logo URL' })
  logo?: string;

  @ApiProperty({ description: 'Average vendor rating (0-5)' })
  rating!: number;

  @ApiProperty({ description: 'Total number of reviews' })
  reviewCount!: number;
}

/**
 * Category summary included in product responses
 */
export class CategorySummaryDto {
  @ApiProperty({ description: 'Category unique identifier' })
  id!: string;

  @ApiProperty({ description: 'URL-friendly category slug' })
  slug!: string;

  @ApiProperty({ description: 'Category name' })
  name!: string;
}

/**
 * Category with parent info for breadcrumbs
 */
export class CategoryWithParentDto extends CategorySummaryDto {
  @ApiPropertyOptional({
    type: CategorySummaryDto,
    description: 'Parent category',
  })
  parent?: CategorySummaryDto;
}

/**
 * Media item response
 */
export class MediaResponseDto {
  @ApiProperty({ description: 'Media unique identifier' })
  id!: string;

  @ApiProperty({ description: 'Media file URL' })
  url!: string;

  @ApiProperty({ description: 'Original filename' })
  filename!: string;

  @ApiProperty({ description: 'MIME type of the media' })
  mimeType!: string;

  @ApiProperty({ description: 'File size in bytes' })
  size!: number;

  @ApiPropertyOptional({ description: 'Image width in pixels' })
  width?: number;

  @ApiPropertyOptional({ description: 'Image height in pixels' })
  height?: number;

  @ApiProperty({ description: 'Display order' })
  sortOrder!: number;
}

/**
 * Review summary for product detail
 */
export class ReviewSummaryDto {
  @ApiProperty({ description: 'Review unique identifier' })
  id!: string;

  @ApiProperty({ description: 'Rating from 1-5' })
  rating!: number;

  @ApiPropertyOptional({ description: 'Review title' })
  title?: string;

  @ApiPropertyOptional({ description: 'Review comment text' })
  comment?: string;

  @ApiProperty({
    description: 'Whether the review is from a verified purchase',
  })
  isVerified!: boolean;

  @ApiProperty({ description: 'Review creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Reviewer information' })
  user!: {
    id: string;
    name: string;
    avatar?: string;
  };
}

/**
 * Product list item response (for grid/list views)
 */
export class ProductListItemDto {
  @ApiProperty({ description: 'Product unique identifier' })
  id!: string;

  @ApiProperty({ description: 'Product title' })
  title!: string;

  @ApiProperty({ description: 'URL-friendly product slug' })
  slug!: string;

  @ApiProperty({ description: 'Product price' })
  price!: number;

  @ApiPropertyOptional({ description: 'Original/compare price' })
  comparePrice?: number;

  @ApiProperty({ enum: ProductCondition, description: 'Product condition' })
  condition!: ProductCondition;

  @ApiProperty({ description: 'Whether product is active and available' })
  isActive!: boolean;

  @ApiProperty({ description: 'Whether product is featured' })
  isFeatured!: boolean;

  @ApiProperty({ description: 'Available quantity' })
  quantity!: number;

  @ApiProperty({
    type: [MediaResponseDto],
    description: 'Product images (first image)',
  })
  media!: MediaResponseDto[];

  @ApiProperty({ type: VendorSummaryDto, description: 'Vendor information' })
  vendor!: VendorSummaryDto;

  @ApiPropertyOptional({
    type: CategorySummaryDto,
    description: 'Category information',
  })
  category?: CategorySummaryDto;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;
}

/**
 * Product detail response (for product page)
 * Uses composition instead of inheritance to avoid property override issues
 */
export class ProductDetailDto {
  @ApiProperty({ description: 'Product unique identifier' })
  id!: string;

  @ApiProperty({ description: 'Product title' })
  title!: string;

  @ApiProperty({ description: 'URL-friendly product slug' })
  slug!: string;

  @ApiProperty({ description: 'Product price' })
  price!: number;

  @ApiPropertyOptional({ description: 'Original/compare price' })
  comparePrice?: number;

  @ApiProperty({ enum: ProductCondition, description: 'Product condition' })
  condition!: ProductCondition;

  @ApiProperty({ description: 'Whether product is active and available' })
  isActive!: boolean;

  @ApiProperty({ description: 'Whether product is featured' })
  isFeatured!: boolean;

  @ApiProperty({ description: 'Available quantity' })
  quantity!: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiPropertyOptional({ description: 'Product description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Product brand' })
  brand?: string;

  @ApiPropertyOptional({ description: 'Product color' })
  color?: string;

  @ApiPropertyOptional({ description: 'Product size' })
  size?: string;

  @ApiPropertyOptional({ description: 'Target gender' })
  gender?: string;

  @ApiPropertyOptional({ description: 'Product measurements' })
  measurements?: {
    chest?: number;
    length?: number;
    waist?: number;
    hips?: number;
    inseam?: number;
  };

  @ApiProperty({ type: [String], description: 'Product tags' })
  tags!: string[];

  @ApiProperty({ description: 'Total view count' })
  viewCount!: number;

  @ApiProperty({ type: [MediaResponseDto], description: 'All product images' })
  media!: MediaResponseDto[];

  @ApiProperty({
    type: VendorDetailDto,
    description: 'Detailed vendor information',
  })
  vendor!: VendorDetailDto;

  @ApiPropertyOptional({
    type: CategoryWithParentDto,
    description: 'Category with parent',
  })
  category?: CategoryWithParentDto;

  @ApiProperty({
    type: [ReviewSummaryDto],
    description: 'Recent product reviews',
  })
  reviews!: ReviewSummaryDto[];
}

/**
 * Pagination metadata
 */
export class PaginationMetaDto {
  @ApiProperty({ description: 'Total number of items' })
  total!: number;

  @ApiProperty({ description: 'Current page number' })
  page!: number;

  @ApiProperty({ description: 'Items per page' })
  limit!: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages!: number;
}

/**
 * Paginated products response
 */
export class PaginatedProductsResponseDto {
  @ApiProperty({ type: [ProductListItemDto], description: 'List of products' })
  data!: ProductListItemDto[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  meta!: PaginationMetaDto;
}
