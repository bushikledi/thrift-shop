import { plainToInstance } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsOptional,
  validateSync,
  IsEnum,
  MinLength,
  IsPositive,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 3000;

  // Database
  @IsString()
  DATABASE_URL!: string;

  // JWT - Enforced minimum length for security
  @IsString()
  @MinLength(64, {
    message: 'JWT_SECRET must be at least 64 characters for security',
  })
  JWT_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '7d';

  // Redis (optional for development)
  @IsString()
  @IsOptional()
  REDIS_URL?: string;

  // S3/MinIO Storage (optional)
  @IsString()
  @IsOptional()
  S3_ENDPOINT?: string;

  @IsString()
  @IsOptional()
  S3_ACCESS_KEY?: string;

  @IsString()
  @IsOptional()
  S3_SECRET_KEY?: string;

  @IsString()
  @IsOptional()
  S3_BUCKET?: string;

  @IsString()
  @IsOptional()
  S3_REGION?: string;

  // Email
  @IsString()
  @IsOptional()
  SENDGRID_API_KEY?: string;

  @IsString()
  @IsOptional()
  EMAIL_FROM?: string;

  // SMS
  @IsString()
  @IsOptional()
  TWILIO_SID?: string;

  @IsString()
  @IsOptional()
  TWILIO_TOKEN?: string;

  @IsString()
  @IsOptional()
  TWILIO_PHONE?: string;

  // App URLs
  @IsString()
  @IsOptional()
  FRONTEND_URL?: string;

  @IsString()
  @IsOptional()
  APP_URL?: string;

  // Rate Limiting
  @IsNumber()
  @IsOptional()
  @IsPositive()
  THROTTLE_TTL?: number;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  THROTTLE_LIMIT?: number;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((error) => {
        const constraints = error.constraints
          ? Object.values(error.constraints).join(', ')
          : 'Unknown error';
        return `${error.property}: ${constraints}`;
      })
      .join('\n');
    throw new Error(`Environment validation failed:\n${errorMessages}`);
  }

  return validatedConfig;
}
