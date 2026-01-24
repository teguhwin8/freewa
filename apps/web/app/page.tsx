'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { ChatSidebar } from '@/components/messaging/chat-sidebar';
import { MessageThread } from '@/components/messaging/message-thread';
import { fetchDevices as fetchDevicesAction } from './actions/devices';
import { fetchChats as fetchChatsAction, markChatAsRead as markChatAsReadAction } from './actions/chat';

export interface Chat {
  id: string;
  deviceId: string;
  chatId: string;
  name: string | null;
  lastMessageBody: string | null;
  lastMessageTimestamp: number | null;
  unreadCount: number;
  updatedAt: string;
}

export interface Message {
  id: string;
  deviceId: string;
  chatId: string;
  from: string;
  to: string;
  body: string;
  timestamp: number | string;
  fromMe: boolean;
  status: string;
  createdAt: string;
}

export interface Device {
  id: string;
  name: string;
  status: 'disconnected' | 'connecting' | 'scan_qr' | 'connected';
  phoneNumber?: string;
}

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const fetchDevices = useCallback(async () => {
    const data = await fetchDevicesAction();
    if (data.success) {
      const connectedDevices = data.data.filter((d: Device) => d.status === 'connected');
      setDevices(connectedDevices);

      if (!selectedDevice && connectedDevices.length > 0) {
        setSelectedDevice(connectedDevices[0].id);
      }
    }
  }, [selectedDevice]);

  const fetchChats = useCallback(async () => {
    if (!selectedDevice) return;

    const data = await fetchChatsAction(selectedDevice);
    if (data.success) {
      setChats(data.data);
    }
  }, [selectedDevice]);

  useEffect(() => {
    const newSocket = io(API_URL);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [API_URL]);

  useEffect(() => {
    if (!socket || !selectedDevice) return;

    socket.on(`device:${selectedDevice}:message:new`, (message: Message) => {
      fetchChats();
    });

    socket.on(`device:${selectedDevice}:chat:update`, (chat: Chat) => {
      setChats((prev) => {
        const existing = prev.find((c) => c.chatId === chat.chatId);
        if (existing) {
          return prev.map((c) => (c.chatId === chat.chatId ? chat : c));
        }
        return [chat, ...prev];
      });
    });

    return () => {
      socket.off(`device:${selectedDevice}:message:new`);
      socket.off(`device:${selectedDevice}:chat:update`);
    };
  }, [socket, selectedDevice, fetchChats]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDevice(deviceId);
    setSelectedChat(null);
    setChats([]);
  };

  const handleSelectChat = async (chatId: string) => {
    setSelectedChat(chatId);

    // Mark chat as read locally for instant UI feedback
    setChats((prev) =>
      prev.map((chat) =>
        chat.chatId === chatId ? { ...chat, unreadCount: 0 } : chat
      )
    );

    // Mark chat as read in database for persistence
    if (selectedDevice) {
      try {
        await markChatAsReadAction(selectedDevice, chatId);

      } catch (error) {
        console.error('Failed to mark chat as read:', error);
      }
    }
  };

  if (devices.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-4">
          <div className="size-24 mx-auto mb-6 rounded-full bg-green-50 flex items-center justify-center">
            <MessageSquare className="size-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">No Connected Devices</h2>
          <p className="text-gray-600 mb-6">
            Please connect a WhatsApp device first to start messaging
          </p>
          <Link
            href="/devices"
            className="inline-flex items-center justify-center rounded-lg text-sm font-medium px-6 py-3 bg-green-500 text-white hover:bg-green-600 transition-colors"
          >
            Go to Device Manager
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-100">
      <ChatSidebar
        devices={devices}
        selectedDevice={selectedDevice}
        onSelectDevice={handleDeviceChange}
        chats={chats}
        selectedChat={selectedChat}
        onSelectChat={handleSelectChat}
        onRefreshChats={fetchChats}
      />
      <MessageThread
        deviceId={selectedDevice}
        chatId={selectedChat}
        socket={socket}
        onSendMessage={fetchChats}
      />
    </div>
  );
}