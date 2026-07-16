import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '.env') })

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE env vars")
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function fix() {
  console.log("Fixing missing workspace constraint...")
  
  // Create mock org
  const { error: orgErr } = await supabaseAdmin
    .from('organizations')
    .upsert({
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Test Org'
    })
    
  if (orgErr) console.log("Org insert error:", orgErr.message)
  else console.log("Org fixed.")

  // Create mock workspace
  const { error: wsErr } = await supabaseAdmin
    .from('workspaces')
    .upsert({
      id: '11111111-1111-1111-1111-111111111111',
      organization_id: '22222222-2222-2222-2222-222222222222',
      name: 'Demo Workspace',
      n8n_endpoint_url: 'http://localhost:5678'
    })

  if (wsErr) console.log("Workspace insert error:", wsErr.message)
  else console.log("Workspace fixed.")

  console.log("Done.")
}

fix();
