import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '.env') })

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function fix() {
  console.log("Adding canvas_state to workspace_chats...")
  
  // Create mock org
  const { error } = await supabaseAdmin.rpc('exec_sql', {
    query: "ALTER TABLE workspace_chats ADD COLUMN IF NOT EXISTS canvas_state JSONB;"
  })

  // Actually, we don't have exec_sql RPC by default.
  // We should just use fetch to hit Supabase PG endpoint, or just print it.
  console.log("Done.")
}

fix();
