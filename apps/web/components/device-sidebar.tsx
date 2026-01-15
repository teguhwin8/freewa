'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DeviceListItem } from '@/components/device-list-item';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Rocket, Plus, Search, Loader2, BarChart3, Book } from 'lucide-react';
import Link from 'next/link';

interface Device {
    id: string;
    name: string;
    status: 'disconnected' | 'connecting' | 'scan_qr' | 'connected';
    phoneNumber?: string;
    qrCode?: string | null;
}

interface DeviceSidebarProps {
    devices: Device[];
    selectedDeviceId: string | null;
    onSelectDevice: (deviceId: string) => void;
    onAddDevice: (name: string) => Promise<void>;
    isAddingDevice: boolean;
}

export function DeviceSidebar({
    devices,
    selectedDeviceId,
    onSelectDevice,
    onAddDevice,
    isAddingDevice,
}: DeviceSidebarProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [newDeviceName, setNewDeviceName] = useState('');
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const filteredDevices = devices.filter((device) =>
        device.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const connectedCount = devices.filter((d) => d.status === 'connected').length;

    const handleAddDevice = async () => {
        if (!newDeviceName.trim()) return;
        await onAddDevice(newDeviceName);
        setNewDeviceName('');
        setIsSheetOpen(false);
    };

    return (
        <>
            <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
                <div className="flex items-center gap-2">
                    <Rocket className="size-6 text-primary" />
                    <span className="font-bold text-lg">FreeWA</span>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/docs">
                            <Book className="size-5" />
                        </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/queue">
                            <BarChart3 className="size-5" />
                        </Link>
                    </Button>
                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Plus className="size-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[400px]">
                            <SheetHeader>
                                <SheetTitle>Add New Device</SheetTitle>
                                <SheetDescription>
                                    Create a new WhatsApp device to connect.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="mt-6 space-y-4">
                                <Input
                                    value={newDeviceName}
                                    onChange={(e) => setNewDeviceName(e.target.value)}
                                    placeholder="Device name (e.g. Office Phone)"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddDevice()}
                                />
                                <Button
                                    onClick={handleAddDevice}
                                    disabled={isAddingDevice || !newDeviceName.trim()}
                                    className="w-full"
                                >
                                    {isAddingDevice ? (
                                        <Loader2 className="size-4 animate-spin mr-2" />
                                    ) : (
                                        <Plus className="size-4 mr-2" />
                                    )}
                                    Create Device
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Search */}
            <div className="px-3 py-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search devices..."
                        className="pl-9 bg-muted/50"
                    />
                </div>
            </div>

            <Separator />

            {/* Device List */}
            <ScrollArea className="flex-1">
                {filteredDevices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Rocket className="size-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">
                            {searchQuery ? 'No devices found' : 'No devices yet'}
                        </p>
                        {!searchQuery && (
                            <Button
                                variant="link"
                                onClick={() => setIsSheetOpen(true)}
                                className="mt-2"
                            >
                                Add your first device
                            </Button>
                        )}
                    </div>
                ) : (
                    <div>
                        {filteredDevices.map((device) => (
                            <DeviceListItem
                                key={device.id}
                                device={device}
                                isSelected={selectedDeviceId === device.id}
                                onClick={() => onSelectDevice(device.id)}
                            />
                        ))}
                    </div>
                )}
            </ScrollArea>

            {/* Footer Stats */}
            <div className="border-t border-border px-4 py-3 bg-muted/30">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                        {devices.length} device{devices.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {connectedCount} connected
                    </span>
                </div>
            </div>
        </>
    );
}
