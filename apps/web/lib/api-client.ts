// API client utility for FreeWA
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// API Key management
export const apiKey = {
    get: (): string | null => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('freewa_api_key');
    },

    set: (key: string): void => {
        if (typeof window === 'undefined') return;
        localStorage.setItem('freewa_api_key', key);
    },

    remove: (): void => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem('freewa_api_key');
    },
};

// Request headers with API key
export const getHeaders = (): HeadersInit => {
    const key = apiKey.get();
    return {
        'Content-Type': 'application/json',
        ...(key && { 'x-api-key': key }),
    };
};

// Generic API request function
export async function apiRequest<T>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            ...getHeaders(),
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `Request failed: ${response.statusText}`);
    }

    return response.json();
}

// Specific API methods
export const api = {
    // Devices
    devices: {
        list: () => apiRequest<{ success: boolean; data: any[] }>('/device'),

        create: (data: { name: string; webhookUrl?: string | null }) =>
            apiRequest('/device', {
                method: 'POST',
                body: JSON.stringify(data),
            }),

        get: (id: string) => apiRequest(`/device/${id}`),

        updateWebhook: (id: string, webhookUrl: string | null) =>
            apiRequest(`/device/${id}/webhook`, {
                method: 'PATCH',
                body: JSON.stringify({ webhookUrl }),
            }),

        connect: (id: string) =>
            apiRequest(`/device/${id}/connect`, { method: 'POST' }),

        disconnect: (id: string) =>
            apiRequest(`/device/${id}/disconnect`, { method: 'POST' }),

        delete: (id: string) =>
            apiRequest(`/device/${id}`, { method: 'DELETE' }),
    },

    // Messages
    messages: {
        send: (data: { deviceId?: string; to: string; message: string }) =>
            apiRequest('/message/send', {
                method: 'POST',
                body: JSON.stringify(data),
            }),

        sendPhoto: (data: { deviceId?: string; to: string; url: string; caption?: string }) =>
            apiRequest('/message/send-photo', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
    },

    // API Keys
    apiKeys: {
        list: () => apiRequest('/api-key'),

        create: (data: { name: string }) =>
            apiRequest('/api-key', {
                method: 'POST',
                body: JSON.stringify(data),
            }),

        get: (id: string) => apiRequest(`/api-key/${id}`),

        toggle: (id: string) =>
            apiRequest(`/api-key/${id}/toggle`, { method: 'PATCH' }),

        delete: (id: string) =>
            apiRequest(`/api-key/${id}`, { method: 'DELETE' }),
    },

    // Queue
    queue: {
        getJob: (jobId: string) => apiRequest(`/queue/${jobId}`),
    },
};
