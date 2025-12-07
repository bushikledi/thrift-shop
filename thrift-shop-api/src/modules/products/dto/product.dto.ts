import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsObject,
  MinLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform, TransformFnParams } from 'class-transformer';
import { ProductCondition } from '../../../generated/prisma/client';
import { stripHtmlTags } from '../../../common/utils';

export class CreateProductDto {
  @ApiProperty({ example: 'Vintage Denim Jacket' })
  @IsString()
  @MinLength(3)
  title!: string;

  @ApiPropertyOptional({
    example: 'Beautiful vintage denim jacket from the 90s...',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? stripHtmlTags(value) : (value as unknown),
  )
  description?: string;

  @ApiProperty({ example: 49.99 })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ example: 79.99 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  comparePrice?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isUnique?: boolean;

  @ApiProperty({ enum: ProductCondition, example: 'GOOD' })
  @IsEnum(ProductCondition)
  condition!: ProductCondition;

  @ApiPropertyOptional({ example: "Levi's" })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 'Blue' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'M' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ example: 'Women' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({
    example: { chest: 40, length: 26, waist: null, hips: null, inseam: null },
  })
  @IsOptional()
  @IsObject()
  measurements?: {
    chest?: number;
    length?: number;
    waist?: number;
    hips?: number;
    inseam?: number;
  };

  @ApiPropertyOptional({ example: ['vintage', 'denim', '90s'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Vintage Denim Jacket' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? stripHtmlTags(value) : (value as unknown),
  )
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  comparePrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isUnique?: boolean;

  @ApiPropertyOptional({ enum: ProductCondition })
  @IsOptional()
  @IsEnum(ProductCondition)
  condition?: ProductCondition;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  measurements?: {
    chest?: number;
    length?: number;
    waist?: number;
    hips?: number;
    inseam?: number;
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
