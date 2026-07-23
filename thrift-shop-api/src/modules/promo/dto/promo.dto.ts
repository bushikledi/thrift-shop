import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class ValidatePromoDto {
  @ApiProperty({ example: 'WELCOME10' })
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  code!: string;

  @ApiProperty({
    description: 'Cart subtotal the discount would apply to',
    example: 120.5,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  subtotal!: number;
}

export class PromoValidationResponseDto {
  @ApiProperty()
  code!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ description: 'Amount taken off the subtotal' })
  discount!: number;

  @ApiProperty({ description: 'Subtotal once the discount is applied' })
  subtotalAfterDiscount!: number;
}
