alter table timeline_events
  add column if not exists event_role text not null default 'primary',
  add column if not exists primary_event_id uuid references timeline_events(id) on delete set null;

alter table timeline_events
  drop constraint if exists timeline_events_event_role_check;

alter table timeline_events
  add constraint timeline_events_event_role_check
  check (event_role in ('primary', 'supporting'));

create index if not exists timeline_events_primary_event_id_idx
  on timeline_events (primary_event_id);

create index if not exists timeline_events_incident_role_time_idx
  on timeline_events (incident_id, event_role, event_time asc);
