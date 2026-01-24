'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { WebhookDialog } from '@/components/webhook-dialog';
import {
    Smartphone,
    ArrowLeft,
    Plus,
    Trash2,
    CheckCircle,
    Loader2,
    PhoneOff,
    Link2,
    Unplug,
    Webhook,
} from 'lucide-react';
import { fetchDevices as fetchDevicesAction, createDevice as createDeviceAction, connectDevice as connectDeviceAction, disconnectDevice as disconnectDeviceAction, deleteDevice as deleteDeviceAction, updateWebhook as updateWebhookAction } from '@/app/actions/devices';

interface Device {
    id: string;
    name: string;
    status: 'disconnected' | 'connecting' | 'scan_qr' | 'connected';
    phoneNumber?: string;
    qrCode?: string | null;
    webhookUrl?: string | null;
}

export default function DevicesPage() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [devices, setDevices] = useState<Device[]>([]);
    const [newDeviceName, setNewDeviceName] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
    const [isWebhookDialogOpen, setIsWebhookDialogOpen] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const fetchDevices = useCallback(async () => {
        const data = await fetchDevicesAction();
        if (data.success) {
            setDevices(data.data);
        }
    }, []);

    useEffect(() => {
        const newSocket = io(API_URL);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to WebSocket');
        });

        newSocket.on('devices:list', () => {
            fetchDevices();
        });

        return () => {
            newSocket.disconnect();
        };
    }, [API_URL, fetchDevices]);

    useEffect(() => {
        if (!socket) return;

        devices.forEach((device) => {
            socket.on(`device:${device.id}:status`, (status: string) => {
                setDevices((prev) =>
                    prev.map((d) =>
                        d.id === device.id ? { ...d, status: status as Device['status'] } : d
                    )
                );
            });

            socket.on(`device:${device.id}:qr`, (qr: string | null) => {
                setDevices((prev) =>
                    prev.map((d) => (d.id === device.id ? { ...d, qrCode: qr } : d))
                );
            });

            socket.on(`device:${device.id}:phoneNumber`, (phoneNumber: string) => {
                setDevices((prev) =>
                    prev.map((d) => (d.id === device.id ? { ...d, phoneNumber } : d))
                );
            });
        });

        return () => {
            devices.forEach((device) => {
                socket.off(`device:${device.id}:status`);
                socket.off(`device:${device.id}:qr`);
                socket.off(`device:${device.id}:phoneNumber`);
            });
        };
    }, [socket, devices]);

    useEffect(() => {
        fetchDevices();
    }, [fetchDevices]);

    const createDevice = async () => {
        if (!newDeviceName.trim()) return;
        setLoading(true);
        const data = await createDeviceAction(newDeviceName);
        if (data.success) {
            setNewDeviceName('');
            fetchDevices();
        }
        setLoading(false);
    };

    const connectDevice = async (deviceId: string) => {
        setSelectedDevice(deviceId);
        await connectDeviceAction(deviceId);
        fetchDevices();
    };

    const disconnectDevice = async (deviceId: string) => {
        await disconnectDeviceAction(deviceId);
        fetchDevices();
    };

    const deleteDevice = async (deviceId: string) => {
        if (!confirm('Are you sure you want to delete this device?')) return;
        await deleteDeviceAction(deviceId);
        setSelectedDevice(null);
        fetchDevices();
    };

    const handleUpdateWebhook = async (deviceId: string, webhookUrl: string | null) => {
        await updateWebhookAction(deviceId, webhookUrl || '');
        fetchDevices();
    };

    const getStatusBadge = (status: Device['status']) => {
        switch (status) {
            case 'connected':
                return <Badge>Connected</Badge>;
            case 'scan_qr':
                return <Badge variant="secondary">Scan QR</Badge>;
            case 'connecting':
                return <Badge variant="secondary">Connecting...</Badge>;
            default:
                return <Badge variant="outline">Disconnected</Badge>;
        }
    };

    const currentDevice = devices.find((d) => d.id === selectedDevice);

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Smartphone className="size-8" /> Device Manager
                        </h1>
                        <p className="text-muted-foreground mt-1">Manage your WhatsApp accounts</p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/" className="flex items-center gap-2">
                            <ArrowLeft className="size-4" /> Dashboard
                        </Link>
                    </Button>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Device List */}
                    <div className="space-y-4">
                        {/* Add Device */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Add New Device</CardTitle>
                                <CardDescription>Create a new WhatsApp API instance</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Device name (e.g., My Business Account)"
                                        value={newDeviceName}
                                        onChange={(e) => setNewDeviceName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && createDevice()}
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={createDevice}
                                        disabled={loading || !newDeviceName.trim()}
                                    >
                                        {loading ? <Loader2 className="size-4 animate-spin" /> : <><Plus className="size-4" /> Add</>}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Device List */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Device List ({devices.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {devices.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">
                                        No devices yet. Add a new device above.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {devices.map((device) => (
                                            <div
                                                key={device.id}
                                                onClick={() => setSelectedDevice(device.id)}
                                                className={`p-4 rounded-lg border transition cursor-pointer ${selectedDevice === device.id
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-border hover:border-muted-foreground'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div>
                                                            <p className="font-semibold">{device.name}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                {getStatusBadge(device.status)}
                                                                {device.phoneNumber && (
                                                                    <span className="text-sm text-muted-foreground">
                                                                        {device.phoneNumber}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Device Detail */}
                    <Card>
                        {!currentDevice ? (
                            <CardContent className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
                                <Smartphone className="size-16 mb-4" />
                                <p>Select a device to view details</p>
                            </CardContent>
                        ) : (
                            <>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-2xl">{currentDevice.name}</CardTitle>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => deleteDevice(currentDevice.id)}
                                        >
                                            <Trash2 className="size-4 mr-1" /> Delete
                                        </Button>
                                    </div>
                                    <CardDescription className="flex items-center gap-2 mt-2">
                                        {getStatusBadge(currentDevice.status)}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* QR Code Display */}
                                    {currentDevice.status === 'scan_qr' && currentDevice.qrCode && (
                                        <div className="flex flex-col items-center py-6">
                                            <div className="p-4 bg-white rounded-2xl shadow-xl">
                                                <QRCodeSVG value={currentDevice.qrCode} size={220} />
                                            </div>
                                            <p className="mt-4 text-center text-muted-foreground">
                                                Open WhatsApp on your phone &rarr; Three Dots &rarr; Linked Devices
                                                <br />
                                                <span className="font-bold text-foreground">Scan the QR Code above</span>
                                            </p>
                                        </div>
                                    )}

                                    {/* Connected State */}
                                    {currentDevice.status === 'connected' && (
                                        <div className="flex flex-col items-center py-10 text-primary">
                                            <CheckCircle className="size-20 mb-4" />
                                            <p className="text-xl font-semibold">WhatsApp Connected!</p>
                                            <p className="text-muted-foreground mt-2">Ready to send messages via API</p>
                                        </div>
                                    )}

                                    {/* Connecting State */}
                                    {currentDevice.status === 'connecting' && (
                                        <div className="flex flex-col items-center py-10 text-muted-foreground">
                                            <Loader2 className="size-16 mb-4 animate-spin" />
                                            <p className="text-lg">Connecting to WhatsApp...</p>
                                        </div>
                                    )}

                                    {/* Disconnected State */}
                                    {currentDevice.status === 'disconnected' && (
                                        <div className="flex flex-col items-center py-10 text-muted-foreground">
                                            <PhoneOff className="size-16 mb-4" />
                                            <p className="text-lg mb-4">Device is not connected</p>
                                            <Button onClick={() => connectDevice(currentDevice.id)}>
                                                <Link2 className="size-4 mr-1" /> Connect
                                            </Button>
                                        </div>
                                    )}

                                    {/* Connect/Disconnect Actions */}
                                    {currentDevice.status === 'connected' && (
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => disconnectDevice(currentDevice.id)}
                                        >
                                            <Unplug className="size-4 mr-1" /> Disconnect
                                        </Button>
                                    )}

                                    <Separator />

                                    {/* Webhook Configuration */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-medium">Webhook URL</p>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setIsWebhookDialogOpen(true)}
                                                className="h-7 text-xs"
                                            >
                                                <Webhook className="size-3 mr-1" />
                                                {currentDevice.webhookUrl ? 'Edit' : 'Configure'}
                                            </Button>
                                        </div>
                                        {currentDevice.webhookUrl ? (
                                            <code className="text-xs text-muted-foreground font-mono block truncate">
                                                {currentDevice.webhookUrl}
                                            </code>
                                        ) : (
                                            <p className="text-xs text-muted-foreground italic">
                                                Using global webhook (if configured)
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </>
                        )}
                    </Card>
                </div>
            </div>

            {/* Webhook Dialog */}
            {currentDevice && (
                <WebhookDialog
                    open={isWebhookDialogOpen}
                    onOpenChange={setIsWebhookDialogOpen}
                    deviceId={currentDevice.id}
                    deviceName={currentDevice.name}
                    currentWebhook={currentDevice.webhookUrl}
                    onSave={(webhookUrl) => handleUpdateWebhook(currentDevice.id, webhookUrl)}
                />
            )}
        </main>
    );
}

