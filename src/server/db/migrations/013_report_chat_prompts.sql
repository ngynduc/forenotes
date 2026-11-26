create table if not exists report_chat_prompts (
  user_id uuid primary key references users(id) on delete cascade,
  prompt text not null default '',
  updated_at timestamptz not null default now()
);
