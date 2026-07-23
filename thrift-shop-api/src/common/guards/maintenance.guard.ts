import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../prisma';
import { UserRole } from '../../generated/prisma/client';

/**
 * Enforces the admin "maintenance mode" setting.
 *
 * When enabled the API rejects ordinary traffic with 503 but deliberately keeps
 * reachable:
 *  - health checks, so orchestrators do not kill the containers,
 *  - authentication, so an admin can still sign in,
 *  - every admin route, so maintenance mode can be switched back off.
 *
 * The setting is cached briefly to avoid a database read on every request.
 */
@Injectable()
export class MaintenanceGuard implements CanActivate {
  private static readonly CACHE_TTL_MS = 10_000;

  private cachedValue = false;
  private cachedAt = 0;

  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: { role?: UserRole } }>();

    const path = request.path || request.url || '';
    if (this.isAlwaysAllowed(path)) {
      return true;
    }

    // Admins keep full access so they can turn maintenance mode off again.
    if (request.user?.role === UserRole.ADMIN) {
      return true;
    }

    if (await this.isMaintenanceMode()) {
      throw new ServiceUnavailableException(
        'The store is temporarily unavailable for maintenance. Please try again shortly.',
      );
    }

    return true;
  }

  private isAlwaysAllowed(path: string): boolean {
    return (
      path.includes('/health') ||
      path.includes('/auth/') ||
      path.includes('/admin')
    );
  }

  private async isMaintenanceMode(): Promise<boolean> {
    const now = Date.now();
    if (now - this.cachedAt < MaintenanceGuard.CACHE_TTL_MS) {
      return this.cachedValue;
    }

    try {
      const settings = await this.prisma.platformSettings.findUnique({
        where: { id: 'singleton' },
        select: { maintenanceMode: true },
      });
      this.cachedValue = settings?.maintenanceMode ?? false;
    } catch {
      // Never take the API down because the settings row could not be read.
      this.cachedValue = false;
    }

    this.cachedAt = now;
    return this.cachedValue;
  }
}
