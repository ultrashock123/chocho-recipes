-- Rifay Umami — схема за Supabase.
-- Как се ползва: Supabase → SQL Editor → New query → постави целия файл → Run.
-- Безопасно е да се пусне повторно.

-- ───────── Таблици ─────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

create table if not exists public.recipes (
  id          text primary key,                      -- генерира се от приложението (r-...)
  owner_id    uuid not null references auth.users(id) on delete cascade,
  visibility  text not null default 'public' check (visibility in ('public', 'private')),
  based_on    text,                                  -- id на оригинална рецепта, която тази версия замества
  data        jsonb not null default '{}'::jsonb,    -- заглавие, продукти, стъпки, снимки и т.н.
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists recipes_owner_idx      on public.recipes (owner_id);
create index if not exists recipes_visibility_idx on public.recipes (visibility);

-- Любими и „изпробвана“ са лични за всеки потребител (важат и за чужди, и за оригиналните рецепти).
create table if not exists public.recipe_states (
  user_id    uuid not null references auth.users(id) on delete cascade,
  recipe_id  text not null,
  favorite   boolean not null default false,
  tried      boolean,
  updated_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

-- Профилът се вижда от другите (автор на рецепта, търсене за изпращане) само ако потребителят е позволил.
alter table public.profiles add column if not exists show_author boolean not null default true;

-- Рецепта, изпратена до конкретен потребител (получателят я вижда, дори да е лична; не може да я променя).
create table if not exists public.recipe_shares (
  recipe_id   text not null references public.recipes(id) on delete cascade,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  shared_with uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (recipe_id, shared_with)
);
create index if not exists recipe_shares_to_idx on public.recipe_shares (shared_with);

-- ───────── Права върху таблиците ─────────
-- Новите проекти не ги дават автоматично. Какво точно се вижда го решават правилата по-долу (RLS).
grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.recipes to anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.recipes, public.recipe_states to authenticated;
grant select, insert, delete on public.recipe_shares to authenticated;

-- ───────── Правила за достъп (Row Level Security) ─────────
alter table public.profiles      enable row level security;
alter table public.recipes       enable row level security;
alter table public.recipe_states enable row level security;
alter table public.recipe_shares enable row level security;

-- Профил: вижда се, ако потребителят е оставил „показвай името ми“; собственикът винаги вижда своя;
-- този, който е изпратил рецепта до теб, също се вижда от теб.
drop policy if exists "profiles: everyone can read" on public.profiles;
drop policy if exists "profiles: read visible" on public.profiles;
create policy "profiles: read visible" on public.profiles
  for select to anon, authenticated using (show_author);
drop policy if exists "profiles: read own or sender" on public.profiles;
create policy "profiles: read own or sender" on public.profiles
  for select to authenticated using (
    id = auth.uid()
    or exists (select 1 from public.recipe_shares s where s.owner_id = profiles.id and s.shared_with = auth.uid())
  );
drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own" on public.profiles
  for insert to authenticated with check (id = auth.uid());
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Публичните рецепти ги вижда всеки (и гост); личните — собственикът и тези, до които ги е изпратил.
-- (s.owner_id = recipes.owner_id: само собственикът на рецептата може да я споделя.)
drop policy if exists "recipes: read public or own" on public.recipes;
drop policy if exists "recipes: read public" on public.recipes;
create policy "recipes: read public" on public.recipes
  for select to anon, authenticated using (visibility = 'public');
drop policy if exists "recipes: read own or shared" on public.recipes;
create policy "recipes: read own or shared" on public.recipes
  for select to authenticated using (
    owner_id = auth.uid()
    or exists (select 1 from public.recipe_shares s
               where s.recipe_id = recipes.id and s.owner_id = recipes.owner_id and s.shared_with = auth.uid())
  );
drop policy if exists "recipes: insert own" on public.recipes;
create policy "recipes: insert own" on public.recipes
  for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "recipes: update own" on public.recipes;
create policy "recipes: update own" on public.recipes
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "recipes: delete own" on public.recipes;
create policy "recipes: delete own" on public.recipes
  for delete to authenticated using (owner_id = auth.uid());

drop policy if exists "shares: read own or received" on public.recipe_shares;
create policy "shares: read own or received" on public.recipe_shares
  for select to authenticated using (owner_id = auth.uid() or shared_with = auth.uid());
drop policy if exists "shares: insert own" on public.recipe_shares;
create policy "shares: insert own" on public.recipe_shares
  for insert to authenticated with check (owner_id = auth.uid() and shared_with <> auth.uid());
drop policy if exists "shares: delete own" on public.recipe_shares;
create policy "shares: delete own" on public.recipe_shares
  for delete to authenticated using (owner_id = auth.uid());

drop policy if exists "states: all own" on public.recipe_states;
create policy "states: all own" on public.recipe_states
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ───────── Автоматичен профил при регистрация ─────────
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name',
             new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────── Снимки ─────────
-- Публичен контейнер: снимката се отваря по точния линк (адресите са случайни и не могат да се изброят).
-- Всеки качва/трие само в своята папка <user_id>/…
insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do nothing;

drop policy if exists "images: insert own folder" on storage.objects;
create policy "images: insert own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'recipe-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "images: read own folder" on storage.objects;
create policy "images: read own folder" on storage.objects
  for select to authenticated
  using (bucket_id = 'recipe-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "images: update own folder" on storage.objects;
create policy "images: update own folder" on storage.objects
  for update to authenticated
  using (bucket_id = 'recipe-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "images: delete own folder" on storage.objects;
create policy "images: delete own folder" on storage.objects
  for delete to authenticated
  using (bucket_id = 'recipe-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- ═════════ v1.5: готвене, приятели, скриване/изтриване, администратор ═════════

-- Колко пъти е сготвена рецептата, кога за последно, и дали е скрита за този потребител.
alter table public.recipe_states add column if not exists cooked integer not null default 0;
alter table public.recipe_states add column if not exists last_cooked timestamptz;
alter table public.recipe_states add column if not exists hidden boolean not null default false;

-- Изпращане може за всяка рецепта (оригинални и чужди публични), затова махаме връзката към таблицата с рецепти.
-- Достъп до ЛИЧНА рецепта дава само ред, създаден от нейния собственик (виж правилото за четене на recipes).
alter table public.recipe_shares drop constraint if exists recipe_shares_recipe_id_fkey;

-- Приятели: бърз списък с хора, на които често изпращаш рецепти.
create table if not exists public.friends (
  user_id    uuid not null references auth.users(id) on delete cascade,
  friend_id  uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);
alter table public.friends enable row level security;
grant select, insert, delete on public.friends to authenticated;
drop policy if exists "friends: all own" on public.friends;
create policy "friends: all own" on public.friends
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Администратор (собственикът на сайта): може да премахва оригинални рецепти за всички.
-- Добавя се само с SQL (виж make-admin.sql); от приложението не може да се назначи.
create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.app_admins enable row level security;
grant select on public.app_admins to authenticated;
drop policy if exists "admins: read own" on public.app_admins;
create policy "admins: read own" on public.app_admins
  for select to authenticated using (user_id = auth.uid());

create table if not exists public.removed_recipes (
  recipe_id  text primary key,
  removed_by uuid references auth.users(id) on delete set null,
  removed_at timestamptz not null default now()
);
alter table public.removed_recipes enable row level security;
grant select on public.removed_recipes to anon, authenticated;
grant insert, delete on public.removed_recipes to authenticated;
drop policy if exists "removed: everyone reads" on public.removed_recipes;
create policy "removed: everyone reads" on public.removed_recipes
  for select to anon, authenticated using (true);
drop policy if exists "removed: admin writes" on public.removed_recipes;
create policy "removed: admin writes" on public.removed_recipes
  for insert to authenticated with check (exists (select 1 from public.app_admins a where a.user_id = auth.uid()));
drop policy if exists "removed: admin deletes" on public.removed_recipes;
create policy "removed: admin deletes" on public.removed_recipes
  for delete to authenticated using (exists (select 1 from public.app_admins a where a.user_id = auth.uid()));

-- ═════════ v1.6: оценки (1–5 звезди) за рецепти и потребители ═════════
-- Един глас на човек за всяка рецепта и за всеки потребител (може да се променя или да се оттегли).
-- Можеш да оценяваш всяка рецепта (и своя), но не и себе си като потребител.
create table if not exists public.ratings (
  rater_id    uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('recipe', 'user')),
  target_id   text not null,                    -- id на рецептата или на потребителя
  stars       smallint not null check (stars between 1 and 5),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (rater_id, target_type, target_id)
);
create index if not exists ratings_target_idx on public.ratings (target_type, target_id);
alter table public.ratings enable row level security;

-- Кой как е гласувал не се вижда от другите: всеки чете само своите гласове.
drop policy if exists "ratings: read own" on public.ratings;
create policy "ratings: read own" on public.ratings
  for select to authenticated using (rater_id = auth.uid());
drop policy if exists "ratings: insert own" on public.ratings;
create policy "ratings: insert own" on public.ratings
  for insert to authenticated with check (
    rater_id = auth.uid()
    and ((target_type = 'user' and target_id <> auth.uid()::text)
      or target_type = 'recipe')
  );
drop policy if exists "ratings: update own" on public.ratings;
create policy "ratings: update own" on public.ratings
  for update to authenticated using (rater_id = auth.uid()) with check (
    rater_id = auth.uid()
    and ((target_type = 'user' and target_id <> auth.uid()::text)
      or target_type = 'recipe')
  );
drop policy if exists "ratings: delete own" on public.ratings;
create policy "ratings: delete own" on public.ratings
  for delete to authenticated using (rater_id = auth.uid());
grant select, insert, update, delete on public.ratings to authenticated;

-- Общата оценка (средно и брой гласове) е публична, без да показва кой е гласувал.
create or replace view public.rating_stats as
  select target_type, target_id, round(avg(stars)::numeric, 2) as avg_stars, count(*) as votes
  from public.ratings
  group by target_type, target_id;
grant select on public.rating_stats to anon, authenticated;

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
      exists (select 1 from public.friends f where f.user_id = auth.uid() and f.friend_id = recipient_id)
      or exists (select 1 from public.messages m where m.sender_id = recipient_id and m.recipient_id = auth.uid())
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
