import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma';
import { CreateMediaDto, MediaQueryDto } from './dto';
import {
  MediaOwnerType,
  Prisma,
  UserRole,
} from '../../generated/prisma/client';
import * as path from 'path';
import * as crypto from 'crypto';
import { MEDIA } from '../../common/constants';
import { matchesDeclaredImageType } from '../../common/utils';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/** Minimal authenticated-user context needed for media ownership checks. */
export interface MediaUser {
  id: string;
  role: UserRole;
}

interface UploadResult {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  variants?: Record<string, string>;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly bucketName: string;
  private readonly s3Endpoint: string;
  private readonly s3Client: S3Client | null;
  private readonly cdnUrl: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.bucketName = this.configService.get<string>('S3_BUCKET', 'thriftshop');
    this.s3Endpoint = this.configService.get<string>(
      'S3_ENDPOINT',
      'http://localhost:9000',
    );
    this.cdnUrl = this.configService.get<string>('CDN_URL', this.s3Endpoint);

    // Initialize S3 client if credentials are provided
    // Support both AWS and S3-compatible naming conventions
    const accessKeyId =
      this.configService.get<string>('AWS_ACCESS_KEY_ID') ||
      this.configService.get<string>('S3_ACCESS_KEY');
    const secretAccessKey =
      this.configService.get<string>('AWS_SECRET_ACCESS_KEY') ||
      this.configService.get<string>('S3_SECRET_KEY');
    const region =
      this.configService.get<string>('AWS_REGION') ||
      this.configService.get<string>('S3_REGION', 'us-east-1');

    if (accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region,
        endpoint: this.s3Endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        forcePathStyle: true, // Required for MinIO and some S3-compatible services
      });
      this.logger.log('S3 client initialized');
    } else {
      this.s3Client = null;
      this.logger.warn('S3 credentials not configured - using mock storage');
    }
  }

  async findAll(query: MediaQueryDto) {
    const where: Prisma.MediaWhereInput = {};

    if (query.ownerType) where.ownerType = query.ownerType;
    if (query.ownerId) where.ownerId = query.ownerId;

    return this.prisma.media.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string) {
    const media = await this.prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    return media;
  }

  async findByOwner(ownerType: MediaOwnerType, ownerId: string) {
    return this.prisma.media.findMany({
      where: { ownerType, ownerId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async upload(file: UploadedFile, dto: CreateMediaDto): Promise<UploadResult> {
    // Validate file type
    if (
      !MEDIA.ALLOWED_MIME_TYPES.includes(
        file.mimetype as (typeof MEDIA.ALLOWED_MIME_TYPES)[number],
      )
    ) {
      throw new BadRequestException(
        'Invalid file type. Allowed: JPEG, PNG, WebP, GIF',
      );
    }

    // Validate file size
    if (file.size > MEDIA.MAX_FILE_SIZE) {
      throw new BadRequestException('File too large. Maximum size: 10MB');
    }

    // The declared Content-Type can be forged, so verify the actual bytes.
    if (!matchesDeclaredImageType(file.buffer, file.mimetype)) {
      throw new BadRequestException(
        'File content does not match its declared image type',
      );
    }

    // Generate unique filename
    const ext = path.extname(file.originalname);
    const hash = crypto.randomBytes(8).toString('hex');
    const filename = `${dto.ownerType.toLowerCase()}/${dto.ownerId}/${hash}${ext}`;

    let url: string;

    // Upload to S3 if client is configured
    if (this.s3Client) {
      try {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: filename,
            Body: file.buffer,
            ContentType: file.mimetype,
            CacheControl: 'max-age=31536000', // 1 year cache
          }),
        );
        url = `${this.cdnUrl}/${this.bucketName}/${filename}`;
        this.logger.log(`File uploaded to S3: ${filename}`);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`S3 upload failed: ${errorMessage}`);
        throw new BadRequestException('Failed to upload file');
      }
    } else {
      // Mock storage - generate placeholder URL
      url = `${this.s3Endpoint}/${this.bucketName}/${filename}`;
      this.logger.debug(`Mock upload: ${filename}`);
    }

    // Generate thumbnail URLs (placeholder - in production use image processing)
    const variants = {
      thumb: url.replace(ext, `-thumb${ext}`),
      medium: url.replace(ext, `-medium${ext}`),
      webp: url.replace(ext, '.webp'),
    };

    return {
      url,
      filename,
      mimeType: file.mimetype,
      size: file.size,
      variants,
    };
  }

  async create(file: UploadedFile, dto: CreateMediaDto, user: MediaUser) {
    // Verify the owner exists and the current user is allowed to attach media to it
    await this.authorizeOwner(dto.ownerType, dto.ownerId, user);

    // Upload file
    const uploadResult = await this.upload(file, dto);

    // Get current max sort order
    const lastMedia = await this.prisma.media.findFirst({
      where: { ownerType: dto.ownerType, ownerId: dto.ownerId },
      orderBy: { sortOrder: 'desc' },
    });

    const sortOrder = (lastMedia?.sortOrder ?? -1) + 1;

    // Create media record
    return this.prisma.media.create({
      data: {
        ownerType: dto.ownerType,
        ownerId: dto.ownerId,
        // Only product media carries the concrete foreign key.
        productId:
          dto.ownerType === MediaOwnerType.PRODUCT ? dto.ownerId : null,
        url: uploadResult.url,
        filename: uploadResult.filename,
        mimeType: uploadResult.mimeType,
        size: uploadResult.size,
        width: uploadResult.width,
        height: uploadResult.height,
        variants: uploadResult.variants,
        sortOrder,
      },
    });
  }

  async createMany(
    files: UploadedFile[],
    dto: CreateMediaDto,
    user: MediaUser,
  ) {
    // Verify the owner exists and the current user is allowed to attach media to it
    await this.authorizeOwner(dto.ownerType, dto.ownerId, user);

    // Get current max sort order once (optimization)
    const lastMedia = await this.prisma.media.findFirst({
      where: { ownerType: dto.ownerType, ownerId: dto.ownerId },
      orderBy: { sortOrder: 'desc' },
    });

    let currentSortOrder = (lastMedia?.sortOrder ?? -1) + 1;

    // Upload files in parallel (with rate limiting consideration)
    const uploadResults = await Promise.all(
      files.map((file) => this.upload(file, dto)),
    );

    // Create media records in parallel
    const createPromises = uploadResults.map((uploadResult) => {
      const sortOrder = currentSortOrder++;
      return this.prisma.media.create({
        data: {
          ownerType: dto.ownerType,
          ownerId: dto.ownerId,
          // Only product media carries the concrete foreign key.
          productId:
            dto.ownerType === MediaOwnerType.PRODUCT ? dto.ownerId : null,
          url: uploadResult.url,
          filename: uploadResult.filename,
          mimeType: uploadResult.mimeType,
          size: uploadResult.size,
          width: uploadResult.width,
          height: uploadResult.height,
          variants: uploadResult.variants,
          sortOrder,
        },
      });
    });

    return Promise.all(createPromises);
  }

  async updateSortOrder(id: string, sortOrder: number) {
    await this.findById(id);

    return this.prisma.media.update({
      where: { id },
      data: { sortOrder },
    });
  }

  async delete(id: string, user: MediaUser) {
    const media = await this.findById(id);

    // Only the media owner (or an admin) may delete it
    await this.authorizeOwner(media.ownerType, media.ownerId, user);

    // Delete from S3 if client is configured
    if (this.s3Client && media.filename) {
      try {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: media.filename,
          }),
        );
        this.logger.log(`File deleted from S3: ${media.filename}`);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`S3 delete failed: ${errorMessage}`);
        // Continue with database deletion even if S3 fails
      }
    }

    return this.prisma.media.delete({
      where: { id },
    });
  }

  async deleteByOwner(ownerType: MediaOwnerType, ownerId: string) {
    const media = await this.findByOwner(ownerType, ownerId);

    // Delete all files from S3 if client is configured
    if (this.s3Client && media.length > 0) {
      try {
        const objects = media
          .filter((m) => m.filename)
          .map((m) => ({ Key: m.filename }));

        if (objects.length > 0) {
          await this.s3Client.send(
            new DeleteObjectsCommand({
              Bucket: this.bucketName,
              Delete: { Objects: objects },
            }),
          );
          this.logger.log(
            `Deleted ${objects.length} files from S3 for ${ownerType}/${ownerId}`,
          );
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`S3 batch delete failed: ${errorMessage}`);
        // Continue with database deletion even if S3 fails
      }
    }

    return this.prisma.media.deleteMany({
      where: { ownerType, ownerId },
    });
  }

  /**
   * Verify the owner entity exists AND that the current user is allowed to
   * manage media for it. Admins may manage any media; otherwise a user may only
   * manage media for products they vend, their own vendor profile, or their own
   * user record. Category media is admin-only.
   */
  private async authorizeOwner(
    ownerType: MediaOwnerType,
    ownerId: string,
    user: MediaUser,
  ) {
    const isAdmin = user.role === UserRole.ADMIN;

    switch (ownerType) {
      case MediaOwnerType.PRODUCT: {
        const product = await this.prisma.product.findUnique({
          where: { id: ownerId },
          select: { vendor: { select: { userId: true } } },
        });
        if (!product) {
          throw new NotFoundException('PRODUCT not found');
        }
        if (!isAdmin && product.vendor.userId !== user.id) {
          throw new ForbiddenException(
            'You are not allowed to manage media for this product',
          );
        }
        break;
      }
      case MediaOwnerType.VENDOR: {
        const vendor = await this.prisma.vendor.findUnique({
          where: { id: ownerId },
          select: { userId: true },
        });
        if (!vendor) {
          throw new NotFoundException('VENDOR not found');
        }
        if (!isAdmin && vendor.userId !== user.id) {
          throw new ForbiddenException(
            'You are not allowed to manage media for this vendor',
          );
        }
        break;
      }
      case MediaOwnerType.USER: {
        const owner = await this.prisma.user.findUnique({
          where: { id: ownerId },
          select: { id: true },
        });
        if (!owner) {
          throw new NotFoundException('USER not found');
        }
        if (!isAdmin && owner.id !== user.id) {
          throw new ForbiddenException('You can only manage your own media');
        }
        break;
      }
      case MediaOwnerType.CATEGORY: {
        const category = await this.prisma.category.findUnique({
          where: { id: ownerId },
          select: { id: true },
        });
        if (!category) {
          throw new NotFoundException('CATEGORY not found');
        }
        if (!isAdmin) {
          throw new ForbiddenException('Only admins can manage category media');
        }
        break;
      }
    }
  }

  // Generate a pre-signed URL for direct uploads (useful for large files)
  async getUploadUrl(dto: CreateMediaDto, filename: string, user: MediaUser) {
    await this.authorizeOwner(dto.ownerType, dto.ownerId, user);

    const ext = path.extname(filename);
    const hash = crypto.randomBytes(8).toString('hex');
    const key = `${dto.ownerType.toLowerCase()}/${dto.ownerId}/${hash}${ext}`;

    // Generate pre-signed URL if S3 client is configured
    if (this.s3Client) {
      try {
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          ContentType: this.getMimeType(ext),
        });
        const presignedUrl = await getSignedUrl(this.s3Client, command, {
          expiresIn: 3600,
        });

        return {
          uploadUrl: presignedUrl,
          key,
          expiresIn: 3600,
          finalUrl: `${this.cdnUrl}/${this.bucketName}/${key}`,
        };
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to generate presigned URL: ${errorMessage}`);
        throw new BadRequestException('Failed to generate upload URL');
      }
    }

    // Mock response for development
    return {
      uploadUrl: `${this.s3Endpoint}/${this.bucketName}/${key}`,
      key,
      expiresIn: 3600,
      finalUrl: `${this.s3Endpoint}/${this.bucketName}/${key}`,
    };
  }

  private getMimeType(ext: string): string {
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
  }
}
