import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../generated/prisma/client';

/**
 * Vendor summary in auth response (signup - minimal fields)
 */
export class AuthVendorMinimalDto {
  @ApiProperty({ description: 'Vendor ID', example: 'vendor-uuid-123' })
  id!: string;

  @ApiProperty({ description: 'Vendor name', example: 'vintage-finds' })
  name!: string;

  @ApiProperty({ description: 'Vendor display name', example: 'Vintage Finds' })
  displayName!: string;
}

/**
 * Vendor summary in auth response (login - full fields)
 */
export class AuthVendorDto extends AuthVendorMinimalDto {
  @ApiProperty({ description: 'Whether the vendor is verified', example: true })
  verified!: boolean;
}

/**
 * User information in auth response
 */
export class AuthUserDto {
  @ApiProperty({ description: 'User ID', example: 'user-uuid-123' })
  id!: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email!: string;

  @ApiProperty({ description: 'User display name', example: 'John Doe' })
  name!: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.CUSTOMER,
  })
  role!: UserRole;

  @ApiPropertyOptional({
    description: 'Vendor details if user is a vendor',
    type: AuthVendorMinimalDto,
  })
  vendor?: AuthVendorMinimalDto | AuthVendorDto | null;
}

/**
 * Response for login and signup endpoints
 */
export class AuthResponseDto {
  @ApiProperty({
    description: 'Authenticated user information',
    type: AuthUserDto,
  })
  user!: AuthUserDto;

  @ApiProperty({
    description: 'Token expiration time',
    example: '1d',
  })
  expiresIn!: string;
}

/**
 * Response for logout endpoint
 */
export class LogoutResponseDto {
  @ApiProperty({
    description: 'Logout status message',
    example: 'Logged out successfully',
  })
  message!: string;
}

/**
 * Response for forgot-password endpoint
 */
export class ForgotPasswordResponseDto {
  @ApiProperty({
    description: 'Status message',
    example: 'If an account with that email exists, a reset link has been sent',
  })
  message!: string;
}

/**
 * Response for reset-password endpoint
 */
export class ResetPasswordResponseDto {
  @ApiProperty({
    description: 'Status message',
    example: 'Password reset successful',
  })
  message!: string;
}

/**
 * Response for change-password endpoint
 */
export class ChangePasswordResponseDto {
  @ApiProperty({
    description: 'Status message',
    example: 'Password changed successfully',
  })
  message!: string;
}

/**
 * Response for /me endpoint
 */
export class MeResponseDto {
  @ApiProperty({
    description: 'Current user information',
    type: AuthUserDto,
  })
  user!: AuthUserDto;
}

/**
 * Response for refresh token endpoint
 */
export class RefreshTokenResponseDto {
  @ApiProperty({
    description: 'Token expiration time',
    example: '1d',
  })
  expiresIn!: string;
}
