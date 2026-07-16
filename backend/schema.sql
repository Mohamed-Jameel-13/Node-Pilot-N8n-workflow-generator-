-- organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  razorpay_customer_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- workspaces table
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  n8n_endpoint_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- user_profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  encryption_key_versions JSONB NOT NULL DEFAULT '[]',
  llm_base_url TEXT,
  llm_model TEXT,
  encrypted_llm_api_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- workflow_audit_trail table
CREATE TABLE workflow_audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  snapshot_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  raw_n8n_json JSONB NOT NULL,
  canvas_state JSONB DEFAULT '{}',
  change_summary TEXT,
  CONSTRAINT audit_retention CHECK (snapshot_timestamp > now() - INTERVAL '36 months')
);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_audit_trail ENABLE ROW LEVEL SECURITY;

-- Policies for organizations
CREATE POLICY "Users can view their own organization"
  ON organizations
  FOR SELECT
  USING (id IN (SELECT organization_id FROM user_profiles WHERE email = auth.jwt()->>'email'));

-- Policies for workspaces
CREATE POLICY "Users can view workspaces in their organization"
  ON workspaces
  FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE email = auth.jwt()->>'email'));

-- Policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  USING (email = auth.jwt()->>'email');

-- Policies for workflow_audit_trail
CREATE POLICY "Users can view audit trails for their workspaces"
  ON workflow_audit_trail
  FOR SELECT
  USING (workspace_id IN (SELECT id FROM workspaces WHERE organization_id IN (SELECT organization_id FROM user_profiles WHERE email = auth.jwt()->>'email')));

-- workspace_chats table
CREATE TABLE workspace_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
  messages JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE workspace_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage chats for their workspaces"
  ON workspace_chats
  USING (workspace_id IN (SELECT id FROM workspaces WHERE organization_id IN (SELECT organization_id FROM user_profiles WHERE email = auth.jwt()->>'email')));
