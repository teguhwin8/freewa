'use server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'your_api_key';

export async function fetchDevices() {
    try {
        const res = await fetch(`${API_URL}/device`, {
            headers: { 'x-api-key': API_KEY },
            cache: 'no-store',
        });
        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch devices:', error);
        return { success: false, error: 'Failed to fetch devices' };
    }
}

export async function createDevice(name: string, webhookUrl?: string) {
    try {
        const body: any = { name };
        if (webhookUrl) body.webhookUrl = webhookUrl;

        const res = await fetch(`${API_URL}/device`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
            },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Failed to create device:', error);
        return { success: false, error: 'Failed to create device' };
    }
}

export async function connectDevice(deviceId: string) {
    try {
        const res = await fetch(`${API_URL}/device/${deviceId}/connect`, {
            method: 'POST',
            headers: { 'x-api-key': API_KEY },
        });
        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Failed to connect device:', error);
        return { success: false, error: 'Failed to connect device' };
    }
}

export async function disconnectDevice(deviceId: string) {
    try {
        const res = await fetch(`${API_URL}/device/${deviceId}/disconnect`, {
            method: 'POST',
            headers: { 'x-api-key': API_KEY },
        });
        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Failed to disconnect device:', error);
        return { success: false, error: 'Failed to disconnect device' };
    }
}

export async function deleteDevice(deviceId: string) {
    try {
        const res = await fetch(`${API_URL}/device/${deviceId}`, {
            method: 'DELETE',
            headers: { 'x-api-key': API_KEY },
        });
        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Failed to delete device:', error);
        return { success: false, error: 'Failed to delete device' };
    }
}

export async function updateWebhook(deviceId: string, webhookUrl: string) {
    try {
        const res = await fetch(`${API_URL}/device/${deviceId}/webhook`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
            },
            body: JSON.stringify({ webhookUrl }),
        });
        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Failed to update webhook:', error);
        return { success: false, error: 'Failed to update webhook' };
    }
}

export async function testWebhook(webhookUrl: string, deviceId: string, deviceName: string) {
    try {
        const testPayload = {
            event: 'webhook.test',
            timestamp: new Date().toISOString(),
            device: {
                id: deviceId,
                name: deviceName,
            },
            message: 'This is a test webhook from FreeWA. If you receive this, your webhook is configured correctly!',
        };

        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testPayload),
        });

        if (res.ok) {
            return {
                success: true,
                status: res.status,
                message: 'Webhook test successful! Your endpoint responded correctly.'
            };
        } else {
            return {
                success: false,
                status: res.status,
                error: `Webhook returned status ${res.status}: ${res.statusText}`
            };
        }
    } catch (error) {
        console.error('Failed to test webhook:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to connect to webhook URL'
        };
    }
}
