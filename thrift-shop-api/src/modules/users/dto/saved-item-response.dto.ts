import { ApiProperty } from '@nestjs/swagger';
import { ProductListItemDto } from '../../products/dto';

export class SavedItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ type: ProductListItemDto })
  product!: ProductListItemDto;
}
