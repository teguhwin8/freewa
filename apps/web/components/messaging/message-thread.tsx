'use client';

import { useEffect, useState, useRef } from 'react';
import { Send, MessageSquareOff, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ContactAvatar } from './contact-avatar';
import type { Message } from '@/app/page';
import type { Socket } from 'socket.io-client';
import { fetchMessages as fetchMessagesAction, sendMessage as sendMessageAction } from '@/app/actions/chat';
import { formatTime, formatDate } from '@/lib/utils/format';

interface MessageThreadProps {
    deviceId: string | null;
    chatId: string | null;
    socket: Socket | null;
    onSendMessage?: () => void;
}

export function MessageThread({ deviceId, chatId, socket, onSendMessage }: MessageThreadProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!deviceId || !chatId) {
            setMessages([]);
            return;
        }

        const loadMessages = async () => {
            const data = await fetchMessagesAction(deviceId, chatId);
            if (data.success) {
                console.log('Messages data:', data.data);
                if (data.data.length > 0) {
                    console.log('First message timestamp:', {
                        timestamp: data.data[0].timestamp,
                        type: typeof data.data[0].timestamp,
                        value: data.data[0]
                    });
                }
                setMessages(data.data);
            }
        };

        loadMessages();
    }, [deviceId, chatId]);

    // Listen for real-time message updates via WebSocket
    useEffect(() => {
        if (!socket || !deviceId || !chatId) return;

        const handleNewMessage = (message: Message) => {
            // Only add message if it belongs to current chat
            if (message.chatId === chatId) {
                console.log('Real-time message received:', message);
                setMessages((prev) => {
                    // Check if message already exists to avoid duplicates
                    const exists = prev.some((m) => m.id === message.id);
                    if (exists) return prev;
                    return [...prev, message];
                });
            }
        };

        socket.on(`device:${deviceId}:message:new`, handleNewMessage);

        return () => {
            socket.off(`device:${deviceId}:message:new`, handleNewMessage);
        };
    }, [socket, deviceId, chatId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !deviceId || !chatId || isSending) return;

        setIsSending(true);
        const data = await sendMessageAction(deviceId, chatId, newMessage);

        if (data.success) {
            setMessages((prev) => [...prev, data.data]);
            setNewMessage('');
            onSendMessage?.();
        }
        setIsSending(false);
    };

    const groupedMessages = messages.reduce((groups, message) => {
        const dateKey = formatDate(message.timestamp);
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(message);
        return groups;
    }, {} as Record<string, Message[]>);

    if (!deviceId || !chatId) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-500">
                    <MessageSquareOff className="size-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Select a chat to start messaging</p>
                    <p className="text-sm mt-1">Choose a conversation from the sidebar</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-gray-50">
            {/* Header */}
            <div className="px-6 py-3 bg-white border-b flex items-center gap-3">
                <ContactAvatar phoneNumber={chatId} size="md" />
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{chatId}</h3>
                    <p className="text-xs text-gray-500">WhatsApp Chat</p>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                        <p className="font-medium">No messages yet</p>
                        <p className="text-sm mt-1">Send a message to start the conversation</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {Object.entries(groupedMessages).map(([date, msgs]) => (
                            <div key={date}>
                                {/* Date Separator */}
                                <div className="flex items-center justify-center my-4">
                                    <div className="bg-white shadow-sm rounded-lg px-3 py-1">
                                        <span className="text-xs font-medium text-gray-500">{date}</span>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="space-y-2">
                                    {msgs.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[70%] rounded-lg px-3 py-2 shadow-sm ${message.fromMe
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-white text-gray-900'
                                                    }`}
                                            >
                                                <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
                                                <div className="flex items-center justify-end gap-1 mt-1">
                                                    <span className={`text-[10px] ${message.fromMe ? 'text-green-100' : 'text-gray-500'}`}>
                                                        {formatTime(message.timestamp)}
                                                    </span>
                                                    {message.fromMe && (
                                                        <span className="text-green-100">
                                                            {message.status === 'read' ? (
                                                                <CheckCheck className="size-3" />
                                                            ) : (
                                                                <Check className="size-3" />
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            {/* Input */}
            <div className="p-4 bg-white border-t">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                    }}
                    className="flex gap-2"
                >
                    <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={isSending}
                        className="flex-1"
                    />
                    <Button
                        type="submit"
                        disabled={isSending || !newMessage.trim()}
                        className="bg-green-500 hover:bg-green-600 text-white"
                    >
                        <Send className="size-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
