update users
set global_role = 'commander'
where global_role = 'response_lead';

delete from role_permissions
where role = 'response_lead';

update case_members
set case_role = case
  when case_role in ('case_lead', 'response_lead', 'incident_commander', 'investigation_lead', 'commander') then 'commander'
  when case_role = 'viewer' then 'viewer'
  else 'analyst'
end
where case_role not in ('commander', 'analyst', 'viewer');

update incident_members
set incident_role = case
  when incident_role in ('incident_lead', 'incident_commander', 'investigation_lead', 'response_lead', 'commander') then 'commander'
  when incident_role = 'viewer' then 'viewer'
  else 'analyst'
end
where incident_role not in ('commander', 'analyst', 'viewer');
