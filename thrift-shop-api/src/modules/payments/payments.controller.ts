import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';
import { Public } from '../../common/decorators';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  /**
   * Stripe webhook receiver.
   *
   * Public because Stripe calls it directly, but every request must carry a
   * valid `stripe-signature` computed with the webhook secret, so it is not
   * callable by third parties. Requires the raw body (see `rawBody` in main.ts)
   * because re-serialising JSON invalidates the signature.
   */
  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @ApiExcludeEndpoint()
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }
    if (!req.rawBody) {
      throw new BadRequestException('Missing raw request body');
    }

    const event = this.paymentsService.constructEvent(req.rawBody, signature);
    await this.paymentsService.handleEvent(event);

    // Acknowledge quickly so Stripe does not retry.
    return { received: true };
  }
}
