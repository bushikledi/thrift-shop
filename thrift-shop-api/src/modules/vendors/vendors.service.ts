import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { UpdateVendorDto, VendorPayoutDetails, VendorQueryDto } from './dto';
import { OrderStatus, Prisma } from '../../generated/prisma/client';
import { PAGINATION } from '../../common/constants';
import { EncryptionService } from '../../common/utils';

@Injectable()
export class VendorsService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
  ) {}

  /**
   * Public seller directory.
   *
   * Search and sort are applied here because the Sellers page offers both
   * controls; before this they were decoration — the search box filtered
   * nothing and the sort select was never read at all.
   */
  async findAll(query: VendorQueryDto = {}) {
    const {
      page = 1,
      limit = 20,
      verified,
      search,
      sortBy = 'rating',
      sortOrder = 'desc',
    } = query;
    const safeLimit = Math.min(limit, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * safeLimit;
    const where: Prisma.VendorWhereInput = {};

    if (verified !== undefined) {
      where.verified = verified;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.VendorOrderByWithRelationInput =
      sortBy === 'products'
        ? { products: { _count: sortOrder } }
        : { [sortBy]: sortOrder };

    const [vendors, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        select: {
          id: true,
          name: true,
          displayName: true,
          bio: true,
          logo: true,
          verified: true,
          rating: true,
          reviewCount: true,
          createdAt: true,
          _count: {
            select: { products: true },
          },
        },
        orderBy,
        skip,
        take: safeLimit,
      }),
      this.prisma.vendor.count({ where }),
    ]);

    return {
      data: vendors,
      meta: {
        total,
        page,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async findByName(name: string) {
    // This endpoint is public: select storefront fields explicitly so private
    // columns (payoutDetails, address, settings) are never exposed.
    const vendor = await this.prisma.vendor.findUnique({
      where: { name },
      select: {
        id: true,
        name: true,
        displayName: true,
        bio: true,
        logo: true,
        banner: true,
        verified: true,
        rating: true,
        reviewCount: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            createdAt: true,
          },
        },
        _count: {
          select: { products: true, orders: true },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }

  async findById(id: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Only reached by the owning vendor (me/profile), so the decrypted payout
    // details are returned rather than the stored ciphertext.
    return {
      ...vendor,
      payoutDetails: this.encryption.decryptJson<VendorPayoutDetails>(
        vendor.payoutDetails,
      ),
    };
  }

  async update(id: string, userId: string, dto: UpdateVendorDto) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    if (vendor.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const updated = await this.prisma.vendor.update({
      where: { id },
      data: {
        ...dto,
        // Payout details contain bank/PayPal identifiers: encrypt at rest.
        payoutDetails: dto.payoutDetails
          ? this.encryption.encryptJson(dto.payoutDetails)
          : undefined,
      },
    });

    // Return the readable form to the owner rather than the ciphertext.
    return {
      ...updated,
      payoutDetails: this.encryption.decryptJson<VendorPayoutDetails>(
        updated.payoutDetails,
      ),
    };
  }

  async getProducts(
    vendorId: string,
    page = 1,
    limit = 20,
    includeInactive = false,
    search?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.ProductWhereInput = {
      vendorId,
      ...(includeInactive ? {} : { isActive: true }),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { brand: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          media: {
            take: 1,
            orderBy: { sortOrder: 'asc' },
          },
          category: {
            select: { id: true, slug: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrders(
    vendorId: string,
    page = 1,
    limit = 20,
    status?: OrderStatus,
  ) {
    const safeLimit = Math.min(limit, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * safeLimit;
    const where: Prisma.OrderWhereInput = { vendorId };

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          buyer: {
            select: { id: true, name: true, email: true },
          },
          items: {
            include: {
              product: {
                include: {
                  media: { take: 1, orderBy: { sortOrder: 'asc' } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async getOrderById(vendorId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        items: {
          include: {
            product: {
              include: {
                media: { take: 1, orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.vendorId !== vendorId) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  async getStats(vendorId: string) {
    const [totalProducts, activeProducts, totalOrders, pendingOrders, revenue] =
      await Promise.all([
        this.prisma.product.count({ where: { vendorId } }),
        // Reported separately because the dashboard labels this figure
        // "Active products" — the total includes archived listings.
        this.prisma.product.count({ where: { vendorId, isActive: true } }),
        this.prisma.order.count({ where: { vendorId } }),
        this.prisma.order.count({
          where: {
            vendorId,
            status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING'] },
          },
        }),
        this.prisma.order.aggregate({
          where: { vendorId, status: 'DELIVERED' },
          _sum: { total: true },
        }),
      ]);

    return {
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      totalRevenue: revenue._sum.total || 0,
    };
  }

  async getReviews(vendorId: string, page = 1, limit = 10) {
    const safeLimit = Math.min(limit, PAGINATION.MAX_LIMIT_STRICT);
    const skip = (page - 1) * safeLimit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { vendorId },
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.review.count({ where: { vendorId } }),
    ]);

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  /**
   * Store analytics for the last `days` days, scoped to one vendor.
   *
   * Mirrors the admin report: revenue counts DELIVERED orders, the order count
   * covers everything placed, and quiet days are returned as zeroes so the
   * series is continuous.
   */
  async getAnalytics(vendorId: string, days = 30) {
    // Clamp: `days` drives a per-day loop below, so an unbounded value from
    // the query string would build an arbitrarily large response.
    const windowDays = Math.min(Math.max(Math.trunc(days) || 30, 1), 365);

    const since = new Date();
    since.setUTCDate(since.getUTCDate() - (windowDays - 1));
    since.setUTCHours(0, 0, 0, 0);

    // The equal-length window immediately before this one, so the dashboard
    // can show a real period-over-period change instead of a placeholder.
    const previousSince = new Date(since);
    previousSince.setUTCDate(since.getUTCDate() - windowDays);

    const [rows, topProducts, previous] = await Promise.all([
      this.prisma.$queryRaw<
        Array<{ day: Date; revenue: number | null; orders: bigint }>
      >`
        SELECT date_trunc('day', created_at) AS day,
               SUM(CASE WHEN status = 'DELIVERED' THEN total ELSE 0 END) AS revenue,
               COUNT(*) AS orders
        FROM orders
        WHERE vendor_id = ${vendorId} AND created_at >= ${since}
        GROUP BY day
        ORDER BY day ASC
      `,
      this.prisma.$queryRaw<
        Array<{ name: string; revenue: number | null; orders: bigint }>
      >`
        SELECT oi.title AS name,
               SUM(oi.price * oi.quantity) AS revenue,
               COUNT(DISTINCT o.id) AS orders
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.vendor_id = ${vendorId} AND o.created_at >= ${since}
        GROUP BY oi.title
        ORDER BY revenue DESC NULLS LAST
        LIMIT 8
      `,
      this.prisma.$queryRaw<Array<{ revenue: number | null; orders: bigint }>>`
        SELECT SUM(CASE WHEN status = 'DELIVERED' THEN total ELSE 0 END) AS revenue,
               COUNT(*) AS orders
        FROM orders
        WHERE vendor_id = ${vendorId}
          AND created_at >= ${previousSince}
          AND created_at < ${since}
      `,
    ]);

    const byDay = new Map<string, { revenue: number; orders: number }>();
    for (const row of rows) {
      byDay.set(row.day.toISOString().slice(0, 10), {
        revenue: Number(row.revenue ?? 0),
        orders: Number(row.orders),
      });
    }

    const series: Array<{ date: string; revenue: number; orders: number }> = [];
    for (let offset = 0; offset < windowDays; offset++) {
      const date = new Date(since);
      date.setUTCDate(since.getUTCDate() + offset);
      const key = date.toISOString().slice(0, 10);
      const entry = byDay.get(key);
      series.push({
        date: key,
        revenue: entry?.revenue ?? 0,
        orders: entry?.orders ?? 0,
      });
    }

    const totals = series.reduce(
      (acc, day) => ({
        revenue: acc.revenue + day.revenue,
        orders: acc.orders + day.orders,
      }),
      { revenue: 0, orders: 0 },
    );

    return {
      days: windowDays,
      series,
      totals,
      previous: {
        revenue: Number(previous[0]?.revenue ?? 0),
        orders: Number(previous[0]?.orders ?? 0),
      },
      topProducts: topProducts.map((row) => ({
        name: row.name,
        revenue: Number(row.revenue ?? 0),
        orders: Number(row.orders),
      })),
    };
  }
}
