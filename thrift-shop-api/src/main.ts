import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const shutdownSignals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  shutdownSignals.forEach((signal) => {
    process.once(signal, () => {
      logger.log(`Received ${signal}. Initiating graceful shutdown...`);
      app
        .close()
        .then(() => {
          logger.log('Application closed gracefully. Goodbye!');
          process.exit(0);
        })
        .catch((error: unknown) => {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          logger.error(`Error during shutdown: ${errorMessage}`);
          process.exit(1);
        });
    });
  });

  // Global prefix with versioning
  app.setGlobalPrefix('api/v1');

  // Security headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:', 'http://localhost:9000'],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Cookie parser
  app.use(cookieParser());

  // CORS - properly configured with validation
  const frontendUrl = configService.get<string>(
    'FRONTEND_URL',
    'http://localhost:3001',
  );
  const allowedOrigins = frontendUrl
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => {
      // Validate origin format
      try {
        const url = new URL(origin);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        return false;
      }
    });

  if (allowedOrigins.length === 0) {
    logger.warn('No valid CORS origins configured, defaulting to localhost');
    allowedOrigins.push('http://localhost:3001');
  }

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Correlation-Id',
      'X-Requested-With',
    ],
    exposedHeaders: ['X-Correlation-Id'],
  });

  if (configService.get<string>('NODE_ENV') !== 'production') {
    // Swagger API documentation (disabled in production)
    const config = new DocumentBuilder()
      .setTitle('Thrift Shop API')
      .setDescription('API for the Thrift Shop e-commerce platform')
      .setVersion('1.0')
      .addBearerAuth()
      .addCookieAuth('access_token')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/v1/docs', app, document);
  }

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
  if (configService.get<string>('NODE_ENV') !== 'production') {
    logger.log(`📚 Swagger docs: http://localhost:${port}/api/v1/docs`);
  }
}
void bootstrap();
