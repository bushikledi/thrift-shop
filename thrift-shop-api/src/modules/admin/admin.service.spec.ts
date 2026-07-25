import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../../prisma';

/**
 * The admin orders list offers a sort control and status stat cards. Both used
 * to be decorative: the sort was never passed to the query, and the counts were
 * derived from whichever page happened to be on screen.
 */
describe('AdminService orders', () => {
  let service: AdminService;

  const prisma = {
    order: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue({ _sum: { total: 0 } }),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    user: { count: jest.fn().mockResolvedValue(0) },
    vendor: {
      count: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue({ _avg: { rating: 0 } }),
    },
    product: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
    review: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      aggregate: jest.fn().mockResolvedValue({ _avg: { rating: 0 } }),
    },
  };

  const lastFindManyArgs = () => {
    const calls = prisma.order.findMany.mock.calls as Array<
      [{ orderBy: Record<string, string>; where: Record<string, unknown> }]
    >;
    return calls[calls.length - 1][0];
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.order.findMany.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(AdminService);
  });

  it('defaults to newest first', async () => {
    await service.getOrders({});
    expect(lastFindManyArgs().orderBy).toEqual({ createdAt: 'desc' });
  });

  it('honours the requested sort field and direction', async () => {
    await service.getOrders({ sortBy: 'total', sortOrder: 'asc' });
    expect(lastFindManyArgs().orderBy).toEqual({ total: 'asc' });
  });

  it('searches order number and buyer name/email', async () => {
    await service.getOrders({ search: 'ada' });
    expect(lastFindManyArgs().where.OR).toEqual([
      { orderNumber: { contains: 'ada', mode: 'insensitive' } },
      { buyer: { name: { contains: 'ada', mode: 'insensitive' } } },
      { buyer: { email: { contains: 'ada', mode: 'insensitive' } } },
    ]);
  });

  it('filters products in the query rather than in the browser', async () => {
    await service.getProducts({
      search: 'denim',
      condition: 'LIKE_NEW',
      categoryId: 'cat-1',
      sortBy: 'price',
      sortOrder: 'asc',
    });

    const productCalls = prisma.product.findMany.mock.calls as Array<
      [{ where: Record<string, unknown>; orderBy: Record<string, string> }]
    >;
    const args = productCalls[0][0];
    expect(args.orderBy).toEqual({ price: 'asc' });
    expect(args.where.categoryId).toBe('cat-1');
    expect(args.where.condition).toBe('LIKE_NEW');
    expect(args.where.OR).toEqual([
      { title: { contains: 'denim', mode: 'insensitive' } },
      { brand: { contains: 'denim', mode: 'insensitive' } },
    ]);
  });

  it('filters reviews by rating and verified state', async () => {
    await service.getReviews({ rating: 5, isVerified: true, search: 'great' });

    const reviewCalls = prisma.review.findMany.mock.calls as Array<
      [{ where: Record<string, unknown> }]
    >;
    const args = reviewCalls[0][0];
    expect(args.where.rating).toBe(5);
    expect(args.where.isVerified).toBe(true);
    expect(args.where.OR).toHaveLength(4);
  });

  it('reports every status in ordersByStatus, including empty ones', async () => {
    prisma.order.groupBy.mockResolvedValue([
      { status: 'PENDING', _count: { _all: 4 } },
      { status: 'DELIVERED', _count: { _all: 9 } },
    ]);

    const stats = await service.getStats();

    expect(stats.ordersByStatus.PENDING).toBe(4);
    expect(stats.ordersByStatus.DELIVERED).toBe(9);
    // A status nobody has used must still be present as 0 rather than absent,
    // so the UI never renders "undefined".
    expect(stats.ordersByStatus.CANCELLED).toBe(0);
  });
});
