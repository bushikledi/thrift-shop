import { registerAs } from '@nestjs/config';

/**
 * S3 / object-storage configuration.
 *
 * All values are optional. When they are not fully provided the application
 * falls back to mock storage (see MediaService), which matches the "optional"
 * contract declared in env.validation.ts. `isConfigured` lets consumers detect
 * whether real object storage is available.
 */
export default registerAs('s3', () => {
  const endpoint = process.env.S3_ENDPOINT;
  const accessKey = process.env.S3_ACCESS_KEY;
  const secretKey = process.env.S3_SECRET_KEY;
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION;

  return {
    endpoint,
    accessKey,
    secretKey,
    bucket,
    region,
    isConfigured: Boolean(
      endpoint && accessKey && secretKey && bucket && region,
    ),
  };
});
