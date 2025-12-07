import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  Matches,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../generated/prisma/client';

export class SignupDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Password must contain uppercase, lowercase, and number/special character',
  })
  password!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ example: '+355691234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: ['CUSTOMER', 'VENDOR'], example: 'CUSTOMER' })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiPropertyOptional({ example: 'Johns Vintage Shop' })
  @ValidateIf((o: SignupDto) => o.role === UserRole.VENDOR)
  @IsString()
  @MinLength(3)
  displayName?: string;

  @ApiPropertyOptional({
    example: 'Selling quality vintage clothing since 2020',
  })
  @IsOptional()
  @IsString()
  bio?: string;
}

export class VendorSignupDto extends SignupDto {}
