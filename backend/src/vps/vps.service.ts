import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { EncryptionUtil } from '../common/utils/encryption.util';
import { AccountStatusDto } from './dto/account-status.dto';
import { PendingAccountDto } from './dto/pending-account.dto';

@Injectable()
export class VpsService {
  constructor(private supabaseService: SupabaseService) {}

  async getPendingAccounts(): Promise<PendingAccountDto[]> {
    const supabase = this.supabaseService.getServiceRoleClient();

    const { data, error } = await supabase
      .from('trading_accounts')
      .select(
        'external_account_id, broker, platform, server, login, investor_password'
      )
      .eq('status', 'pending_vps_setup');

    if (error) {
      throw new BadRequestException(
        `Erreur lors de la récupération: ${error.message}`
      );
    }

    // Déchiffrer les mots de passe
    return (data || []).map((account) => ({
      external_account_id: account.external_account_id,
      broker: account.broker,
      platform: account.platform,
      server: account.server,
      login: account.login,
      investor_password: EncryptionUtil.decrypt(account.investor_password)
    }));
  }

  async updateAccountStatus(dto: AccountStatusDto): Promise<void> {
    const supabase = this.supabaseService.getServiceRoleClient();

    const updateData: any = {
      status: dto.status,
      updated_at: new Date().toISOString()
    };

    if (dto.error_message) {
      updateData.error_message = dto.error_message;
    }

    const { error } = await supabase
      .from('trading_accounts')
      .update(updateData)
      .eq('external_account_id', dto.external_account_id);

    if (error) {
      throw new BadRequestException(
        `Erreur lors de la mise à jour: ${error.message}`
      );
    }
  }
}
