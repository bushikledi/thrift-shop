import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, ValidateNested } from 'class-validator';

/**
 * Notification opt-ins for a single delivery channel.
 *
 * Every field is optional so a client can PATCH one toggle without resending
 * the whole object; unspecified values keep their stored setting.
 */
export class NotificationChannelPreferencesDto {
  @ApiPropertyOptional({ description: 'Order status updates' })
  @IsOptional()
  @IsBoolean()
  orders?: boolean;

  @ApiPropertyOptional({ description: 'Promotions and offers' })
  @IsOptional()
  @IsBoolean()
  promotions?: boolean;

  @ApiPropertyOptional({ description: 'Review activity' })
  @IsOptional()
  @IsBoolean()
  reviews?: boolean;

  @ApiPropertyOptional({ description: 'Direct messages' })
  @IsOptional()
  @IsBoolean()
  messages?: boolean;
}

export class NotificationPreferencesDto {
  @ApiPropertyOptional({ type: NotificationChannelPreferencesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationChannelPreferencesDto)
  email?: NotificationChannelPreferencesDto;

  @ApiPropertyOptional({ type: NotificationChannelPreferencesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationChannelPreferencesDto)
  sms?: NotificationChannelPreferencesDto;
}

export class UpdateUserPreferencesDto {
  @ApiPropertyOptional({ type: NotificationPreferencesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationPreferencesDto)
  notifications?: NotificationPreferencesDto;
}

/** Fully-resolved preferences (defaults applied), as returned by the API. */
export class UserPreferencesResponseDto {
  @ApiProperty({
    description: 'Notification opt-ins per channel',
    example: {
      email: { orders: true, promotions: false, reviews: true, messages: true },
      sms: {
        orders: false,
        promotions: false,
        reviews: false,
        messages: false,
      },
    },
  })
  notifications!: Required<{
    email: Required<NotificationChannelPreferencesDto>;
    sms: Required<NotificationChannelPreferencesDto>;
  }>;
}
