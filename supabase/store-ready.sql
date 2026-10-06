-- Rifay Umami v1.26: изисквания на Google Play и App Store за приложения с потребителско съдържание.
--   1) Докладване на съдържание (рецепти, потребители)   2) Блокиране на потребители
--   3) Изтриване на собствения акаунт от самото приложение   4) Табло за докладите (само за администратор)
-- Пуска се еднократно в SQL Editor. Безопасно е да се пусне повторно.

/* ───────── 1) Доклади ───────── */
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('recipe', 'user', 'message')),
  target_id   text not null,
  owner_id    uuid references auth.users(id) on delete set null,      -- авторът на докладваното съдържание
  reason      text not null,
  details     text,
  status      text not null default 'open' check (status in ('open', 'handled')),
  created_at  timestamptz not null default now()
);
create index if not exists reports_status_idx on public.reports (status, created_at desc);
alter table public.reports enable row level security;
grant insert on public.reports to authenticated;
drop policy if exists "reports: insert own" on public.reports;
create policy "reports: insert own" on public.reports
  for insert to authenticated with check (reporter_id = auth.uid());
-- четене само през функцията по-долу (за администратор)

create or replace function public.admin_reports()
returns table (rep_id uuid, rep_type text, rep_target text, rep_owner uuid, rep_owner_name text, rep_reporter_name text,
               rep_reason text, rep_details text, rep_status text, rep_created timestamptz, rep_title text)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.app_admins a where a.user_id = auth.uid()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query
    select r.id, r.target_type, r.target_id, r.owner_id, po.display_name, pr.display_name, r.reason, r.details, r.status, r.created_at,
           (select rc.data->>'title' from public.recipes rc where rc.id = r.target_id)
    from public.reports r
    left join public.profiles po on po.id = r.owner_id
    left join public.profiles pr on pr.id = r.reporter_id
    order by (r.status = 'open') desc, r.created_at desc
    limit 200;
end $$;
revoke all on function public.admin_reports() from public, anon;
grant execute on function public.admin_reports() to authenticated;

create or replace function public.admin_resolve_report(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.app_admins a where a.user_id = auth.uid()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  update public.reports set status = 'handled' where id = p_id;
end $$;
revoke all on function public.admin_resolve_report(uuid) from public, anon;
grant execute on function public.admin_resolve_report(uuid) to authenticated;

/* ───────── 2) Блокирани потребители (всеки блокира за себе си) ───────── */
create table if not exists public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);
alter table public.user_blocks enable row level security;
grant select, insert, delete on public.user_blocks to authenticated;
drop policy if exists "blocks: read own" on public.user_blocks;
create policy "blocks: read own" on public.user_blocks for select to authenticated using (blocker_id = auth.uid());
drop policy if exists "blocks: add own" on public.user_blocks;
create policy "blocks: add own" on public.user_blocks for insert to authenticated with check (blocker_id = auth.uid() and blocked_id <> auth.uid());
drop policy if exists "blocks: remove own" on public.user_blocks;
create policy "blocks: remove own" on public.user_blocks for delete to authenticated using (blocker_id = auth.uid());

-- Блокиран потребител не може да пише на този, който го е блокирал (допълнително правило върху съобщенията).
drop policy if exists "messages: not blocked" on public.messages;
create policy "messages: not blocked" on public.messages
  as restrictive for insert to authenticated
  with check (not exists (select 1 from public.user_blocks b where b.blocker_id = messages.recipient_id and b.blocked_id = auth.uid()));

/* ───────── 3) Изтриване на собствения акаунт ───────── */
-- Всички таблици с данни на потребителя са свързани с „on delete cascade“, затова изтриването на акаунта премахва
-- рецептите, любимите, съобщенията, оценките, приятелите и профила. Файловете със снимки приложението трие само, преди това.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if exists (select 1 from public.app_admins a where a.user_id = auth.uid()) then
    raise exception 'an administrator account cannot be deleted from the app' using errcode = '42501';
  end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
