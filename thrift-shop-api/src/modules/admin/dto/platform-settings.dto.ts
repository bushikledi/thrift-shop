import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdatePlatformSettingsDto {
  @ApiPropertyOptional({ example: 'ThriftShop' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  siteName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  siteDescription?: string;

  @ApiPropertyOptional({ example: 'support@thriftshop.com' })
  @IsOptional()
  @IsEmail()
  supportEmail?: string;

  @ApiPropertyOptional({
    description:
      'When enabled, the API rejects shopping traffic with 503. Admins and ' +
      'authentication remain available so it can be switched back off.',
  })
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;
}

export class PlatformSettingsResponseDto {
  @ApiProperty()
  siteName!: string;

  @ApiPropertyOptional({ nullable: true })
  siteDescription!: string | null;

  @ApiPropertyOptional({ nullable: true })
  supportEmail!: string | null;

  @ApiProperty()
  maintenanceMode!: boolean;

  @ApiProperty()
  updatedAt!: Date;
}
