import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiServiceUnavailableResponse,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import Redis from 'ioredis';
import { Public } from '../../common/decorators';
import { PrismaService } from '../../prisma';
import { HealthResponseDto } from './dto/health-response.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'API is healthy',
    type: HealthResponseDto,
  })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Public()
  @Get('db')
  @ApiOperation({ summary: 'Database health check' })
  @ApiResponse({
    status: 200,
    description: 'Database is healthy',
    type: HealthResponseDto,
  })
  @ApiServiceUnavailableResponse({
    description: 'Database is unhealthy',
    type: ErrorResponseDto,
  })
  async checkDatabase() {
    try {
      // Simple query to check database connection
      await this.prisma.user.count();
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'disconnected',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Public()
  @Get('redis')
  @ApiOperation({ summary: 'Redis health check' })
  @ApiResponse({
    status: 200,
    description: 'Redis is healthy',
    type: HealthResponseDto,
  })
  @ApiServiceUnavailableResponse({
    description: 'Redis is unhealthy',
    type: ErrorResponseDto,
  })
  async checkRedis() {
    const redisUrl =
      this.configService.get<string>('REDIS_URL') ||
      this.configService.get<string>('redis.url');

    if (!redisUrl) {
      throw new ServiceUnavailableException({
        status: 'error',
        redis: 'misconfigured',
        timestamp: new Date().toISOString(),
      });
    }

    const client = new Redis(redisUrl, { lazyConnect: true });
    const startedAt = Date.now();

    try {
      await client.connect();
      await client.ping();
      return {
        status: 'ok',
        redis: 'connected',
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new ServiceUnavailableException({
        status: 'error',
        redis: 'disconnected',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    } finally {
      try {
        await client.quit();
      } catch {
        client.disconnect();
      }
    }
  }

  @Public()
  @Get('object-store')
  @ApiOperation({ summary: 'S3/Object storage health check' })
  @ApiResponse({
    status: 200,
    description: 'Object storage is reachable',
    type: HealthResponseDto,
  })
  @ApiServiceUnavailableResponse({
    description: 'Object storage is unavailable',
    type: ErrorResponseDto,
  })
  async checkObjectStore() {
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const accessKey = this.configService.get<string>('S3_ACCESS_KEY');
    const secretKey = this.configService.get<string>('S3_SECRET_KEY');
    const bucket = this.configService.get<string>('S3_BUCKET');
    const region = this.configService.get<string>('S3_REGION');

    if (!endpoint || !accessKey || !secretKey || !bucket || !region) {
      throw new ServiceUnavailableException({
        status: 'error',
        objectStorage: 'misconfigured',
        timestamp: new Date().toISOString(),
      });
    }

    const client = new S3Client({
      region,
      endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });

    const startedAt = Date.now();

    try {
      await client.send(new HeadBucketCommand({ Bucket: bucket }));
      return {
        status: 'ok',
        objectStorage: 'connected',
        bucket,
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new ServiceUnavailableException({
        status: 'error',
        objectStorage: 'disconnected',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    } finally {
      client.destroy();
    }
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async readiness() {
    try {
      await this.prisma.user.count();
      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new ServiceUnavailableException({
        status: 'not-ready',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Public()
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  liveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }
}
