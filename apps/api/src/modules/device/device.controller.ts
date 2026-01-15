import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiOperation } from '@nestjs/swagger';
import { ApiKeyGuard } from '../../common/guards/api-key/api-key.guard';
import { DeviceService } from './device.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import type { DeviceWithQr } from './device.interface';

class CreateDeviceDto {
    name: string;
    webhookUrl?: string | null;
}

@ApiTags('Device')
@ApiSecurity('x-api-key')
@UseGuards(ApiKeyGuard)
@Controller('device')
export class DeviceController {
    constructor(
        private readonly deviceService: DeviceService,
        private readonly whatsappService: WhatsappService,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Create a new WhatsApp device' })
    create(@Body() dto: CreateDeviceDto) {
        const device = this.deviceService.create(dto);
        return {
            success: true,
            data: device,
        };
    }

    @Get()
    @ApiOperation({ summary: 'Get all devices with their status' })
    findAll(): { success: boolean; data: DeviceWithQr[] } {
        const devices = this.deviceService.findAll();
        const devicesWithQr: DeviceWithQr[] = devices.map((device) => ({
            ...device,
            qrCode: this.whatsappService.getQrCode(device.id),
        }));
        return {
            success: true,
            data: devicesWithQr,
        };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a device by ID' })
    findOne(@Param('id') id: string): { success: boolean; data: DeviceWithQr } {
        const device = this.deviceService.findOne(id);
        return {
            success: true,
            data: {
                ...device,
                qrCode: this.whatsappService.getQrCode(id),
            },
        };
    }

    @Post(':id/connect')
    @ApiOperation({ summary: 'Connect a device to WhatsApp' })
    async connect(@Param('id') id: string) {
        // Validate device exists
        this.deviceService.findOne(id);

        await this.whatsappService.connectDevice(id);
        return {
            success: true,
            message: 'Connection initiated. Check WebSocket for QR code.',
        };
    }

    @Post(':id/disconnect')
    @ApiOperation({ summary: 'Disconnect a device from WhatsApp' })
    async disconnect(@Param('id') id: string) {
        this.deviceService.findOne(id);
        await this.whatsappService.disconnectDevice(id);
        return {
            success: true,
            message: 'Device disconnected',
        };
    }

    @Patch(':id/webhook')
    @ApiOperation({ summary: 'Update device webhook URL' })
    updateWebhook(@Param('id') id: string, @Body() body: { webhookUrl: string | null }) {
        const device = this.deviceService.updateWebhook(id, body.webhookUrl);
        return {
            success: true,
            data: device,
            message: 'Webhook URL updated',
        };
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a device and its session' })
    async delete(@Param('id') id: string) {
        // Disconnect first if connected
        await this.whatsappService.disconnectDevice(id);
        this.whatsappService.deleteSession(id);
        this.deviceService.delete(id);
        return {
            success: true,
            message: 'Device deleted',
        };
    }
}
