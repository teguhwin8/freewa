import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { Device, CreateDeviceDto, DeviceStatus } from './device.interface';

@Injectable()
export class DeviceService {
    private devices: Map<string, Device> = new Map();
    private readonly storagePath: string;

    constructor() {
        this.storagePath = path.resolve(__dirname, '../../../../devices.json');
        this.loadDevices();
    }

    private loadDevices() {
        try {
            if (fs.existsSync(this.storagePath)) {
                const data = fs.readFileSync(this.storagePath, 'utf-8');
                const parsed = JSON.parse(data) as Device[];
                parsed.forEach((device) => {
                    // Reset status to disconnected on startup
                    device.status = 'disconnected';
                    device.createdAt = new Date(device.createdAt);
                    device.updatedAt = new Date(device.updatedAt);
                    this.devices.set(device.id, device);
                });
                console.log(`📱 Loaded ${this.devices.size} devices from storage`);
            }
        } catch (error) {
            console.error('Failed to load devices:', error);
        }
    }

    private saveDevices() {
        try {
            const devicesArray = Array.from(this.devices.values());
            fs.writeFileSync(this.storagePath, JSON.stringify(devicesArray, null, 2));
        } catch (error) {
            console.error('Failed to save devices:', error);
        }
    }

    create(dto: CreateDeviceDto): Device {
        const device: Device = {
            id: uuidv4(),
            name: dto.name,
            status: 'disconnected',
            webhookUrl: dto.webhookUrl || null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.devices.set(device.id, device);
        this.saveDevices();
        console.log(`📱 Device created: ${device.name} (${device.id})`);
        return device;
    }

    updateWebhook(id: string, webhookUrl: string | null): Device {
        const device = this.findOne(id);
        device.webhookUrl = webhookUrl;
        device.updatedAt = new Date();
        this.devices.set(id, device);
        this.saveDevices();
        console.log(`📱 Webhook updated for device ${id}: ${webhookUrl || 'null'}`);
        return device;
    }

    findAll(): Device[] {
        return Array.from(this.devices.values());
    }

    findOne(id: string): Device {
        const device = this.devices.get(id);
        if (!device) {
            throw new NotFoundException(`Device with ID ${id} not found`);
        }
        return device;
    }

    updateStatus(id: string, status: DeviceStatus, phoneNumber?: string): Device {
        const device = this.findOne(id);
        device.status = status;
        if (phoneNumber) {
            device.phoneNumber = phoneNumber;
        }
        device.updatedAt = new Date();
        this.devices.set(id, device);
        this.saveDevices();
        return device;
    }

    delete(id: string): void {
        const device = this.findOne(id);
        this.devices.delete(id);
        this.saveDevices();
        console.log(`📱 Device deleted: ${device.name} (${id})`);
    }

    getFirstConnected(): Device | null {
        for (const device of this.devices.values()) {
            if (device.status === 'connected') {
                return device;
            }
        }
        return null;
    }
}
