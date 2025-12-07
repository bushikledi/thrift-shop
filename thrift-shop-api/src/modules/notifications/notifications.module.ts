import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { OrderEventListener } from './listeners';
import { PrismaModule } from '../../prisma';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, OrderEventListener],
  exports: [NotificationsService],
})
export class NotificationsModule {}
