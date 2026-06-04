create table if not exists users (
  id uuid primary key,
  email text not null unique,
  display_name text not null,
  global_role text not null,
  status text not null default 'active',
  password_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists permissions (
  id uuid primary key,
  key text not null unique,
  description text
);

create table if not exists role_permissions (
  role text not null,
  permission_key text not null references permissions(key) on delete cascade,
  primary key (role, permission_key)
);

create table if not exists cases (
  id uuid primary key,
  case_name text not null,
  client_name text,
  start_date timestamptz,
  end_date timestamptz,
  status text not null,
  summary text,
  created_by_user_id uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists case_members (
  case_id uuid not null references cases(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  case_role text not null,
  added_by_user_id uuid not null references users(id),
  added_at timestamptz not null default now(),
  primary key (case_id, user_id)
);

create table if not exists incidents (
  id uuid primary key,
  case_id uuid not null references cases(id) on delete cascade,
  name text not null,
  summary text,
  severity text,
  status text not null,
  created_by_user_id uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists incident_members (
  incident_id uuid not null references incidents(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  incident_role text not null,
  added_by_user_id uuid not null references users(id),
  added_at timestamptz not null default now(),
  primary key (incident_id, user_id)
);

create table if not exists findings (
  id uuid primary key,
  incident_id uuid not null references incidents(id) on delete cascade,
  title text not null,
  description text,
  severity text,
  status text not null,
  confidence text,
  impact text,
  recommendation text,
  owner_user_id uuid references users(id),
  created_by_user_id uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists timeline_events (
  id uuid primary key,
  incident_id uuid not null references incidents(id) on delete cascade,
  event_time timestamptz not null,
  title text not null,
  description text,
  source text,
  raw_evidence_ref text,
  owner_user_id uuid references users(id),
  created_by_user_id uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists systems (
  id uuid primary key,
  incident_id uuid not null references incidents(id) on delete cascade,
  hostname text not null,
  ip_address inet,
  os text,
  owner text,
  notes text,
  created_by_user_id uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists accounts (
  id uuid primary key,
  incident_id uuid not null references incidents(id) on delete cascade,
  username text not null,
  domain text,
  status text,
  owner text,
  notes text,
  created_by_user_id uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists indicators (
  id uuid primary key,
  incident_id uuid not null references incidents(id) on delete cascade,
  indicator_type text not null,
  value text not null,
  description text,
  confidence text,
  source text,
  first_seen_at timestamptz,
  last_seen_at timestamptz,
  created_by_user_id uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (incident_id, indicator_type, value)
);

create table if not exists attack_tags (
  id uuid primary key,
  attack_id text not null unique,
  name text not null,
  type text,
  parent_attack_id text,
  description text,
  platform text,
  tactic text,
  attack_version text,
  external_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists custom_tags (
  id uuid primary key,
  case_id uuid not null references cases(id) on delete cascade,
  name text not null,
  color text,
  created_by_user_id uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, name)
);

create table if not exists queries (
  id uuid primary key,
  incident_id uuid not null references incidents(id) on delete cascade,
  name text not null,
  language text not null,
  description text,
  query_body text not null,
  owner_user_id uuid references users(id),
  created_by_user_id uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key,
  incident_id uuid not null references incidents(id) on delete cascade,
  title text not null,
  description text,
  status text not null,
  priority text not null,
  owner_user_id uuid references users(id),
  assignee_user_id uuid references users(id),
  created_by_user_id uuid not null references users(id),
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists task_links (
  id uuid primary key,
  task_id uuid not null references tasks(id) on delete cascade,
  incident_id uuid not null references incidents(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (task_id, entity_type, entity_id)
);

create table if not exists finding_evidence_links (
  id uuid primary key,
  finding_id uuid not null references findings(id) on delete cascade,
  incident_id uuid not null references incidents(id) on delete cascade,
  evidence_type text not null,
  evidence_id uuid not null,
  linked_by_user_id uuid not null references users(id),
  created_at timestamptz not null default now(),
  unique (finding_id, evidence_type, evidence_id)
);

create table if not exists finding_attack_tags (
  finding_id uuid not null references findings(id) on delete cascade,
  attack_tag_id uuid not null references attack_tags(id) on delete cascade,
  incident_id uuid not null references incidents(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (finding_id, attack_tag_id)
);

create table if not exists finding_custom_tags (
  finding_id uuid not null references findings(id) on delete cascade,
  custom_tag_id uuid not null references custom_tags(id) on delete cascade,
  incident_id uuid not null references incidents(id) on delete cascade,
  case_id uuid not null references cases(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (finding_id, custom_tag_id)
);

create table if not exists timeline_event_attack_tags (
  timeline_event_id uuid not null references timeline_events(id) on delete cascade,
  attack_tag_id uuid not null references attack_tags(id) on delete cascade,
  incident_id uuid not null references incidents(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (timeline_event_id, attack_tag_id)
);

create table if not exists timeline_event_custom_tags (
  timeline_event_id uuid not null references timeline_events(id) on delete cascade,
  custom_tag_id uuid not null references custom_tags(id) on delete cascade,
  incident_id uuid not null references incidents(id) on delete cascade,
  case_id uuid not null references cases(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (timeline_event_id, custom_tag_id)
);

create table if not exists notifications (
  id uuid primary key,
  recipient_user_id uuid not null references users(id) on delete cascade,
  incident_id uuid references incidents(id) on delete cascade,
  actor_user_id uuid references users(id),
  event_type text not null,
  title text not null,
  body text,
  entity_type text,
  entity_id uuid,
  unseen boolean not null default true,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key,
  actor_user_id uuid not null references users(id),
  case_id uuid references cases(id) on delete cascade,
  incident_id uuid references incidents(id) on delete cascade,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  before_json jsonb,
  after_json jsonb,
  metadata_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_case_members_user_id on case_members(user_id);
create index if not exists idx_incident_members_user_id on incident_members(user_id);
create index if not exists idx_incidents_case_id on incidents(case_id);
create index if not exists idx_findings_incident_id on findings(incident_id);
create index if not exists idx_timeline_events_incident_id on timeline_events(incident_id, event_time desc);
create index if not exists idx_systems_incident_id on systems(incident_id);
create index if not exists idx_accounts_incident_id on accounts(incident_id);
create index if not exists idx_indicators_incident_id on indicators(incident_id);
create index if not exists idx_queries_incident_id on queries(incident_id);
create index if not exists idx_tasks_incident_id on tasks(incident_id);
create index if not exists idx_task_links_incident_id on task_links(incident_id);
create index if not exists idx_notifications_recipient on notifications(recipient_user_id, unseen);
