import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class FlagProductDto {
  @ApiProperty({
    description: 'Why the listing is being flagged, shown to other admins',
    example: 'Counterfeit branding in the product photos',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}
