create table if not exists mcp_access_tokens (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  label text not null,
  scope text not null check (scope in ('read_only', 'read_write')),
  token_prefix text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists mcp_access_tokens_user_idx on mcp_access_tokens(user_id, created_at desc);

create table if not exists investigation_runs (
  id uuid primary key,
  case_id uuid not null references cases(id) on delete cascade,
  objective text not null,
  status text not null check (status in ('active', 'completed', 'failed', 'cancelled')),
  initiated_by_token_id uuid references mcp_access_tokens(id) on delete set null,
  initiated_by_user_id uuid not null references users(id),
  client_name text,
  summary text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists evidence_records (
  id uuid primary key,
  case_id uuid not null references cases(id) on delete cascade,
  incident_id uuid references incidents(id) on delete cascade,
  run_id uuid not null references investigation_runs(id) on delete cascade,
  evidence_type text not null,
  title text not null,
  description text,
  source_locator text,
  hashes_json jsonb not null default '{}'::jsonb,
  size_bytes bigint,
  mime_type text,
  collected_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by_user_id uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists observations (
  id uuid primary key,
  case_id uuid not null references cases(id) on delete cascade,
  incident_id uuid references incidents(id) on delete cascade,
  run_id uuid not null references investigation_runs(id) on delete cascade,
  title text not null,
  description text not null,
  observed_at timestamptz,
  created_by_user_id uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists observation_evidence (
  observation_id uuid not null references observations(id) on delete cascade,
  evidence_id uuid not null references evidence_records(id),
  created_at timestamptz not null default now(),
  primary key (observation_id, evidence_id)
);

create table if not exists hypotheses (
  id uuid primary key,
  case_id uuid not null references cases(id) on delete cascade,
  incident_id uuid references incidents(id) on delete cascade,
  run_id uuid not null references investigation_runs(id) on delete cascade,
  title text not null,
  description text not null,
  status text not null default 'open' check (status in ('open', 'supported', 'rejected')),
  created_by_user_id uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hypothesis_observations (
  hypothesis_id uuid not null references hypotheses(id) on delete cascade,
  observation_id uuid not null references observations(id),
  created_at timestamptz not null default now(),
  primary key (hypothesis_id, observation_id)
);

create table if not exists finding_observations (
  finding_id uuid not null references findings(id) on delete cascade,
  observation_id uuid not null references observations(id),
  created_at timestamptz not null default now(),
  primary key (finding_id, observation_id)
);

alter table findings add column if not exists created_by_agent boolean not null default false;
alter table findings add column if not exists investigation_run_id uuid references investigation_runs(id) on delete set null;

create table if not exists agent_actions (
  id uuid primary key,
  token_id uuid references mcp_access_tokens(id) on delete set null,
  user_id uuid not null references users(id),
  client_name text,
  run_id uuid references investigation_runs(id) on delete set null,
  tool_name text not null,
  idempotency_key text,
  input_hash text,
  input_json jsonb,
  outcome text not null check (outcome in ('succeeded', 'failed')),
  duration_ms integer not null,
  error_summary text,
  result_summary_json jsonb,
  record_refs_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists mcp_idempotency_results (
  token_id uuid not null references mcp_access_tokens(id) on delete cascade,
  idempotency_key text not null,
  input_hash text not null,
  result_json jsonb not null,
  created_at timestamptz not null default now(),
  primary key (token_id, idempotency_key)
);

create index if not exists investigation_runs_case_idx on investigation_runs(case_id, created_at desc);
create index if not exists evidence_records_case_idx on evidence_records(case_id, run_id, created_at desc);
create index if not exists observations_case_idx on observations(case_id, run_id, created_at desc);
create index if not exists hypotheses_case_idx on hypotheses(case_id, run_id, created_at desc);
create index if not exists agent_actions_case_run_idx on agent_actions(run_id, created_at desc);
