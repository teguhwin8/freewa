export interface ApiKey {
    id: string;
    name: string;
    key: string;
    isActive: boolean;
    createdAt: Date;
    lastUsedAt?: Date;
}

export interface CreateApiKeyDto {
    name: string;
}

export interface ApiKeyResponse {
    id: string;
    name: string;
    key: string;
    maskedKey?: string;
    isActive: boolean;
    createdAt: Date;
    lastUsedAt?: Date;
}
