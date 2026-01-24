import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
    Inject,
    forwardRef,
} from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ApiKeyGuard } from '../../common/guards/api-key/api-key.guard';
import { ChatService } from './chat.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { SendMessageDto, MarkAsReadDto } from './chat.dto';

@ApiTags('Chat')
@ApiSecurity('x-api-key')
@UseGuards(ApiKeyGuard)
@Controller('chat')
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
        @Inject(forwardRef(() => WhatsappService))
        private readonly whatsappService: WhatsappService,
    ) { }

    @Get(':deviceId')
    @ApiOperation({ summary: 'Get all chats for a device' })
    @ApiParam({ name: 'deviceId', description: 'Device ID' })
    async getChats(@Param('deviceId') deviceId: string) {
        const chats = await this.chatService.getChats(deviceId);
        return {
            success: true,
            data: chats,
        };
    }

    @Get(':deviceId/:chatId/messages')
    @ApiOperation({ summary: 'Get messages for a specific chat' })
    @ApiParam({ name: 'deviceId', description: 'Device ID' })
    @ApiParam({ name: 'chatId', description: 'Chat ID (phone number)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of messages to fetch (default: 50)' })
    async getMessages(
        @Param('deviceId') deviceId: string,
        @Param('chatId') chatId: string,
        @Query('limit') limit?: number,
    ) {
        const messages = await this.chatService.getMessages(
            deviceId,
            chatId,
            limit ? Number(limit) : 50,
        );
        return {
            success: true,
            data: messages,
        };
    }

    @Patch(':deviceId/:chatId/read')
    async markAsRead(
        @Param('deviceId') deviceId: string,
        @Param('chatId') chatId: string,
    ) {
        try {
            await this.chatService.markAsRead(deviceId, chatId);
            return {
                success: true,
                message: 'Chat marked as read',
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    @Post(':deviceId/send')
    @ApiOperation({ summary: 'Send a message' })
    @ApiParam({ name: 'deviceId', description: 'Device ID' })
    async sendMessage(
        @Param('deviceId') deviceId: string,
        @Body() dto: SendMessageDto,
    ) {
        // Send message via WhatsApp
        await this.whatsappService.sendText(deviceId, dto.to, dto.message);

        // Extract chat ID (phone number without domain)
        const chatId = dto.to.replace(/[^0-9]/g, '');

        // Store the sent message in database
        const message = await this.chatService.addMessage({
            deviceId,
            chatId,
            from: deviceId, // We'll use deviceId as placeholder for sender
            to: `${chatId}@s.whatsapp.net`,
            body: dto.message,
            timestamp: Date.now(),
            fromMe: true,
            status: 'sent',
        });

        return {
            success: true,
            data: message,
            message: 'Message sent successfully',
        };
    }


    @Delete(':deviceId/:chatId')
    @ApiOperation({ summary: 'Delete a chat and its messages' })
    @ApiParam({ name: 'deviceId', description: 'Device ID' })
    @ApiParam({ name: 'chatId', description: 'Chat ID (phone number)' })
    async deleteChat(
        @Param('deviceId') deviceId: string,
        @Param('chatId') chatId: string,
    ) {
        await this.chatService.deleteChat(deviceId, chatId);
        return {
            success: true,
            message: 'Chat deleted',
        };
    }
}
