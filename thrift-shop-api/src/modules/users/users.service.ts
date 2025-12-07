import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { UpdateUserDto } from './dto';
import { PAGINATION } from '../../common/constants';

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
      data: { address: address as any },
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
}
