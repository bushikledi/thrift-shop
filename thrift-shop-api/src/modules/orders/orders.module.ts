import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrderNumberService } from '../../common/utils';

@Module({
  imports: [NotificationsModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository, OrderNumberService],
  exports: [OrdersService, OrdersRepository, OrderNumberService],
})
export class OrdersModule {}
