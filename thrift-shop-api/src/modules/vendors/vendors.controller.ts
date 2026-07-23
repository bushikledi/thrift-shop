import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
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
import { VendorsService } from './vendors.service';
import { UpdateVendorDto, VendorDashboardStatsDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { Public, Roles, CurrentUser } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { UserRole, OrderStatus } from '../../generated/prisma/client';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import {
  VendorDetailDto,
  ReviewSummaryDto,
} from '../products/dto/product-response.dto';
import { ProductListItemDto } from '../products/dto';
import { ReviewListResponseDto } from '../reviews/dto/review-response.dto';
import { OrderResponseDto } from '../orders/dto/order-response.dto';

@ApiTags('vendors')
@Controller('vendors')
export class VendorsController {
  constructor(private vendorsService: VendorsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all vendors' })
  @ApiResponse({
    status: 200,
    description: 'List of vendors',
    type: [VendorDetailDto],
  })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('verified') verified?: boolean,
  ) {
    return this.vendorsService.findAll(page || 1, limit || 20, verified);
  }

  @Get('me/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current vendor profile' })
  @ApiResponse({
    status: 200,
    description: 'Vendor profile',
    type: VendorDetailDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Not authorized as vendor',
    type: ErrorResponseDto,
  })
  async getMyProfile(@CurrentUser() user: { vendor: { id: string } }) {
    return this.vendorsService.findById(user.vendor.id);
  }

  @Put('me/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current vendor profile' })
  @ApiResponse({
    status: 200,
    description: 'Vendor updated',
    type: VendorDetailDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Not authorized as vendor',
    type: ErrorResponseDto,
  })
  async updateMyProfile(
    @CurrentUser() user: { id: string; vendor: { id: string } },
    @Body() dto: UpdateVendorDto,
  ) {
    return this.vendorsService.update(user.vendor.id, user.id, dto);
  }

  @Get('me/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get vendor dashboard stats' })
  @ApiResponse({
    status: 200,
    description: 'Vendor stats',
    type: VendorDashboardStatsDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Not authorized as vendor',
    type: ErrorResponseDto,
  })
  async getMyStats(@CurrentUser() user: { vendor: { id: string } }) {
    return this.vendorsService.getStats(user.vendor.id);
  }

  @Get('me/products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current vendor products (includes inactive)' })
  @ApiResponse({
    status: 200,
    description: 'Vendor products',
    type: [ProductListItemDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Not authorized as vendor',
    type: ErrorResponseDto,
  })
  async getMyProducts(
    @CurrentUser() user: { vendor: { id: string } },
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    return this.vendorsService.getProducts(
      user.vendor.id,
      page || 1,
      limit || 20,
      includeInactive ?? true,
    );
  }

  @Get('me/orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current vendor orders' })
  @ApiResponse({
    status: 200,
    description: 'Vendor orders',
    type: [OrderResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Not authorized as vendor',
    type: ErrorResponseDto,
  })
  async getMyOrders(
    @CurrentUser() user: { vendor: { id: string } },
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: OrderStatus,
  ) {
    return this.vendorsService.getOrders(
      user.vendor.id,
      page || 1,
      limit || 20,
      status,
    );
  }

  @Get('me/orders/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific vendor order' })
  @ApiResponse({
    status: 200,
    description: 'Order details',
    type: OrderResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Not authorized as vendor',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Order not found',
    type: ErrorResponseDto,
  })
  async getMyOrder(
    @CurrentUser() user: { vendor: { id: string } },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.vendorsService.getOrderById(user.vendor.id, id);
  }

  @Get('me/reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current vendor reviews' })
  @ApiResponse({
    status: 200,
    description: 'Vendor reviews',
    type: ReviewListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Not authorized as vendor',
    type: ErrorResponseDto,
  })
  async getMyReviews(
    @CurrentUser() user: { vendor: { id: string } },
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.vendorsService.getReviews(
      user.vendor.id,
      page || 1,
      limit || 10,
    );
  }

  @Get('me/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Store analytics',
    description:
      'Daily revenue/order series and best-selling products for the window.',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics for the requested window',
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async getMyAnalytics(
    @CurrentUser() user: { vendor: { id: string } },
    @Query('days') days?: number,
  ) {
    return this.vendorsService.getAnalytics(user.vendor.id, Number(days) || 30);
  }

  // ---------------------------------------------------------------------------
  // Public storefront lookups by vendor slug.
  //
  // Declared last on purpose: Nest matches routes in declaration order, so
  // ':name/products' and ':name/reviews' would otherwise shadow the concrete
  // 'me/products' and 'me/reviews' routes above and resolve them as a vendor
  // named "me".
  // ---------------------------------------------------------------------------

  @Public()
  @Get(':name')
  @ApiOperation({ summary: 'Get vendor by name (slug)' })
  @ApiResponse({
    status: 200,
    description: 'Vendor details',
    type: VendorDetailDto,
  })
  @ApiNotFoundResponse({
    description: 'Vendor not found',
    type: ErrorResponseDto,
  })
  async findByName(@Param('name') name: string) {
    return this.vendorsService.findByName(name);
  }

  @Public()
  @Get(':name/products')
  @ApiOperation({ summary: 'Get vendor products' })
  @ApiResponse({
    status: 200,
    description: 'Vendor products',
    type: [ProductListItemDto],
  })
  @ApiNotFoundResponse({
    description: 'Vendor not found',
    type: ErrorResponseDto,
  })
  async getProducts(
    @Param('name') name: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const vendor = await this.vendorsService.findByName(name);
    return this.vendorsService.getProducts(vendor.id, page || 1, limit || 20);
  }

  @Public()
  @Get(':name/reviews')
  @ApiOperation({ summary: 'Get vendor reviews' })
  @ApiResponse({
    status: 200,
    description: 'Vendor reviews',
    type: [ReviewSummaryDto],
  })
  @ApiNotFoundResponse({
    description: 'Vendor not found',
    type: ErrorResponseDto,
  })
  async getReviews(
    @Param('name') name: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const vendor = await this.vendorsService.findByName(name);
    return this.vendorsService.getReviews(vendor.id, page || 1, limit || 10);
  }
}
