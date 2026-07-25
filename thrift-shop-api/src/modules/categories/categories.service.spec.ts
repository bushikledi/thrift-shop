import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../../prisma';

/**
 * GET /categories is cached for five minutes by CacheInterceptor. Writes must
 * drop those entries, otherwise create/update/delete returned 200 while the
 * admin list kept serving the stale tree — the change looked like a no-op.
 */
describe('CategoriesService cache invalidation', () => {
  let service: CategoriesService;
  let del: jest.Mock;

  const prisma = {
    category: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    product: { updateMany: jest.fn() },
    $transaction: jest.fn(),
  };

  const deletedKeys = () => del.mock.calls.map(([key]: [string]) => key);

  beforeEach(async () => {
    jest.clearAllMocks();
    del = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: CACHE_MANAGER,
          useValue: { del, get: jest.fn(), set: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(CategoriesService);
  });

  it('drops the cached list when a category is created', async () => {
    prisma.category.findUnique.mockResolvedValue(null);
    prisma.category.create.mockResolvedValue({ id: 'c1', slug: 'jackets' });

    await service.create({ name: 'Jackets', slug: 'jackets' });

    expect(deletedKeys()).toContain('/api/v1/categories');
    expect(deletedKeys()).toContain('/api/v1/categories?includeInactive=true');
    expect(deletedKeys()).toContain('/api/v1/categories/jackets');
  });

  it('drops both the old and the new slug when a slug changes', async () => {
    prisma.category.findUnique
      .mockResolvedValueOnce({ id: 'c1', slug: 'old-slug' }) // lookup
      .mockResolvedValueOnce(null); // slug uniqueness check
    prisma.category.update.mockResolvedValue({ id: 'c1', slug: 'new-slug' });

    await service.update('c1', { slug: 'new-slug' });

    expect(deletedKeys()).toContain('/api/v1/categories/old-slug');
    expect(deletedKeys()).toContain('/api/v1/categories/new-slug');
  });

  it('drops the cache for a deleted category and its descendants', async () => {
    prisma.category.findUnique.mockResolvedValue({ id: 'c1', slug: 'parent' });
    prisma.category.findMany
      .mockResolvedValueOnce([{ id: 'c2', slug: 'child' }])
      .mockResolvedValueOnce([]);
    prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      Promise.resolve(
        fn({
          product: { updateMany: jest.fn() },
          category: { deleteMany: jest.fn() },
        }),
      ),
    );

    await service.delete('c1');

    expect(deletedKeys()).toContain('/api/v1/categories');
    expect(deletedKeys()).toContain('/api/v1/categories/parent');
    expect(deletedKeys()).toContain('/api/v1/categories/child');
  });
});
