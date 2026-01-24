'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LayoutShell } from '@/components/layout-shell';
import { DeviceSidebar } from '@/components/device-sidebar';
import { apiKey } from '@/lib/api-client';
import {
    Book,
    Key,
    Check,
    X,
    ChevronDown,
    ChevronRight,
    Copy,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface ApiEndpoint {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    path: string;
    description: string;
    parameters?: {
        name: string;
        type: string;
        required: boolean;
        description: string;
        example?: string;
    }[];
    requestBody?: any;
    responseExample?: any;
}

interface EndpointGroup {
    title: string;
    endpoints: ApiEndpoint[];
}

const methodColors = {
    GET: 'bg-blue-500',
    POST: 'bg-green-500',
    PATCH: 'bg-yellow-500',
    DELETE: 'bg-red-500',
};

const endpoints: EndpointGroup[] = [
    {
        title: 'Device Management',
        endpoints: [
            {
                method: 'GET',
                path: '/device',
                description: 'List all WhatsApp devices',
                responseExample: {
                    success: true,
                    data: [
                        {
                            id: 'uuid',
                            name: 'My Device',
                            status: 'connected',
                            phoneNumber: '628xxx',
                            webhookUrl: 'https://example.com/webhook',
                        },
                    ],
                },
            },
            {
                method: 'POST',
                path: '/device',
                description: 'Create a new WhatsApp device',
                requestBody: {
                    name: 'Device Name',
                    webhookUrl: 'https://example.com/webhook', // optional
                },
                responseExample: {
                    success: true,
                    data: {
                        id: 'uuid',
                        name: 'Device Name',
                        status: 'disconnected',
                    },
                },
            },
            {
                method: 'PATCH',
                path: '/device/:id/webhook',
                description: 'Update device webhook URL',
                parameters: [
                    {
                        name: 'id',
                        type: 'string',
                        required: true,
                        description: 'Device ID',
                    },
                ],
                requestBody: {
                    webhookUrl: 'https://example.com/new-webhook',
                },
                responseExample: {
                    success: true,
                    data: { id: 'uuid', webhookUrl: 'https://example.com/new-webhook' },
                },
            },
            {
                method: 'POST',
                path: '/device/:id/connect',
                description: 'Connect device to WhatsApp',
                parameters: [
                    {
                        name: 'id',
                        type: 'string',
                        required: true,
                        description: 'Device ID',
                    },
                ],
                responseExample: {
                    success: true,
                    message: 'Connection initiated',
                },
            },
            {
                method: 'DELETE',
                path: '/device/:id',
                description: 'Delete a device',
                parameters: [
                    {
                        name: 'id',
                        type: 'string',
                        required: true,
                        description: 'Device ID',
                    },
                ],
                responseExample: {
                    success: true,
                    message: 'Device deleted',
                },
            },
        ],
    },
    {
        title: 'Message Management',
        endpoints: [
            {
                method: 'POST',
                path: '/message/send',
                description: 'Send a text message',
                requestBody: {
                    deviceId: 'uuid', // optional
                    to: '628xxx',
                    message: 'Hello World',
                },
                responseExample: {
                    success: true,
                    message: 'Message queued',
                },
            },
            {
                method: 'POST',
                path: '/message/send-photo',
                description: 'Send a photo message',
                requestBody: {
                    deviceId: 'uuid', // optional
                    to: '628xxx',
                    url: 'https://example.com/image.jpg',
                    caption: 'Optional caption',
                },
                responseExample: {
                    success: true,
                    message: 'Photo message queued',
                },
            },
        ],
    },
    {
        title: 'API Key Management',
        endpoints: [
            {
                method: 'GET',
                path: '/api-key',
                description: 'List all API keys (masked)',
                responseExample: {
                    success: true,
                    data: [
                        {
                            id: 'uuid',
                            name: 'Production Key',
                            maskedKey: 'a1b2...x9y0',
                            isActive: true,
                        },
                    ],
                },
            },
            {
                method: 'POST',
                path: '/api-key',
                description: 'Generate a new API key',
                requestBody: {
                    name: 'Production Key',
                },
                responseExample: {
                    success: true,
                    data: {
                        id: 'uuid',
                        name: 'Production Key',
                        key: 'full_api_key_here',
                        isActive: true,
                    },
                    message: 'API key created successfully',
                },
            },
        ],
    },
];

export default function DocsPage() {
    const [currentApiKey, setCurrentApiKey] = useState('');
    const [savedApiKey, setSavedApiKey] = useState<string | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
        new Set(endpoints.map((g) => g.title))
    );

    useEffect(() => {
        const key = apiKey.get();
        if (key) {
            setSavedApiKey(key);
            setCurrentApiKey(key);
        }
    }, []);

    const handleSaveApiKey = () => {
        if (currentApiKey.trim()) {
            apiKey.set(currentApiKey);
            setSavedApiKey(currentApiKey);
        }
    };

    const toggleGroup = (title: string) => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(title)) {
                next.delete(title);
            } else {
                next.add(title);
            }
            return next;
        });
    };

    const copyCurl = (endpoint: ApiEndpoint) => {
        const url = `${API_URL}${endpoint.path}`;
        let curl = `curl -X ${endpoint.method} "${url}"`;

        if (savedApiKey) {
            curl += ` \\\\\n  -H "x-api-key: ${savedApiKey}"`;
        }

        if (endpoint.requestBody) {
            curl += ` \\\\\n  -H "Content-Type: application/json"`;
            curl += ` \\\\\n  -d '${JSON.stringify(endpoint.requestBody, null, 2)}'`;
        }

        navigator.clipboard.writeText(curl);
    };

    return (
        <main className="w-full h-full bg-gray-50 overflow-auto">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="bg-white border rounded-lg px-6 py-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-green-50 flex items-center justify-center">
                            <Book className="size-6 text-green-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">API Documentation</h1>
                            <p className="text-sm text-gray-600">
                                Interactive documentation for FreeWA API
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {/* API Key Section */}
                    <div className="bg-white border rounded-lg p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Key className="size-5" />
                            <h2 className="text-lg font-semibold">API Key</h2>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            Enter your API key to test endpoints directly from this page. Your key is stored locally in your browser.
                        </p>
                        <div className="flex gap-2 items-center">
                            <Input
                                type="password"
                                value={currentApiKey}
                                onChange={(e) => setCurrentApiKey(e.target.value)}
                                placeholder="Enter your API key"
                                className="flex-1"
                            />
                            <Button onClick={handleSaveApiKey}>
                                {savedApiKey ? <Check className="size-4 mr-2" /> : null}
                                Save
                            </Button>
                        </div>
                        {savedApiKey && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                                <Check className="size-3" />
                                API key saved and ready for testing
                            </p>
                        )}
                    </div>

                    {/* Endpoint Groups */}
                    {endpoints.map((group) => (
                        <div key={group.title} className="bg-white border rounded-lg overflow-hidden">
                            <button
                                onClick={() => toggleGroup(group.title)}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                                <h3 className="text-lg font-semibold">{group.title}</h3>
                                {expandedGroups.has(group.title) ? (
                                    <ChevronDown className="size-5" />
                                ) : (
                                    <ChevronRight className="size-5" />
                                )}
                            </button>

                            {expandedGroups.has(group.title) && (
                                <div className="border-t border-border">
                                    {group.endpoints.map((endpoint, idx) => (
                                        <div
                                            key={idx}
                                            className="px-6 py-4 border-b border-border last:border-b-0"
                                        >
                                            <div className="flex items-start gap-4 mb-3">
                                                <Badge
                                                    className={`${methodColors[endpoint.method]} text-white font-mono text-xs px-2`}
                                                >
                                                    {endpoint.method}
                                                </Badge>
                                                <div className="flex-1">
                                                    <code className="text-sm font-mono">{endpoint.path}</code>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {endpoint.description}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => copyCurl(endpoint)}
                                                    disabled={!savedApiKey}
                                                >
                                                    <Copy className="size-4 mr-1" />
                                                    cURL
                                                </Button>
                                            </div>

                                            {endpoint.parameters && (
                                                <div className="mb-3">
                                                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                                                        Parameters:
                                                    </p>
                                                    {endpoint.parameters.map((param) => (
                                                        <div key={param.name} className="flex gap-2 text-xs mb-1">
                                                            <code className="text-primary">{param.name}</code>
                                                            <span className="text-muted-foreground">
                                                                ({param.type})
                                                                {param.required && (
                                                                    <span className="text-destructive ml-1">*</span>
                                                                )}
                                                            </span>
                                                            <span className="text-muted-foreground">
                                                                - {param.description}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {endpoint.requestBody && (
                                                <div className="mb-3">
                                                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                                                        Request Body:
                                                    </p>
                                                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                                                        {JSON.stringify(endpoint.requestBody, null, 2)}
                                                    </pre>
                                                </div>
                                            )}

                                            {endpoint.responseExample && (
                                                <div>
                                                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                                                        Response Example:
                                                    </p>
                                                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                                                        {JSON.stringify(endpoint.responseExample, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
