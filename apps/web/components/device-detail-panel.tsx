'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { WebhookDialog } from '@/components/webhook-dialog';
import {
    Smartphone,
    CheckCircle2,
    Loader2,
    WifiOff,
    Link2,
    Unplug,
    Trash2,
    Copy,
    Webhook,
} from 'lucide-react';

interface Device {
    id: string;
    name: string;
    status: 'disconnected' | 'connecting' | 'scan_qr' | 'connected';
    phoneNumber?: string;
    qrCode?: string | null;
    webhookUrl?: string | null;
}

interface DeviceDetailPanelProps {
    device: Device | null;
    onConnect: (deviceId: string) => void;
    onDisconnect: (deviceId: string) => void;
    onDelete: (deviceId: string) => void;
    onUpdateWebhook: (deviceId: string, webhookUrl: string | null) => Promise<void>;
}

export function DeviceDetailPanel({
    device,
    onConnect,
    onDisconnect,
    onDelete,
    onUpdateWebhook,
}: DeviceDetailPanelProps) {
    const [isWebhookDialogOpen, setIsWebhookDialogOpen] = useState(false);

    const copyDeviceId = () => {
        if (device) {
            navigator.clipboard.writeText(device.id);
        }
    };

    // Empty state - no device selected
    if (!device) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-muted/20">
                <div className="text-center max-w-md px-8">
                    <div className="size-32 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                        <Smartphone className="size-16 text-muted-foreground/50" />
                    </div>
                    <h2 className="text-2xl font-semibold text-muted-foreground mb-2">
                        FreeWA for Desktop
                    </h2>
                    <p className="text-muted-foreground">
                        Select a device from the sidebar to view details and manage WhatsApp connection.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
                <div className="flex items-center gap-4">
                    <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Smartphone className="size-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">{device.name}</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <Badge
                                variant={device.status === 'connected' ? 'default' : 'secondary'}
                                className={device.status === 'connected' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                            >
                                {device.status === 'connected' && 'Connected'}
                                {device.status === 'scan_qr' && 'Scan QR'}
                                {device.status === 'connecting' && 'Connecting'}
                                {device.status === 'disconnected' && 'Disconnected'}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onDelete(device.id)}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 className="size-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete device</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-muted/20">
                {/* QR Code State */}
                {device.status === 'scan_qr' && device.qrCode && (
                    <div className="text-center">
                        <div className="bg-white p-6 rounded-2xl shadow-xl inline-block mb-6">
                            <QRCodeSVG value={device.qrCode} size={264} />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Scan QR Code</h3>
                        <p className="text-muted-foreground max-w-sm">
                            Open WhatsApp on your phone → Menu → Linked Devices → Link a Device
                        </p>
                    </div>
                )}

                {/* Connected State */}
                {device.status === 'connected' && (
                    <div className="text-center">
                        <div className="size-24 mx-auto mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 className="size-12 text-emerald-500" />
                        </div>
                        <h3 className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                            WhatsApp Connected!
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            This device is ready to send messages via API
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => onDisconnect(device.id)}
                            className="gap-2"
                        >
                            <Unplug className="size-4" />
                            Disconnect Device
                        </Button>
                    </div>
                )}

                {/* Connecting State */}
                {device.status === 'connecting' && (
                    <div className="text-center">
                        <div className="size-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                            <Loader2 className="size-12 text-muted-foreground animate-spin" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Connecting...</h3>
                        <p className="text-muted-foreground">
                            Please wait while we establish connection
                        </p>
                    </div>
                )}

                {/* Disconnected State */}
                {device.status === 'disconnected' && (
                    <div className="text-center">
                        <div className="size-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                            <WifiOff className="size-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Device Disconnected</h3>
                        <p className="text-muted-foreground mb-6">
                            Connect this device to start sending messages
                        </p>
                        <Button onClick={() => onConnect(device.id)} className="gap-2">
                            <Link2 className="size-4" />
                            Connect Device
                        </Button>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-6 py-4 bg-card space-y-4">
                {/* Device ID */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Device ID</p>
                        <code className="text-xs text-muted-foreground font-mono">
                            {device.id}
                        </code>
                    </div>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={copyDeviceId}>
                                    <Copy className="size-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy Device ID</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                <Separator />

                {/* Webhook Configuration */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-muted-foreground">Webhook URL</p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsWebhookDialogOpen(true)}
                            className="h-7 text-xs"
                        >
                            <Webhook className="size-3 mr-1" />
                            {device.webhookUrl ? 'Edit' : 'Configure'}
                        </Button>
                    </div>
                    {device.webhookUrl ? (
                        <code className="text-xs text-muted-foreground font-mono block truncate">
                            {device.webhookUrl}
                        </code>
                    ) : (
                        <p className="text-xs text-muted-foreground italic">
                            Using global webhook (if configured)
                        </p>
                    )}
                </div>
            </div>

            {/* Webhook Dialog */}
            {device && (
                <WebhookDialog
                    open={isWebhookDialogOpen}
                    onOpenChange={setIsWebhookDialogOpen}
                    deviceId={device.id}
                    deviceName={device.name}
                    currentWebhook={device.webhookUrl}
                    onSave={(webhookUrl) => onUpdateWebhook(device.id, webhookUrl)}
                />
            )}
        </div>
    );
}
