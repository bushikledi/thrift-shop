import { ApiProperty } from '@nestjs/swagger';
import { ProductListItemDto } from '../../products/dto';
import { CategorySummaryDto } from '../../products/dto/product-response.dto';

export class TrendingResponseDto {
  @ApiProperty({ type: [ProductListItemDto] })
  products!: ProductListItemDto[];

  @ApiProperty({ type: [CategorySummaryDto] })
  categories!: CategorySummaryDto[];

  @ApiProperty({ type: [String] })
  searches!: string[];
}
