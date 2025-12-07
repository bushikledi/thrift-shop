import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  ProductListItemDto,
  ProductDetailDto,
  PaginatedProductsResponseDto,
} from './dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { JwtAuthGuard } from '../auth/guards';
import { Public, Roles, CurrentUser } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { UserRole } from '../../generated/prisma/client';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all products with filters' })
  @ApiResponse({
    status: 200,
    description: 'List of products',
    type: PaginatedProductsResponseDto,
  })
  async findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Get featured products' })
  @ApiResponse({
    status: 200,
    description: 'Featured products',
    type: [ProductListItemDto],
  })
  async getFeatured(@Query('limit') limit?: number) {
    return this.productsService.getFeatured(limit || 8);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get product by slug' })
  @ApiResponse({
    status: 200,
    description: 'Product details',
    type: ProductDetailDto,
  })
  @ApiNotFoundResponse({
    description: 'Product not found',
    type: ErrorResponseDto,
  })
  async findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Public()
  @Get(':id/related')
  @ApiOperation({ summary: 'Get related products' })
  @ApiResponse({
    status: 200,
    description: 'Related products',
    type: [ProductListItemDto],
  })
  async getRelated(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.productsService.getRelated(id, limit || 4);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product (vendor only)' })
  @ApiResponse({
    status: 201,
    description: 'Product created',
    type: ProductDetailDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Not authorized as vendor',
    type: ErrorResponseDto,
  })
  async create(
    @CurrentUser() user: { vendor: { id: string } },
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(user.vendor.id, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product (vendor only)' })
  @ApiResponse({
    status: 200,
    description: 'Product updated',
    type: ProductDetailDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Not authorized as vendor or not your product',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Product not found',
    type: ErrorResponseDto,
  })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: { vendor: { id: string } },
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, user.vendor.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product (vendor only)' })
  @ApiResponse({
    status: 200,
    description: 'Product deleted',
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Not authorized as vendor or not your product',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Product not found',
    type: ErrorResponseDto,
  })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: { vendor: { id: string } },
  ) {
    return this.productsService.delete(id, user.vendor.id);
  }
}
