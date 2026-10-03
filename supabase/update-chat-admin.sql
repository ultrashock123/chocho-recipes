
-- ═════════ v1.9: чат между потребители ═════════
-- Лични съобщения 1 към 1, по желание с таг към рецепта. Пише се само на хора, които имаш в „Приятели",
-- или на такива, които вече са ти писали (за да можеш да отговориш).
create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body         text not null check (char_length(body) between 1 and 2000),
  recipe_id    text,                                   -- таг към рецепта (по желание)
  created_at   timestamptz not null default now(),
  read_at      timestamptz,
  check (sender_id <> recipient_id)
);
create index if not exists messages_recipient_idx on public.messages (recipient_id, created_at desc);
create index if not exists messages_sender_idx    on public.messages (sender_id, created_at desc);
alter table public.messages enable row level security;

grant select, insert, delete on public.messages to authenticated;
grant update (read_at) on public.messages to authenticated;   -- получателят може да променя само „прочетено"

drop policy if exists "messages: read mine" on public.messages;
create policy "messages: read mine" on public.messages
  for select to authenticated using (sender_id = auth.uid() or recipient_id = auth.uid());

drop policy if exists "messages: send to friends or replies" on public.messages;
create policy "messages: send to friends or replies" on public.messages
  for insert to authenticated with check (
    sender_id = auth.uid()
    and recipient_id <> auth.uid()
    and (
      exists (select 1 from public.friends f where f.user_id = auth.uid() and f.friend_id = messages.recipient_id)
      or exists (select 1 from public.messages m where m.sender_id = messages.recipient_id and m.recipient_id = auth.uid())
    )
  );

drop policy if exists "messages: mark read" on public.messages;
create policy "messages: mark read" on public.messages
  for update to authenticated using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

drop policy if exists "messages: delete own sent" on public.messages;
create policy "messages: delete own sent" on public.messages
  for delete to authenticated using (sender_id = auth.uid());

-- Събеседниците виждат името и снимката си един на друг (дори да са скрили името си за търсене).
drop policy if exists "profiles: read chat partners" on public.profiles;
create policy "profiles: read chat partners" on public.profiles
  for select to authenticated using (
    exists (select 1 from public.messages m
            where (m.sender_id = profiles.id and m.recipient_id = auth.uid())
               or (m.recipient_id = profiles.id and m.sender_id = auth.uid()))
  );

-- Нови съобщения пристигат веднага (Realtime).
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- ═════════ v1.10: администраторски панел (кой се е регистрирал) ═════════
-- Функциите отговарят САМО на потребители от таблицата app_admins (виж make-admin.sql). За всички останали — отказ.
create or replace function public.admin_user_stats()
returns table (r_id uuid, r_email text, r_name text, r_provider text, r_created timestamptz, r_last_login timestamptz,
               r_confirmed timestamptz, r_recipes bigint, r_cooked bigint)
language plpgsql security definer set search_path = public, auth as $$
begin
  if not exists (select 1 from public.app_admins a where a.user_id = auth.uid()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query
    select u.id, u.email::text, p.display_name, coalesce(u.raw_app_meta_data->>'provider', 'email'),
           u.created_at, u.last_sign_in_at, u.email_confirmed_at,
           (select count(*) from public.recipes r where r.owner_id = u.id),
           (select coalesce(sum(s.cooked), 0)::bigint from public.recipe_states s where s.user_id = u.id)
    from auth.users u
    left join public.profiles p on p.id = u.id
    order by u.created_at desc;
end $$;

create or replace function public.admin_totals()
returns table (t_users bigint, t_recipes bigint, t_messages bigint, t_ratings bigint, t_friends bigint)
language plpgsql security definer set search_path = public, auth as $$
begin
  if not exists (select 1 from public.app_admins a where a.user_id = auth.uid()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query
    select (select count(*) from auth.users), (select count(*) from public.recipes),
           (select count(*) from public.messages), (select count(*) from public.ratings), (select count(*) from public.friends);
end $$;

revoke all on function public.admin_user_stats() from public, anon;
revoke all on function public.admin_totals() from public, anon;
grant execute on function public.admin_user_stats() to authenticated;
grant execute on function public.admin_totals() to authenticated;

-- ═════════ v1.11: блокиране на потребители + активност по дни (само за администратор) ═════════
create table if not exists public.blocked_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  blocked_at timestamptz not null default now(),
  blocked_by uuid references auth.users(id) on delete set null
);
alter table public.blocked_users enable row level security;   -- без политики: достъп само през функциите по-долу

create or replace function public.is_blocked() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.blocked_users b where b.user_id = auth.uid());
$$;
revoke all on function public.is_blocked() from public, anon;
grant execute on function public.is_blocked() to authenticated;

-- Блокиран потребител не може да пише никъде (рестриктивните правила се прилагат ЗАЕДНО с останалите).
do $$
declare t text;
begin
  foreach t in array array['recipes', 'recipe_states', 'recipe_shares', 'friends', 'ratings', 'messages', 'profiles'] loop
    execute format('drop policy if exists "blocked: no insert" on public.%I', t);
    execute format('create policy "blocked: no insert" on public.%I as restrictive for insert to authenticated with check (not public.is_blocked())', t);
    execute format('drop policy if exists "blocked: no update" on public.%I', t);
    execute format('create policy "blocked: no update" on public.%I as restrictive for update to authenticated using (not public.is_blocked())', t);
  end loop;
end $$;

-- Блокиране / отблокиране. Не може да блокираш себе си или друг администратор.
create or replace function public.admin_set_blocked(p_user uuid, p_blocked boolean) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not exists (select 1 from public.app_admins a where a.user_id = auth.uid()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_user = auth.uid() or exists (select 1 from public.app_admins a where a.user_id = p_user) then
    raise exception 'cannot block an admin' using errcode = '42501';
  end if;
  if p_blocked then
    insert into public.blocked_users (user_id, blocked_by) values (p_user, auth.uid()) on conflict (user_id) do nothing;
    update auth.users set banned_until = now() + interval '100 years' where id = p_user;   -- не може да влиза отново
    delete from auth.sessions where user_id = p_user;                                        -- излиза от всички устройства
  else
    delete from public.blocked_users where user_id = p_user;
    update auth.users set banned_until = null where id = p_user;
  end if;
end $$;
revoke all on function public.admin_set_blocked(uuid, boolean) from public, anon;
grant execute on function public.admin_set_blocked(uuid, boolean) to authenticated;

-- Списъкът с потребители вече казва кой е блокиран и кой е администратор (променя се типът на резултата → drop).
drop function if exists public.admin_user_stats();
create function public.admin_user_stats()
returns table (r_id uuid, r_email text, r_name text, r_provider text, r_created timestamptz, r_last_login timestamptz,
               r_confirmed timestamptz, r_recipes bigint, r_cooked bigint, r_blocked boolean, r_is_admin boolean)
language plpgsql security definer set search_path = public, auth as $$
begin
  if not exists (select 1 from public.app_admins a where a.user_id = auth.uid()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query
    select u.id, u.email::text, p.display_name, coalesce(u.raw_app_meta_data->>'provider', 'email'),
           u.created_at, u.last_sign_in_at, u.email_confirmed_at,
           (select count(*) from public.recipes r where r.owner_id = u.id),
           (select coalesce(sum(s.cooked), 0)::bigint from public.recipe_states s where s.user_id = u.id),
           exists (select 1 from public.blocked_users b where b.user_id = u.id),
           exists (select 1 from public.app_admins a2 where a2.user_id = u.id)
    from auth.users u
    left join public.profiles p on p.id = u.id
    order by u.created_at desc;
end $$;
revoke all on function public.admin_user_stats() from public, anon;
grant execute on function public.admin_user_stats() to authenticated;

-- Активност по дни за последните 30 дни: активни потребители и брой действия.
create or replace function public.admin_activity()
returns table (r_day date, r_active bigint, r_recipes bigint, r_messages bigint, r_ratings bigint, r_cooked bigint)
language plpgsql security definer set search_path = public, auth as $$
begin
  if not exists (select 1 from public.app_admins a where a.user_id = auth.uid()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query
    with days as (select generate_series(current_date - 29, current_date, interval '1 day')::date as d),
    ev as (
      select r.owner_id as uid, r.created_at::date as d, 'recipe'::text as k from public.recipes r
      union all select m.sender_id, m.created_at::date, 'message' from public.messages m
      union all select x.rater_id, x.created_at::date, 'rating' from public.ratings x
      union all select s.user_id, s.updated_at::date, 'cooked' from public.recipe_states s where s.cooked > 0
    )
    select days.d, count(distinct ev.uid), count(*) filter (where ev.k = 'recipe'), count(*) filter (where ev.k = 'message'),
           count(*) filter (where ev.k = 'rating'), count(*) filter (where ev.k = 'cooked')
    from days left join ev on ev.d = days.d
    group by days.d order by days.d;
end $$;
revoke all on function public.admin_activity() from public, anon;
grant execute on function public.admin_activity() to authenticated;
