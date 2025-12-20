import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';

@Injectable()
export class CashbackService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Recalcule le cashback pour un utilisateur donné
   * Formule simple : X $ par lot tradé (ex: 0.50 $ par lot)
   */
  async recalculateCashback(userId: string): Promise<void> {
    const supabase = this.supabaseService.getServiceRoleClient();

    // Récupérer tous les trades de l'utilisateur via une jointure
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('lots, close_time, trading_accounts!inner(user_id)')
      .eq('trading_accounts.user_id', userId)
      .order('close_time', { ascending: true });

    if (tradesError) {
      throw new Error(
        `Erreur lors de la récupération des trades: ${tradesError.message}`
      );
    }

    // Grouper par période (YYYY-MM) et calculer le cashback
    const cashbackByPeriod = new Map<
      string,
      { volume: number; amount: number }
    >();

    // Taux de cashback : 0.50 $ par lot (configurable)
    const CASHBACK_RATE_PER_LOT = 0.5;

    for (const trade of trades || []) {
      const closeDate = new Date(trade.close_time);
      const period = `${closeDate.getFullYear()}-${String(closeDate.getMonth() + 1).padStart(2, '0')}`;

      if (!cashbackByPeriod.has(period)) {
        cashbackByPeriod.set(period, { volume: 0, amount: 0 });
      }

      const periodData = cashbackByPeriod.get(period)!;
      periodData.volume += parseFloat(trade.lots.toString());
      periodData.amount = periodData.volume * CASHBACK_RATE_PER_LOT;
    }

    // Mettre à jour ou créer les balances de cashback
    for (const [period, data] of cashbackByPeriod.entries()) {
      const { error: upsertError } = await supabase
        .from('cashback_balances')
        .upsert(
          {
            user_id: userId,
            period,
            volume_lots: data.volume,
            cashback_amount: data.amount,
            status: 'pending',
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id,period'
          }
        );

      if (upsertError) {
        console.error(
          `Erreur lors de la mise à jour du cashback pour ${period}:`,
          upsertError
        );
      }
    }
  }

  /**
   * Récupère les balances de cashback pour un utilisateur
   */
  async getCashbackBalances(userId: string) {
    const supabase = this.supabaseService.getAnonClient();

    const { data, error } = await supabase
      .from('cashback_balances')
      .select('*')
      .eq('user_id', userId)
      .order('period', { ascending: false });

    if (error) {
      throw new Error(
        `Erreur lors de la récupération des balances: ${error.message}`
      );
    }

    return data;
  }
}
