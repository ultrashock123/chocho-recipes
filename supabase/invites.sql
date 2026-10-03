-- ═════════ v1.12: покани за приятели ═════════
-- Всеки потребител има лична връзка за покана. Който се регистрира през нея, става автоматично приятел на поканилия (и обратно).
create table if not exists public.invite_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code    text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)
);
alter table public.invite_codes enable row level security;
grant select on public.invite_codes to authenticated;
drop policy if exists "invite_codes: read own" on public.invite_codes;
create policy "invite_codes: read own" on public.invite_codes for select to authenticated using (user_id = auth.uid());

-- Кому сме пратили покана (за статистика; самите писма се пращат от пощата на потребителя).
create table if not exists public.invite_log (
  id         uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references auth.users(id) on delete cascade,
  email      text not null check (char_length(email) between 3 and 254),
  created_at timestamptz not null default now()
);
alter table public.invite_log enable row level security;
grant select, insert on public.invite_log to authenticated;
drop policy if exists "invite_log: read own" on public.invite_log;
create policy "invite_log: read own" on public.invite_log for select to authenticated using (inviter_id = auth.uid());
drop policy if exists "invite_log: insert own" on public.invite_log;
create policy "invite_log: insert own" on public.invite_log for insert to authenticated with check (inviter_id = auth.uid());

-- Кой през чия покана е дошъл (един път за потребител).
create table if not exists public.referrals (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  inviter_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.referrals enable row level security;   -- без политики: само през функциите

create or replace function public.my_invite_code() returns text
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not allowed' using errcode = '42501'; end if;
  insert into public.invite_codes (user_id) values (auth.uid()) on conflict (user_id) do nothing;
  return (select c.code from public.invite_codes c where c.user_id = auth.uid());
end $$;
revoke all on function public.my_invite_code() from public, anon;
grant execute on function public.my_invite_code() to authenticated;

-- Името на този, който е поканил — за да се покаже на екрана за вход („Поканен си от …").
create or replace function public.invite_info(p_code text) returns text
language sql stable security definer set search_path = public as $$
  select p.display_name from public.invite_codes c join public.profiles p on p.id = c.user_id where c.code = p_code;
$$;
revoke all on function public.invite_info(text) from public;
grant execute on function public.invite_info(text) to anon, authenticated;

-- След регистрация през връзка: двамата стават приятели.
create or replace function public.accept_invite(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare inv uuid;
begin
  if auth.uid() is null then raise exception 'not allowed' using errcode = '42501'; end if;
  select c.user_id into inv from public.invite_codes c where c.code = p_code;
  if inv is null or inv = auth.uid() then return null; end if;
  insert into public.referrals (user_id, inviter_id) values (auth.uid(), inv) on conflict (user_id) do nothing;
  insert into public.friends (user_id, friend_id) values (auth.uid(), inv), (inv, auth.uid()) on conflict do nothing;
  return inv;
end $$;
revoke all on function public.accept_invite(text) from public, anon;
grant execute on function public.accept_invite(text) to authenticated;
