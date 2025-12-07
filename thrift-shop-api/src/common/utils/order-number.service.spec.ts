import { Test, TestingModule } from '@nestjs/testing';
import { OrderNumberService } from './order-number.service';
import { PrismaService } from '../../prisma';

describe('OrderNumberService', () => {
  let service: OrderNumberService;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
    order: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderNumberService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<OrderNumberService>(OrderNumberService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generate', () => {
    it('should generate order number using database function', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([
        { get_next_order_number: 'TS-2024-00001' },
      ]);

      const result = await service.generate();

      expect(result).toBe('TS-2024-00001');
      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
    });

    it('should fall back to query-based generation when function not available', async () => {
      mockPrismaService.$queryRaw.mockRejectedValue(
        new Error('Function not found'),
      );
      mockPrismaService.order.findFirst.mockResolvedValue(null);

      const result = await service.generate();

      expect(result).toMatch(/^TS-\d{4}-00001$/);
    });

    it('should increment sequence in fallback method', async () => {
      const year = new Date().getFullYear();
      mockPrismaService.$queryRaw.mockRejectedValue(
        new Error('Function not found'),
      );
      mockPrismaService.order.findFirst.mockResolvedValue({
        orderNumber: `TS-${year}-00042`,
      });

      const result = await service.generate();

      expect(result).toBe(`TS-${year}-00043`);
    });

    it('should handle empty result from database function', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([]);
      mockPrismaService.order.findFirst.mockResolvedValue(null);

      const result = await service.generate();

      expect(result).toMatch(/^TS-\d{4}-00001$/);
    });
  });

  describe('isValidFormat', () => {
    it('should return true for valid order numbers', () => {
      expect(service.isValidFormat('TS-2024-00001')).toBe(true);
      expect(service.isValidFormat('TS-2023-12345')).toBe(true);
      expect(service.isValidFormat('TS-2025-99999')).toBe(true);
    });

    it('should return false for invalid order numbers', () => {
      expect(service.isValidFormat('TS-24-00001')).toBe(false); // Year too short
      expect(service.isValidFormat('TS-2024-0001')).toBe(false); // Sequence too short
      expect(service.isValidFormat('TS-2024-000001')).toBe(false); // Sequence too long
      expect(service.isValidFormat('XX-2024-00001')).toBe(false); // Wrong prefix
      expect(service.isValidFormat('')).toBe(false);
      expect(service.isValidFormat('invalid')).toBe(false);
    });
  });

  describe('parse', () => {
    it('should correctly parse valid order numbers', () => {
      const result = service.parse('TS-2024-00042');

      expect(result).toEqual({
        year: 2024,
        sequence: 42,
      });
    });

    it('should return null for invalid order numbers', () => {
      expect(service.parse('invalid')).toBeNull();
      expect(service.parse('')).toBeNull();
    });
  });
});
