import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './entities/chat.entity';
import { Message } from './entities/message.entity';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(Chat)
        private chatRepository: Repository<Chat>,
        @InjectRepository(Message)
        private messageRepository: Repository<Message>,
    ) { }

    async getChats(deviceId: string): Promise<Chat[]> {
        return this.chatRepository.find({
            where: { deviceId },
            order: { updatedAt: 'DESC' },
        });
    }

    async getMessages(deviceId: string, chatId: string, limit = 50): Promise<Message[]> {
        return this.messageRepository.find({
            where: { deviceId, chatId },
            order: { createdAt: 'ASC' },
            take: limit,
        });
    }

    async upsertChat(
        deviceId: string,
        chatId: string,
        lastMessage?: { body: string; timestamp: number },
        name?: string,
    ): Promise<Chat> {
        let chat = await this.chatRepository.findOne({
            where: { deviceId, chatId },
        });

        if (!chat) {
            chat = this.chatRepository.create({
                deviceId,
                chatId,
                name,
                lastMessageBody: lastMessage?.body,
                lastMessageTimestamp: lastMessage?.timestamp,
                unreadCount: 0,
            });
        } else {
            if (lastMessage) {
                chat.lastMessageBody = lastMessage.body;
                chat.lastMessageTimestamp = lastMessage.timestamp;
            }
            if (name) {
                chat.name = name;
            }
        }

        return this.chatRepository.save(chat);
    }

    async addMessage(data: {
        deviceId: string;
        chatId: string;
        from: string;
        to: string;
        body: string;
        timestamp: number;
        fromMe: boolean;
        status?: string;
    }): Promise<Message> {
        const message = this.messageRepository.create({
            ...data,
            status: data.status || 'sent',
        });

        const saved = await this.messageRepository.save(message);

        // Update chat's last message
        await this.upsertChat(data.deviceId, data.chatId, {
            body: data.body,
            timestamp: data.timestamp,
        });

        // Increment unread count if not from me
        if (!data.fromMe) {
            await this.chatRepository.increment(
                { deviceId: data.deviceId, chatId: data.chatId },
                'unreadCount',
                1,
            );
        }

        return saved;
    }

    async markAsRead(deviceId: string, chatId: string): Promise<void> {
        await this.chatRepository.update(
            { deviceId, chatId },
            { unreadCount: 0 },
        );
    }

    async deleteChat(deviceId: string, chatId: string): Promise<void> {
        await this.messageRepository.delete({ deviceId, chatId });
        await this.chatRepository.delete({ deviceId, chatId });
    }
}
