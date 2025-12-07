import { registerAs } from '@nestjs/config';

export default registerAs('s3', () => {
  const endpoint = process.env.S3_ENDPOINT;
  const accessKey = process.env.S3_ACCESS_KEY;
  const secretKey = process.env.S3_SECRET_KEY;
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION;

  if (!endpoint || !accessKey || !secretKey || !bucket || !region) {
    throw new Error(
      'S3 configuration is incomplete. Please set all S3_* environment variables.',
    );
  }

  return {
    endpoint,
    accessKey,
    secretKey,
    bucket,
    region,
  };
});
