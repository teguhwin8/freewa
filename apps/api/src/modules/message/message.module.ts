import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MessageController } from './message.controller';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { MessageProcessor } from './message.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'message-queue',
    }),
    WhatsappModule,
  ],
  controllers: [MessageController],
  providers: [MessageProcessor],
})
export class MessageModule {}
