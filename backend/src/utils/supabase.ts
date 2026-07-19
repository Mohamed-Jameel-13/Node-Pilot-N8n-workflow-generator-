import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null;

// Use a Proxy to lazily initialize the client when it's first used.
// This prevents Cloudflare Workers from crashing on startup if process.env isn't populated synchronously.
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    if (!_client) {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error('Missing Supabase environment variables');
      }
      
      _client = createClient(supabaseUrl, supabaseServiceRoleKey);
    }
    return (_client as any)[prop];
  }
});
