import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { MessageModule } from './modules/message/message.module';
import { EventsModule } from './modules/events/events.module';
import { DeviceModule } from './modules/device/device.module';
import { QueueModule } from './modules/queue/queue.module';
import { ApiKeyModule } from './modules/api-key/api-key.module';
import { ChatModule } from './modules/chat/chat.module';
import { Chat } from './modules/chat/entities/chat.entity';
import { Message } from './modules/chat/entities/message.entity';

@Module({
  imports: [
    // Load .env file
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // TypeORM configuration
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'user',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'freewa',
      entities: [Chat, Message],
      synchronize: true, // Auto-create tables (disable in production!)
      logging: false,
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
    ApiKeyModule,
    ChatModule,
  ],
  providers: [],
})
export class AppModule { }
