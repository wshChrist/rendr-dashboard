import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException
} from '@nestjs/common';
import { SupabaseService } from '../../config/supabase.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token manquant');
    }

    const token = authHeader.substring(7);
    const supabase = this.supabaseService.getAnonClient();

    const {
      data: { user },
      error
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException('Token invalide');
    }

    request.user = user;
    return true;
  }
}
