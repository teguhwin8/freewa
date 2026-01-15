import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueController } from './queue.controller';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'message-queue',
        }),
    ],
    controllers: [QueueController],
})
export class QueueModule { }
