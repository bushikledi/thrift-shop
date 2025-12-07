import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { getCorrelationId } from '../middleware/correlation-id.middleware';

/**
 * Standard error codes for consistent API responses
 */
export enum ErrorCode {
  // Client errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  BAD_REQUEST = 'BAD_REQUEST',

  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

interface ErrorResponse {
  statusCode: number;
  errorCode: string;
  message: string | string[];
  timestamp: string;
  path: string;
  method: string;
  correlationId: string;
  details?: Record<string, unknown>;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const correlationId = getCorrelationId();

    const { status, errorCode, message, details } =
      this.extractErrorInfo(exception);

    const errorResponse: ErrorResponse = {
      statusCode: status,
      errorCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      correlationId,
    };

    // Only include validation error details (sanitized), never expose internal details
    if (details && errorCode === (ErrorCode.VALIDATION_ERROR as string)) {
      errorResponse.details = { validationErrors: details.validationErrors };
    }

    // Log with appropriate level
    if (status >= 500) {
      this.logger.error(
        `[${correlationId}] ${request.method} ${request.url} ${status} - ${errorCode}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else if (status >= 400) {
      this.logger.warn(
        `[${correlationId}] ${request.method} ${request.url} ${status} - ${errorCode}: ${JSON.stringify(message)}`,
      );
    }

    response.status(status).json(errorResponse);
  }

  private extractErrorInfo(exception: unknown): {
    status: number;
    errorCode: string;
    message: string | string[];
    details?: Record<string, unknown>;
  } {
    // Handle HttpException (NestJS built-in exceptions)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      let message: string | string[];
      let details: Record<string, unknown> | undefined;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message =
          (responseObj.message as string | string[]) || exception.message;

        // Extract validation errors as details
        if (Array.isArray(message) && message.length > 0) {
          details = { validationErrors: message };
          message = 'Validation failed';
        }
      } else {
        message = exception.message;
      }

      return {
        status,
        errorCode: this.mapStatusToErrorCode(status),
        message,
        details,
      };
    }

    // Handle Prisma errors
    if (this.isPrismaError(exception)) {
      return this.handlePrismaError(exception);
    }

    // Handle unknown errors
    this.logger.error(
      'Unhandled exception:',
      exception instanceof Error ? exception.stack : exception,
    );

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: ErrorCode.INTERNAL_ERROR,
      message:
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : exception instanceof Error
            ? exception.message
            : 'Unknown error',
    };
  }

  private mapStatusToErrorCode(status: number): string {
    switch (status as HttpStatus) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.BAD_REQUEST;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.AUTHENTICATION_REQUIRED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.PERMISSION_DENIED;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.RESOURCE_NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.RESOURCE_CONFLICT;
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return ErrorCode.VALIDATION_ERROR;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.RATE_LIMIT_EXCEEDED;
      case HttpStatus.SERVICE_UNAVAILABLE:
        return ErrorCode.SERVICE_UNAVAILABLE;
      default:
        return status >= 500 ? ErrorCode.INTERNAL_ERROR : ErrorCode.BAD_REQUEST;
    }
  }

  private isPrismaError(exception: unknown): boolean {
    if (
      exception !== null &&
      typeof exception === 'object' &&
      'code' in exception
    ) {
      const code = (exception as { code: unknown }).code;
      return typeof code === 'string' && code.startsWith('P');
    }
    return false;
  }

  private handlePrismaError(exception: unknown): {
    status: number;
    errorCode: string;
    message: string;
    details?: Record<string, unknown>;
  } {
    const prismaError = exception as {
      code: string;
      meta?: Record<string, unknown>;
    };

    switch (prismaError.code) {
      case 'P2002': // Unique constraint violation
        return {
          status: HttpStatus.CONFLICT,
          errorCode: ErrorCode.RESOURCE_CONFLICT,
          message: 'A record with this value already exists',
          details:
            process.env.NODE_ENV !== 'production'
              ? {
                  prismaCode: prismaError.code,
                  target: prismaError.meta?.target,
                }
              : undefined,
        };
      case 'P2025': // Record not found
        return {
          status: HttpStatus.NOT_FOUND,
          errorCode: ErrorCode.RESOURCE_NOT_FOUND,
          message: 'The requested resource was not found',
        };
      case 'P2003': // Foreign key constraint violation
        return {
          status: HttpStatus.BAD_REQUEST,
          errorCode: ErrorCode.BAD_REQUEST,
          message: 'Referenced resource does not exist',
        };
      default:
        this.logger.error(
          `Unhandled Prisma error: ${prismaError.code}`,
          prismaError,
        );
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          errorCode: ErrorCode.DATABASE_ERROR,
          message: 'A database error occurred',
        };
    }
  }
}
