import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import {
  AdminUserQueryDto,
  AdminUpdateUserDto,
  AdminVendorQueryDto,
  AdminUpdateVendorDto,
  AdminOrderQueryDto,
} from './dto';
import { OrderStatus, Prisma } from '../../generated/prisma/client';
import { PAGINATION } from '../../common/constants';
import { UpdatePlatformSettingsDto } from './dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // Dashboard stats
  async getStats() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalVendors,
      totalProducts,
      totalOrders,
      revenue,
      newUsersThisMonth,
      newOrdersThisMonth,
      pendingVendorVerifications,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.vendor.count(),
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.DELIVERED },
        _sum: { total: true },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: firstDayOfMonth } },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: firstDayOfMonth } },
      }),
      this.prisma.vendor.count({
        where: { verified: false },
      }),
    ]);

    return {
      totalUsers,
      totalVendors,
      totalProducts,
      totalOrders,
      totalRevenue: revenue._sum.total || 0,
      newUsersThisMonth,
      newOrdersThisMonth,
      pendingVendorVerifications,
    };
  }

  // User management
  async getUsers(query: AdminUserQueryDto) {
    const {
      search,
      role,
      isActive,
      emailVerified,
      page = 1,
      limit = 20,
    } = query;
    const safeLimit = Math.min(limit, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * safeLimit;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;
    if (emailVerified !== undefined) where.emailVerified = emailVerified;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          vendor: {
            select: { id: true, name: true, displayName: true, verified: true },
          },
          _count: {
            select: { orders: true, reviews: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        emailVerified: true,
        address: true,
        createdAt: true,
        updatedAt: true,
        vendor: true,
        orders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(id: string, dto: AdminUpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        emailVerified: true,
        updatedAt: true,
      },
    });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        vendor: { select: { id: true } },
        _count: { select: { orders: true, reviews: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Users that own historical data (a vendor storefront, orders as a buyer,
    // or reviews) cannot be hard-deleted without orphaning records that must be
    // preserved — a raw delete failed with a foreign-key error. Deactivate
    // them instead; only genuinely unreferenced accounts are removed outright.
    const hasReferences =
      Boolean(user.vendor) ||
      user._count.orders > 0 ||
      user._count.reviews > 0;

    if (hasReferences) {
      await this.prisma.user.update({
        where: { id },
        data: { isActive: false },
      });
      return {
        message:
          'User has existing orders, reviews, or a vendor store and was deactivated instead of deleted.',
      };
    }

    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted successfully' };
  }

  // Vendor management
  async getVendors(query: AdminVendorQueryDto) {
    const { search, verified, page = 1, limit = 20 } = query;
    const safeLimit = Math.min(limit, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * safeLimit;

    const where: Prisma.VendorWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (verified !== undefined) where.verified = verified;

    const [vendors, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, name: true, isActive: true },
          },
          _count: {
            select: { products: true, orders: true, reviews: true },
          },
        },
        orderBy: { createdAt: 'desc' },
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

  async getVendorById(id: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            isActive: true,
            emailVerified: true,
          },
        },
        _count: {
          select: { products: true, orders: true, reviews: true },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }

  async updateVendor(id: string, dto: AdminUpdateVendorDto) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return this.prisma.vendor.update({
      where: { id },
      data: dto,
    });
  }

  async verifyVendor(id: string) {
    return this.updateVendor(id, { verified: true });
  }

  // Order management
  async getOrders(query: AdminOrderQueryDto) {
    const { status, vendorId, buyerId, page = 1, limit = 20 } = query;
    const safeLimit = Math.min(limit, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * safeLimit;

    const where: Prisma.OrderWhereInput = {};

    if (status) where.status = status;
    if (vendorId) where.vendorId = vendorId;
    if (buyerId) where.buyerId = buyerId;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          buyer: {
            select: { id: true, email: true, name: true },
          },
          vendor: {
            select: { id: true, name: true, displayName: true },
          },
          items: true,
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

  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        buyer: {
          select: { id: true, email: true, name: true, phone: true },
        },
        vendor: {
          select: { id: true, name: true, displayName: true },
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

    return order;
  }

  // Product management
  async getProducts(page = 1, limit = 20, includeInactive = true) {
    const safeLimit = Math.min(limit, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * safeLimit;
    const where = includeInactive ? {} : { isActive: true };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          vendor: {
            select: { id: true, name: true, displayName: true },
          },
          category: {
            select: { id: true, slug: true, name: true },
          },
          media: {
            take: 1,
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async toggleProductFeatured(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: { id },
      data: { isFeatured: !product.isFeatured },
    });
  }

  async toggleProductActive(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: { id },
      data: { isActive: !product.isActive },
    });
  }

  // Review management
  async getReviews(page = 1, limit = 20) {
    const safeLimit = Math.min(limit, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * safeLimit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          vendor: {
            select: { id: true, name: true, displayName: true },
          },
          product: {
            select: { id: true, title: true, slug: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.review.count(),
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

  async deleteReview(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.prisma.review.delete({ where: { id } });

    // Update vendor rating if applicable
    if (review.vendorId) {
      const stats = await this.prisma.review.aggregate({
        where: { vendorId: review.vendorId },
        _avg: { rating: true },
        _count: true,
      });

      await this.prisma.vendor.update({
        where: { id: review.vendorId },
        data: {
          rating: stats._avg.rating || 0,
          reviewCount: stats._count,
        },
      });
    }

    return { message: 'Review deleted successfully' };
  }

  // Audit logs
  async getAuditLogs(page = 1, limit = 50) {
    const safeLimit = Math.min(limit, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * safeLimit;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.auditLog.count(),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  // Create audit log
  async createAuditLog(data: {
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    oldData?: unknown;
    newData?: unknown;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const { oldData, newData, ...rest } = data;
    return this.prisma.auditLog.create({
      data: {
        ...rest,
        oldData: oldData
          ? (JSON.parse(JSON.stringify(oldData)) as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        newData: newData
          ? (JSON.parse(JSON.stringify(newData)) as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Platform settings
  // ---------------------------------------------------------------------------

  /** The settings row is a singleton; create it with defaults on first read. */
  private static readonly SETTINGS_ID = 'singleton';

  async getPlatformSettings() {
    return this.prisma.platformSettings.upsert({
      where: { id: AdminService.SETTINGS_ID },
      create: { id: AdminService.SETTINGS_ID },
      update: {},
    });
  }

  async updatePlatformSettings(dto: UpdatePlatformSettingsDto) {
    return this.prisma.platformSettings.upsert({
      where: { id: AdminService.SETTINGS_ID },
      create: { id: AdminService.SETTINGS_ID, ...dto },
      update: dto,
    });
  }

  // ---------------------------------------------------------------------------
  // Product moderation
  // ---------------------------------------------------------------------------

  /** Flags a listing for review and takes it out of the storefront. */
  async flagProduct(id: string, reason: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        flaggedAt: new Date(),
        flagReason: reason,
        // A flagged listing should not stay visible while it is reviewed.
        isActive: false,
      },
    });
  }

  /** Clears a flag and restores the listing. */
  async unflagProduct(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: { id },
      data: { flaggedAt: null, flagReason: null, isActive: true },
    });
  }

  /**
   * Permanently removes a listing.
   *
   * Order items reference products to preserve purchase history, so a product
   * that has been ordered cannot be deleted without destroying that history.
   * Those are rejected with a clear message pointing at deactivation instead.
   */
  async deleteProduct(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, _count: { select: { orderItems: true } } },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product._count.orderItems > 0) {
      throw new ConflictException(
        'This product appears in existing orders and cannot be deleted. Deactivate it instead.',
      );
    }

    await this.prisma.product.delete({ where: { id } });

    return { message: 'Product deleted successfully' };
  }

  // ---------------------------------------------------------------------------
  // Analytics
  // ---------------------------------------------------------------------------

  /**
   * Platform analytics for the last `days` days.
   *
   * Revenue counts DELIVERED orders only, matching how totalRevenue is reported
   * elsewhere, while the order count covers every order placed. Days with no
   * activity are filled in with zeroes so the series is continuous and charts
   * do not imply data that is missing.
   */
  async getAnalytics(days = 30) {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - (days - 1));
    since.setUTCHours(0, 0, 0, 0);

    const [rows, topCategories, topVendors] = await Promise.all([
      this.prisma.$queryRaw<
        Array<{ day: Date; revenue: number | null; orders: bigint }>
      >`
        SELECT date_trunc('day', created_at) AS day,
               SUM(CASE WHEN status = 'DELIVERED' THEN total ELSE 0 END) AS revenue,
               COUNT(*) AS orders
        FROM orders
        WHERE created_at >= ${since}
        GROUP BY day
        ORDER BY day ASC
      `,
      this.prisma.$queryRaw<
        Array<{ name: string; revenue: number | null; orders: bigint }>
      >`
        SELECT c.name AS name,
               SUM(oi.price * oi.quantity) AS revenue,
               COUNT(DISTINCT o.id) AS orders
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        JOIN products p ON p.id = oi.product_id
        JOIN categories c ON c.id = p.category_id
        WHERE o.created_at >= ${since}
        GROUP BY c.name
        ORDER BY revenue DESC NULLS LAST
        LIMIT 8
      `,
      this.prisma.$queryRaw<
        Array<{ name: string; revenue: number | null; orders: bigint }>
      >`
        SELECT v.display_name AS name,
               SUM(o.total) AS revenue,
               COUNT(*) AS orders
        FROM orders o
        JOIN vendors v ON v.id = o.vendor_id
        WHERE o.created_at >= ${since}
        GROUP BY v.display_name
        ORDER BY revenue DESC NULLS LAST
        LIMIT 8
      `,
    ]);

    return {
      days,
      series: this.fillDailySeries(rows, since, days),
      topCategories: topCategories.map((row) => ({
        name: row.name,
        revenue: Number(row.revenue ?? 0),
        orders: Number(row.orders),
      })),
      topVendors: topVendors.map((row) => ({
        name: row.name,
        revenue: Number(row.revenue ?? 0),
        orders: Number(row.orders),
      })),
    };
  }

  /** Expands sparse day rows into one entry per day in the window. */
  private fillDailySeries(
    rows: Array<{ day: Date; revenue: number | null; orders: bigint }>,
    since: Date,
    days: number,
  ) {
    const byDay = new Map<string, { revenue: number; orders: number }>();
    for (const row of rows) {
      byDay.set(row.day.toISOString().slice(0, 10), {
        revenue: Number(row.revenue ?? 0),
        orders: Number(row.orders),
      });
    }

    const series: Array<{ date: string; revenue: number; orders: number }> = [];
    for (let offset = 0; offset < days; offset++) {
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

    return series;
  }
}
