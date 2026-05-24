alter table users add column if not exists must_change_password boolean not null default false;
alter table users add column if not exists is_bootstrap_admin boolean not null default false;

update case_members
set case_role = case
  when case_role in ('case_lead', 'incident_commander') then 'case_lead'
  when case_role in ('response_lead', 'investigation_lead') then 'response_lead'
  when case_role = 'viewer' then 'viewer'
  else 'analyst'
end
where case_role not in ('case_lead', 'response_lead', 'analyst', 'viewer');

insert into case_members (case_id, user_id, case_role, added_by_user_id, added_at)
select distinct i.case_id, im.user_id, 'case_lead', im.added_by_user_id, im.added_at
from incident_members im
inner join incidents i on i.id = im.incident_id
where im.incident_role in ('incident_lead', 'incident_commander')
on conflict (case_id, user_id) do nothing;

insert into case_members (case_id, user_id, case_role, added_by_user_id, added_at)
select distinct i.case_id, im.user_id, 'response_lead', im.added_by_user_id, im.added_at
from incident_members im
inner join incidents i on i.id = im.incident_id
where im.incident_role in ('investigation_lead', 'response_lead')
on conflict (case_id, user_id) do nothing;

insert into case_members (case_id, user_id, case_role, added_by_user_id, added_at)
select distinct i.case_id, im.user_id, 'analyst', im.added_by_user_id, im.added_at
from incident_members im
inner join incidents i on i.id = im.incident_id
where im.incident_role in ('triage_analyst', 'analyst', 'member')
on conflict (case_id, user_id) do nothing;

insert into case_members (case_id, user_id, case_role, added_by_user_id, added_at)
select distinct i.case_id, im.user_id, 'viewer', im.added_by_user_id, im.added_at
from incident_members im
inner join incidents i on i.id = im.incident_id
on conflict (case_id, user_id) do nothing;

insert into incident_members (incident_id, user_id, incident_role, added_by_user_id, added_at)
select
  i.id,
  cm.user_id,
  case
    when cm.case_role = 'case_lead' then 'incident_lead'
    when cm.case_role = 'response_lead' then 'investigation_lead'
    when cm.case_role = 'viewer' then 'viewer'
    else 'analyst'
  end,
  cm.added_by_user_id,
  cm.added_at
from case_members cm
inner join incidents i on i.case_id = cm.case_id
on conflict (incident_id, user_id) do update set
  incident_role = excluded.incident_role,
  added_by_user_id = excluded.added_by_user_id;
