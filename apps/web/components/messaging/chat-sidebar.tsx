'use client';

import { useState } from 'react';
import { Plus, RefreshCw, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChatItem } from './chat-item';
import type { Chat, Device } from '@/app/page';

interface ChatSidebarProps {
    devices: Device[];
    selectedDevice: string | null;
    onSelectDevice: (deviceId: string) => void;
    chats: Chat[];
    selectedChat: string | null;
    onSelectChat: (chatId: string) => void;
    onRefreshChats: () => void;
}

export function ChatSidebar({
    devices,
    selectedDevice,
    onSelectDevice,
    chats,
    selectedChat,
    onSelectChat,
    onRefreshChats,
}: ChatSidebarProps) {
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
    const [newChatNumber, setNewChatNumber] = useState('');
    const [newChatName, setNewChatName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isDeviceSelectorOpen, setIsDeviceSelectorOpen] = useState(false);

    const handleNewChat = async () => {
        if (!newChatNumber.trim() || !selectedDevice) return;

        const chatId = newChatNumber.replace(/[^0-9]/g, '');
        onSelectChat(chatId);
        setIsNewChatOpen(false);
        setNewChatNumber('');
        setNewChatName('');
    };

    const selectedDeviceData = devices.find((d) => d.id === selectedDevice);

    const filteredChats = chats.filter((chat) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            chat.name?.toLowerCase().includes(query) ||
            chat.chatId.toLowerCase().includes(query) ||
            chat.lastMessageBody?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="w-96 bg-white border-r flex flex-col">
            {/* Header with Device Selector */}
            <div className="p-4 bg-gray-50 border-b">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={onRefreshChats}>
                            <RefreshCw className="size-4" />
                        </Button>
                        <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white">
                                    <Plus className="size-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Start New Chat</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 mt-4">
                                    <div>
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            placeholder="628123456789"
                                            value={newChatNumber}
                                            onChange={(e) => setNewChatNumber(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="name">Name (Optional)</Label>
                                        <Input
                                            id="name"
                                            placeholder="John Doe"
                                            value={newChatName}
                                            onChange={(e) => setNewChatName(e.target.value)}
                                        />
                                    </div>
                                    <Button onClick={handleNewChat} className="w-full bg-green-500 hover:bg-green-600">
                                        Start Chat
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Device Selector Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsDeviceSelectorOpen(!isDeviceSelectorOpen)}
                        className="w-full p-2 bg-white border rounded-lg flex items-center justify-between hover:bg-gray-50 transition"
                    >
                        <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-green-500" />
                            <span className="text-sm font-medium text-gray-900">
                                {selectedDeviceData?.phoneNumber || selectedDeviceData?.name || 'Select Device'}
                            </span>
                        </div>
                        <ChevronDown className="size-4 text-gray-500" />
                    </button>

                    {isDeviceSelectorOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10">
                            {devices.map((device) => (
                                <button
                                    key={device.id}
                                    onClick={() => {
                                        onSelectDevice(device.id);
                                        setIsDeviceSelectorOpen(false);
                                    }}
                                    className="w-full p-3 text-left hover:bg-gray-50 transition flex items-center gap-2 border-b last:border-b-0"
                                >
                                    <div className="size-2 rounded-full bg-green-500" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {device.phoneNumber || device.name}
                                        </div>
                                        <div className="text-xs text-gray-500">{device.name}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Search Bar */}
            <div className="p-3 border-b">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-gray-100 border-0"
                    />
                </div>
            </div>

            {/* Chat List */}
            <ScrollArea className="flex-1">
                {filteredChats.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        {searchQuery ? (
                            <>
                                <p className="font-medium">No chats found</p>
                                <p className="text-sm mt-1">Try a different search term</p>
                            </>
                        ) : (
                            <>
                                <p className="font-medium">No chats yet</p>
                                <p className="text-sm mt-1">Start a new chat with the + button above</p>
                            </>
                        )}
                    </div>
                ) : (
                    <div>
                        {filteredChats.map((chat) => (
                            <ChatItem
                                key={chat.id}
                                chat={chat}
                                isSelected={selectedChat === chat.chatId}
                                onClick={() => onSelectChat(chat.chatId)}
                            />
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
