create table if not exists report_templates (
  id uuid primary key,
  incident_id uuid not null references incidents(id) on delete cascade,
  name text not null,
  report_type text not null check (report_type in ('daily', 'incident')),
  content text not null,
  created_by_user_id uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key,
  incident_id uuid not null references incidents(id) on delete cascade,
  template_id uuid references report_templates(id) on delete set null,
  title text not null,
  report_type text not null check (report_type in ('daily', 'incident')),
  report_date date,
  timezone text,
  markdown text not null,
  generation_mode text not null check (generation_mode in ('deterministic', 'llm')),
  generated_context jsonb not null,
  unresolved_placeholders jsonb not null default '[]'::jsonb,
  created_by_user_id uuid not null references users(id),
  updated_by_user_id uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists report_exports (
  id uuid primary key,
  report_id uuid not null references reports(id) on delete cascade,
  incident_id uuid not null references incidents(id) on delete cascade,
  file_url text not null,
  file_name text not null,
  created_by_user_id uuid not null references users(id),
  created_at timestamptz not null default now()
);

create table if not exists llm_settings (
  user_id uuid primary key references users(id) on delete cascade,
  provider_name text not null,
  base_url text,
  model text not null,
  encrypted_api_key text not null,
  api_key_mask text not null,
  custom_headers_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pdf_templates (
  id uuid primary key,
  name text not null,
  description text,
  scope text not null check (scope in ('global', 'incident')),
  incident_id uuid references incidents(id) on delete cascade,
  html_template text not null,
  css text not null default '',
  is_default boolean not null default false,
  created_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((scope = 'global' and incident_id is null) or (scope = 'incident' and incident_id is not null))
);

create index if not exists idx_report_templates_incident_id on report_templates(incident_id, report_type);
create index if not exists idx_reports_incident_id on reports(incident_id, created_at desc);
create index if not exists idx_report_exports_report_id on report_exports(report_id);
create index if not exists idx_pdf_templates_scope_incident on pdf_templates(scope, incident_id, updated_at desc);
create unique index if not exists idx_pdf_templates_default_per_user on pdf_templates(created_by) where is_default;
