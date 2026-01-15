import { Module, forwardRef } from '@nestjs/common';
import { DeviceController } from './device.controller';
import { DeviceService } from './device.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { ApiKeyModule } from '../api-key/api-key.module';

@Module({
    imports: [
        forwardRef(() => WhatsappModule),
        ApiKeyModule,
    ],
    controllers: [DeviceController],
    providers: [DeviceService],
    exports: [DeviceService],
})
export class DeviceModule { }
