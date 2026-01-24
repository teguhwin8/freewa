'use server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'your_api_key';

export async function fetchChats(deviceId: string) {
    try {
        const res = await fetch(`${API_URL}/chat/${deviceId}`, {
            headers: { 'x-api-key': API_KEY },
            cache: 'no-store',
        });
        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch chats:', error);
        return { success: false, error: 'Failed to fetch chats' };
    }
}

export async function fetchMessages(deviceId: string, chatId: string) {
    try {
        const res = await fetch(`${API_URL}/chat/${deviceId}/${chatId}/messages`, {
            headers: { 'x-api-key': API_KEY },
            cache: 'no-store',
        });
        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch messages:', error);
        return { success: false, error: 'Failed to fetch messages' };
    }
}

export async function sendMessage(deviceId: string, to: string, message: string) {
    try {
        const res = await fetch(`${API_URL}/chat/${deviceId}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
            },
            body: JSON.stringify({ to, message }),
        });
        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Failed to send message:', error);
        return { success: false, error: 'Failed to send message' };
    }
}

export async function markChatAsRead(deviceId: string, chatId: string) {
    try {
        const res = await fetch(`${API_URL}/chat/${deviceId}/${chatId}/read`, {
            method: 'PATCH',
            headers: { 'x-api-key': API_KEY },
        });
        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Failed to mark chat as read:', error);
        return { success: false, error: 'Failed to mark chat as read' };
    }
}
