import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma';
import { NotificationsService } from '../notifications/notifications.service';
import { OrderNumberService } from '../../common/utils';
import {
  OrderCreatedEvent,
  OrderStatusChangedEvent,
  OrderCancelledEvent,
} from '../notifications/events';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  GuestInfo,
  ShippingAddress,
} from './dto';
import { OrderStatus, Prisma } from '../../generated/prisma/client';
import { OrdersRepository } from './orders.repository';

interface ShippingConfig {
  baseRate: number;
  perItemRate: number;
  weightRate: number;
  freeShippingThreshold: number;
  expressMultiplier: number;
  overnightMultiplier: number;
}

type OrderWithVendorAndItems = Prisma.OrderGetPayload<{
  include: {
    items: true;
    vendor: {
      select: { id: true; displayName: true };
    };
  };
}>;

type OrderWithBuyerAndItems = Prisma.OrderGetPayload<{
  include: {
    items: true;
    buyer: {
      select: { id: true; name: true; email: true };
    };
  };
}>;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private ordersRepository: OrdersRepository,
    private notificationsService: NotificationsService,
    private eventEmitter: EventEmitter2,
    private orderNumberService: OrderNumberService,
    private configService: ConfigService,
  ) {}

  /**
   * Default assumed per-item weight in grams. Products do not currently track a
   * per-item weight, so shipping uses this estimate for the weight component.
   */
  private static readonly DEFAULT_ITEM_WEIGHT_GRAMS = 200;

  /**
   * Calculate shipping cost based on items, method, and address
   */
  private calculateShipping(
    items: Array<{
      quantity: number;
      product: { price: Prisma.Decimal };
    }>,
    shippingMethod: string,
    subtotal: number,
  ): number {
    const shippingConfig = this.configService.get<ShippingConfig>('shipping');
    if (!shippingConfig) {
      throw new Error('Shipping config not found');
    }
    const freeShippingThreshold = shippingConfig.freeShippingThreshold;

    // Free shipping for orders above threshold
    if (subtotal >= freeShippingThreshold && shippingMethod === 'standard') {
      return 0;
    }

    // Base rate + per-item charge
    let shipping = shippingConfig.baseRate;
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    shipping += totalItems * shippingConfig.perItemRate;

    // Add weight-based charge using the default per-item weight estimate.
    const totalWeight = totalItems * OrdersService.DEFAULT_ITEM_WEIGHT_GRAMS;
    shipping += (totalWeight / 100) * shippingConfig.weightRate;

    // Apply shipping method multiplier
    switch (shippingMethod) {
      case 'express':
        shipping *= shippingConfig.expressMultiplier;
        break;
      case 'overnight':
        shipping *= shippingConfig.overnightMultiplier;
        break;
      case 'standard':
      default:
        // No multiplier for standard
        break;
    }

    return Math.round(shipping * 100) / 100; // Round to 2 decimal places
  }

  async create(dto: CreateOrderDto, userId?: string) {
    // Get cart session
    const cart = await this.prisma.cartSession.findUnique({
      where: { id: dto.cartSessionId },
      include: {
        items: {
          include: {
            product: {
              include: {
                vendor: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Validate guest info for non-authenticated users
    if (!userId && !dto.guestInfo) {
      throw new BadRequestException('Guest info required for guest checkout');
    }

    // Group items by vendor
    const itemsByVendor = new Map<string, typeof cart.items>();

    for (const item of cart.items) {
      if (!item.product.isActive || item.product.quantity < item.quantity) {
        throw new BadRequestException(
          `Product "${item.product.title}" is no longer available in requested quantity`,
        );
      }

      const vendorId = item.product.vendorId;
      if (!itemsByVendor.has(vendorId)) {
        itemsByVendor.set(vendorId, []);
      }
      itemsByVendor.get(vendorId)!.push(item);
    }

    const guestInfoPayload: GuestInfo | null = dto.guestInfo
      ? {
          name: dto.guestInfo.name,
          email: dto.guestInfo.email,
          phone: dto.guestInfo.phone,
        }
      : null;

    const shippingAddressPayload: ShippingAddress = {
      street: dto.shippingAddress.street,
      city: dto.shippingAddress.city,
      state: dto.shippingAddress.state,
      zip: dto.shippingAddress.zip,
      country: dto.shippingAddress.country,
    };

    // Use transaction for atomic order creation
    const orders = (await this.prisma.$transaction<OrderWithVendorAndItems[]>(
      async (tx) => {
        const createdOrders: OrderWithVendorAndItems[] = [];

        for (const [vendorId, items] of itemsByVendor) {
          const subtotal = items.reduce(
            (sum, item) => sum + Number(item.product.price) * item.quantity,
            0,
          );
          const shippingAmount = this.calculateShipping(
            items,
            dto.shippingMethod || 'standard',
            subtotal,
          );
          const total = subtotal + shippingAmount;

          // Use the OrderNumberService for atomic generation
          const orderNumber = await this.orderNumberService.generate();

          const order = await tx.order.create({
            data: {
              orderNumber,
              buyerId: userId,
              guestInfo: guestInfoPayload ?? undefined,
              vendorId,
              shippingAddress: shippingAddressPayload,
              shippingMethod: dto.shippingMethod,
              shippingAmount,
              subtotal,
              total,
              paymentMethod: dto.paymentMethod,
              customerNotes: dto.customerNotes,
              items: {
                create: items.map((item) => ({
                  productId: item.productId,
                  title: item.product.title,
                  price: item.product.price,
                  quantity: item.quantity,
                  conditionSnapshot: item.product.condition,
                })),
              },
            },
            include: {
              items: true,
              vendor: {
                select: { id: true, displayName: true },
              },
            },
          });

          createdOrders.push(order);

          // Update product quantities within transaction (batched for performance)
          await Promise.all(
            items.map((item) =>
              tx.product.update({
                where: { id: item.productId },
                data: {
                  quantity: { decrement: item.quantity },
                  // Mark as inactive if unique item
                  ...(item.product.isUnique &&
                  item.product.quantity <= item.quantity
                    ? { isActive: false }
                    : {}),
                },
              }),
            ),
          );
        }

        // Clear the cart within transaction
        await tx.cartItem.deleteMany({
          where: { sessionId: dto.cartSessionId },
        });

        return createdOrders;
      },
      {
        maxWait: 5000,
        timeout: 15000,
      },
    )) as OrderWithVendorAndItems[];

    // Emit order.created events (outside transaction - non-critical)
    for (const order of orders) {
      this.emitOrderCreatedEvent(order, userId, dto).catch((error: unknown) => {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Failed to emit order.created event for ${order.orderNumber}: ${errorMessage}`,
        );
      });
    }

    return orders;
  }

  /**
   * Emit order.created event for event-driven notifications
   */
  private async emitOrderCreatedEvent(
    order: OrderWithVendorAndItems,
    userId: string | undefined,
    dto: CreateOrderDto,
  ) {
    // Get buyer email
    let buyerEmail = '';
    if (userId) {
      const buyer = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      buyerEmail = buyer?.email || '';
    } else if (dto.guestInfo) {
      buyerEmail = dto.guestInfo.email;
    }

    // Get vendor email
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: order.vendorId },
      include: { user: { select: { email: true } } },
    });
    const vendorEmail = vendor?.user?.email || '';

    // Build items for event
    const items = order.items.map((item) => ({
      productTitle: item.title,
      quantity: item.quantity,
      price: Number(item.price),
    }));

    // Emit event
    this.eventEmitter.emit(
      'order.created',
      new OrderCreatedEvent(
        order.id,
        order.orderNumber,
        userId || null,
        buyerEmail,
        order.vendorId,
        vendorEmail,
        Number(order.total),
        items,
      ),
    );

    this.logger.log(`Emitted order.created event for ${order.orderNumber}`);
  }

  async findById(id: string, userId?: string, vendorId?: string) {
    const order = await this.ordersRepository.findById(id);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check access
    if (userId && order.buyerId !== userId && order.vendor.id !== vendorId) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  async findByOrderNumber(orderNumber: string) {
    const order = await this.ordersRepository.findByOrderNumber(orderNumber);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async getVendorOrders(
    vendorId: string,
    page = 1,
    limit = 20,
    status?: OrderStatus,
  ) {
    const skip = (page - 1) * limit;

    const { orders, total } = await this.ordersRepository.findByVendor(
      vendorId,
      {
        status,
        skip,
        take: limit,
      },
    );

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateStatus(id: string, vendorId: string, dto: UpdateOrderStatusDto) {
    const order = await this.ordersRepository.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.vendorId !== vendorId) {
      throw new ForbiddenException('Access denied');
    }

    // Validate status transition
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['DELIVERED'],
      DELIVERED: ['RETURNED'],
      CANCELLED: [],
      RETURNED: ['REFUNDED'],
      REFUNDED: [],
    };

    if (!validTransitions[order.status].includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${dto.status}`,
      );
    }

    if (dto.status === 'CANCELLED') {
      // Restore product quantities
      const items = await this.prisma.orderItem.findMany({
        where: { orderId: id },
      });
      for (const item of items) {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: {
            quantity: { increment: item.quantity },
            isActive: true,
          },
        });
      }
    }

    const previousStatus = order.status;

    const updatedOrder = await this.ordersRepository.updateStatus(
      id,
      dto.status,
      {
        trackingNumber: dto.trackingNumber,
        vendorNotes: dto.vendorNotes,
      },
    );

    // Emit status change event
    this.emitStatusChangedEvent(updatedOrder, previousStatus, dto).catch(
      (error: unknown) => {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Failed to emit status change event for ${order.orderNumber}: ${errorMessage}`,
        );
      },
    );

    return updatedOrder;
  }

  /**
   * Emit order.status_changed event
   */
  private async emitStatusChangedEvent(
    order: OrderWithBuyerAndItems,
    previousStatus: OrderStatus,
    dto: UpdateOrderStatusDto,
  ) {
    const buyerEmail = order.buyer?.email || '';

    this.eventEmitter.emit(
      'order.status_changed',
      new OrderStatusChangedEvent(
        order.id,
        order.orderNumber,
        order.buyerId,
        buyerEmail,
        order.vendorId,
        previousStatus,
        order.status,
        dto.trackingNumber,
      ),
    );

    // Also emit specific cancelled event for full notifications
    if (order.status === 'CANCELLED') {
      const vendor = await this.prisma.vendor.findUnique({
        where: { id: order.vendorId },
        include: { user: { select: { email: true } } },
      });

      this.eventEmitter.emit(
        'order.cancelled',
        new OrderCancelledEvent(
          order.id,
          order.orderNumber,
          order.buyerId,
          buyerEmail,
          order.vendorId,
          vendor?.user?.email || '',
          dto.vendorNotes,
        ),
      );
    }

    this.logger.log(
      `Emitted order.status_changed event for ${order.orderNumber}: ${previousStatus} -> ${order.status}`,
    );
  }
}
