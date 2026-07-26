import { IsString, IsOptional, IsObject, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Note there is no `email` here, and that is deliberate: the address is the
 * login identity and is tied to `emailVerified`, so changing it needs its own
 * verified flow rather than riding along with a profile save.
 */
export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: '+355691234567' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: 'Long-time thrifter, mostly denim.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({
    example: {
      street: '123 Main St',
      city: 'Tirana',
      state: 'Tirana',
      zip: '1001',
      country: 'Albania',
    },
  })
  @IsOptional()
  @IsObject()
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}
