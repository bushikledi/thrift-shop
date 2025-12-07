import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { SearchQueryDto } from './dto';
import { sanitizeSearchQuery } from '../../common/utils';
import { Prisma } from '../../generated/prisma/client';

type ProductSearchResult = Prisma.ProductGetPayload<{
  include: {
    media: true;
    vendor: {
      select: {
        id: true;
        name: true;
        displayName: true;
        verified: true;
      };
    };
    category: {
      select: { id: true; slug: true; name: true };
    };
  };
}> & { type: 'product' };

type VendorSearchResult = Prisma.VendorGetPayload<{
  select: {
    id: true;
    name: true;
    displayName: true;
    bio: true;
    logo: true;
    verified: true;
    rating: true;
    reviewCount: true;
    _count: { select: { products: true } };
  };
}> & { type: 'vendor' };

type CategorySearchResult = Prisma.CategoryGetPayload<{
  include: {
    _count: { select: { products: true } };
  };
}> & { type: 'category' };

export interface SearchResult {
  products: {
    data: ProductSearchResult[];
    total: number;
  };
  vendors: {
    data: VendorSearchResult[];
    total: number;
  };
  categories: {
    data: CategorySearchResult[];
    total: number;
  };
}

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(query: SearchQueryDto): Promise<SearchResult> {
    const { types, page = 1, limit = 10 } = query;

    // Sanitize the search query to prevent injection attacks
    const q = sanitizeSearchQuery(query.q);

    if (!q) {
      return {
        products: { data: [], total: 0 },
        vendors: { data: [], total: 0 },
        categories: { data: [], total: 0 },
      };
    }

    const skip = (page - 1) * limit;

    // Determine which types to search
    const searchTypes = types
      ? types.split(',').map((t) => t.trim().toLowerCase())
      : ['products', 'vendors', 'categories'];

    const result: SearchResult = {
      products: { data: [], total: 0 },
      vendors: { data: [], total: 0 },
      categories: { data: [], total: 0 },
    };

    // Search products
    if (searchTypes.includes('products')) {
      const productWhere = {
        isActive: true,
        quantity: { gt: 0 },
        OR: [
          { title: { contains: q, mode: 'insensitive' as const } },
          { description: { contains: q, mode: 'insensitive' as const } },
          { brand: { contains: q, mode: 'insensitive' as const } },
          { tags: { has: q.toLowerCase() } },
        ],
      };

      const [products, productCount] = await Promise.all([
        this.prisma.product.findMany({
          where: productWhere,
          include: {
            media: {
              take: 1,
              orderBy: { sortOrder: 'asc' },
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
              select: { id: true, slug: true, name: true },
            },
          },
          orderBy: { viewCount: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.product.count({ where: productWhere }),
      ]);

      result.products = {
        data: products.map((p) => ({ ...p, type: 'product' })),
        total: productCount,
      };
    }

    // Search vendors
    if (searchTypes.includes('vendors')) {
      const vendorWhere = {
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { displayName: { contains: q, mode: 'insensitive' as const } },
          { bio: { contains: q, mode: 'insensitive' as const } },
        ],
      };

      const [vendors, vendorCount] = await Promise.all([
        this.prisma.vendor.findMany({
          where: vendorWhere,
          select: {
            id: true,
            name: true,
            displayName: true,
            bio: true,
            logo: true,
            verified: true,
            rating: true,
            reviewCount: true,
            _count: {
              select: { products: true },
            },
          },
          orderBy: { rating: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.vendor.count({ where: vendorWhere }),
      ]);

      result.vendors = {
        data: vendors.map((v) => ({ ...v, type: 'vendor' })),
        total: vendorCount,
      };
    }

    // Search categories
    if (searchTypes.includes('categories')) {
      const categoryWhere = {
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { description: { contains: q, mode: 'insensitive' as const } },
          { slug: { contains: q, mode: 'insensitive' as const } },
        ],
      };

      const [categories, categoryCount] = await Promise.all([
        this.prisma.category.findMany({
          where: categoryWhere,
          include: {
            _count: {
              select: { products: true },
            },
          },
          orderBy: { sortOrder: 'asc' },
          skip,
          take: limit,
        }),
        this.prisma.category.count({ where: categoryWhere }),
      ]);

      result.categories = {
        data: categories.map((c) => ({ ...c, type: 'category' })),
        total: categoryCount,
      };
    }

    return result;
  }

  async suggestions(rawQuery: string, limit = 5) {
    // Sanitize the query input
    const q = sanitizeSearchQuery(rawQuery, { maxLength: 100 });

    if (!q || q.length < 2) {
      return { suggestions: [] };
    }

    // Enforce reasonable limit
    const safeLimit = Math.min(Math.max(1, limit), 10);

    const [products, vendors, categories] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          isActive: true,
          title: { contains: q, mode: 'insensitive' },
        },
        select: { title: true },
        take: safeLimit,
      }),
      this.prisma.vendor.findMany({
        where: {
          displayName: { contains: q, mode: 'insensitive' },
        },
        select: { displayName: true },
        take: safeLimit,
      }),
      this.prisma.category.findMany({
        where: {
          isActive: true,
          name: { contains: q, mode: 'insensitive' },
        },
        select: { name: true },
        take: safeLimit,
      }),
    ]);

    // Combine and deduplicate suggestions
    const suggestions = [
      ...products.map((p) => ({ text: p.title, type: 'product' })),
      ...vendors.map((v) => ({ text: v.displayName, type: 'vendor' })),
      ...categories.map((c) => ({ text: c.name, type: 'category' })),
    ]
      .filter(
        (item, index, self) =>
          index ===
          self.findIndex(
            (t) => t.text.toLowerCase() === item.text.toLowerCase(),
          ),
      )
      .slice(0, safeLimit);

    return { suggestions };
  }

  async trending(limit = 10) {
    // Get trending products based on view count
    const trendingProducts = await this.prisma.product.findMany({
      where: {
        isActive: true,
        quantity: { gt: 0 },
      },
      include: {
        media: {
          take: 1,
          orderBy: { sortOrder: 'asc' },
        },
        vendor: {
          select: { id: true, name: true, displayName: true },
        },
      },
      orderBy: { viewCount: 'desc' },
      take: limit,
    });

    // Get popular categories
    const popularCategories = await this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        products: {
          _count: 'desc',
        },
      },
      take: 6,
    });

    // Get popular search terms (could be stored in a separate table for analytics)
    const popularSearches = [
      'vintage',
      'denim',
      'jacket',
      'dress',
      'sneakers',
      'retro',
    ];

    return {
      products: trendingProducts,
      categories: popularCategories,
      searches: popularSearches,
    };
  }
}
