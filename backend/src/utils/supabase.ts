import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Use the service role key to bypass RLS for administrative backend operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
