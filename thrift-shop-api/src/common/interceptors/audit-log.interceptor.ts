import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const method = request.method;
    const url = request.url;
    const userId = request.user?.id;

    // Only log mutating operations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: (data: unknown) => {
          // Extract entity info from URL
          const urlParts = url.split('/').filter(Boolean);
          const entityType = urlParts[1] || 'unknown'; // e.g., 'products', 'orders'
          const entityId =
            urlParts[2] && this.isUUID(urlParts[2]) ? urlParts[2] : null;

          // Determine action based on method
          let action: string;
          switch (method) {
            case 'POST':
              action = 'CREATE';
              break;
            case 'PUT':
            case 'PATCH':
              action = 'UPDATE';
              break;
            case 'DELETE':
              action = 'DELETE';
              break;
            default:
              action = method;
          }

          let safeData: Prisma.InputJsonValue | undefined;
          if (method !== 'DELETE' && data) {
            safeData = JSON.parse(
              JSON.stringify(data),
            ) as Prisma.InputJsonValue;
          }

          // Log asynchronously (fire and forget)
          this.prisma.auditLog
            .create({
              data: {
                userId,
                action,
                entityType: entityType.toUpperCase(),
                entityId,
                ...(safeData && { newData: safeData }),
                ipAddress: request.ip || request.socket.remoteAddress,
                userAgent: request.get('user-agent'),
              },
            })
            .catch((error: unknown) => {
              const message =
                error instanceof Error ? error.message : 'Unknown error';
              this.logger.error('Failed to create audit log:', message);
            });
        },
        error: (error: unknown) => {
          const message =
            error instanceof Error ? error.message : 'Unknown error';
          // Optionally log errors too
          this.logger.error(
            `Request failed after ${Date.now() - start}ms:`,
            message,
          );
        },
      }),
    );
  }

  private isUUID(str: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }
}
