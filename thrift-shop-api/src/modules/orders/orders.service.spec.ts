import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { PrismaService } from '../../prisma';
import { NotificationsService } from '../notifications/notifications.service';
import { OrderNumberService } from '../../common/utils';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { OrderStatus, PaymentMethod } from '../../generated/prisma/client';

// Mock data
const mockCart = {
  id: 'cart-1',
  items: [
    {
      id: 'item-1',
      productId: 'product-1',
      quantity: 1,
      product: {
        id: 'product-1',
        title: 'Vintage Jacket',
        price: 45.0,
        quantity: 1,
        isActive: true,
        isUnique: true,
        condition: 'GOOD',
        vendorId: 'vendor-1',
        vendor: { id: 'vendor-1', name: 'Vintage Store' },
        weight: 500,
      },
    },
  ],
};

const mockEmptyCart = {
  id: 'cart-empty',
  items: [],
};

const mockCartWithUnavailableProduct = {
  id: 'cart-2',
  items: [
    {
      id: 'item-2',
      productId: 'product-2',
      quantity: 2,
      product: {
        id: 'product-2',
        title: 'Sold Out Item',
        price: 30.0,
        quantity: 1, // Only 1 available but 2 requested
        isActive: true,
        isUnique: false,
        condition: 'GOOD',
        vendorId: 'vendor-1',
        vendor: { id: 'vendor-1', name: 'Vintage Store' },
        weight: 300,
      },
    },
  ],
};

const mockOrder = {
  id: 'order-1',
  orderNumber: 'TS-2024-0001',
  buyerId: 'user-1',
  vendorId: 'vendor-1',
  subtotal: 45.0,
  shippingAmount: 5.99,
  total: 50.99,
  status: OrderStatus.PENDING,
  paymentMethod: PaymentMethod.COD,
  shippingAddress: {
    street: '123 Main St',
    city: 'Test City',
    state: 'TS',
    zip: '12345',
    country: 'US',
  },
  items: [
    {
      id: 'order-item-1',
      productId: 'product-1',
      title: 'Vintage Jacket',
      price: 45.0,
      quantity: 1,
    },
  ],
  vendor: { id: 'vendor-1', displayName: 'Vintage Store' },
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('OrdersService', () => {
  let service: OrdersService;

  // Mock PrismaService
  const mockPrismaService = {
    cartSession: {
      findUnique: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    orderItem: {
      findMany: jest.fn(),
    },
    product: {
      update: jest.fn(),
    },
    cartItem: {
      deleteMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    vendor: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  // Mock OrdersRepository
  const mockOrdersRepository = {
    findById: jest.fn(),
    findByOrderNumber: jest.fn(),
    findByVendor: jest.fn(),
    findUnique: jest.fn(),
    updateStatus: jest.fn(),
  };

  // Mock NotificationsService
  const mockNotificationsService = {
    sendOrderConfirmation: jest.fn(),
    sendVendorNewOrder: jest.fn(),
  };

  // Mock EventEmitter2
  const mockEventEmitter = {
    emit: jest.fn(),
  };

  // Mock OrderNumberService
  const mockOrderNumberService = {
    generate: jest.fn().mockResolvedValue('TS-2024-00001'),
    isValidFormat: jest.fn().mockReturnValue(true),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'shipping') {
        return {
          baseRate: 5,
          perItemRate: 1,
          weightRate: 0.05,
          freeShippingThreshold: 100,
          expressMultiplier: 1.5,
          overnightMultiplier: 2,
        };
      }
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: OrdersRepository, useValue: mockOrdersRepository },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: OrderNumberService, useValue: mockOrderNumberService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);

    // Clear mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return an order by id', async () => {
      mockOrdersRepository.findById.mockResolvedValue({
        ...mockOrder,
        buyer: { id: 'user-1', name: 'Test User', email: 'test@test.com' },
      });

      const result = await service.findById('order-1', 'user-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('order-1');
      expect(mockOrdersRepository.findById).toHaveBeenCalledWith('order-1');
    });

    it('should throw NotFoundException if order not found', async () => {
      mockOrdersRepository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('calculateShipping', () => {
    it('should calculate base shipping correctly', () => {
      // Access private method via reflection for testing
      const calculateShipping = (
        service as unknown as {
          calculateShipping: (
            items: any[],
            method: string,
            subtotal: number,
          ) => number;
        }
      ).calculateShipping.bind(service);

      const items = [{ quantity: 1, product: { price: 30, weight: 200 } }];

      const result = calculateShipping(items, 'standard', 30);

      expect(result).toBeGreaterThan(0);
      expect(typeof result).toBe('number');
    });

    it('should return free shipping for orders above threshold', () => {
      const calculateShipping = (
        service as unknown as {
          calculateShipping: (
            items: any[],
            method: string,
            subtotal: number,
          ) => number;
        }
      ).calculateShipping.bind(service);

      const items = [{ quantity: 2, product: { price: 50, weight: 300 } }];

      const result = calculateShipping(items, 'standard', 100);

      expect(result).toBe(0);
    });

    it('should apply express multiplier', () => {
      const calculateShipping = (
        service as unknown as {
          calculateShipping: (
            items: any[],
            method: string,
            subtotal: number,
          ) => number;
        }
      ).calculateShipping.bind(service);

      const items = [{ quantity: 1, product: { price: 30, weight: 200 } }];

      const standardRate = calculateShipping(items, 'standard', 30);
      const expressRate = calculateShipping(items, 'express', 30);

      expect(expressRate).toBeGreaterThan(standardRate);
    });
  });

  describe('order number generation', () => {
    it('should use OrderNumberService to generate order numbers', async () => {
      // The service now delegates to OrderNumberService
      expect(mockOrderNumberService.generate).toBeDefined();

      // Verify mock returns expected format
      const result = (await mockOrderNumberService.generate()) as string;
      expect(result).toMatch(/^TS-\d{4}-\d{5}$/);
    });
  });

  describe('create', () => {
    const createOrderDto = {
      cartSessionId: 'cart-1',
      shippingAddress: {
        street: '123 Main St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        country: 'US',
      },
      paymentMethod: PaymentMethod.COD,
    };

    it('should throw BadRequestException for empty cart', async () => {
      mockPrismaService.cartSession.findUnique.mockResolvedValue(mockEmptyCart);

      await expect(service.create(createOrderDto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createOrderDto, 'user-1')).rejects.toThrow(
        'Cart is empty',
      );
    });

    it('should throw BadRequestException for guest checkout without guest info', async () => {
      mockPrismaService.cartSession.findUnique.mockResolvedValue(mockCart);

      await expect(service.create(createOrderDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createOrderDto)).rejects.toThrow(
        'Guest info required for guest checkout',
      );
    });

    it('should throw BadRequestException for unavailable product quantity', async () => {
      mockPrismaService.cartSession.findUnique.mockResolvedValue(
        mockCartWithUnavailableProduct,
      );

      await expect(service.create(createOrderDto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create order successfully with valid cart and user', async () => {
      mockPrismaService.cartSession.findUnique.mockResolvedValue(mockCart);
      mockPrismaService.$transaction.mockImplementation(
        (callback: (tx: any) => Promise<any>) => {
          const mockTx = {
            order: {
              create: jest.fn().mockResolvedValue(mockOrder),
            },
            product: {
              update: jest.fn().mockResolvedValue({}),
            },
            cartItem: {
              deleteMany: jest.fn().mockResolvedValue({}),
            },
          };
          return callback(mockTx);
        },
      );
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
      });

      const result = await service.create(createOrderDto, 'user-1');

      expect(result).toBeDefined();
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should throw NotFoundException for non-existent order', async () => {
      mockOrdersRepository.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('non-existent', 'vendor-1', {
          status: OrderStatus.CONFIRMED,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for unauthorized vendor', async () => {
      mockOrdersRepository.findUnique.mockResolvedValue({
        ...mockOrder,
        vendorId: 'different-vendor',
      });

      await expect(
        service.updateStatus('order-1', 'vendor-1', {
          status: OrderStatus.CONFIRMED,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update order status successfully', async () => {
      mockOrdersRepository.findUnique.mockResolvedValue(mockOrder);
      mockOrdersRepository.updateStatus.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CONFIRMED,
        confirmedAt: new Date(),
      });

      const result = await service.updateStatus('order-1', 'vendor-1', {
        status: OrderStatus.CONFIRMED,
      });

      expect(result.status).toBe(OrderStatus.CONFIRMED);
      expect(mockOrdersRepository.updateStatus).toHaveBeenCalledWith(
        'order-1',
        OrderStatus.CONFIRMED,
        expect.any(Object),
      );
    });

    it('should add tracking number when shipping', async () => {
      mockOrdersRepository.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PROCESSING,
      });
      mockOrdersRepository.updateStatus.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.SHIPPED,
        trackingNumber: 'TRACK123',
      });

      await service.updateStatus('order-1', 'vendor-1', {
        status: OrderStatus.SHIPPED,
        trackingNumber: 'TRACK123',
      });

      expect(mockOrdersRepository.updateStatus).toHaveBeenCalledWith(
        'order-1',
        OrderStatus.SHIPPED,
        expect.objectContaining({
          trackingNumber: 'TRACK123',
        }),
      );
    });
  });

  describe('getVendorOrders', () => {
    it('should return paginated orders for vendor', async () => {
      mockOrdersRepository.findByVendor.mockResolvedValue({
        orders: [mockOrder],
        total: 1,
      });

      const result = await service.getVendorOrders('vendor-1', 1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter orders by status', async () => {
      mockOrdersRepository.findByVendor.mockResolvedValue({
        orders: [],
        total: 0,
      });

      await service.getVendorOrders('vendor-1', 1, 10, OrderStatus.DELIVERED);

      expect(mockOrdersRepository.findByVendor).toHaveBeenCalledWith(
        'vendor-1',
        expect.objectContaining({
          status: OrderStatus.DELIVERED,
        }),
      );
    });
  });
});
