import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueController } from './queue.controller';
import { ApiKeyModule } from '../api-key/api-key.module';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'message-queue',
        }),
        ApiKeyModule,
    ],
    controllers: [QueueController],
})
export class QueueModule { }
