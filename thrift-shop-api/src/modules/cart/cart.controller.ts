import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto, CartResponseDto } from './dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { Public } from '../../common/decorators';
import { RequestWithUser } from '../../common/interfaces/request.interface';

@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get current cart' })
  @ApiResponse({
    status: 200,
    description: 'Cart details',
    type: CartResponseDto,
  })
  async getCart(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const sessionId = req.cookies?.cart_session;
    const userId = req.user?.id;

    const session = await this.cartService.getOrCreateSession(
      sessionId,
      userId,
    );

    // Set cart session cookie if new
    if (!sessionId || sessionId !== session.id) {
      res.cookie('cart_session', session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
    }

    return this.cartService.getCart(session.id);
  }

  @Public()
  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({
    status: 201,
    description: 'Item added',
    type: CartResponseDto,
  })
  async addItem(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: AddToCartDto,
  ) {
    const sessionId = req.cookies?.cart_session;
    const userId = req.user?.id;

    const session = await this.cartService.getOrCreateSession(
      sessionId,
      userId,
    );

    // Set cart session cookie if new
    if (!sessionId || sessionId !== session.id) {
      res.cookie('cart_session', session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }

    return this.cartService.addItem(session.id, dto);
  }

  @Public()
  @Put('items/:itemId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiResponse({
    status: 200,
    description: 'Item updated',
    type: CartResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Cart or item not found',
    type: ErrorResponseDto,
  })
  async updateItem(
    @Req() req: RequestWithUser,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    const sessionId = req.cookies?.cart_session;

    if (!sessionId) {
      return { message: 'Cart not found' };
    }

    return this.cartService.updateItem(sessionId, itemId, dto);
  }

  @Public()
  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({
    status: 200,
    description: 'Item removed',
    type: CartResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Cart or item not found',
    type: ErrorResponseDto,
  })
  async removeItem(
    @Req() req: RequestWithUser,
    @Param('itemId') itemId: string,
  ) {
    const sessionId = req.cookies?.cart_session;

    if (!sessionId) {
      return { message: 'Cart not found' };
    }

    return this.cartService.removeItem(sessionId, itemId);
  }

  @Public()
  @Delete()
  @ApiOperation({ summary: 'Clear cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared' })
  @ApiNotFoundResponse({
    description: 'Cart not found',
    type: ErrorResponseDto,
  })
  async clearCart(@Req() req: RequestWithUser) {
    const sessionId = req.cookies?.cart_session;

    if (!sessionId) {
      return { message: 'Cart not found' };
    }

    return this.cartService.clearCart(sessionId);
  }
}
