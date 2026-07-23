import { Module } from '@nestjs/common';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';
import { EncryptionService } from '../../common/utils';

@Module({
  controllers: [VendorsController],
  providers: [VendorsService, EncryptionService],
  exports: [VendorsService],
})
export class VendorsModule {}
