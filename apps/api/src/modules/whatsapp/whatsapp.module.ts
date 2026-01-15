import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WhatsappService } from './whatsapp.service';
import { EventsModule } from '../events/events.module';
import { DeviceModule } from '../device/device.module';

@Module({
  imports: [HttpModule, EventsModule, forwardRef(() => DeviceModule)],
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class WhatsappModule { }
