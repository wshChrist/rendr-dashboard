import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException
} from '@nestjs/common';
import { SupabaseService } from '../../config/supabase.service';
import { HmacUtil } from '../../common/utils/hmac.util';

@Injectable()
export class TradeSignatureGuard implements CanActivate {
  constructor(private supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const body = request.body;
    const signature = body.signature;
    const externalAccountId = body.external_account_id;

    if (!signature || !externalAccountId) {
      throw new UnauthorizedException(
        'Signature ou external_account_id manquant'
      );
    }

    // Récupérer le compte pour obtenir le secret
    const supabase = this.supabaseService.getServiceRoleClient();
    const { data: account, error } = await supabase
      .from('trading_accounts')
      .select('id, external_account_id')
      .eq('external_account_id', externalAccountId)
      .single();

    if (error || !account) {
      throw new UnauthorizedException('Compte non trouvé');
    }

    // Pour l'instant, on utilise external_account_id comme secret
    // En production, il faudrait un champ api_secret dans trading_accounts
    const secret = externalAccountId;

    // Reconstruire le JSON sans la signature pour vérifier
    const { signature: _, ...dataWithoutSignature } = body;
    const jsonString = JSON.stringify(dataWithoutSignature);
    const isValid = HmacUtil.verifyHMAC(jsonString, signature, secret);

    if (!isValid) {
      throw new UnauthorizedException('Signature invalide');
    }

    request.tradingAccountId = account.id;
    return true;
  }
}
