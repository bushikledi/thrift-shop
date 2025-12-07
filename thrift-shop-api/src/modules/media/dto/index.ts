import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { MediaOwnerType } from '../../../generated/prisma/client';

export class CreateMediaDto {
  @IsEnum(MediaOwnerType)
  ownerType!: MediaOwnerType;

  @IsUUID()
  ownerId!: string;

  @IsOptional()
  @IsString()
  altText?: string;
}

export class MediaQueryDto {
  @IsOptional()
  @IsEnum(MediaOwnerType)
  ownerType?: MediaOwnerType;

  @IsOptional()
  @IsUUID()
  ownerId?: string;
}
