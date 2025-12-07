import { IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiProperty({ default: 1 })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  quantity!: number;
}

export class UpdateCartItemDto {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  quantity!: number;
}
