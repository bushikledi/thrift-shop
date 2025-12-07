import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Endpoints', () => {
    it('/api/health (GET) - should return health status', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res) => {
          const body = res.body as {
            status: string;
            timestamp: string;
            uptime: number;
          };
          expect(body.status).toBe('ok');
          expect(body.timestamp).toBeDefined();
          expect(body.uptime).toBeDefined();
        });
    });

    it('/api/health/live (GET) - should return liveness status', () => {
      return request(app.getHttpServer())
        .get('/api/health/live')
        .expect(200)
        .expect((res) => {
          const body = res.body as { status: string };
          expect(body.status).toBe('alive');
        });
    });
  });

  describe('Auth Endpoints', () => {
    it('/api/auth/login (POST) - should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'invalid@test.com', password: 'wrongpassword' })
        .expect(401);
    });

    it('/api/auth/signup (POST) - should validate input', () => {
      return request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({ email: 'invalid-email', password: 'short' })
        .expect(400);
    });
  });

  describe('Products Endpoints', () => {
    it('/api/products (GET) - should return paginated products', () => {
      return request(app.getHttpServer())
        .get('/api/products')
        .expect(200)
        .expect((res) => {
          const body = res.body as { data: unknown[]; meta: { page: number } };
          expect(body.data).toBeDefined();
          expect(body.meta).toBeDefined();
          expect(body.meta.page).toBe(1);
        });
    });

    it('/api/products (GET) - should accept pagination params', () => {
      return request(app.getHttpServer())
        .get('/api/products?page=1&limit=5')
        .expect(200)
        .expect((res) => {
          const body = res.body as { meta: { limit: number } };
          expect(body.meta.limit).toBe(5);
        });
    });
  });

  describe('Categories Endpoints', () => {
    it('/api/categories (GET) - should return categories', () => {
      return request(app.getHttpServer())
        .get('/api/categories')
        .expect(200)
        .expect((res) => {
          const body = res.body as unknown[];
          expect(Array.isArray(body)).toBe(true);
        });
    });
  });

  describe('Search Endpoints', () => {
    it('/api/search (GET) - should return search results', () => {
      return request(app.getHttpServer())
        .get('/api/search?q=test')
        .expect(200)
        .expect((res) => {
          const body = res.body as {
            products: unknown;
            vendors: unknown;
            categories: unknown;
          };
          expect(body.products).toBeDefined();
          expect(body.vendors).toBeDefined();
          expect(body.categories).toBeDefined();
        });
    });

    it('/api/search (GET) - should handle empty query', () => {
      return request(app.getHttpServer())
        .get('/api/search?q=')
        .expect(200)
        .expect((res) => {
          const body = res.body as { products: { data: unknown[] } };
          expect(body.products.data).toHaveLength(0);
        });
    });
  });
});
