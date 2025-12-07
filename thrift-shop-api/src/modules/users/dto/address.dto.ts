import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddressDto {
  @ApiProperty({ example: '123 Main St' })
  @IsString()
  @IsNotEmpty()
  street!: string;

  @ApiProperty({ example: 'Tirana' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ example: 'Tirana' })
  @IsString()
  @IsNotEmpty()
  state!: string;

  @ApiProperty({ example: '1001' })
  @IsString()
  @IsNotEmpty()
  zip!: string;

  @ApiProperty({ example: 'Albania' })
  @IsString()
  @IsNotEmpty()
  country!: string;
}

export class UpdateAddressDto {
  @ApiPropertyOptional({ example: '123 Main St' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  street?: string;

  @ApiPropertyOptional({ example: 'Tirana' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  city?: string;

  @ApiPropertyOptional({ example: 'Tirana' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  state?: string;

  @ApiPropertyOptional({ example: '1001' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  zip?: string;

  @ApiPropertyOptional({ example: 'Albania' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  country?: string;
}
