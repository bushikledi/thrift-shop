import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { Prisma, OrderStatus } from '../../generated/prisma/client';

/**
 * Order include configurations for different use cases
 */
export const ORDER_INCLUDES = {
  /** Minimal order data for list views */
  list: {
    items: {
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            media: {
              take: 1,
              orderBy: { sortOrder: 'asc' as const },
            },
          },
        },
      },
    },
    vendor: {
      select: {
        id: true,
        name: true,
        displayName: true,
      },
    },
  },
  /** Full order details */
  detail: {
    items: {
      include: {
        product: {
          include: {
            media: {
              take: 1,
              orderBy: { sortOrder: 'asc' as const },
            },
          },
        },
      },
    },
    vendor: {
      select: {
        id: true,
        name: true,
        displayName: true,
        logo: true,
      },
    },
    buyer: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    },
  },
} as const;

/**
 * Repository for Order data access operations
 * Separates data access logic from business logic
 */
@Injectable()
export class OrdersRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Find multiple orders with filters
   */
  async findMany(params: {
    where?: Prisma.OrderWhereInput;
    include?: Prisma.OrderInclude;
    orderBy?: Prisma.OrderOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.order.findMany(params);
  }

  /**
   * Find a single order by unique field
   */
  async findUnique(params: {
    where: Prisma.OrderWhereUniqueInput;
    include?: Prisma.OrderInclude;
  }) {
    return this.prisma.order.findUnique(params);
  }

  /**
   * Find an order by ID with full detail includes
   */
  async findById(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDES.detail,
    });
  }

  /**
   * Find an order by order number with full detail includes
   */
  async findByOrderNumber(orderNumber: string) {
    return this.prisma.order.findUnique({
      where: { orderNumber },
      include: ORDER_INCLUDES.detail,
    });
  }

  /**
   * Count orders matching criteria
   */
  async count(where: Prisma.OrderWhereInput) {
    return this.prisma.order.count({ where });
  }

  /**
   * Create a new order
   */
  async create(data: Prisma.OrderCreateInput) {
    return this.prisma.order.create({
      data,
      include: ORDER_INCLUDES.detail,
    });
  }

  /**
   * Update an order
   */
  async update(id: string, data: Prisma.OrderUpdateInput) {
    return this.prisma.order.update({
      where: { id },
      data,
      include: ORDER_INCLUDES.detail,
    });
  }

  /**
   * Update order status with timestamp
   */
  async updateStatus(
    id: string,
    status: OrderStatus,
    additionalData?: Partial<{
      trackingNumber: string;
      vendorNotes: string;
    }>,
  ) {
    const timestampField = this.getStatusTimestampField(status);

    return this.prisma.order.update({
      where: { id },
      data: {
        status,
        ...(timestampField ? { [timestampField]: new Date() } : {}),
        ...additionalData,
      },
      include: ORDER_INCLUDES.detail,
    });
  }

  /**
   * Find orders for a buyer with pagination
   */
  async findByBuyer(
    buyerId: string,
    options: {
      status?: OrderStatus;
      skip?: number;
      take?: number;
    } = {},
  ) {
    const where: Prisma.OrderWhereInput = {
      buyerId,
      ...(options.status ? { status: options.status } : {}),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: ORDER_INCLUDES.list,
        orderBy: { createdAt: 'desc' },
        skip: options.skip,
        take: options.take,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, total };
  }

  /**
   * Find orders for a vendor with pagination
   */
  async findByVendor(
    vendorId: string,
    options: {
      status?: OrderStatus;
      skip?: number;
      take?: number;
    } = {},
  ) {
    const where: Prisma.OrderWhereInput = {
      vendorId,
      ...(options.status ? { status: options.status } : {}),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          ...ORDER_INCLUDES.list,
          buyer: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: options.skip,
        take: options.take,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, total };
  }

  /**
   * Get status timestamp field name
   */
  private getStatusTimestampField(status: OrderStatus): string | null {
    const statusTimestamps: Partial<Record<OrderStatus, string>> = {
      [OrderStatus.CONFIRMED]: 'confirmedAt',
      [OrderStatus.SHIPPED]: 'shippedAt',
      [OrderStatus.DELIVERED]: 'deliveredAt',
      [OrderStatus.CANCELLED]: 'cancelledAt',
    };
    return statusTimestamps[status] || null;
  }
}
