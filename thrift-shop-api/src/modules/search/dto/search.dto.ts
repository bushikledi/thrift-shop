import {
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
  IsUUID,
  Min,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform, TransformFnParams } from 'class-transformer';
import { sanitizeSearchQuery } from '../../../common/utils';

export const SEARCH_SORT_OPTIONS = [
  'relevance',
  'newest',
  'price_asc',
  'price_desc',
] as const;
export type SearchSortOption = (typeof SEARCH_SORT_OPTIONS)[number];

export class SearchQueryDto {
  @ApiPropertyOptional({
    description: 'Search query string',
    maxLength: 200,
    example: 'vintage jacket',
  })
  @IsString()
  @MaxLength(200, { message: 'Search query must not exceed 200 characters' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? sanitizeSearchQuery(value) : (value as unknown),
  )
  q!: string;

  @ApiPropertyOptional({
    description: 'Types to search (comma-separated)',
    example: 'products,vendors,categories',
    pattern: '^(products|vendors|categories)(,(products|vendors|categories))*$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(products|vendors|categories)(,(products|vendors|categories))*$/, {
    message:
      'Types must be comma-separated values: products, vendors, categories',
  })
  types?: string;

  @ApiPropertyOptional({
    description: 'Restrict product results to a category',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Comma-separated product conditions',
    example: 'LIKE_NEW,GOOD',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z_]+(,[A-Z_]+)*$/, {
    message: 'Conditions must be comma-separated ProductCondition values',
  })
  conditions?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    enum: SEARCH_SORT_OPTIONS,
    default: 'relevance',
    description:
      'Ordering for product results. "relevance" falls back to view count.',
  })
  @IsOptional()
  @IsIn(SEARCH_SORT_OPTIONS)
  sort?: SearchSortOption;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}
