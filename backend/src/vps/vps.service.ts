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

    // Déchiffrer les mots de passe avec gestion d'erreur
    const accounts: PendingAccountDto[] = [];

    for (const account of data || []) {
      try {
        // Vérifier si le format est valide (doit contenir ":")
        if (
          !account.investor_password ||
          !account.investor_password.includes(':')
        ) {
          console.warn(
            `Compte ${account.external_account_id}: mot de passe non chiffré ou format invalide`
          );
          // Marquer le compte en erreur
          await this.updateAccountStatus({
            external_account_id: account.external_account_id,
            status: 'error',
            error_message:
              'Format de mot de passe invalide. Veuillez recréer le compte.'
          });
          continue;
        }

        const decryptedPassword = EncryptionUtil.decrypt(
          account.investor_password
        );

        accounts.push({
          external_account_id: account.external_account_id,
          broker: account.broker,
          platform: account.platform,
          server: account.server,
          login: account.login,
          investor_password: decryptedPassword
        });
      } catch (error) {
        console.error(
          `Erreur lors du déchiffrement du compte ${account.external_account_id}:`,
          error
        );
        // Marquer le compte en erreur
        await this.updateAccountStatus({
          external_account_id: account.external_account_id,
          status: 'error',
          error_message: `Erreur de déchiffrement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
        });
      }
    }

    return accounts;
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
