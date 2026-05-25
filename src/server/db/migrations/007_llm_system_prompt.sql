alter table llm_settings
  add column if not exists system_prompt text not null default '';
