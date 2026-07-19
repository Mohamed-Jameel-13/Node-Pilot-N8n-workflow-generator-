-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- PROFILES (Users)
-- ==========================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  -- BYOK SaaS Control Plane Fields
  llm_base_url text,
  llm_model text,
  encrypted_llm_api_key text,
  -- Subscription Fields (Razorpay)
  razorpay_customer_id text,
  subscription_id text,
  subscription_status text, -- 'active', 'past_due', 'canceled', etc.
  subscription_plan text, -- 'monthly', 'yearly'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Profiles
alter table public.profiles enable row level security;
create policy "Users can view own profile." on profiles for select using (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- Trigger to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ==========================================
-- API KEYS
-- ==========================================
create table if not exists public.api_keys (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  key_prefix text not null,
  hashed_key text not null,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for API Keys
alter table public.api_keys enable row level security;
create policy "Users can view own api keys." on api_keys for select using (auth.uid() = user_id);
create policy "Users can insert own api keys." on api_keys for insert with check (auth.uid() = user_id);
create policy "Users can delete own api keys." on api_keys for delete using (auth.uid() = user_id);


-- ==========================================
-- AUDIT LOGS
-- ==========================================
create table if not exists public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  details text,
  ip_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Audit Logs
alter table public.audit_logs enable row level security;
create policy "Users can view own audit logs." on audit_logs for select using (auth.uid() = user_id);
create policy "System can insert audit logs." on audit_logs for insert with check (auth.uid() = user_id);


-- ==========================================
-- SAVED WORKFLOWS / CHATS
-- ==========================================
create table if not exists public.workflows (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null default 'Untitled Workflow',
  n8n_id text, -- ID of the workflow in n8n
  nodes jsonb default '[]'::jsonb not null,
  edges jsonb default '[]'::jsonb not null,
  messages jsonb default '[]'::jsonb not null, -- Chat history related to this workflow
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Workflows
alter table public.workflows enable row level security;
create policy "Users can view own workflows." on workflows for select using (auth.uid() = user_id);
create policy "Users can insert own workflows." on workflows for insert with check (auth.uid() = user_id);
create policy "Users can update own workflows." on workflows for update using (auth.uid() = user_id);
create policy "Users can delete own workflows." on workflows for delete using (auth.uid() = user_id);
