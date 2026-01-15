'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Smartphone, Wifi, WifiOff, QrCode, Loader2 } from 'lucide-react';

interface Device {
    id: string;
    name: string;
    status: 'disconnected' | 'connecting' | 'scan_qr' | 'connected';
    phoneNumber?: string;
    qrCode?: string | null;
}

interface DeviceListItemProps {
    device: Device;
    isSelected: boolean;
    onClick: () => void;
}

export function DeviceListItem({ device, isSelected, onClick }: DeviceListItemProps) {
    const getStatusIcon = () => {
        switch (device.status) {
            case 'connected':
                return <Wifi className="size-3.5 text-emerald-500" />;
            case 'scan_qr':
                return <QrCode className="size-3.5 text-amber-500" />;
            case 'connecting':
                return <Loader2 className="size-3.5 text-muted-foreground animate-spin" />;
            default:
                return <WifiOff className="size-3.5 text-muted-foreground" />;
        }
    };

    const getStatusText = () => {
        switch (device.status) {
            case 'connected':
                return 'Connected';
            case 'scan_qr':
                return 'Scan QR Code';
            case 'connecting':
                return 'Connecting...';
            default:
                return 'Disconnected';
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((word) => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
                'hover:bg-accent/50',
                isSelected && 'bg-accent'
            )}
        >
            <Avatar className="size-12 bg-primary/10">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(device.name)}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <p className="font-medium truncate">{device.name}</p>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                        {device.id.slice(0, 6)}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                    {getStatusIcon()}
                    <span className={cn(
                        'text-sm',
                        device.status === 'connected' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                    )}>
                        {getStatusText()}
                    </span>
                </div>
            </div>
        </div>
    );
}
