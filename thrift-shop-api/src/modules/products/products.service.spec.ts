import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';
import { ViewCountService } from './view-count.service';
import { PrismaService } from '../../prisma';
import type { Prisma } from '../../generated/prisma/client';

/**
 * Focused coverage for the category filter (F3): products live on leaf
 * subcategories, so filtering by a parent category must expand to the whole
 * subtree (categoryId IN [parent, ...descendants]).
 */
describe('ProductsService.findAll category filtering', () => {
  let service: ProductsService;
  let repoFindMany: jest.Mock;

  const prisma = {
    category: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    repoFindMany = jest.fn().mockResolvedValue([]);
    prisma.category.findFirst.mockReset();
    prisma.category.findMany.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ProductsRepository,
          useValue: {
            findMany: repoFindMany,
            count: jest.fn().mockResolvedValue(0),
          },
        },
        { provide: ViewCountService, useValue: { increment: jest.fn() } },
        {
          provide: CACHE_MANAGER,
          useValue: { get: jest.fn(), set: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  /** The `where` clause the service handed to the repository. */
  const whereArg = (): Prisma.ProductWhereInput => {
    const [args] = repoFindMany.mock.calls[0] as [
      { where: Prisma.ProductWhereInput },
    ];
    return args.where;
  };

  it('expands a parent category to itself + all descendants', async () => {
    // womens-clothing -> [dresses, tops], each leaf childless
    prisma.category.findFirst.mockResolvedValue({ id: 'cat-womens' });
    prisma.category.findMany
      .mockResolvedValueOnce([{ id: 'cat-dresses' }, { id: 'cat-tops' }])
      .mockResolvedValueOnce([]); // no grandchildren

    await service.findAll({ categorySlug: 'womens-clothing' });

    expect(whereArg().categoryId).toEqual({
      in: ['cat-womens', 'cat-dresses', 'cat-tops'],
    });
  });

  it('supports filtering by categoryId as well as slug', async () => {
    prisma.category.findFirst.mockResolvedValue({ id: 'cat-x' });
    prisma.category.findMany.mockResolvedValueOnce([]);

    await service.findAll({ categoryId: 'cat-x' });

    expect(prisma.category.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'cat-x' } }),
    );
    expect(whereArg().categoryId).toEqual({ in: ['cat-x'] });
  });

  it('matches nothing when the category does not exist', async () => {
    prisma.category.findFirst.mockResolvedValue(null);

    await service.findAll({ categorySlug: 'does-not-exist' });

    // A sentinel id that cannot match any product -> empty result, not "all".
    expect(whereArg().categoryId).toBe('__no_such_category__');
  });

  it('does not add a category filter when none is requested', async () => {
    await service.findAll({});
    expect(prisma.category.findFirst).not.toHaveBeenCalled();
    expect(whereArg().categoryId).toBeUndefined();
  });
});

/**
 * A product's slug is its public URL. The edit form always submits the title,
 * so keying slug regeneration off "was a title sent?" rebuilt it on every
 * save — silently moving the product to a new URL and 404ing the link the
 * vendor's own product table was still showing.
 */
describe('ProductsService.update slug stability', () => {
  let service: ProductsService;
  let repoUpdate: jest.Mock;

  const existing = {
    id: 'product-1',
    vendorId: 'vendor-1',
    title: 'Vintage Denim Jacket',
    slug: 'vintage-denim-jacket-abc123',
  };

  const prisma = {
    product: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    repoUpdate = jest.fn().mockResolvedValue(existing);
    prisma.product.findUnique.mockReset().mockResolvedValue(existing);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ProductsRepository,
          useValue: {
            update: repoUpdate,
            findUnique: jest.fn().mockResolvedValue(null),
          },
        },
        { provide: ViewCountService, useValue: { increment: jest.fn() } },
        {
          provide: CACHE_MANAGER,
          useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  /** The update payload the service handed to the repository. */
  const updateData = (): Record<string, unknown> => {
    const [, data] = repoUpdate.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    return data;
  };

  it('keeps the slug when the submitted title is unchanged', async () => {
    await service.update('product-1', 'vendor-1', {
      title: existing.title,
      price: 42,
    });

    expect(updateData().slug).toBeUndefined();
  });

  it('keeps the slug when no title is submitted at all', async () => {
    await service.update('product-1', 'vendor-1', { isActive: false });

    expect(updateData().slug).toBeUndefined();
  });

  it('regenerates the slug when the title actually changes', async () => {
    await service.update('product-1', 'vendor-1', {
      title: 'Vintage Denim Jacket (Repaired)',
    });

    expect(updateData().slug).toEqual(
      expect.stringContaining('vintage-denim-jacket-repaired'),
    );
    expect(updateData().slug).not.toBe(existing.slug);
  });
});
