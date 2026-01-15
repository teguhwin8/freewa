import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { WhatsappService } from '../whatsapp/whatsapp.service';

interface SendMessageJobData {
  type: 'text' | 'image';
  to: string;
  message?: string;
  url?: string;
  caption?: string;
  deviceId?: string;
}

@Processor('message-queue')
export class MessageProcessor extends WorkerHost {
  constructor(private readonly whatsappService: WhatsappService) {
    super();
  }

  async process(job: Job<SendMessageJobData>): Promise<any> {
    const { type, to, message, url, caption, deviceId } = job.data;
    console.log(
      `Processing job ${job.id} type: ${type} device: ${deviceId || 'default'}`,
    );

    try {
      if (type === 'text' && message) {
        await this.whatsappService.sendText(deviceId, to, message);
      } else if (type === 'image' && url) {
        await this.whatsappService.sendPhoto(deviceId, to, url, caption);
      }

      return { status: 'success', type, to, deviceId };
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }
}
