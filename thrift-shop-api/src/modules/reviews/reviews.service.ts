import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateReviewDto, UpdateReviewDto, ReviewQueryDto } from './dto';
import { Prisma } from '../../generated/prisma/client';
import { PAGINATION } from '../../common/constants';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(query: ReviewQueryDto) {
    const {
      vendorId,
      productId,
      userId,
      minRating,
      page = 1,
      limit = 10,
    } = query;
    const safeLimit = Math.min(limit, PAGINATION.MAX_LIMIT_STRICT);
    const skip = (page - 1) * safeLimit;

    const where: Prisma.ReviewWhereInput = {};

    if (vendorId) where.vendorId = vendorId;
    if (productId) where.productId = productId;
    if (userId) where.userId = userId;
    if (minRating) where.rating = { gte: minRating };

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
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
      this.prisma.review.count({ where }),
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

  async findById(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
        vendor: {
          select: { id: true, name: true, displayName: true },
        },
        product: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async create(userId: string, dto: CreateReviewDto) {
    // Must review either a vendor or a product, not both or neither
    if (!dto.vendorId && !dto.productId) {
      throw new BadRequestException(
        'Must specify either vendorId or productId',
      );
    }

    if (dto.vendorId && dto.productId) {
      throw new BadRequestException(
        'Cannot review both vendor and product in one review',
      );
    }

    // Check if user already reviewed this vendor/product
    const existingReview = await this.prisma.review.findFirst({
      where: {
        userId,
        ...(dto.vendorId ? { vendorId: dto.vendorId } : {}),
        ...(dto.productId ? { productId: dto.productId } : {}),
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this item');
    }

    // Validate vendor/product exists
    if (dto.vendorId) {
      const vendor = await this.prisma.vendor.findUnique({
        where: { id: dto.vendorId },
      });
      if (!vendor) {
        throw new NotFoundException('Vendor not found');
      }
    }

    if (dto.productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: dto.productId },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }
    }

    // Check if user has purchased from this vendor/product (for verified reviews)
    let isVerified = false;
    if (dto.vendorId) {
      const purchase = await this.prisma.order.findFirst({
        where: {
          buyerId: userId,
          vendorId: dto.vendorId,
          status: 'DELIVERED',
        },
      });
      isVerified = !!purchase;
    }

    if (dto.productId) {
      const purchase = await this.prisma.orderItem.findFirst({
        where: {
          productId: dto.productId,
          order: {
            buyerId: userId,
            status: 'DELIVERED',
          },
        },
      });
      isVerified = !!purchase;
    }

    const review = await this.prisma.review.create({
      data: {
        userId,
        vendorId: dto.vendorId,
        productId: dto.productId,
        rating: dto.rating,
        title: dto.title,
        comment: dto.comment,
        isVerified,
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Update vendor/product rating
    if (dto.vendorId) {
      this.updateVendorRating(dto.vendorId);
    }

    return review;
  }

  async update(id: string, userId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only edit your own reviews');
    }

    const updated = await this.prisma.review.update({
      where: { id },
      data: dto,
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Update vendor rating if applicable
    if (review.vendorId && dto.rating) {
      this.updateVendorRating(review.vendorId);
    }

    return updated;
  }

  async delete(id: string, userId: string, isAdmin = false) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.prisma.review.delete({
      where: { id },
    });

    // Update vendor rating if applicable
    if (review.vendorId) {
      this.updateVendorRating(review.vendorId);
    }

    return { message: 'Review deleted successfully' };
  }

  async getProductReviews(productId: string, page = 1, limit = 10) {
    const safeLimit = Math.min(limit, PAGINATION.MAX_LIMIT_STRICT);
    const skip = (page - 1) * safeLimit;

    const [reviews, total, stats] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId },
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.review.count({ where: { productId } }),
      this.prisma.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    // Get rating distribution
    const distribution = await this.prisma.review.groupBy({
      by: ['rating'],
      where: { productId },
      _count: true,
    });

    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    distribution.forEach((d) => {
      ratingDistribution[d.rating as keyof typeof ratingDistribution] =
        d._count;
    });

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
        averageRating: stats._avg.rating || 0,
        ratingDistribution,
      },
    };
  }

  async getVendorReviews(vendorId: string, page = 1, limit = 10) {
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

  async getUserReviews(userId: string, page = 1, limit = 10) {
    const safeLimit = Math.min(limit, PAGINATION.MAX_LIMIT_STRICT);
    const skip = (page - 1) * safeLimit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { userId },
        include: {
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
      this.prisma.review.count({ where: { userId } }),
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

  private updateVendorRating(vendorId: string): void {
    // Make this async/non-blocking to avoid slowing down review operations
    this.prisma.review
      .aggregate({
        where: { vendorId },
        _avg: { rating: true },
        _count: true,
      })
      .then((stats) =>
        this.prisma.vendor.update({
          where: { id: vendorId },
          data: {
            rating: stats._avg.rating || 0,
            reviewCount: stats._count,
          },
        }),
      )
      .catch((error: unknown) => {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        // Log error but don't fail the review operation
        this.logger.error(
          `Failed to update vendor rating for ${vendorId}: ${errorMessage}`,
        );
      });
  }
}
