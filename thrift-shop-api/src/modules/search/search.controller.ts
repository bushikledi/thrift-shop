import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchQueryDto, SearchResponseDto, TrendingResponseDto } from './dto';
import { Public } from '../../common/decorators';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Search across products, vendors, and categories' })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    type: SearchResponseDto,
  })
  async search(@Query() query: SearchQueryDto) {
    return this.searchService.search(query);
  }

  @Public()
  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions' })
  @ApiResponse({
    status: 200,
    description: 'Search suggestions',
    type: [String],
  })
  async suggestions(@Query('q') q: string, @Query('limit') limit?: number) {
    return this.searchService.suggestions(q, limit || 5);
  }

  @Public()
  @Get('trending')
  @ApiOperation({ summary: 'Get trending products, categories, and searches' })
  @ApiResponse({
    status: 200,
    description: 'Trending items',
    type: TrendingResponseDto,
  })
  async trending(@Query('limit') limit?: number) {
    return this.searchService.trending(limit || 10);
  }
}
