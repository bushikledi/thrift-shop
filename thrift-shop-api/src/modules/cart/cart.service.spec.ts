import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CartService } from './cart.service';
import { PrismaService } from '../../prisma';

/**
 * Regression coverage for the cart remove/update contract: both must return the
 * full, recalculated cart (CartResponseDto), not the raw mutated row. Returning
 * the deleted/updated row previously corrupted the client cache and made
 * removed items reappear after refresh.
 */
describe('CartService', () => {
  let service: CartService;
  let prisma: {
    cartItem: {
      findFirst: jest.Mock;
      delete: jest.Mock;
      update: jest.Mock;
    };
    cartSession: { findUnique: jest.Mock };
  };

  const SESSION_ID = 'session-1';
  const ITEM_ID = 'item-1';

  const sessionWithItems = (items: unknown[]) => ({
    id: SESSION_ID,
    items,
  });

  beforeEach(async () => {
    prisma = {
      cartItem: {
        findFirst: jest.fn(),
        delete: jest.fn().mockResolvedValue({ id: ITEM_ID }),
        update: jest.fn().mockResolvedValue({ id: ITEM_ID }),
      },
      cartSession: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  describe('removeItem', () => {
    it('returns the full recalculated cart, not the deleted row', async () => {
      prisma.cartItem.findFirst.mockResolvedValue({ id: ITEM_ID });
      // getCart() reads the session after the delete
      prisma.cartSession.findUnique.mockResolvedValue(sessionWithItems([]));

      const result = await service.removeItem(SESSION_ID, ITEM_ID);

      expect(prisma.cartItem.delete).toHaveBeenCalledWith({
        where: { id: ITEM_ID },
      });
      // Shape is a cart, not the deleted cart item
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('subtotal', 0);
      expect(result).toHaveProperty('itemCount', 0);
      expect(result.items).toEqual([]);
    });

    it('throws when the item is not in the session', async () => {
      prisma.cartItem.findFirst.mockResolvedValue(null);

      await expect(service.removeItem(SESSION_ID, ITEM_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.cartItem.delete).not.toHaveBeenCalled();
    });
  });

  describe('updateItem', () => {
    const activeItem = {
      quantity: 2,
      product: { isActive: true, quantity: 5, price: 10 },
    };

    it('returns the full cart with recalculated totals', async () => {
      prisma.cartItem.findFirst.mockResolvedValue({
        id: ITEM_ID,
        product: { quantity: 5 },
      });
      prisma.cartSession.findUnique.mockResolvedValue(
        sessionWithItems([{ ...activeItem, quantity: 3 }]),
      );

      const result = await service.updateItem(SESSION_ID, ITEM_ID, {
        quantity: 3,
      });

      expect(prisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: ITEM_ID },
        data: { quantity: 3 },
      });
      expect(result).toHaveProperty('items');
      // subtotal = price(10) * quantity(3)
      expect(result).toHaveProperty('subtotal', 30);
      expect(result).toHaveProperty('itemCount', 3);
    });

    it('removes the item (and returns the cart) when quantity is 0', async () => {
      prisma.cartItem.findFirst.mockResolvedValue({
        id: ITEM_ID,
        product: { quantity: 5 },
      });
      prisma.cartSession.findUnique.mockResolvedValue(sessionWithItems([]));

      const result = await service.updateItem(SESSION_ID, ITEM_ID, {
        quantity: 0,
      });

      expect(prisma.cartItem.delete).toHaveBeenCalledWith({
        where: { id: ITEM_ID },
      });
      expect(result).toHaveProperty('itemCount', 0);
    });

    it('rejects a quantity above available stock', async () => {
      prisma.cartItem.findFirst.mockResolvedValue({
        id: ITEM_ID,
        product: { quantity: 2 },
      });

      await expect(
        service.updateItem(SESSION_ID, ITEM_ID, { quantity: 5 }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.cartItem.update).not.toHaveBeenCalled();
    });
  });
});
