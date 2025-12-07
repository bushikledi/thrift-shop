import {
  Controller,
  Get,
  Put,
  Post,
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
  ApiNotFoundResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import {
  UpdateUserDto,
  UserProfileResponseDto,
  SavedItemResponseDto,
  AddressDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../../common/decorators';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { OrderResponseDto } from '../orders/dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile',
    type: UserProfileResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @Put('me')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 updates per minute
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Updated user profile',
    type: UserProfileResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded',
    type: ErrorResponseDto,
  })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(userId, dto);
  }

  @Get('me/saved')
  @ApiOperation({ summary: 'Get saved/wishlist items' })
  @ApiResponse({
    status: 200,
    description: 'List of saved items',
    type: [SavedItemResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async getSavedItems(@CurrentUser('id') userId: string) {
    return this.usersService.getSavedItems(userId);
  }

  @Post('me/saved/:productId')
  @ApiOperation({ summary: 'Save an item to wishlist' })
  @ApiResponse({
    status: 201,
    description: 'Item saved',
    type: SavedItemResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Product not found',
    type: ErrorResponseDto,
  })
  async saveItem(
    @CurrentUser('id') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.usersService.saveItem(userId, productId);
  }

  @Delete('me/saved/:productId')
  @ApiOperation({ summary: 'Remove item from wishlist' })
  @ApiResponse({
    status: 200,
    description: 'Item removed',
    type: SavedItemResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Item not found',
    type: ErrorResponseDto,
  })
  async removeSavedItem(
    @CurrentUser('id') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.usersService.removeSavedItem(userId, productId);
  }

  @Get('me/orders')
  @ApiOperation({ summary: 'Get user orders' })
  @ApiResponse({
    status: 200,
    description: 'List of orders',
    type: [OrderResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async getOrders(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.usersService.getOrders(userId, page || 1, limit || 10);
  }

  @Get('me/address')
  @ApiOperation({ summary: 'Get current user address' })
  @ApiResponse({
    status: 200,
    description: 'User address',
    type: Object,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async getAddress(@CurrentUser('id') userId: string) {
    return this.usersService.getAddress(userId);
  }

  @Put('me/address')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Update current user address' })
  @ApiResponse({
    status: 200,
    description: 'Updated address',
    schema: {
      type: 'object',
      properties: {
        street: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        zip: { type: 'string' },
        country: { type: 'string' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded',
    type: ErrorResponseDto,
  })
  async updateAddress(
    @CurrentUser('id') userId: string,
    @Body() dto: AddressDto,
  ) {
    return this.usersService.updateAddress(userId, dto);
  }
}
