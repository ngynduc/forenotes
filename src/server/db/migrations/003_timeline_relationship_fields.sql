alter table timeline_events
  add column if not exists system_id uuid references systems(id) on delete set null,
  add column if not exists account_id uuid references accounts(id) on delete set null;

create index if not exists timeline_events_system_id_idx on timeline_events (system_id);
create index if not exists timeline_events_account_id_idx on timeline_events (account_id);
