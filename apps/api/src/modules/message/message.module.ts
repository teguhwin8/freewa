import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MessageController } from './message.controller';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { MessageProcessor } from './message.processor';
import { ApiKeyModule } from '../api-key/api-key.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'message-queue',
    }),
    WhatsappModule,
    ApiKeyModule,
  ],
  controllers: [MessageController],
  providers: [MessageProcessor],
})
export class MessageModule { }
