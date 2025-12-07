import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma';
import { NotificationsService } from '../notifications/notifications.service';
import { SignupDto } from './dto';
import { UserRole } from '../../generated/prisma/client';
import { BCRYPT_ROUNDS, SLUG_UUID_LENGTH } from '../../common/constants';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
  ) {}

  async signup(dto: SignupDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // Create user (and vendor if role is VENDOR)
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
        phone: dto.phone,
        role: dto.role,
        ...(dto.role === UserRole.VENDOR && dto.displayName
          ? {
              vendor: {
                create: {
                  name: this.generateSlug(dto.displayName),
                  displayName: dto.displayName,
                  bio: dto.bio,
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        vendor: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
      },
    });

    // Generate token
    const tokens = this.generateTokens(user.id, user.email, user.role);

    return {
      user,
      ...tokens,
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
        isActive: true,
        vendor: {
          select: {
            id: true,
            name: true,
            displayName: true,
            verified: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    const { passwordHash, ...result } = user;
    void passwordHash;
    return result;
  }

  login(user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    vendor?: {
      id: string;
      name: string;
      displayName: string;
      verified: boolean;
    } | null;
  }) {
    const tokens = this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        vendor: user.vendor || null,
      },
      ...tokens,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a reset link will be sent' };
    }

    // Generate reset token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await this.prisma.passwordReset.create({
      data: {
        email: email.toLowerCase(),
        token,
        expiresAt,
      },
    });

    // Send password reset email
    const appUrl = this.configService.get<string>(
      'APP_URL',
      'http://localhost:3000',
    );
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    try {
      await this.notificationsService.sendPasswordReset(
        email.toLowerCase(),
        token,
        resetUrl,
      );
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send password reset email: ${errorMessage}`);
      // Don't fail the request even if email fails - token is still valid
    }

    return { message: 'If the email exists, a reset link will be sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    // Use atomic update to prevent token reuse race condition
    const resetRecord = await this.prisma.passwordReset.findUnique({
      where: { token },
    });

    if (!resetRecord || resetRecord.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Atomically mark token as used and check if it was already used
    const updatedReset = await this.prisma.passwordReset.updateMany({
      where: {
        id: resetRecord.id,
        used: false, // Only update if not already used
      },
      data: { used: true },
    });

    if (updatedReset.count === 0) {
      throw new BadRequestException('Token has already been used');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: resetRecord.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return { message: 'Password reset successfully' };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Password changed successfully' };
  }

  async refreshToken(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  private generateTokens(userId: string, email: string, role: UserRole) {
    const payload = { sub: userId, email, role: role.toString() };

    const jwtSecret = this.configService.get<string>('jwt.secret');
    if (!jwtSecret) {
      throw new Error('JWT secret is not configured');
    }

    const accessToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: 86400, // 1 day in seconds
    });

    return {
      accessToken,
      expiresIn: '1d',
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .concat('-', uuidv4().slice(0, SLUG_UUID_LENGTH));
  }
}
