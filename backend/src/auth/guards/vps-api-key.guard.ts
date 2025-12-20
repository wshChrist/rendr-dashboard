import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VpsApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-vps-api-key'];
    const expectedKey = this.configService.get<string>('VPS_API_KEY');

    if (!apiKey || apiKey !== expectedKey) {
      throw new UnauthorizedException('Clé API VPS invalide');
    }

    return true;
  }
}
