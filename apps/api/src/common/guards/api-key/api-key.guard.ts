import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { ApiKeyService } from '../../../modules/api-key/api-key.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeyService) { }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'] as string;

    // If no API key provided
    if (!apiKey) {
      const envApiKey = process.env.API_KEY;
      if (!envApiKey) {
        // No authentication required if no env key is set
        return true;
      }
      throw new UnauthorizedException('Invalid or missing API Key!');
    }

    // Check against environment variable (backward compatibility)
    const validEnvApiKey = process.env.API_KEY;
    if (validEnvApiKey && apiKey === validEnvApiKey) {
      return true;
    }

    // Check against stored API keys
    const storedKey = this.apiKeyService.findByKey(apiKey);
    if (storedKey) {
      // Update last used timestamp
      this.apiKeyService.updateLastUsed(storedKey.id);
      return true;
    }

    throw new UnauthorizedException('Invalid or missing API Key!');
  }
}
