import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'];
    const validApiKey = process.env.API_KEY;

    if (!validApiKey) {
      return true;
    }

    if (apiKey !== validApiKey) {
      throw new UnauthorizedException(
        'Invalid or missing API Key!',
      );
    }

    return true;
  }
}
