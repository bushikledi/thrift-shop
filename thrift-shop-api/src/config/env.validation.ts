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

  // Key for encrypting sensitive stored values (vendor payout details).
  // Optional: falls back to a key derived from JWT_SECRET. Prefer a dedicated
  // 64-character hex value so it can be rotated independently.
  @IsString()
  @IsOptional()
  @MinLength(32, {
    message: 'ENCRYPTION_KEY must be at least 32 characters',
  })
  ENCRYPTION_KEY?: string;

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

  // Stripe (optional). Without STRIPE_SECRET_KEY the platform runs
  // cash-on-delivery only and card checkout is rejected with a clear error.
  @IsString()
  @IsOptional()
  STRIPE_SECRET_KEY?: string;

  @IsString()
  @IsOptional()
  STRIPE_WEBHOOK_SECRET?: string;

  @IsString()
  @IsOptional()
  STRIPE_CURRENCY?: string;

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
  // Treat empty strings as "not set".
  //
  // docker compose substitutes an unset variable to an empty string (e.g.
  // `ENCRYPTION_KEY: ${ENCRYPTION_KEY:-}`), and class-validator's @IsOptional()
  // only skips undefined/null - so an empty value would still be measured
  // against rules like @MinLength and crash the app at boot. Stripping them
  // here lets every optional variable fall back to its default.
  const normalizedConfig = Object.fromEntries(
    Object.entries(config).filter(
      ([, value]) => !(typeof value === 'string' && value.trim() === ''),
    ),
  );

  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    normalizedConfig,
    {
      enableImplicitConversion: true,
    },
  );

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
