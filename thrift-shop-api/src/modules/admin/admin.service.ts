import { Injectable, NotFoundException } from '@nestjs/common';
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
    });

    if (!user) {
      throw new NotFoundException('User not found');
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
}
