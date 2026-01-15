import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { ApiKey, CreateApiKeyDto, ApiKeyResponse } from './api-key.interface';

@Injectable()
export class ApiKeyService {
    private apiKeys: Map<string, ApiKey> = new Map();
    private readonly storagePath: string;

    constructor() {
        this.storagePath = path.resolve(__dirname, '../../../../api-keys.json');
        this.loadApiKeys();
    }

    private loadApiKeys() {
        try {
            if (fs.existsSync(this.storagePath)) {
                const data = fs.readFileSync(this.storagePath, 'utf-8');
                const parsed = JSON.parse(data) as ApiKey[];
                parsed.forEach((apiKey) => {
                    apiKey.createdAt = new Date(apiKey.createdAt);
                    if (apiKey.lastUsedAt) {
                        apiKey.lastUsedAt = new Date(apiKey.lastUsedAt);
                    }
                    this.apiKeys.set(apiKey.id, apiKey);
                });
                console.log(`🔑 Loaded ${this.apiKeys.size} API keys from storage`);
            }
        } catch (error) {
            console.error('Failed to load API keys:', error);
        }
    }

    private saveApiKeys() {
        try {
            const apiKeysArray = Array.from(this.apiKeys.values());
            fs.writeFileSync(this.storagePath, JSON.stringify(apiKeysArray, null, 2));
        } catch (error) {
            console.error('Failed to save API keys:', error);
        }
    }

    private generateKey(): string {
        return randomBytes(32).toString('hex');
    }

    private maskKey(key: string): string {
        if (key.length <= 8) return '***';
        return key.substring(0, 4) + '...' + key.substring(key.length - 4);
    }

    create(dto: CreateApiKeyDto): ApiKeyResponse {
        const key = this.generateKey();
        const apiKey: ApiKey = {
            id: randomBytes(16).toString('hex'),
            name: dto.name,
            key: key,
            isActive: true,
            createdAt: new Date(),
        };
        this.apiKeys.set(apiKey.id, apiKey);
        this.saveApiKeys();
        console.log(`🔑 API Key created: ${apiKey.name} (${apiKey.id})`);

        // Return full key only on creation
        return {
            ...apiKey,
            maskedKey: this.maskKey(key),
        };
    }

    findAll(): ApiKeyResponse[] {
        return Array.from(this.apiKeys.values()).map(apiKey => ({
            ...apiKey,
            key: '',
            maskedKey: this.maskKey(apiKey.key),
        }));
    }

    findOne(id: string): ApiKeyResponse {
        const apiKey = this.apiKeys.get(id);
        if (!apiKey) {
            throw new NotFoundException(`API Key with ID ${id} not found`);
        }
        // Return full key for copying
        return {
            ...apiKey,
            maskedKey: this.maskKey(apiKey.key),
        };
    }

    findByKey(key: string): ApiKey | null {
        for (const apiKey of this.apiKeys.values()) {
            if (apiKey.key === key && apiKey.isActive) {
                return apiKey;
            }
        }
        return null;
    }

    toggleActive(id: string): ApiKeyResponse {
        const apiKey = this.apiKeys.get(id);
        if (!apiKey) {
            throw new NotFoundException(`API Key with ID ${id} not found`);
        }
        apiKey.isActive = !apiKey.isActive;
        this.apiKeys.set(id, apiKey);
        this.saveApiKeys();
        console.log(`🔑 API Key ${id} is now ${apiKey.isActive ? 'active' : 'inactive'}`);
        return {
            ...apiKey,
            key: '',
            maskedKey: this.maskKey(apiKey.key),
        };
    }

    updateLastUsed(id: string): void {
        const apiKey = this.apiKeys.get(id);
        if (apiKey) {
            apiKey.lastUsedAt = new Date();
            this.apiKeys.set(id, apiKey);
            // Don't save on every request for performance
            // Optionally implement periodic saving or debouncing
        }
    }

    delete(id: string): void {
        const apiKey = this.apiKeys.get(id);
        if (!apiKey) {
            throw new NotFoundException(`API Key with ID ${id} not found`);
        }
        this.apiKeys.delete(id);
        this.saveApiKeys();
        console.log(`🔑 API Key deleted: ${apiKey.name} (${id})`);
    }
}
