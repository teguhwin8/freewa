import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiOperation } from '@nestjs/swagger';
import { ApiKeyGuard } from '../../common/guards/api-key/api-key.guard';
import { ApiKeyService } from './api-key.service';
import type { CreateApiKeyDto } from './api-key.interface';

@ApiTags('API Key')
@ApiSecurity('x-api-key')
@UseGuards(ApiKeyGuard)
@Controller('api-key')
export class ApiKeyController {
    constructor(private readonly apiKeyService: ApiKeyService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new API key' })
    create(@Body() dto: CreateApiKeyDto) {
        const apiKey = this.apiKeyService.create(dto);
        return {
            success: true,
            data: apiKey,
            message: 'API key created successfully. Copy the key now, it will not be shown again in full.',
        };
    }

    @Get()
    @ApiOperation({ summary: 'Get all API keys (masked)' })
    findAll() {
        const apiKeys = this.apiKeyService.findAll();
        return {
            success: true,
            data: apiKeys,
        };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific API key by ID (shows full key for copying)' })
    findOne(@Param('id') id: string) {
        const apiKey = this.apiKeyService.findOne(id);
        return {
            success: true,
            data: apiKey,
        };
    }

    @Patch(':id/toggle')
    @ApiOperation({ summary: 'Enable or disable an API key' })
    toggleActive(@Param('id') id: string) {
        const apiKey = this.apiKeyService.toggleActive(id);
        return {
            success: true,
            data: apiKey,
            message: `API key ${apiKey.isActive ? 'enabled' : 'disabled'}`,
        };
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete an API key' })
    delete(@Param('id') id: string) {
        this.apiKeyService.delete(id);
        return {
            success: true,
            message: 'API key deleted',
        };
    }
}
