import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabaseServiceRole: SupabaseClient;
  private supabaseAnon: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY'
    );
    const anonKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      throw new Error('Variables Supabase manquantes dans la configuration');
    }

    // Client avec service role (bypass RLS)
    this.supabaseServiceRole = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Client avec anon key (respecte RLS)
    this.supabaseAnon = createClient(supabaseUrl, anonKey);
  }

  getClient(useServiceRole = true): SupabaseClient {
    return useServiceRole ? this.supabaseServiceRole : this.supabaseAnon;
  }

  getServiceRoleClient(): SupabaseClient {
    return this.supabaseServiceRole;
  }

  getAnonClient(): SupabaseClient {
    return this.supabaseAnon;
  }
}
