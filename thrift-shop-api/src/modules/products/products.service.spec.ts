import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';
import { ViewCountService } from './view-count.service';
import { PrismaService } from '../../prisma';

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
          useValue: { findMany: repoFindMany, count: jest.fn().mockResolvedValue(0) },
        },
        { provide: ViewCountService, useValue: { increment: jest.fn() } },
        { provide: CACHE_MANAGER, useValue: { get: jest.fn(), set: jest.fn() } },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  const whereArg = () => repoFindMany.mock.calls[0][0].where;

  it('expands a parent category to itself + all descendants', async () => {
    // womens-clothing -> [dresses, tops], each leaf childless
    prisma.category.findFirst.mockResolvedValue({ id: 'cat-womens' });
    prisma.category.findMany
      .mockResolvedValueOnce([{ id: 'cat-dresses' }, { id: 'cat-tops' }])
      .mockResolvedValueOnce([]); // no grandchildren

    await service.findAll({ categorySlug: 'womens-clothing' } as never);

    expect(whereArg().categoryId).toEqual({
      in: ['cat-womens', 'cat-dresses', 'cat-tops'],
    });
  });

  it('supports filtering by categoryId as well as slug', async () => {
    prisma.category.findFirst.mockResolvedValue({ id: 'cat-x' });
    prisma.category.findMany.mockResolvedValueOnce([]);

    await service.findAll({ categoryId: 'cat-x' } as never);

    expect(prisma.category.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'cat-x' } }),
    );
    expect(whereArg().categoryId).toEqual({ in: ['cat-x'] });
  });

  it('matches nothing when the category does not exist', async () => {
    prisma.category.findFirst.mockResolvedValue(null);

    await service.findAll({ categorySlug: 'does-not-exist' } as never);

    // A sentinel id that cannot match any product -> empty result, not "all".
    expect(whereArg().categoryId).toBe('__no_such_category__');
  });

  it('does not add a category filter when none is requested', async () => {
    await service.findAll({} as never);
    expect(prisma.category.findFirst).not.toHaveBeenCalled();
    expect(whereArg().categoryId).toBeUndefined();
  });
});
