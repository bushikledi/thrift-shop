import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { UpdateVendorDto, VendorPayoutDetails } from './dto';
import { OrderStatus, Prisma } from '../../generated/prisma/client';
import { PAGINATION } from '../../common/constants';
import { EncryptionService } from '../../common/utils';

@Injectable()
export class VendorsService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
  ) {}

  async findAll(page = 1, limit = 20, verified?: boolean) {
    const safeLimit = Math.min(limit, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * safeLimit;
    const where: Prisma.VendorWhereInput = {};

    if (verified !== undefined) {
      where.verified = verified;
    }

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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
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
  ) {
    const skip = (page - 1) * limit;
    const where = includeInactive ? { vendorId } : { vendorId, isActive: true };

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
    const [totalProducts, totalOrders, pendingOrders, revenue] =
      await Promise.all([
        this.prisma.product.count({ where: { vendorId } }),
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
}
