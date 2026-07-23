import {
  IsString,
  IsOptional,
  IsObject,
  MinLength,
  IsIn,
  IsEmail,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export interface VendorPayoutDetails {
  method: 'bank' | 'paypal' | 'manual';
  accountHolder: string;
  accountNumber?: string;
  bankName?: string;
  routingNumber?: string;
  paypalEmail?: string;
  notes?: string;
}

class PayoutDetailsDto implements VendorPayoutDetails {
  @ApiPropertyOptional({ enum: ['bank', 'paypal', 'manual'], default: 'bank' })
  @IsIn(['bank', 'paypal', 'manual'])
  method!: VendorPayoutDetails['method'];

  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsString()
  accountHolder!: string;

  @ApiPropertyOptional({ example: '123456789' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'Community Bank' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ example: '987654321' })
  @IsOptional()
  @IsString()
  routingNumber?: string;

  @ApiPropertyOptional({ example: 'vendor-payments@example.com' })
  @IsOptional()
  @IsEmail()
  paypalEmail?: string;

  @ApiPropertyOptional({ example: 'Preferred payout via bank transfer' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateVendorDto {
  @ApiPropertyOptional({ example: 'Johns Vintage Shop' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  displayName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  banner?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  settings?: {
    policies?: {
      returns?: string;
      shipping?: string;
    };
    shippingOptions?: Array<{
      name: string;
      price: number;
      estimatedDays: number;
    }>;
    /**
     * Public store contact details, kept separate from the owner's account
     * email/phone (which are login credentials, not storefront information).
     */
    contact?: {
      email?: string;
      phone?: string;
    };
  };

  @ApiPropertyOptional({ type: PayoutDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PayoutDetailsDto)
  payoutDetails?: VendorPayoutDetails;
}
