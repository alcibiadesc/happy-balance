import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Lead {
  email: string;
  source: string;
  ip?: string;
  created_at?: string;
}

export class SupabaseService {
  private client: SupabaseClient | null = null;
  private initialized = false;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;

    if (url && key) {
      this.client = createClient(url, key);
      this.initialized = true;
    } else {
      console.warn(
        '⚠️ Supabase not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY to enable lead tracking.'
      );
    }
  }

  isConfigured(): boolean {
    return this.initialized && this.client !== null;
  }

  async storeLead(lead: Lead): Promise<void> {
    if (!this.client) {
      console.warn('Supabase not configured, skipping lead storage');
      return;
    }

    const { error } = await this.client.from('leads').insert({
      email: lead.email,
      source: lead.source,
      ip: lead.ip || null,
      created_at: new Date().toISOString(),
    });

    if (error) {
      // Don't throw - lead storage failure shouldn't block the magic link flow
      console.error('Failed to store lead in Supabase:', error.message);
    }
  }

  async findLeadByEmail(email: string): Promise<Lead | null> {
    if (!this.client) {
      return null;
    }

    const { data, error } = await this.client.from('leads').select('*').eq('email', email).single();

    if (error || !data) {
      return null;
    }

    return data as Lead;
  }
}
