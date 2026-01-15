'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { LayoutShell } from '@/components/layout-shell';
import { DeviceSidebar } from '@/components/device-sidebar';
import { DeviceDetailPanel } from '@/components/device-detail-panel';

interface Device {
  id: string;
  name: string;
  status: 'disconnected' | 'connecting' | 'scan_qr' | 'connected';
  phoneNumber?: string;
  qrCode?: string | null;
  webhookUrl?: string | null;
}

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [isAddingDevice, setIsAddingDevice] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'your_api_key';

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/device`, {
        headers: { 'x-api-key': API_KEY },
      });
      const data = await res.json();
      if (data.success) {
        setDevices(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    }
  }, [API_URL, API_KEY]);

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
    });

    return () => {
      devices.forEach((device) => {
        socket.off(`device:${device.id}:status`);
        socket.off(`device:${device.id}:qr`);
      });
    };
  }, [socket, devices]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleAddDevice = async (name: string) => {
    setIsAddingDevice(true);
    try {
      const res = await fetch(`${API_URL}/device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchDevices();
        // Auto-select the new device
        setSelectedDeviceId(data.data.id);
      }
    } catch (error) {
      console.error('Failed to create device:', error);
    } finally {
      setIsAddingDevice(false);
    }
  };

  const handleConnect = async (deviceId: string) => {
    try {
      await fetch(`${API_URL}/device/${deviceId}/connect`, {
        method: 'POST',
        headers: { 'x-api-key': API_KEY },
      });
      fetchDevices();
    } catch (error) {
      console.error('Failed to connect device:', error);
    }
  };

  const handleDisconnect = async (deviceId: string) => {
    try {
      await fetch(`${API_URL}/device/${deviceId}/disconnect`, {
        method: 'POST',
        headers: { 'x-api-key': API_KEY },
      });
      fetchDevices();
    } catch (error) {
      console.error('Failed to disconnect device:', error);
    }
  };

  const handleDelete = async (deviceId: string) => {
    if (!confirm('Are you sure you want to delete this device?')) return;
    try {
      await fetch(`${API_URL}/device/${deviceId}`, {
        method: 'DELETE',
        headers: { 'x-api-key': API_KEY },
      });
      if (selectedDeviceId === deviceId) {
        setSelectedDeviceId(null);
      }
      fetchDevices();
    } catch (error) {
      console.error('Failed to delete device:', error);
    }
  };

  const handleUpdateWebhook = async (deviceId: string, webhookUrl: string | null) => {
    try {
      await fetch(`${API_URL}/device/${deviceId}/webhook`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({ webhookUrl }),
      });
      await fetchDevices();
    } catch (error) {
      console.error('Failed to update webhook:', error);
      throw error;
    }
  };

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId) || null;

  return (
    <LayoutShell
      sidebar={
        <DeviceSidebar
          devices={devices}
          selectedDeviceId={selectedDeviceId}
          onSelectDevice={setSelectedDeviceId}
          onAddDevice={handleAddDevice}
          isAddingDevice={isAddingDevice}
        />
      }
    >
      <DeviceDetailPanel
        device={selectedDevice}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onDelete={handleDelete}
        onUpdateWebhook={handleUpdateWebhook}
      />
    </LayoutShell>
  );
}