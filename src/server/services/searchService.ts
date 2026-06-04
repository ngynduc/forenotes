import type { Database } from "../db/types.js";
import type { AuthenticatedUser } from "./authService.js";

interface SearchInput {
  query: string;
  caseId?: string;
  incidentId?: string;
}

export async function searchAccessibleRecords(database: Database, user: AuthenticatedUser, input: SearchInput) {
  const likeQuery = `%${input.query}%`;
  const attackTagMatch = "at.attack_id ilike $3 or at.name ilike $3 or coalesce(at.type, '') ilike $3 or coalesce(at.tactic, '') ilike $3";
  const customTagMatch = "ct.name ilike $3 or coalesce(ct.color, '') ilike $3";
  const attackTagMatchGlobal = "at.attack_id ilike $2 or at.name ilike $2 or coalesce(at.type, '') ilike $2 or coalesce(at.tactic, '') ilike $2";
  const customTagMatchGlobal = "ct.name ilike $2 or coalesce(ct.color, '') ilike $2";

  if (input.incidentId) {
    const result = await database.query(
      `
        with accessible_incidents as (
          select i.id, i.case_id, i.name as incident_name, c.case_name
          from incidents i
          inner join incident_members im on im.incident_id = i.id and im.user_id = $1
          inner join cases c on c.id = i.case_id
          where i.id = $2
        ),
        matching_finding_ids as (
          select distinct fct.finding_id as id
          from finding_custom_tags fct
          inner join custom_tags ct on ct.id = fct.custom_tag_id
          inner join accessible_incidents ai on ai.id = fct.incident_id
          where ${customTagMatch}
          union
          select distinct fat.finding_id as id
          from finding_attack_tags fat
          inner join attack_tags at on at.id = fat.attack_tag_id
          inner join accessible_incidents ai on ai.id = fat.incident_id
          where ${attackTagMatch}
        ),
        matching_timeline_ids as (
          select distinct tect.timeline_event_id as id
          from timeline_event_custom_tags tect
          inner join custom_tags ct on ct.id = tect.custom_tag_id
          inner join accessible_incidents ai on ai.id = tect.incident_id
          where ${customTagMatch}
          union
          select distinct teat.timeline_event_id as id
          from timeline_event_attack_tags teat
          inner join attack_tags at on at.id = teat.attack_tag_id
          inner join accessible_incidents ai on ai.id = teat.incident_id
          where ${attackTagMatch}
        )
        select 'finding' as entity_type, f.id as entity_id, f.title as title, ai.case_name, ai.incident_name, f.description as snippet
        from findings f
        inner join accessible_incidents ai on ai.id = f.incident_id
        where f.title ilike $3
          or coalesce(f.description, '') ilike $3
          or f.id in (select id from matching_finding_ids)
        union all
        select 'timeline_event', t.id, t.title, ai.case_name, ai.incident_name, t.description
        from timeline_events t
        inner join accessible_incidents ai on ai.id = t.incident_id
        where t.title ilike $3
          or coalesce(t.description, '') ilike $3
          or t.id in (select id from matching_timeline_ids)
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
        select 'custom_tag', ct.id, ct.name, ai.case_name, ai.incident_name, ct.color as snippet
        from custom_tags ct
        inner join accessible_incidents ai on ai.case_id = ct.case_id
        where ${customTagMatch}
        union all
        select 'attack_tag', at.id, coalesce(at.attack_id, '') || ' · ' || at.name, ai.case_name, ai.incident_name, coalesce(at.tactic, at.type, at.external_url)
        from attack_tags at
        inner join accessible_incidents ai on true
        where ${attackTagMatch}
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
        ),
        matching_finding_ids as (
          select distinct fct.finding_id as id
          from finding_custom_tags fct
          inner join custom_tags ct on ct.id = fct.custom_tag_id
          inner join accessible_incidents ai on ai.id = fct.incident_id
          where ${customTagMatch}
          union
          select distinct fat.finding_id as id
          from finding_attack_tags fat
          inner join attack_tags at on at.id = fat.attack_tag_id
          inner join accessible_incidents ai on ai.id = fat.incident_id
          where ${attackTagMatch}
        ),
        matching_timeline_ids as (
          select distinct tect.timeline_event_id as id
          from timeline_event_custom_tags tect
          inner join custom_tags ct on ct.id = tect.custom_tag_id
          inner join accessible_incidents ai on ai.id = tect.incident_id
          where ${customTagMatch}
          union
          select distinct teat.timeline_event_id as id
          from timeline_event_attack_tags teat
          inner join attack_tags at on at.id = teat.attack_tag_id
          inner join accessible_incidents ai on ai.id = teat.incident_id
          where ${attackTagMatch}
        )
        select * from (
          select 'finding' as entity_type, f.id as entity_id, f.title as title, ai.case_name, ai.incident_name, f.description as snippet
          from findings f
          inner join accessible_incidents ai on ai.id = f.incident_id
          where f.title ilike $3
            or coalesce(f.description, '') ilike $3
            or f.id in (select id from matching_finding_ids)
          union all
          select 'timeline_event', t.id, t.title, ai.case_name, ai.incident_name, t.description
          from timeline_events t
          inner join accessible_incidents ai on ai.id = t.incident_id
          where t.title ilike $3
            or coalesce(t.description, '') ilike $3
            or t.id in (select id from matching_timeline_ids)
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
          where ct.case_id = $2 and (${customTagMatch})
          union all
          select 'attack_tag', at.id, coalesce(at.attack_id, '') || ' · ' || at.name, c.case_name, '(global scope)' as incident_name, coalesce(at.tactic, at.type, at.external_url)
          from attack_tags at
          inner join cases c on c.id = $2
          inner join case_members cm on cm.case_id = c.id and cm.user_id = $1
          where ${attackTagMatch}
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
      ),
      matching_finding_ids as (
        select distinct fct.finding_id as id
        from finding_custom_tags fct
        inner join custom_tags ct on ct.id = fct.custom_tag_id
        inner join accessible_incidents ai on ai.id = fct.incident_id
        where ${customTagMatchGlobal}
        union
        select distinct fat.finding_id as id
        from finding_attack_tags fat
        inner join attack_tags at on at.id = fat.attack_tag_id
        inner join accessible_incidents ai on ai.id = fat.incident_id
        where ${attackTagMatchGlobal}
      ),
      matching_timeline_ids as (
        select distinct tect.timeline_event_id as id
        from timeline_event_custom_tags tect
        inner join custom_tags ct on ct.id = tect.custom_tag_id
        inner join accessible_incidents ai on ai.id = tect.incident_id
        where ${customTagMatchGlobal}
        union
        select distinct teat.timeline_event_id as id
        from timeline_event_attack_tags teat
        inner join attack_tags at on at.id = teat.attack_tag_id
        inner join accessible_incidents ai on ai.id = teat.incident_id
        where ${attackTagMatchGlobal}
      )
      select * from (
        select 'finding' as entity_type, f.id as entity_id, f.title as title, ai.case_name, ai.incident_name, f.description as snippet
        from findings f
        inner join accessible_incidents ai on ai.id = f.incident_id
        where f.title ilike $2
          or coalesce(f.description, '') ilike $2
          or f.id in (select id from matching_finding_ids)
        union all
        select 'timeline_event', t.id, t.title, ai.case_name, ai.incident_name, t.description
        from timeline_events t
        inner join accessible_incidents ai on ai.id = t.incident_id
        where t.title ilike $2
          or coalesce(t.description, '') ilike $2
          or t.id in (select id from matching_timeline_ids)
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
        where ${customTagMatchGlobal}
        union all
        select 'attack_tag', at.id, coalesce(at.attack_id, '') || ' · ' || at.name, '(global cases)' as case_name, '(global scope)' as incident_name, coalesce(at.tactic, at.type, at.external_url)
        from attack_tags at
        where ${attackTagMatchGlobal}
      ) search_results
      order by case_name, incident_name, entity_type, title
    `,
    [user.id, likeQuery]
  );
  return result.rows;
}
