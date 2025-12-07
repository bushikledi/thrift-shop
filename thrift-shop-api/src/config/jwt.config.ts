import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  if (secret.length < 64) {
    throw new Error(
      'JWT_SECRET must be at least 64 characters for security. Current length: ' +
        secret.length,
    );
  }
  return {
    secret,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  };
});
