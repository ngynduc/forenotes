create table if not exists query_attack_tags (
  query_id uuid not null references queries(id) on delete cascade,
  attack_tag_id uuid not null references attack_tags(id) on delete cascade,
  incident_id uuid not null references incidents(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (query_id, attack_tag_id)
);

create table if not exists incident_entity_links (
  id uuid primary key,
  incident_id uuid not null references incidents(id) on delete cascade,
  source_type text not null,
  source_id uuid not null,
  target_type text not null,
  target_id uuid not null,
  link_type text not null,
  created_by_user_id uuid not null references users(id),
  created_at timestamptz not null default now(),
  unique (incident_id, source_type, source_id, target_type, target_id, link_type)
);

create index if not exists incident_entity_links_incident_idx on incident_entity_links (incident_id);
create index if not exists query_attack_tags_incident_idx on query_attack_tags (incident_id);
