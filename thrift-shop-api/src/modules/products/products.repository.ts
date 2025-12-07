import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { Prisma } from '../../generated/prisma/client';

/**
 * Product include configurations for different use cases
 */
export const PRODUCT_INCLUDES = {
  /** Minimal product data with first image and basic vendor info */
  list: {
    media: {
      orderBy: { sortOrder: 'asc' } as const,
      take: 1,
    },
    vendor: {
      select: {
        id: true,
        name: true,
        displayName: true,
        verified: true,
      },
    },
    category: {
      select: {
        id: true,
        slug: true,
        name: true,
      },
    },
  },
  /** Full product details for product page */
  detail: {
    media: {
      orderBy: { sortOrder: 'asc' } as const,
    },
    vendor: {
      select: {
        id: true,
        name: true,
        displayName: true,
        bio: true,
        logo: true,
        verified: true,
        rating: true,
        reviewCount: true,
      },
    },
    category: {
      select: {
        id: true,
        slug: true,
        name: true,
        parent: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
      },
    },
    reviews: {
      take: 5,
      orderBy: { createdAt: 'desc' } as const,
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
    },
  },
  /** Product with all media and category for editing */
  edit: {
    media: {
      orderBy: { sortOrder: 'asc' } as const,
    },
    vendor: {
      select: { id: true, name: true, displayName: true },
    },
    category: true,
  },
} as const;

/**
 * Repository for Product data access operations
 * Separates data access logic from business logic
 */
@Injectable()
export class ProductsRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Find multiple products with filters
   */
  async findMany(params: {
    where?: Prisma.ProductWhereInput;
    include?: Prisma.ProductInclude;
    orderBy?: Prisma.ProductOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.product.findMany(params);
  }

  /**
   * Find a single product by unique field
   */
  async findUnique(params: {
    where: Prisma.ProductWhereUniqueInput;
    include?: Prisma.ProductInclude;
  }) {
    return this.prisma.product.findUnique(params);
  }

  /**
   * Find a product by ID with edit includes
   */
  async findById(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: PRODUCT_INCLUDES.edit,
    });
  }

  /**
   * Find a product by slug with full detail includes
   */
  async findBySlug(slug: string) {
    return this.prisma.product.findUnique({
      where: { slug },
      include: PRODUCT_INCLUDES.detail,
    });
  }

  /**
   * Count products matching criteria
   */
  async count(where: Prisma.ProductWhereInput) {
    return this.prisma.product.count({ where });
  }

  /**
   * Create a new product
   */
  async create(data: Prisma.ProductCreateInput) {
    return this.prisma.product.create({
      data,
      include: PRODUCT_INCLUDES.edit,
    });
  }

  /**
   * Update an existing product
   */
  async update(id: string, data: Prisma.ProductUpdateInput) {
    return this.prisma.product.update({
      where: { id },
      data,
      include: PRODUCT_INCLUDES.edit,
    });
  }

  /**
   * Delete a product
   */
  async delete(id: string) {
    return this.prisma.product.delete({
      where: { id },
    });
  }

  /**
   * Increment view count for a product
   */
  async incrementViewCount(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  /**
   * Find featured products
   */
  async findFeatured(limit: number) {
    return this.prisma.product.findMany({
      where: {
        isActive: true,
        isFeatured: true,
        quantity: { gt: 0 },
      },
      include: PRODUCT_INCLUDES.list,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Find related products based on category, vendor, or tags
   */
  async findRelated(
    productId: string,
    categoryId: string | null,
    vendorId: string,
    tags: string[],
    limit: number,
  ) {
    const orConditions: Prisma.ProductWhereInput[] = [];

    if (categoryId) {
      orConditions.push({ categoryId });
    }
    orConditions.push({ vendorId });
    if (tags.length > 0) {
      orConditions.push({ tags: { hasSome: tags } });
    }

    return this.prisma.product.findMany({
      where: {
        id: { not: productId },
        isActive: true,
        quantity: { gt: 0 },
        OR: orConditions,
      },
      include: {
        media: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
        vendor: {
          select: { id: true, name: true, displayName: true },
        },
      },
      take: limit,
    });
  }

  /**
   * Find products by vendor with pagination
   */
  async findByVendor(
    vendorId: string,
    options: {
      includeInactive?: boolean;
      skip?: number;
      take?: number;
    },
  ) {
    const where: Prisma.ProductWhereInput = {
      vendorId,
      ...(options.includeInactive ? {} : { isActive: true }),
    };

    return this.prisma.product.findMany({
      where,
      include: {
        media: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
        category: {
          select: { id: true, slug: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: options.skip,
      take: options.take,
    });
  }

  /**
   * Count products by vendor
   */
  async countByVendor(vendorId: string, includeInactive = false) {
    return this.prisma.product.count({
      where: {
        vendorId,
        ...(includeInactive ? {} : { isActive: true }),
      },
    });
  }
}
