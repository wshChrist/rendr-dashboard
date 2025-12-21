/**
 * Client pour communiquer avec le backend API RendR
 *
 * Par défaut, utilise la route API Next.js locale qui communique directement avec Supabase.
 * Pour utiliser un backend externe (NestJS), définissez NEXT_PUBLIC_USE_EXTERNAL_API=true
 * et NEXT_PUBLIC_API_URL dans votre .env.local
 */

const EXTERNAL_API_URL = process.env.NEXT_PUBLIC_API_URL;
const USE_EXTERNAL_API =
  process.env.NEXT_PUBLIC_USE_EXTERNAL_API === 'true' && !!EXTERNAL_API_URL;
const API_URL = USE_EXTERNAL_API ? EXTERNAL_API_URL : '';

export interface CreateTradingAccountRequest {
  broker: string;
  platform: 'MT4' | 'MT5';
  server: string;
  login: string;
  investor_password: string;
}

export interface TradingAccountResponse {
  id: string;
  external_account_id: string;
  user_id: string;
  broker: string;
  platform: string;
  server: string;
  login?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export class BackendClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Crée un compte de trading
   */
  async createTradingAccount(
    data: CreateTradingAccountRequest,
    accessToken: string
  ): Promise<TradingAccountResponse> {
    // Utiliser la route API Next.js locale si pas de backend externe configuré
    const url = USE_EXTERNAL_API
      ? `${this.baseUrl}/api/trading-accounts`
      : '/api/trading-accounts';

    console.log('Appel API:', url);
    console.log(
      'Backend externe:',
      USE_EXTERNAL_API ? 'Oui' : 'Non (route Next.js locale)'
    );
    console.log('Données:', { ...data, investor_password: '***' });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(data)
      });

      console.log('Réponse API:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        let errorMessage = `Erreur ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          console.error('Erreur API:', errorData);
        } catch (e) {
          const text = await response.text();
          console.error('Erreur API (texte):', text);
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Résultat API:', result);
      return result;
    } catch (error: any) {
      // Si c'est une erreur réseau (CORS, connexion refusée, etc.)
      if (error.name === 'TypeError' || error.message.includes('fetch')) {
        console.error('Erreur réseau:', error);
        if (USE_EXTERNAL_API) {
          throw new Error(
            `Impossible de contacter le backend API. Vérifiez que le serveur NestJS est démarré sur ${this.baseUrl} et que NEXT_PUBLIC_API_URL est correctement configuré.`
          );
        } else {
          throw new Error(
            'Erreur de connexion. Vérifiez que le serveur Next.js est démarré.'
          );
        }
      }
      throw error;
    }
  }

  /**
   * Récupère la liste des comptes de trading de l'utilisateur
   */
  async getTradingAccounts(
    accessToken: string
  ): Promise<TradingAccountResponse[]> {
    // Utiliser la route API Next.js locale si pas de backend externe configuré
    const url = USE_EXTERNAL_API
      ? `${this.baseUrl}/api/trading-accounts`
      : '/api/trading-accounts';

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: 'Erreur inconnue' }));
      throw new Error(error.message || `Erreur ${response.status}`);
    }

    return response.json();
  }
}

export const backendClient = new BackendClient();
