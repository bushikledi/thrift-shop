import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PromoService } from './promo.service';
import { PromoValidationResponseDto, ValidatePromoDto } from './dto';
import { Public } from '../../common/decorators';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';

@ApiTags('promo')
@Controller('promo')
export class PromoController {
  constructor(private promoService: PromoService) {}

  @Public()
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  // Codes are short and guessable, so brute-force attempts are rate limited.
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Check a promo code against a cart subtotal',
    description:
      'Returns the discount the code is worth. Guest carts can use this, so it ' +
      'is public, but it never reveals why a code was rejected.',
  })
  @ApiResponse({
    status: 200,
    description: 'The code is valid for this subtotal',
    type: PromoValidationResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The code is not valid for this cart',
    type: ErrorResponseDto,
  })
  async validate(@Body() dto: ValidatePromoDto) {
    const promo = await this.promoService.validate(dto.code, dto.subtotal);

    return {
      code: promo.code,
      description: promo.description,
      discount: promo.discount,
      subtotalAfterDiscount:
        Math.round((dto.subtotal - promo.discount) * 100) / 100,
    };
  }
}
