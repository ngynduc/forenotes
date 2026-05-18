import type { Database } from "../db/types.js";
import type { AuthenticatedUser } from "./authService.js";

interface SearchInput {
  query: string;
  caseId?: string;
  incidentId?: string;
}

export async function searchAccessibleRecords(database: Database, user: AuthenticatedUser, input: SearchInput) {
  const likeQuery = `%${input.query}%`;

  if (input.incidentId) {
    const result = await database.query(
      `
        with accessible_incidents as (
          select i.id, i.case_id, i.name as incident_name, c.case_name
          from incidents i
          inner join incident_members im on im.incident_id = i.id and im.user_id = $1
          inner join cases c on c.id = i.case_id
          where i.id = $2
        )
        select 'finding' as entity_type, f.id as entity_id, f.title as title, ai.case_name, ai.incident_name, f.description as snippet
        from findings f
        inner join accessible_incidents ai on ai.id = f.incident_id
        where f.title ilike $3 or coalesce(f.description, '') ilike $3
        union all
        select 'timeline_event', t.id, t.title, ai.case_name, ai.incident_name, t.description
        from timeline_events t
        inner join accessible_incidents ai on ai.id = t.incident_id
        where t.title ilike $3 or coalesce(t.description, '') ilike $3
        union all
        select 'indicator', i.id, i.value, ai.case_name, ai.incident_name, i.description
        from indicators i
        inner join accessible_incidents ai on ai.id = i.incident_id
        where i.value ilike $3 or coalesce(i.description, '') ilike $3
        union all
        select 'query', q.id, q.name, ai.case_name, ai.incident_name, q.description
        from queries q
        inner join accessible_incidents ai on ai.id = q.incident_id
        where q.name ilike $3 or q.query_body ilike $3 or coalesce(q.description, '') ilike $3
        union all
        select 'task', tk.id, tk.title, ai.case_name, ai.incident_name, tk.description
        from tasks tk
        inner join accessible_incidents ai on ai.id = tk.incident_id
        where tk.title ilike $3 or coalesce(tk.description, '') ilike $3
        union all
        select 'system', s.id, s.hostname, ai.case_name, ai.incident_name, coalesce(s.os, s.owner, s.notes)
        from systems s
        inner join accessible_incidents ai on ai.id = s.incident_id
        where s.hostname ilike $3 or coalesce(s.os, '') ilike $3 or coalesce(s.owner, '') ilike $3 or coalesce(s.notes, '') ilike $3
        union all
        select 'account', a.id, a.username, ai.case_name, ai.incident_name, coalesce(a.domain, a.status, a.owner, a.notes)
        from accounts a
        inner join accessible_incidents ai on ai.id = a.incident_id
        where a.username ilike $3 or coalesce(a.domain, '') ilike $3 or coalesce(a.status, '') ilike $3 or coalesce(a.owner, '') ilike $3 or coalesce(a.notes, '') ilike $3
      `,
      [user.id, input.incidentId, likeQuery]
    );
    return result.rows;
  }

  if (input.caseId) {
    const result = await database.query(
      `
        with accessible_incidents as (
          select i.id, i.case_id, i.name as incident_name, c.case_name
          from incidents i
          inner join cases c on c.id = i.case_id
          inner join case_members cm on cm.case_id = c.id and cm.user_id = $1
          inner join incident_members im on im.incident_id = i.id and im.user_id = $1
          where c.id = $2
        )
        select * from (
          select 'finding' as entity_type, f.id as entity_id, f.title as title, ai.case_name, ai.incident_name, f.description as snippet
          from findings f
          inner join accessible_incidents ai on ai.id = f.incident_id
          where f.title ilike $3 or coalesce(f.description, '') ilike $3
          union all
          select 'timeline_event', t.id, t.title, ai.case_name, ai.incident_name, t.description
          from timeline_events t
          inner join accessible_incidents ai on ai.id = t.incident_id
          where t.title ilike $3 or coalesce(t.description, '') ilike $3
          union all
          select 'indicator', i.id, i.value, ai.case_name, ai.incident_name, i.description
          from indicators i
          inner join accessible_incidents ai on ai.id = i.incident_id
          where i.value ilike $3 or coalesce(i.description, '') ilike $3
          union all
          select 'query', q.id, q.name, ai.case_name, ai.incident_name, q.description
          from queries q
          inner join accessible_incidents ai on ai.id = q.incident_id
          where q.name ilike $3 or q.query_body ilike $3 or coalesce(q.description, '') ilike $3
          union all
          select 'task', tk.id, tk.title, ai.case_name, ai.incident_name, tk.description
          from tasks tk
          inner join accessible_incidents ai on ai.id = tk.incident_id
          where tk.title ilike $3 or coalesce(tk.description, '') ilike $3
          union all
          select 'system', s.id, s.hostname, ai.case_name, ai.incident_name, coalesce(s.os, s.owner, s.notes)
          from systems s
          inner join accessible_incidents ai on ai.id = s.incident_id
          where s.hostname ilike $3 or coalesce(s.os, '') ilike $3 or coalesce(s.owner, '') ilike $3 or coalesce(s.notes, '') ilike $3
          union all
          select 'account', a.id, a.username, ai.case_name, ai.incident_name, coalesce(a.domain, a.status, a.owner, a.notes)
          from accounts a
          inner join accessible_incidents ai on ai.id = a.incident_id
          where a.username ilike $3 or coalesce(a.domain, '') ilike $3 or coalesce(a.status, '') ilike $3 or coalesce(a.owner, '') ilike $3 or coalesce(a.notes, '') ilike $3
          union all
          select 'custom_tag', ct.id, ct.name, c.case_name, '(case scope)' as incident_name, ct.color as snippet
          from custom_tags ct
          inner join cases c on c.id = ct.case_id
          inner join case_members cm on cm.case_id = c.id and cm.user_id = $1
          where ct.case_id = $2 and (ct.name ilike $3 or coalesce(ct.color, '') ilike $3)
          union all
          select 'incident', i.id, i.name, c.case_name, i.name as incident_name, i.summary
          from incidents i
          inner join cases c on c.id = i.case_id
          inner join incident_members im on im.incident_id = i.id and im.user_id = $1
          where i.case_id = $2 and (i.name ilike $3 or coalesce(i.summary, '') ilike $3)
        ) search_results
        order by case_name, incident_name, entity_type, title
      `,
      [user.id, input.caseId, likeQuery]
    );
    return result.rows;
  }

  const result = await database.query(
    `
      with accessible_incidents as (
        select i.id, i.case_id, i.name as incident_name, c.case_name
        from incidents i
        inner join incident_members im on im.incident_id = i.id and im.user_id = $1
        inner join cases c on c.id = i.case_id
      )
      select * from (
        select 'finding' as entity_type, f.id as entity_id, f.title as title, ai.case_name, ai.incident_name, f.description as snippet
        from findings f
        inner join accessible_incidents ai on ai.id = f.incident_id
        where f.title ilike $2 or coalesce(f.description, '') ilike $2
        union all
        select 'timeline_event', t.id, t.title, ai.case_name, ai.incident_name, t.description
        from timeline_events t
        inner join accessible_incidents ai on ai.id = t.incident_id
        where t.title ilike $2 or coalesce(t.description, '') ilike $2
        union all
        select 'indicator', i.id, i.value, ai.case_name, ai.incident_name, i.description
        from indicators i
        inner join accessible_incidents ai on ai.id = i.incident_id
        where i.value ilike $2 or coalesce(i.description, '') ilike $2
        union all
        select 'query', q.id, q.name, ai.case_name, ai.incident_name, q.description
        from queries q
        inner join accessible_incidents ai on ai.id = q.incident_id
        where q.name ilike $2 or q.query_body ilike $2 or coalesce(q.description, '') ilike $2
        union all
        select 'task', tk.id, tk.title, ai.case_name, ai.incident_name, tk.description
        from tasks tk
        inner join accessible_incidents ai on ai.id = tk.incident_id
        where tk.title ilike $2 or coalesce(tk.description, '') ilike $2
        union all
        select 'system', s.id, s.hostname, ai.case_name, ai.incident_name, coalesce(s.os, s.owner, s.notes)
        from systems s
        inner join accessible_incidents ai on ai.id = s.incident_id
        where s.hostname ilike $2 or coalesce(s.os, '') ilike $2 or coalesce(s.owner, '') ilike $2 or coalesce(s.notes, '') ilike $2
        union all
        select 'account', a.id, a.username, ai.case_name, ai.incident_name, coalesce(a.domain, a.status, a.owner, a.notes)
        from accounts a
        inner join accessible_incidents ai on ai.id = a.incident_id
        where a.username ilike $2 or coalesce(a.domain, '') ilike $2 or coalesce(a.status, '') ilike $2 or coalesce(a.owner, '') ilike $2 or coalesce(a.notes, '') ilike $2
        union all
        select 'incident', i.id, i.name, c.case_name, i.name as incident_name, i.summary
        from incidents i
        inner join incident_members im on im.incident_id = i.id and im.user_id = $1
        inner join cases c on c.id = i.case_id
        where i.name ilike $2 or coalesce(i.summary, '') ilike $2
        union all
        select 'case', c.id, c.case_name, c.case_name, '(case scope)' as incident_name, c.summary
        from cases c
        inner join case_members cm on cm.case_id = c.id and cm.user_id = $1
        where c.case_name ilike $2 or coalesce(c.client_name, '') ilike $2 or coalesce(c.summary, '') ilike $2
        union all
        select 'custom_tag', ct.id, ct.name, c.case_name, '(case scope)' as incident_name, ct.color as snippet
        from custom_tags ct
        inner join cases c on c.id = ct.case_id
        inner join case_members cm on cm.case_id = c.id and cm.user_id = $1
        where ct.name ilike $2 or coalesce(ct.color, '') ilike $2
      ) search_results
      order by case_name, incident_name, entity_type, title
    `,
    [user.id, likeQuery]
  );
  return result.rows;
}
