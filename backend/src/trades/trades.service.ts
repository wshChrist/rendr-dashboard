import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException
} from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { RegisterAccountDto } from './dto/register-account.dto';
import { CashbackService } from '../cashback/cashback.service';

@Injectable()
export class TradesService {
  constructor(
    private supabaseService: SupabaseService,
    private cashbackService: CashbackService
  ) {}

  async create(tradingAccountId: string, dto: CreateTradeDto): Promise<void> {
    const supabase = this.supabaseService.getServiceRoleClient();

    // Vérifier si le trade existe déjà (via ticket unique)
    const { data: existingTrade } = await supabase
      .from('trades')
      .select('id')
      .eq('ticket', dto.ticket)
      .single();

    if (existingTrade) {
      throw new ConflictException('Trade déjà existant');
    }

    // Récupérer le user_id via trading_account
    const { data: account } = await supabase
      .from('trading_accounts')
      .select('user_id')
      .eq('id', tradingAccountId)
      .single();

    if (!account) {
      throw new BadRequestException('Compte de trading non trouvé');
    }

    // Insérer le trade
    const { error: insertError } = await supabase.from('trades').insert({
      trading_account_id: tradingAccountId,
      ticket: dto.ticket,
      symbol: dto.symbol,
      lots: dto.lots,
      commission: dto.commission,
      swap: dto.swap,
      profit: dto.profit,
      open_time: dto.open_time,
      close_time: dto.close_time,
      raw_payload: dto as any
    });

    if (insertError) {
      throw new BadRequestException(
        `Erreur lors de l'insertion: ${insertError.message}`
      );
    }

    // Recalculer le cashback pour l'utilisateur
    try {
      await this.cashbackService.recalculateCashback(account.user_id);
    } catch (error) {
      console.error('Erreur lors du recalcul du cashback:', error);
      // Ne pas faire échouer l'insertion du trade si le cashback échoue
    }
  }

  /**
   * Enregistre un compte MT4/MT5 et retourne son external_account_id
   * L'EA appelle cet endpoint au démarrage avec son account_number
   */
  async registerAccount(
    dto: RegisterAccountDto
  ): Promise<{ external_account_id: string; api_secret: string }> {
    const supabase = this.supabaseService.getServiceRoleClient();

    // Chercher le compte dans trading_accounts via login (account_number) et server
    const { data: account, error } = await supabase
      .from('trading_accounts')
      .select('external_account_id, login, server, platform')
      .eq('login', dto.account_number.toString())
      .eq('server', dto.server)
      .eq('platform', dto.platform)
      .single();

    if (error || !account) {
      throw new NotFoundException(
        `Compte non trouvé. Veuillez créer le compte via le dashboard avec le login ${dto.account_number} et le serveur ${dto.server}`
      );
    }

    // Retourner l'external_account_id (utilisé comme api_secret pour l'instant)
    return {
      external_account_id: account.external_account_id,
      api_secret: account.external_account_id // Pour l'instant, on utilise external_account_id comme secret
    };
  }
}
