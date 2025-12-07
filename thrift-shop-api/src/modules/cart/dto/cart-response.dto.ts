import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductCondition } from '../../../generated/prisma/client';

export class CartProductVendorDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  displayName!: string;
}

export class CartProductMediaDto {
  @ApiProperty()
  url!: string;

  @ApiPropertyOptional()
  altText?: string;
}

export class CartProductDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  price!: number;

  @ApiPropertyOptional()
  comparePrice?: number;

  @ApiProperty({ enum: ProductCondition })
  condition!: ProductCondition;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  quantity!: number;

  @ApiProperty({ type: [CartProductMediaDto] })
  media!: CartProductMediaDto[];

  @ApiProperty({ type: CartProductVendorDto })
  vendor!: CartProductVendorDto;
}

export class CartItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  cartSessionId!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: CartProductDto })
  product!: CartProductDto;
}

export class CartResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional()
  userId?: string;

  @ApiProperty()
  expiresAt!: Date;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: [CartItemDto] })
  items!: CartItemDto[];

  @ApiProperty()
  subtotal!: number;

  @ApiProperty()
  itemCount!: number;
}
