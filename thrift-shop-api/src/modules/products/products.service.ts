import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  Logger,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '../../generated/prisma/client';
import {
  CACHE_KEYS,
  CACHE_TTL,
  SLUG_UUID_LENGTH,
  MAX_SLUG_GENERATION_ATTEMPTS,
} from '../../common/constants';
import { invalidateFeaturedProductsCache } from '../../common/utils';
import { ProductsRepository, PRODUCT_INCLUDES } from './products.repository';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private prisma: PrismaService,
    private productsRepository: ProductsRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findAll(query: ProductQueryDto) {
    const {
      search,
      categoryId,
      categorySlug,
      vendorId,
      condition,
      brand,
      color,
      size,
      gender,
      minPrice,
      maxPrice,
      tags,
      sort = 'newest',
      page = 1,
      limit = 20,
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      quantity: { gt: 0 },
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    } else if (categorySlug) {
      where.category = { slug: categorySlug };
    }
    if (vendorId) where.vendorId = vendorId;
    if (condition) where.condition = condition;
    if (brand) where.brand = { contains: brand, mode: 'insensitive' };
    if (color) where.color = { contains: color, mode: 'insensitive' };
    if (size) where.size = { contains: size, mode: 'insensitive' };
    if (gender) where.gender = gender;

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    // Build orderBy
    let orderBy: Prisma.ProductOrderByWithRelationInput;
    switch (sort) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'popular':
        orderBy = { viewCount: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [products, total] = await Promise.all([
      this.productsRepository.findMany({
        where,
        include: PRODUCT_INCLUDES.list,
        orderBy,
        skip,
        take: limit,
      }),
      this.productsRepository.count(where),
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

  async findBySlug(slug: string) {
    // Check cache first
    const cacheKey = `${CACHE_KEYS.PRODUCT_BY_SLUG}${slug}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for product slug: ${slug}`);
      // Still increment view count for cached responses
      this.incrementViewCount(cached as { id: string });
      return cached;
    }

    const product = await this.productsRepository.findBySlug(slug);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Cache the product
    await this.cacheManager.set(cacheKey, product, CACHE_TTL.PRODUCT_DETAIL);
    this.logger.debug(`Cached product slug: ${slug}`);

    // Increment view count (fire and forget)
    this.incrementViewCount(product);

    return product;
  }

  /**
   * Increment view count asynchronously (fire and forget)
   */
  private incrementViewCount(product: { id: string }): void {
    this.productsRepository
      .incrementViewCount(product.id)
      .catch((error: unknown) => {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(
          `Failed to increment view count for ${product.id}: ${errorMessage}`,
        );
      });
  }

  async findById(id: string) {
    // Check cache first
    const cacheKey = `${CACHE_KEYS.PRODUCT_BY_ID}${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const product = await this.productsRepository.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Cache the product
    await this.cacheManager.set(cacheKey, product, CACHE_TTL.PRODUCT_DETAIL);

    return product;
  }

  async create(vendorId: string, dto: CreateProductDto) {
    const slug = await this.generateSlug(dto.title);

    // Extract fields that need special handling
    const { metadata, measurements, categoryId, ...restDto } = dto;

    const product = await this.productsRepository.create({
      ...restDto,
      slug,
      vendor: { connect: { id: vendorId } },
      ...(categoryId && { category: { connect: { id: categoryId } } }),
      price: dto.price,
      comparePrice: dto.comparePrice,
      // Cast to Prisma's InputJsonValue for JSON fields
      ...(metadata && { metadata: metadata as object }),
      ...(measurements && { measurements: measurements as object }),
    });

    // Invalidate featured products cache as new product might be featured
    await this.invalidateFeaturedCache();

    return product;
  }

  async update(id: string, vendorId: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.vendorId !== vendorId) {
      throw new ForbiddenException('You can only update your own products');
    }

    // Generate new slug if title changed
    const slug = dto.title ? await this.generateSlug(dto.title) : undefined;

    // Extract fields that need special handling
    const { metadata, measurements, categoryId, ...restDto } = dto;

    const updatedProduct = await this.productsRepository.update(id, {
      ...restDto,
      ...(slug && { slug }),
      ...(categoryId && { category: { connect: { id: categoryId } } }),
      // Cast to Prisma's InputJsonValue for JSON fields
      ...(metadata && { metadata: metadata as object }),
      ...(measurements && { measurements: measurements as object }),
    });

    // Invalidate caches for this product
    await this.invalidateProductCache(id, product.slug);
    if (slug && slug !== product.slug) {
      await this.invalidateProductCache(id, slug);
    }

    return updatedProduct;
  }

  async delete(id: string, vendorId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.vendorId !== vendorId) {
      throw new ForbiddenException('You can only delete your own products');
    }

    await this.productsRepository.delete(id);

    // Invalidate caches
    await this.invalidateProductCache(id, product.slug);
    await this.invalidateFeaturedCache();

    return { message: 'Product deleted successfully' };
  }

  async getVendorProducts(
    vendorId: string,
    page = 1,
    limit = 20,
    includeInactive = false,
  ) {
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.productsRepository.findByVendor(vendorId, {
        includeInactive,
        skip,
        take: limit,
      }),
      this.productsRepository.countByVendor(vendorId, includeInactive),
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

  async getFeatured(limit = 8) {
    // Check cache first
    const cacheKey = `${CACHE_KEYS.FEATURED_PRODUCTS}:${limit}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      this.logger.debug('Cache hit for featured products');
      return cached;
    }

    const products = await this.productsRepository.findFeatured(limit);

    // Cache featured products
    await this.cacheManager.set(cacheKey, products, CACHE_TTL.FEATURED);
    return products;
  }

  async getRelated(productId: string, limit = 4) {
    // Check cache first
    const cacheKey = `${CACHE_KEYS.RELATED_PRODUCTS}${productId}:${limit}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { categoryId: true, vendorId: true, tags: true },
    });

    if (!product) return [];

    const related = await this.productsRepository.findRelated(
      productId,
      product.categoryId,
      product.vendorId,
      product.tags,
      limit,
    );

    // Cache related products
    await this.cacheManager.set(cacheKey, related, CACHE_TTL.RELATED);
    return related;
  }

  /**
   * Invalidate cache for a specific product
   */
  private async invalidateProductCache(
    id: string,
    slug: string,
  ): Promise<void> {
    await Promise.all([
      this.cacheManager.del(`${CACHE_KEYS.PRODUCT_BY_ID}${id}`),
      this.cacheManager.del(`${CACHE_KEYS.PRODUCT_BY_SLUG}${slug}`),
    ]);
    this.logger.debug(`Invalidated cache for product ${id}`);
  }

  /**
   * Invalidate featured products cache
   */
  private async invalidateFeaturedCache(): Promise<void> {
    await invalidateFeaturedProductsCache(this.cacheManager);
    this.logger.debug('Invalidated featured products cache');
  }

  private async generateSlug(title: string): Promise<string> {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Try to generate unique slug with collision detection
    for (let attempt = 0; attempt < MAX_SLUG_GENERATION_ATTEMPTS; attempt++) {
      const slug =
        attempt === 0
          ? `${baseSlug}-${uuidv4().slice(0, SLUG_UUID_LENGTH)}`
          : `${baseSlug}-${uuidv4().slice(0, SLUG_UUID_LENGTH)}-${attempt}`;

      const existing = await this.productsRepository.findUnique({
        where: { slug },
      });

      if (!existing) {
        return slug;
      }
    }

    // Fallback: use timestamp if all attempts fail (extremely unlikely)
    return `${baseSlug}-${uuidv4().slice(0, SLUG_UUID_LENGTH)}-${Date.now()}`;
  }
}
