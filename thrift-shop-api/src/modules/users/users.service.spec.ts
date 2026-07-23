import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma';
import { UpdateUserPreferencesDto } from './dto';

describe('UsersService - notification preferences', () => {
  let service: UsersService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('getPreferences', () => {
    it('returns documented defaults when nothing has been saved', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        preferences: null,
      });

      const result = await service.getPreferences('user-1');

      // Order updates are opt-out, marketing is opt-in.
      expect(result.notifications.email.orders).toBe(true);
      expect(result.notifications.email.promotions).toBe(false);
      expect(result.notifications.sms.orders).toBe(false);
    });

    it('fills in defaults for categories missing from stored preferences', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        preferences: { notifications: { email: { promotions: true } } },
      });

      const result = await service.getPreferences('user-1');

      expect(result.notifications.email.promotions).toBe(true);
      // Not stored, so the default applies rather than undefined.
      expect(result.notifications.email.orders).toBe(true);
      expect(result.notifications.push.messages).toBe(true);
    });

    it('throws when the user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getPreferences('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updatePreferences', () => {
    it('keeps untouched settings when a single toggle is patched', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        preferences: null,
      });
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.updatePreferences('user-1', {
        notifications: { sms: { orders: true } },
      });

      expect(result.notifications.sms.orders).toBe(true);
      expect(result.notifications.sms.promotions).toBe(false);
      expect(result.notifications.sms.reviews).toBe(false);
      expect(result.notifications.sms.messages).toBe(false);
      // Other channels are untouched.
      expect(result.notifications.email.orders).toBe(true);
    });

    it('ignores undefined properties instead of overwriting stored values', async () => {
      // class-transformer materialises every declared DTO property, so unset
      // ones arrive as undefined. A plain spread would wipe stored values.
      mockPrismaService.user.findUnique.mockResolvedValue({
        preferences: {
          notifications: {
            email: {
              orders: true,
              promotions: true,
              reviews: true,
              messages: true,
            },
          },
        },
      });
      mockPrismaService.user.update.mockResolvedValue({});

      const dto: UpdateUserPreferencesDto = {
        notifications: {
          email: {
            orders: undefined,
            promotions: false,
            reviews: undefined,
            messages: undefined,
          },
        },
      };

      const result = await service.updatePreferences('user-1', dto);

      expect(result.notifications.email.promotions).toBe(false);
      expect(result.notifications.email.orders).toBe(true);
      expect(result.notifications.email.reviews).toBe(true);
      expect(result.notifications.email.messages).toBe(true);
    });

    it('persists the fully resolved set', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        preferences: null,
      });
      mockPrismaService.user.update.mockResolvedValue({});

      await service.updatePreferences('user-1', {
        notifications: { email: { promotions: true } },
      });

      const updateCalls = mockPrismaService.user.update.mock.calls as Array<
        [
          {
            data: {
              preferences: {
                notifications: Record<string, Record<string, boolean>>;
              };
            };
          },
        ]
      >;
      const stored = updateCalls[0][0].data.preferences.notifications;

      expect(Object.keys(stored).sort()).toEqual(['email', 'push', 'sms']);
      expect(Object.keys(stored.email).sort()).toEqual([
        'messages',
        'orders',
        'promotions',
        'reviews',
      ]);
    });
  });
});
