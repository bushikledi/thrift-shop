import { IsEmail, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Human-readable order number format: TS-YYYY-NNNNN */
export const ORDER_NUMBER_REGEX = /^TS-\d{4}-\d{5}$/;

/**
 * Guest order lookup.
 *
 * Order numbers are sequential and therefore guessable, so the email used to
 * place the order is required as a proof-of-ownership factor. Sent in the body
 * (not the URL) to keep the address out of request logs.
 */
export class TrackOrderDto {
  @ApiProperty({
    description: 'Order number in format TS-YYYY-NNNNN',
    example: 'TS-2024-00001',
  })
  @IsString()
  @Matches(ORDER_NUMBER_REGEX, {
    message: 'Invalid order number format. Expected format: TS-YYYY-NNNNN',
  })
  orderNumber!: string;

  @ApiProperty({
    description: 'Email address used to place the order',
    example: 'buyer@example.com',
  })
  @IsEmail({}, { message: 'A valid email address is required' })
  email!: string;
}
