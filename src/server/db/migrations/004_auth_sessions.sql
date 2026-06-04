alter table users add column if not exists username text;
update users set username = email where username is null;
alter table users alter column username set not null;

create unique index if not exists users_username_key on users (username);

alter table users add column if not exists last_login_at timestamptz;

create table if not exists sessions (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists sessions_user_id_idx on sessions (user_id);
create index if not exists sessions_expires_at_idx on sessions (expires_at);
