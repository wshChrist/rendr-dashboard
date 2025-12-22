import {
  Injectable,
  BadRequestException,
  ConflictException
} from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { EncryptionUtil } from '../common/utils/encryption.util';
import { v4 as uuidv4 } from 'uuid';
import { CreateTradingAccountDto } from './dto/create-trading-account.dto';
import { TradingAccountResponseDto } from './dto/trading-account-response.dto';

@Injectable()
export class TradingAccountsService {
  constructor(private supabaseService: SupabaseService) {}

  async create(
    userId: string,
    dto: CreateTradingAccountDto
  ): Promise<TradingAccountResponseDto> {
    const supabase = this.supabaseService.getServiceRoleClient();

    // Vérifier si le compte (login) est déjà associé à un autre utilisateur
    const { data: existingAccounts, error: checkError } = await supabase
      .from('trading_accounts')
      .select('id, user_id')
      .eq('login', dto.login)
      .limit(1);

    if (checkError) {
      throw new BadRequestException(
        `Erreur lors de la vérification du compte: ${checkError.message}`
      );
    }

    // Si le compte existe et appartient à un autre utilisateur
    if (existingAccounts && existingAccounts.length > 0) {
      const existingAccount = existingAccounts[0];
      if (existingAccount.user_id !== userId) {
        throw new ConflictException(
          'Ce compte de trading est déjà associé à un autre utilisateur'
        );
      }
      // Si le compte appartient déjà à l'utilisateur actuel
      throw new ConflictException(
        'Ce compte de trading est déjà dans votre liste'
      );
    }

    const externalAccountId = uuidv4();

    // Chiffrer le mot de passe
    const encryptedPassword = EncryptionUtil.encrypt(dto.investor_password);

    const { data, error } = await supabase
      .from('trading_accounts')
      .insert({
        user_id: userId,
        broker: dto.broker,
        platform: dto.platform,
        server: dto.server,
        login: dto.login,
        investor_password: encryptedPassword,
        external_account_id: externalAccountId,
        status: 'pending_vps_setup'
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Erreur lors de la création du compte: ${error.message}`
      );
    }

    // Retourner sans le mot de passe
    const { investor_password, ...response } = data;
    return response as TradingAccountResponseDto;
  }

  async findByUserId(userId: string) {
    const supabase = this.supabaseService.getAnonClient();
    const { data, error } = await supabase
      .from('trading_accounts')
      .select(
        'id, external_account_id, broker, platform, server, login, status, error_message, created_at, updated_at'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(
        `Erreur lors de la récupération: ${error.message}`
      );
    }

    return data;
  }
}
