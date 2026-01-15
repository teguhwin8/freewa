import {
  Body,
  Controller,
  Post,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ApiKeyGuard } from '../../common/guards/api-key/api-key.guard';
import { SendMessageDto } from './send-message.dto';
import { ApiTags, ApiSecurity, ApiOperation } from '@nestjs/swagger';

@ApiTags('Message')
@ApiSecurity('x-api-key')
@UseGuards(ApiKeyGuard)
@Controller('message')
export class MessageController {
  constructor(@InjectQueue('message-queue') private messageQueue: Queue) { }

  @Post('send')
  @ApiOperation({ summary: 'Send Text or Image message to queue' })
  async sendMessage(@Body() body: SendMessageDto) {
    const { to, type, message, url, caption, deviceId } = body;

    // Basic validation
    if (!to || !type) {
      throw new BadRequestException('Fields "to" and "type" are required!');
    }
    if (type === 'text' && !message) {
      throw new BadRequestException(
        'Field "message" is required for text type!',
      );
    }
    if (type === 'image' && !url) {
      throw new BadRequestException(
        'Field "url" is required for image type!',
      );
    }

    // Add to queue with deviceId
    await this.messageQueue.add('send-message', {
      type,
      to,
      message,
      url,
      caption,
      deviceId,
    });

    return {
      success: true,
      info: 'Message added to queue',
      data: { to, type, deviceId },
    };
  }
}
