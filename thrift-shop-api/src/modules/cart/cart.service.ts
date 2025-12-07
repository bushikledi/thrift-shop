import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { AddToCartDto, UpdateCartItemDto } from './dto';
import { CART_SESSION_INCLUDE, CART_PRODUCT_INCLUDE } from './cart.constants';
import { CART } from '../../common/constants';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateSession(sessionId?: string, userId?: string) {
    // If sessionId provided, try to find existing session
    if (sessionId) {
      const session = await this.prisma.cartSession.findUnique({
        where: { id: sessionId },
        include: CART_SESSION_INCLUDE,
      });

      if (session && session.expiresAt > new Date()) {
        return session;
      }
    }

    // If user is logged in, try to find their existing cart
    if (userId) {
      const userSession = await this.prisma.cartSession.findFirst({
        where: {
          userId,
          expiresAt: { gt: new Date() },
        },
        include: CART_SESSION_INCLUDE,
      });

      if (userSession) {
        return userSession;
      }
    }

    // Create new session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + CART.SESSION_EXPIRY_DAYS);

    return this.prisma.cartSession.create({
      data: {
        userId,
        expiresAt,
      },
      include: CART_SESSION_INCLUDE,
    });
  }

  async getCart(sessionId: string) {
    const session = await this.prisma.cartSession.findUnique({
      where: { id: sessionId },
      include: CART_SESSION_INCLUDE,
    });

    if (!session) {
      throw new NotFoundException(
        `Cart not found for session ID: ${sessionId}`,
      );
    }

    // Calculate totals
    const items = session.items.filter(
      (item) => item.product.isActive && item.product.quantity > 0,
    );
    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );

    return {
      ...session,
      items,
      subtotal,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }

  async addItem(sessionId: string, dto: AddToCartDto) {
    // Validate product exists and is available
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isActive || product.quantity < 1) {
      throw new BadRequestException('Product is not available');
    }

    // Check if item already in cart
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        sessionId_productId: {
          sessionId,
          productId: dto.productId,
        },
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + dto.quantity;
      const availableQuantity = product.quantity - existingItem.quantity;

      if (newQuantity > product.quantity) {
        throw new BadRequestException(
          `Only ${availableQuantity} available. You already have ${existingItem.quantity} in your cart.`,
        );
      }

      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
        include: {
          product: {
            include: CART_PRODUCT_INCLUDE,
          },
        },
      });
    }

    // For new items, check if quantity exceeds available stock
    if (dto.quantity > product.quantity) {
      throw new BadRequestException(`Only ${product.quantity} available`);
    }

    // Add new item
    return this.prisma.cartItem.create({
      data: {
        sessionId,
        productId: dto.productId,
        quantity: dto.quantity,
      },
      include: {
        product: {
          include: CART_PRODUCT_INCLUDE,
        },
      },
    });
  }

  async updateItem(sessionId: string, itemId: string, dto: UpdateCartItemDto) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, sessionId },
      include: { product: true },
    });

    if (!item) {
      throw new NotFoundException(
        `Cart item ${itemId} not found in session ${sessionId}`,
      );
    }

    // If quantity is 0, remove item
    if (dto.quantity === 0) {
      return this.prisma.cartItem.delete({
        where: { id: itemId },
      });
    }

    // Check if requested quantity exceeds available stock
    // Since there's a unique constraint on [sessionId, productId], 
    // this is the only cart item for this product in this session
    if (dto.quantity > item.product.quantity) {
      throw new BadRequestException(
        `Only ${item.product.quantity} available`,
      );
    }

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
      include: {
        product: {
          include: CART_PRODUCT_INCLUDE,
        },
      },
    });
  }

  async removeItem(sessionId: string, itemId: string) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, sessionId },
    });

    if (!item) {
      throw new NotFoundException(
        `Cart item ${itemId} not found in session ${sessionId}`,
      );
    }

    return this.prisma.cartItem.delete({
      where: { id: itemId },
    });
  }

  async clearCart(sessionId: string) {
    return this.prisma.cartItem.deleteMany({
      where: { sessionId },
    });
  }

  async mergeGuestCart(guestSessionId: string, userId: string) {
    // Get or create user's cart
    const userSession = await this.getOrCreateSession(undefined, userId);

    // Get guest cart items
    const guestItems = await this.prisma.cartItem.findMany({
      where: { sessionId: guestSessionId },
    });

    if (guestItems.length === 0) {
      await this.prisma.cartSession.delete({ where: { id: guestSessionId } });
      return this.getCart(userSession.id);
    }

    const existingUserItems = await this.prisma.cartItem.findMany({
      where: {
        sessionId: userSession.id,
        productId: { in: guestItems.map((item) => item.productId) },
      },
    });

    const existingItemsMap = new Map(
      existingUserItems.map((item) => [item.productId, item]),
    );

    // Use function-based transaction for better error handling
    await this.prisma.$transaction(async (tx) => {
      for (const item of guestItems) {
        const existingItem = existingItemsMap.get(item.productId);
        if (existingItem) {
          await tx.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + item.quantity },
          });
        } else {
          await tx.cartItem.create({
            data: {
              sessionId: userSession.id,
              productId: item.productId,
              quantity: item.quantity,
            },
          });
        }
      }
    });

    // Delete guest session
    await this.prisma.cartSession.delete({
      where: { id: guestSessionId },
    });

    return this.getCart(userSession.id);
  }
}
