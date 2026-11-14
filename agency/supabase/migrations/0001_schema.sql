-- AI Digital Marketing Agency — schema, indexes, tenant isolation (RLS)
create extension if not exists pgcrypto;

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ===== Tenancy =====
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references auth.users(id) on delete set null,
  approval_policy jsonb not null default '{"publish_content":true,"send_email":true,"send_prospect_message":true,"run_ads":true,"use_ad_budget":true,"change_public_info":true,"project_delivery":true}',
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  full_name text, role text not null default 'ceo',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on profiles(org_id);

create or replace function current_org_id() returns uuid language sql stable security definer set search_path = public as
$$ select org_id from profiles where id = auth.uid() $$;

-- ===== Company =====
create table departments (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations(id) on delete cascade,
  name text not null, description text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (org_id, name)
);
create table ai_agents (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations(id) on delete cascade,
  key text not null, name text not null, avatar text not null default '', job_title text not null,
  department_id uuid references departments(id) on delete set null, department text not null default '',
  personality text not null default '', system_prompt text not null, tools jsonb not null default '[]',
  status text not null default 'available' check (status in ('available','working','waiting_approval','offline')),
  current_task_id uuid, progress int not null default 0, last_activity_at timestamptz,
  metrics jsonb not null default '{"tasks_completed":0,"tasks_failed":0,"avg_seconds":0,"tokens":0,"cost_usd":0}',
  is_manager boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (org_id, key)
);
create table agent_skills (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations(id) on delete cascade,
  agent_id uuid not null references ai_agents(id) on delete cascade, skill text not null, level int not null default 3,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on agent_skills(org_id, agent_id);

-- ===== Clients (separate workspaces) =====
create table clients (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations(id) on delete cascade,
  name text not null, industry text not null default '', website text not null default '', contact_email text not null default '',
  marketing_history text not null default '', competitors text not null default '', products text not null default '',
  target_audience text not null default '', notes text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table brands (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade, name text not null,
  guidelines text not null default '', tone_of_voice text not null default '', colors text not null default '', keywords text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table client_documents (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade, title text not null, content text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on brands(org_id, client_id); create index on client_documents(org_id, client_id);

-- ===== Memory =====
create table agent_memories (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations(id) on delete cascade,
  agent_id uuid references ai_agents(id) on delete cascade,           -- null = shared company memory
  client_id uuid references clients(id) on delete cascade,            -- client isolation
  project_id uuid, kind text not null check (kind in ('identity','company','client','project','task_history','lesson')),
  content text not null, tags jsonb not null default '[]', importance int not null default 3,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on agent_memories(org_id, agent_id, kind); create index on agent_memories(org_id, client_id);
create index agent_memories_fts on agent_memories using gin (to_tsvector('simple', content));

-- ===== Conversations =====
create table agent_conversations (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations(id) on delete cascade,
  agent_id uuid not null references ai_agents(id) on delete cascade, user_id uuid, title text not null default 'Chat',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table agent_messages (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations(id) on delete cascade,
  conversation_id uuid not null references agent_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')), content text not null, tokens_in int not null default 0, tokens_out int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on agent_conversations(org_id, agent_id); create index on agent_messages(org_id, conversation_id, created_at);

-- ===== Campaigns / Projects / Tasks =====
create table campaigns (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations(id) on delete cascade,
  client_id uuid references clients(id) on delete set null, name text not null, brand text not null default '',
  objective text not null default '', target_audience text not null default '', budget numeric not null default 0,
  platforms jsonb not null default '[]', start_date date, end_date date,
  status text not null default 'draft' check (status in ('draft','planning','active','completed')),
  project_id uuid, kpis jsonb not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table projects (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations(id) on delete cascade,
  client_id uuid references clients(id) on delete set null, campaign_id uuid references campaigns(id) on delete set null,
  title text not null, instruction text not null,
  status text not null default 'planning' check (status in ('planning','in_progress','review','awaiting_ceo','revision','completed','failed')),
  plan jsonb, final_report text, revision_count int not null default 0, created_by uuid, ceo_feedback text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table tasks (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade, agent_id uuid not null references ai_agents(id),
  parent_task_id uuid references tasks(id) on delete cascade, key text not null default '', title text not null, description text not null default '',
  status text not null default 'pending' check (status in ('pending','blocked','ready','in_progress','completed','failed','cancelled')),
  output text, error text, attempts int not null default 0, max_attempts int not null default 3, feedback text,
  deliverable_type text, started_at timestamptz, completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table task_dependencies (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade, depends_on_task_id uuid not null references tasks(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (task_id, depends_on_task_id)
);
create table agent_assignments (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade, agent_id uuid not null references ai_agents(id),
  assigned_by_agent_id uuid references ai_agents(id), reason text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table agent_messages_internal (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade, task_id uuid references tasks(id) on delete cascade,
  from_agent_id uuid not null references ai_agents(id), to_agent_id uuid not null references ai_agents(id),
  kind text not null default 'note' check (kind in ('delegation','request_help','handoff','review','note')), content text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table campaign_deliverables (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade, task_id uuid references tasks(id) on delete set null,
  type text not null default '', title text not null, content text,
  status text not null default 'draft' check (status in ('draft','pending_approval','approved','rejected','published')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on projects(org_id, status); create index on tasks(org_id, project_id); create index on tasks(org_id, agent_id, status);
create index on task_dependencies(task_id); create index on task_dependencies(depends_on_task_id);
create index on agent_messages_internal(org_id, project_id); create index on campaigns(org_id, client_id);
create index on campaign_deliverables(org_id, campaign_id);

-- ===== Content / approvals / integrations =====
create table content_items (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations(id) on delete cascade,
  client_id uuid references clients(id) on delete set null, campaign_id uuid references campaigns(id) on delete set null,
  project_id uuid references projects(id) on delete set null, task_id uuid references tasks(id) on delete set null,
  agent_id uuid references ai_agents(id) on delete set null, platform text not null default 'instagram', type text not null default 'post',
  title text not null, body text not null default '', hashtags jsonb not null default '[]', asset_url text,
  status text not null default 'draft' check (status in ('draft','pending_approval','approved','rejected','published')),
  is_ai_generated boolean not null default true, published_via text, published_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table content_calendar (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations(id) on delete cascade,
  content_item_id uuid references content_items(id) on delete cascade, campaign_id uuid references campaigns(id) on delete cascade,
  client_id uuid references clients(id) on delete set null, platform text not null default '', title text not null,
  scheduled_for timestamptz not null, status text not null default 'draft',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table approvals (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations(id) on delete cascade,
  action text not null, title text not null, description text not null default '',
  status text not null default 'pending_approval' check (status in ('draft','pending_approval','approved','rejected','published')),
  requested_by_agent_id uuid references ai_agents(id) on delete set null, project_id uuid references projects(id) on delete cascade,
  ref_table text, ref_id uuid, payload jsonb not null default '{}', decided_by uuid, decided_at timestamptz, decision_note text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table integrations (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations(id) on delete cascade,
  provider text not null, status text not null default 'not_configured', config jsonb not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (org_id, provider)
);
create index on content_items(org_id, status); create index on content_calendar(org_id, scheduled_for); create index on approvals(org_id, status);

-- ===== Observability / queue =====
create table analytics_events (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete cascade, client_id uuid references clients(id) on delete set null,
  agent_id uuid references ai_agents(id) on delete set null, metric text not null, value numeric not null default 0,
  source text not null default 'real' check (source in ('real','simulated')), occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table activity_logs (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations(id) on delete cascade,
  agent_id uuid references ai_agents(id) on delete set null, project_id uuid references projects(id) on delete cascade,
  task_id uuid references tasks(id) on delete cascade, level text not null default 'info', event text not null, message text not null,
  meta jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table ai_usage (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations(id) on delete cascade,
  agent_id uuid, task_id uuid, provider text not null, model text not null, tokens_in int not null default 0, tokens_out int not null default 0,
  cost_usd numeric not null default 0, simulated boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table jobs (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations(id) on delete cascade,
  type text not null, payload jsonb not null default '{}', status text not null default 'pending' check (status in ('pending','running','done','failed')),
  attempts int not null default 0, max_attempts int not null default 3, run_at timestamptz not null default now(), last_error text, locked_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on analytics_events(org_id, metric, occurred_at); create index on activity_logs(org_id, created_at desc);
create index on activity_logs(task_id); create index on ai_usage(org_id, created_at); create index on jobs(status, run_at);

-- ===== updated_at triggers + RLS tenant isolation =====
do $$
declare t text;
begin
  foreach t in array array['organizations','profiles','departments','ai_agents','agent_skills','clients','brands','client_documents','agent_memories',
    'agent_conversations','agent_messages','campaigns','projects','tasks','task_dependencies','agent_assignments','agent_messages_internal',
    'campaign_deliverables','content_items','content_calendar','approvals','integrations','analytics_events','activity_logs','ai_usage','jobs']
  loop
    execute format('create trigger %I_upd before update on %I for each row execute function set_updated_at()', t, t);
    execute format('alter table %I enable row level security', t);
    if t = 'organizations' then
      execute 'create policy org_isolation on organizations for all using (id = current_org_id()) with check (id = current_org_id())';
    elsif t = 'profiles' then
      execute 'create policy org_isolation on profiles for all using (id = auth.uid() or org_id = current_org_id()) with check (org_id = current_org_id())';
    else
      execute format('create policy org_isolation on %I for all using (org_id = current_org_id()) with check (org_id = current_org_id())', t);
    end if;
  end loop;
end $$;

-- ===== Storage bucket for generated assets (private; served via signed URLs) =====
insert into storage.buckets (id, name, public) values ('agency-assets','agency-assets', false) on conflict do nothing;
create policy "org assets read" on storage.objects for select using (bucket_id = 'agency-assets' and (storage.foldername(name))[1] = current_org_id()::text);
