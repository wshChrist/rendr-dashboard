import { useState, useEffect } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { backendClient } from '@/lib/api/backend-client';
import { brokersData } from '@/constants/cashback-data';
import { calculateCashbackForTrade } from '@/lib/utils/broker-cashback';
import { Transaction } from '@/types/cashback';

interface TradingAccount {
  id: string;
  broker: string;
  external_account_id: string;
  status: string;
  platform: string;
  server: string;
  login: string;
  created_at: string;
}

interface Trade {
  id: string;
  trading_account_id: string;
  ticket: string;
  symbol: string;
  lots: string;
  commission: string;
  swap: string;
  profit: string;
  open_time: string;
  close_time: string;
  created_at: string;
}

interface UseTradingDataReturn {
  accounts: TradingAccount[];
  trades: Trade[];
  transactions: Transaction[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook pour charger les données de trading depuis Supabase
 */
export function useTradingData(): UseTradingDataReturn {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createSupabaseClient();

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Charger les comptes depuis le backend
      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error('Erreur de session');
      }

      if (!session?.access_token) {
        setAccounts([]);
        setTrades([]);
        setIsLoading(false);
        return;
      }

      const accountsData = await backendClient.getTradingAccounts(
        session.access_token
      );
      setAccounts(accountsData);

      if (accountsData.length === 0) {
        setTrades([]);
        setIsLoading(false);
        return;
      }

      // Charger tous les trades pour tous les comptes
      const allTrades: Trade[] = [];
      for (const account of accountsData) {
        const { data: accountTrades, error: tradesError } = await supabase
          .from('trades')
          .select('*')
          .eq('trading_account_id', account.id)
          .order('close_time', { ascending: false });

        if (!tradesError && accountTrades) {
          allTrades.push(...accountTrades);
        }
      }

      // Trier par date de fermeture (plus récent en premier)
      allTrades.sort(
        (a, b) =>
          new Date(b.close_time).getTime() - new Date(a.close_time).getTime()
      );

      setTrades(allTrades);
    } catch (err) {
      console.error('Erreur lors du chargement des données de trading:', err);
      setError(err instanceof Error ? err : new Error('Erreur inconnue'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Transformer les trades en transactions pour la compatibilité avec les composants existants
  const transactions: Transaction[] = trades.map((trade) => {
    const account = accounts.find((a) => a.id === trade.trading_account_id);
    const brokerInfo = brokersData.find((b) => b.name === account?.broker);

    const lots = parseFloat(trade.lots || '0');
    const commission = parseFloat(trade.commission || '0');
    const profit = parseFloat(trade.profit || '0');

    return {
      id: trade.id,
      user_id: '', // Pas nécessaire pour l'affichage
      user_broker_id: trade.trading_account_id,
      broker: brokerInfo || {
        id: `broker-${account?.broker || 'unknown'}`,
        name: account?.broker || 'Unknown',
        logo_url: '',
        category: 'forex' as const,
        cashback_rate: 0.15,
        min_withdrawal: 50,
        description: '',
        website_url: '',
        supported_pairs: [],
        created_at: ''
      },
      trade_id: trade.ticket,
      pair: trade.symbol,
      volume: lots,
      commission: commission,
      cashback_amount: calculateCashbackForTrade(
        account?.broker || 'Unknown',
        lots,
        commission > 0 ? commission : undefined
      ),
      status: 'confirmed' as const,
      trade_date: trade.close_time,
      created_at: trade.created_at,
      profit: profit // Ajouter le profit pour l'affichage
    } as Transaction & { profit: number };
  });

  return {
    accounts,
    trades,
    transactions,
    isLoading,
    error,
    refetch: loadData
  };
}
