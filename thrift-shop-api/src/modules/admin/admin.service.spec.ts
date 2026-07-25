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
    product: { count: jest.fn().mockResolvedValue(0) },
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
