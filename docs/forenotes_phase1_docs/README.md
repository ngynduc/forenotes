# Forenotes Phase 1 Planning Docs

This folder contains the rewritten Phase 1 planning documents for a fresh Forenotes implementation.

## Files

- `TECHSTACK.md` - recommended frontend, backend, database, styling, testing, and quality stack.
- `ARCHITECTURE.md` - application architecture, folder structure, services, UI patterns, evidence linking, tags, and notifications.
- `DB_SCHEMA.md` - database schema, Mermaid ER diagram, tables, indexes, and validation rules.
- `CORE_FUNCTIONALITY.md` - product functionality, workflows, acceptance scenarios, and done definition.

## Major Phase 1 Decisions

- Start with fresh CSS; no existing stylesheet assumption.
- Keep `FINDINGS` separate from `TIMELINE_EVENTS`.
- Use `FINDINGS` for analyst conclusions.
- Use `TIMELINE_EVENTS` for chronological observations.
- Add `INDICATORS` for IoCs and investigation artifacts.
- Use generic `FINDING_EVIDENCE_LINKS` so findings can link to timeline events, systems, accounts, indicators, queries, and future attachments.
- Use global built-in MITRE ATT&CK tags.
- Use case-scoped custom tags created by users.
- Prevent cross-incident links for evidence and tasks.
- Add notification unseen/read state.
- Require browser-verifiable acceptance scenarios.
