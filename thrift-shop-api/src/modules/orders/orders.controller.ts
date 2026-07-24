import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  OrderResponseDto,
  TrackOrderDto,
} from './dto';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../auth/guards';
import { Public, Roles, CurrentUser } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { UserRole, OrderStatus } from '../../generated/prisma/client';
import { RequestWithUser } from '../../common/interfaces/request.interface';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  // @Public() disables the global JwtAuthGuard (which would reject guests);
  // OptionalJwtAuthGuard then attaches req.user when a valid token/cookie is
  // present, so authenticated users are not treated as guests. See F6.
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post('checkout')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 checkouts per minute per IP
  @ApiOperation({ summary: 'Create order (supports guest checkout)' })
  @ApiResponse({
    status: 201,
    description: 'Order(s) created successfully',
    type: [OrderResponseDto],
  })
  @ApiBadRequestResponse({
    description: 'Cart is empty or invalid',
    type: ErrorResponseDto,
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded',
    type: ErrorResponseDto,
  })
  async checkout(@Body() dto: CreateOrderDto, @Req() req: RequestWithUser) {
    const userId = req.user?.id;
    return this.ordersService.create(dto, userId);
  }

  @Public()
  @Post('track')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 tracking requests per minute per IP
  @ApiOperation({
    summary: 'Track an order',
    description:
      'Requires the order number and the email used to place the order. ' +
      'Returns fulfilment status only — no contact details or shipping address.',
  })
  @ApiResponse({
    status: 200,
    description: 'Order tracking details',
  })
  @ApiBadRequestResponse({
    description: 'Invalid order number format or email',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Order not found or email does not match',
    type: ErrorResponseDto,
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded',
    type: ErrorResponseDto,
  })
  async trackOrder(@Body() dto: TrackOrderDto) {
    return this.ordersService.trackByOrderNumber(dto.orderNumber, dto.email);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({
    status: 200,
    description: 'Order details',
    type: OrderResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Order not found',
    type: ErrorResponseDto,
  })
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; vendor?: { id: string } },
  ) {
    return this.ordersService.findById(id, user.id, user.vendor?.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get vendor orders' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of orders',
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
  async getVendorOrders(
    @CurrentUser() user: { vendor: { id: string } },
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: OrderStatus,
  ) {
    return this.ordersService.getVendorOrders(
      user.vendor.id,
      page || 1,
      limit || 20,
      status,
    );
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status (vendor)' })
  @ApiResponse({
    status: 200,
    description: 'Order status updated',
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
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: { vendor: { id: string } },
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, user.vendor.id, dto);
  }
}
