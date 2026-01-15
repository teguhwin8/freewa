export type DeviceStatus = 'disconnected' | 'connecting' | 'scan_qr' | 'connected';

export interface Device {
    id: string;
    name: string;
    status: DeviceStatus;
    phoneNumber?: string;
    webhookUrl?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateDeviceDto {
    name: string;
    webhookUrl?: string | null;
}

export interface DeviceWithQr extends Device {
    qrCode?: string | null;
}
