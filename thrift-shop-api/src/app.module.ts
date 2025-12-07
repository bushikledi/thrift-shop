import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma';
import {
  appConfig,
  databaseConfig,
  jwtConfig,
  s3Config,
  redisConfig,
  shippingConfig,
} from './config';
import { validate } from './config/env.validation';
import { CorrelationIdMiddleware } from './common/middleware';

// Feature modules
import { AuthModule } from './modules/auth';
import { UsersModule } from './modules/users';
import { VendorsModule } from './modules/vendors';
import { CategoriesModule } from './modules/categories';
import { ProductsModule } from './modules/products';
import { CartModule } from './modules/cart';
import { OrdersModule } from './modules/orders';
import { MediaModule } from './modules/media';
import { NotificationsModule } from './modules/notifications';
import { ReviewsModule } from './modules/reviews';
import { AdminModule } from './modules/admin';
import { SearchModule } from './modules/search';
import { HealthModule } from './modules/health';

@Module({
  imports: [
    // Configuration with validation
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        s3Config,
        redisConfig,
        shippingConfig,
      ],
      validate,
      cache: true,
    }),

    // Cache configuration
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');

        // Use Redis if available, otherwise fall back to in-memory cache
        if (redisUrl) {
          const { redisStore } = await import('cache-manager-redis-store');
          return {
            store: redisStore,
            url: redisUrl,
            ttl: 300, // Default 5 minutes
          };
        }

        return {
          ttl: 300, // Default 5 minutes
          max: 1000, // Maximum number of items in cache
        };
      },
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100,
      },
    ]),

    // Event Emitter
    EventEmitterModule.forRoot({
      global: true,
    }),

    // Database
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    VendorsModule,
    CategoriesModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    MediaModule,
    NotificationsModule,
    ReviewsModule,
    AdminModule,
    SearchModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
