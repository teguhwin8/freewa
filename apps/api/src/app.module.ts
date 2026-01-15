import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { MessageModule } from './modules/message/message.module';
import { EventsModule } from './modules/events/events.module';
import { DeviceModule } from './modules/device/device.module';
import { QueueModule } from './modules/queue/queue.module';

@Module({
  imports: [
    // Load .env file
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    WhatsappModule,
    MessageModule,
    EventsModule,
    DeviceModule,
    QueueModule,
  ],
  providers: [],
})
export class AppModule { }
