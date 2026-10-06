-- Rifay Umami: daily counter for "Подреди с AI" (written only by the Edge Function with the service key).
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  n int not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;   -- no policies: nobody can read/write from the app
