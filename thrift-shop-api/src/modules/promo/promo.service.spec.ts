import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PromoService } from './promo.service';
import { PrismaService } from '../../prisma';
import { DiscountType } from '../../generated/prisma/client';

describe('PromoService', () => {
  let service: PromoService;

  const mockPrismaService = {
    promoCode: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      fields: { usageLimit: 'usage_limit' },
    },
  };

  const basePromo = {
    id: 'promo-1',
    code: 'WELCOME10',
    description: '10% off',
    discountType: DiscountType.PERCENTAGE,
    discountValue: 10,
    maxDiscount: null,
    minOrderTotal: null,
    usageLimit: null,
    usageCount: 0,
    startsAt: null,
    expiresAt: null,
    isActive: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromoService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PromoService>(PromoService);
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('applies a percentage discount', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue(basePromo);

      const result = await service.validate('WELCOME10', 200);

      expect(result.discount).toBe(20);
    });

    it('looks codes up case-insensitively', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue(basePromo);

      await service.validate('  welcome10 ', 200);

      expect(mockPrismaService.promoCode.findUnique).toHaveBeenCalledWith({
        where: { code: 'WELCOME10' },
      });
    });

    it('caps a percentage discount at maxDiscount', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue({
        ...basePromo,
        maxDiscount: 500,
      });

      const result = await service.validate('WELCOME10', 10000);

      // 10% of 10000 is 1000, but the cap wins.
      expect(result.discount).toBe(500);
    });

    it('never discounts more than the subtotal', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue({
        ...basePromo,
        discountType: DiscountType.FIXED,
        discountValue: 80,
      });

      const result = await service.validate('WELCOME10', 30);

      expect(result.discount).toBe(30);
    });

    it('rejects a code below its minimum order total', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue({
        ...basePromo,
        minOrderTotal: 1000,
      });

      await expect(service.validate('WELCOME10', 200)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects an expired code', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue({
        ...basePromo,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.validate('WELCOME10', 200)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects a code that has reached its usage limit', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue({
        ...basePromo,
        usageLimit: 5,
        usageCount: 5,
      });

      await expect(service.validate('WELCOME10', 200)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects an inactive code', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue({
        ...basePromo,
        isActive: false,
      });

      await expect(service.validate('WELCOME10', 200)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('gives an unknown code the same rejection as a spent one', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue(null);

      // Identical messages keep the endpoint from confirming which codes exist.
      await expect(service.validate('NOPE', 200)).rejects.toThrow(
        'This promo code is not valid',
      );
    });
  });
});
