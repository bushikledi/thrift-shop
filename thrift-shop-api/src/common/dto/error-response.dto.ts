import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  BAD_REQUEST = 'BAD_REQUEST',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

export class ErrorResponseDto {
  @ApiProperty({ example: 400, description: 'HTTP status code' })
  statusCode!: number;

  @ApiProperty({
    enum: ErrorCode,
    example: ErrorCode.BAD_REQUEST,
    description: 'Application specific error code',
  })
  errorCode!: string;

  @ApiProperty({
    example: 'Invalid input data',
    description: 'Error message or array of messages',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message!: string | string[];

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'Timestamp of the error',
  })
  timestamp!: string;

  @ApiProperty({ example: '/api/v1/resource', description: 'Request path' })
  path!: string;

  @ApiProperty({ example: 'GET', description: 'HTTP method' })
  method!: string;

  @ApiProperty({
    example: 'abc-123-xyz',
    description: 'Unique correlation ID for tracking',
  })
  correlationId!: string;

  @ApiPropertyOptional({
    description: 'Additional error details (e.g. validation errors)',
    example: { validationErrors: ['email must be an email'] },
  })
  details?: Record<string, unknown>;
}
