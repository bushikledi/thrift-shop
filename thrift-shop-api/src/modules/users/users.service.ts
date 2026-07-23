import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { UpdateUserDto, UpdateUserPreferencesDto } from './dto';

import { PAGINATION } from '../../common/constants';
import { Prisma } from '../../generated/prisma/client';

/** Preferences with every default filled in. */
export interface ResolvedUserPreferences {
  notifications: {
    email: NotificationToggles;
    push: NotificationToggles;
    sms: NotificationToggles;
  };
}

interface NotificationToggles {
  orders: boolean;
  promotions: boolean;
  reviews: boolean;
  messages: boolean;
}

/** Any subset of preferences, as sent by a client or read from stored JSON. */
export interface PartialUserPreferences {
  notifications?: {
    email?: Partial<NotificationToggles>;
    push?: Partial<NotificationToggles>;
    sms?: Partial<NotificationToggles>;
  };
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        address: true,
        emailVerified: true,
        createdAt: true,
        vendor: {
          select: {
            id: true,
            name: true,
            displayName: true,
            verified: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        address: true,
        emailVerified: true,
        updatedAt: true,
      },
    });
  }

  async getSavedItems(userId: string) {
    return this.prisma.savedItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            media: {
              take: 1,
              orderBy: { sortOrder: 'asc' },
            },
            vendor: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async saveItem(userId: string, productId: string) {
    return this.prisma.savedItem.upsert({
      where: {
        userId_productId: { userId, productId },
      },
      create: { userId, productId },
      update: {},
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });
  }

  async removeSavedItem(userId: string, productId: string) {
    return this.prisma.savedItem.delete({
      where: {
        userId_productId: { userId, productId },
      },
    });
  }

  async getOrders(userId: string, page = 1, limit = 10) {
    const safeLimit = Math.min(limit, PAGINATION.MAX_LIMIT_STRICT);
    const skip = (page - 1) * safeLimit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { buyerId: userId },
        include: {
          items: true,
          vendor: {
            select: {
              id: true,
              name: true,
              displayName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.order.count({ where: { buyerId: userId } }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async getAddress(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { address: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.address || null;
  }

  async updateAddress(
    userId: string,
    address:
      | {
          street: string;
          city: string;
          state: string;
          zip: string;
          country: string;
        }
      | null
      | undefined,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      // address is a nullable Json column: pass the object as JSON, use
      // Prisma.JsonNull to clear it, and undefined to leave it unchanged.
      data: {
        address:
          address === undefined
            ? undefined
            : address === null
              ? Prisma.JsonNull
              : address,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        address: true,
        emailVerified: true,
        updatedAt: true,
      },
    });

    return updatedUser.address;
  }

  /**
   * Defaults applied when a user has never saved preferences. Order updates
   * are opt-out; marketing is opt-in.
   */
  private static readonly DEFAULT_PREFERENCES: ResolvedUserPreferences = {
    notifications: {
      email: { orders: true, promotions: false, reviews: true, messages: true },
      push: { orders: true, promotions: false, reviews: false, messages: true },
      sms: {
        orders: false,
        promotions: false,
        reviews: false,
        messages: false,
      },
    },
  };

  async getPreferences(userId: string): Promise<ResolvedUserPreferences> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mergePreferences(
      UsersService.DEFAULT_PREFERENCES,
      user.preferences as PartialUserPreferences | null,
    );
  }

  /**
   * Partial update: only the channels/categories present in the payload change,
   * so a client can toggle one switch without resending everything.
   */
  async updatePreferences(
    userId: string,
    dto: UpdateUserPreferencesDto,
  ): Promise<ResolvedUserPreferences> {
    const current = await this.getPreferences(userId);
    const merged = this.mergePreferences(current, dto);

    await this.prisma.user.update({
      where: { id: userId },
      data: { preferences: merged as unknown as Prisma.InputJsonObject },
    });

    return merged;
  }

  private mergePreferences(
    base: ResolvedUserPreferences,
    patch: PartialUserPreferences | null | undefined,
  ): ResolvedUserPreferences {
    const channels = ['email', 'push', 'sms'] as const;
    const toggleKeys = ['orders', 'promotions', 'reviews', 'messages'] as const;
    const notifications = {} as ResolvedUserPreferences['notifications'];

    for (const channel of channels) {
      const merged = { ...base.notifications[channel] };
      const overrides = patch?.notifications?.[channel];

      // Copy only the keys the caller actually set. class-transformer builds
      // the DTO with every declared property present, so unset ones arrive as
      // undefined - a plain spread would overwrite stored values with them.
      if (overrides) {
        for (const key of toggleKeys) {
          const value = overrides[key];
          if (typeof value === 'boolean') {
            merged[key] = value;
          }
        }
      }

      notifications[channel] = merged;
    }

    return { notifications };
  }
}
