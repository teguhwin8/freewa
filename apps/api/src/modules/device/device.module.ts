import { Module, forwardRef } from '@nestjs/common';
import { DeviceController } from './device.controller';
import { DeviceService } from './device.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
    imports: [forwardRef(() => WhatsappModule)],
    controllers: [DeviceController],
    providers: [DeviceService],
    exports: [DeviceService],
})
export class DeviceModule { }
