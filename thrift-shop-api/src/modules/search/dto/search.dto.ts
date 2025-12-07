import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform, TransformFnParams } from 'class-transformer';
import { sanitizeSearchQuery } from '../../../common/utils';

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
