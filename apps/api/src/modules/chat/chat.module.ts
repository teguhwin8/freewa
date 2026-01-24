import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { Chat } from './entities/chat.entity';
import { Message } from './entities/message.entity';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { ApiKeyModule } from '../api-key/api-key.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Chat, Message]),
        forwardRef(() => WhatsappModule),
        ApiKeyModule,
    ],
    providers: [ChatService],
    controllers: [ChatController],
    exports: [ChatService],
})
export class ChatModule { }
