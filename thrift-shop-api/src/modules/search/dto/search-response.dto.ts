import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductListItemDto } from '../../products/dto';
import {
  CategorySummaryDto,
  VendorDetailDto,
} from '../../products/dto/product-response.dto';

export class ProductSearchResultDto {
  @ApiProperty({ type: [ProductListItemDto] })
  data!: ProductListItemDto[];

  @ApiProperty()
  total!: number;
}

export class VendorSearchResultDto {
  @ApiProperty({ type: [VendorDetailDto] })
  data!: VendorDetailDto[];

  @ApiProperty()
  total!: number;
}

export class CategorySearchResultDto {
  @ApiProperty({ type: [CategorySummaryDto] })
  data!: CategorySummaryDto[];

  @ApiProperty()
  total!: number;
}

export class SearchResponseDto {
  @ApiProperty({ type: ProductSearchResultDto })
  products!: ProductSearchResultDto;

  @ApiProperty({ type: VendorSearchResultDto })
  vendors!: VendorSearchResultDto;

  @ApiProperty({ type: CategorySearchResultDto })
  categories!: CategorySearchResultDto;
}

export class SearchSuggestionDto {
  @ApiProperty()
  text!: string;

  @ApiProperty()
  type!: string;
}

export class SearchSuggestionsResponseDto {
  @ApiProperty({ type: [SearchSuggestionDto] })
  suggestions!: SearchSuggestionDto[];
}
