import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { invalidateCachePattern } from '../../common/utils';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Drop the cached category responses.
   *
   * GET /categories and GET /categories/:slug are cached for five minutes by
   * CacheInterceptor. Without this, a create/update/delete returned 200 while
   * the admin list kept serving the old tree — the change looked like it had
   * silently done nothing.
   *
   * CacheInterceptor keys entries by request URL, so the list variants are
   * deleted by name. Slug entries are handled by the caller passing the slugs
   * it touched; the pattern sweep only helps when a Redis store is configured,
   * so it cannot be relied on alone.
   */
  private async invalidateCategoryCache(slugs: string[] = []): Promise<void> {
    const prefix = '/api/v1/categories';
    const keys = [
      prefix,
      `${prefix}?includeInactive=true`,
      `${prefix}?includeInactive=false`,
      ...slugs.map((slug) => `${prefix}/${slug}`),
    ];

    await Promise.all(keys.map((key) => this.cacheManager.del(key)));
    await invalidateCachePattern(this.cacheManager, `${prefix}*`);
  }

  async findAll(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };

    const categories = await this.prisma.category.findMany({
      where,
      include: {
        children: {
          where,
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Build tree structure (only root categories with nested children)
    return categories.filter((c) => !c.parentId);
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async create(dto: CreateCategoryDto) {
    // Check if slug is unique
    const existing = await this.prisma.category.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('Category slug already exists');
    }

    // Validate parent if provided
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
      });

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
    }

    const created = await this.prisma.category.create({
      data: dto,
      include: {
        parent: true,
      },
    });

    await this.invalidateCategoryCache([created.slug]);
    return created;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check slug uniqueness if changing
    if (dto.slug && dto.slug !== category.slug) {
      const existing = await this.prisma.category.findUnique({
        where: { slug: dto.slug },
      });

      if (existing) {
        throw new ConflictException('Category slug already exists');
      }
    }

    // Validate parent if changing
    if (dto.parentId && dto.parentId !== category.parentId) {
      if (dto.parentId === id) {
        throw new ConflictException('Category cannot be its own parent');
      }

      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
      });

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: dto,
      include: {
        parent: true,
        children: true,
      },
    });

    // Both slugs: the old entry must go even when the slug changed.
    await this.invalidateCategoryCache([category.slug, updated.slug]);
    return updated;
  }

  async delete(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Collect the category and every descendant, grouped by depth, so we can
    // delete leaves first and never violate the parent/child foreign key.
    const levels: string[][] = [[id]];
    const slugs: string[] = [category.slug];
    let frontier = [id];
    while (frontier.length > 0) {
      const children = await this.prisma.category.findMany({
        where: { parentId: { in: frontier } },
        select: { id: true, slug: true },
      });
      const ids = children.map((c) => c.id);
      if (ids.length === 0) break;
      slugs.push(...children.map((c) => c.slug));
      levels.push(ids);
      frontier = ids;
    }

    const allIds = levels.flat();
    // Products keep existing but become uncategorized (categoryId is nullable),
    // so deleting a category never orphans or blocks on its listings.
    await this.prisma.$transaction(async (tx) => {
      await tx.product.updateMany({
        where: { categoryId: { in: allIds } },
        data: { categoryId: null },
      });
      // Deepest level first.
      for (let i = levels.length - 1; i >= 0; i--) {
        await tx.category.deleteMany({ where: { id: { in: levels[i] } } });
      }
    });

    await this.invalidateCategoryCache(slugs);

    const subCount = allIds.length - 1;
    return {
      message:
        subCount > 0
          ? `Category and ${subCount} subcategory(ies) deleted; affected products are now uncategorized.`
          : 'Category deleted.',
    };
  }
}
