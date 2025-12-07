import {
  Controller,
  Get,
  Put,
  Delete,
  Post,
  Param,
  Query,
  Body,
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
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AdminService } from './admin.service';
import {
  AdminUserQueryDto,
  AdminUpdateUserDto,
  AdminVendorQueryDto,
  AdminUpdateVendorDto,
  AdminOrderQueryDto,
  AdminStatsResponseDto,
  AuditLogResponseDto,
  AdminReviewResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { UserRole } from '../../generated/prisma/client';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { UserProfileResponseDto } from '../users/dto';
import { VendorDetailDto } from '../products/dto/product-response.dto';
import { OrderResponseDto } from '../orders/dto';
import { ProductListItemDto } from '../products/dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Not authenticated',
  type: ErrorResponseDto,
})
@ApiForbiddenResponse({
  description: 'Not authorized as admin',
  type: ErrorResponseDto,
})
export class AdminController {
  constructor(private adminService: AdminService) {}

  // Dashboard
  @Get('stats')
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics',
    type: AdminStatsResponseDto,
  })
  async getStats() {
    return this.adminService.getStats();
  }

  // User management
  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'List of users',
    type: [UserProfileResponseDto],
  })
  async getUsers(@Query() query: AdminUserQueryDto) {
    return this.adminService.getUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User details',
    type: UserProfileResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: ErrorResponseDto,
  })
  async getUserById(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getUserById(id);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({
    status: 200,
    description: 'User updated',
    type: UserProfileResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: ErrorResponseDto,
  })
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.adminService.updateUser(id, dto);
  }

  @Delete('users/:id')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 deletions per minute
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({
    status: 200,
    description: 'User deleted',
    type: UserProfileResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: ErrorResponseDto,
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded',
    type: ErrorResponseDto,
  })
  async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteUser(id);
  }

  // Vendor management
  @Get('vendors')
  @ApiOperation({ summary: 'Get all vendors' })
  @ApiResponse({
    status: 200,
    description: 'List of vendors',
    type: [VendorDetailDto],
  })
  async getVendors(@Query() query: AdminVendorQueryDto) {
    return this.adminService.getVendors(query);
  }

  @Get('vendors/:id')
  @ApiOperation({ summary: 'Get vendor by ID' })
  @ApiResponse({
    status: 200,
    description: 'Vendor details',
    type: VendorDetailDto,
  })
  @ApiNotFoundResponse({
    description: 'Vendor not found',
    type: ErrorResponseDto,
  })
  async getVendorById(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getVendorById(id);
  }

  @Put('vendors/:id')
  @ApiOperation({ summary: 'Update vendor' })
  @ApiResponse({
    status: 200,
    description: 'Vendor updated',
    type: VendorDetailDto,
  })
  @ApiNotFoundResponse({
    description: 'Vendor not found',
    type: ErrorResponseDto,
  })
  async updateVendor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateVendorDto,
  ) {
    return this.adminService.updateVendor(id, dto);
  }

  @Post('vendors/:id/verify')
  @ApiOperation({ summary: 'Verify a vendor' })
  @ApiResponse({
    status: 200,
    description: 'Vendor verified',
    type: VendorDetailDto,
  })
  @ApiNotFoundResponse({
    description: 'Vendor not found',
    type: ErrorResponseDto,
  })
  async verifyVendor(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.verifyVendor(id);
  }

  // Order management
  @Get('orders')
  @ApiOperation({ summary: 'Get all orders' })
  @ApiResponse({
    status: 200,
    description: 'List of orders',
    type: [OrderResponseDto],
  })
  async getOrders(@Query() query: AdminOrderQueryDto) {
    return this.adminService.getOrders(query);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({
    status: 200,
    description: 'Order details',
    type: OrderResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Order not found',
    type: ErrorResponseDto,
  })
  async getOrderById(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getOrderById(id);
  }

  // Product management
  @Get('products')
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({
    status: 200,
    description: 'List of products',
    type: [ProductListItemDto],
  })
  async getProducts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    return this.adminService.getProducts(
      page || 1,
      limit || 20,
      includeInactive ?? true,
    );
  }

  @Post('products/:id/toggle-featured')
  @ApiOperation({ summary: 'Toggle product featured status' })
  @ApiResponse({
    status: 200,
    description: 'Product featured status toggled',
    type: ProductListItemDto,
  })
  @ApiNotFoundResponse({
    description: 'Product not found',
    type: ErrorResponseDto,
  })
  async toggleProductFeatured(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.toggleProductFeatured(id);
  }

  @Post('products/:id/toggle-active')
  @ApiOperation({ summary: 'Toggle product active status' })
  @ApiResponse({
    status: 200,
    description: 'Product active status toggled',
    type: ProductListItemDto,
  })
  @ApiNotFoundResponse({
    description: 'Product not found',
    type: ErrorResponseDto,
  })
  async toggleProductActive(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.toggleProductActive(id);
  }

  // Review management
  @Get('reviews')
  @ApiOperation({ summary: 'Get all reviews' })
  @ApiResponse({
    status: 200,
    description: 'List of reviews',
    type: [AdminReviewResponseDto],
  })
  async getReviews(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getReviews(page || 1, limit || 20);
  }

  @Delete('reviews/:id')
  @ApiOperation({ summary: 'Delete a review' })
  @ApiResponse({ status: 200, description: 'Review deleted' })
  @ApiNotFoundResponse({
    description: 'Review not found',
    type: ErrorResponseDto,
  })
  async deleteReview(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteReview(id);
  }

  // Audit logs
  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs' })
  @ApiResponse({
    status: 200,
    description: 'List of audit logs',
    type: [AuditLogResponseDto],
  })
  async getAuditLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getAuditLogs(page || 1, limit || 50);
  }
}
