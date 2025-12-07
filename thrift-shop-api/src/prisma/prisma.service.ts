import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private _client: PrismaClient;

  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    this._client = new PrismaClient({ adapter });
  }

  async onModuleInit() {
    await this._client.$connect();
  }

  async onModuleDestroy() {
    await this._client.$disconnect();
  }

  // Expose all Prisma models as getters
  get user() {
    return this._client.user;
  }
  get vendor() {
    return this._client.vendor;
  }
  get product() {
    return this._client.product;
  }
  get category() {
    return this._client.category;
  }
  get order() {
    return this._client.order;
  }
  get orderItem() {
    return this._client.orderItem;
  }
  get cartSession() {
    return this._client.cartSession;
  }
  get cartItem() {
    return this._client.cartItem;
  }
  get media() {
    return this._client.media;
  }
  get review() {
    return this._client.review;
  }
  get savedItem() {
    return this._client.savedItem;
  }
  get passwordReset() {
    return this._client.passwordReset;
  }
  get auditLog() {
    return this._client.auditLog;
  }

  // Expose transaction method - supports both function and array patterns
  $transaction<T>(
    arg:
      | ((prisma: Prisma.TransactionClient) => Promise<T>)
      | Prisma.PrismaPromise<unknown>[],
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ): Promise<T> | Promise<unknown[]> {
    if (Array.isArray(arg)) {
      return this._client.$transaction(arg, options);
    }
    return this._client.$transaction(
      arg as (prisma: Prisma.TransactionClient) => Promise<T>,
      options,
    );
  }

  // For raw queries if needed - use with caution
  // Prefer using Prisma's type-safe queries instead
  get $queryRaw() {
    return this._client.$queryRaw.bind(this._client);
  }

  // For raw execute queries - use with caution
  // Prefer using Prisma's type-safe queries instead
  // WARNING: $executeRawUnsafe is not exposed to prevent SQL injection
  get $executeRaw() {
    return this._client.$executeRaw.bind(this._client);
  }

  // Note: $queryRawUnsafe and $executeRawUnsafe are intentionally not exposed
  // to prevent SQL injection vulnerabilities. Use parameterized queries via
  // $queryRaw and $executeRaw instead.
}
