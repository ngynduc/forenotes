create table if not exists app_license (
  id text primary key default 'active',
  license_key text not null,
  license_payload jsonb not null,
  tier text not null,
  status text not null,
  expires_at timestamptz,
  activated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
