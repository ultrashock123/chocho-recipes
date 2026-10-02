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

-- ───────── Права върху таблиците ─────────
-- Новите проекти не ги дават автоматично. Какво точно се вижда го решават правилата по-долу (RLS).
grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.recipes to anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.recipes, public.recipe_states to authenticated;

-- ───────── Правила за достъп (Row Level Security) ─────────
alter table public.profiles      enable row level security;
alter table public.recipes       enable row level security;
alter table public.recipe_states enable row level security;

drop policy if exists "profiles: everyone can read" on public.profiles;
create policy "profiles: everyone can read" on public.profiles
  for select to anon, authenticated using (true);
drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own" on public.profiles
  for insert to authenticated with check (id = auth.uid());
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Публичните рецепти ги вижда всеки (и гост); личните — само собственикът.
drop policy if exists "recipes: read public or own" on public.recipes;
create policy "recipes: read public or own" on public.recipes
  for select to anon, authenticated using (visibility = 'public' or owner_id = auth.uid());
drop policy if exists "recipes: insert own" on public.recipes;
create policy "recipes: insert own" on public.recipes
  for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "recipes: update own" on public.recipes;
create policy "recipes: update own" on public.recipes
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "recipes: delete own" on public.recipes;
create policy "recipes: delete own" on public.recipes
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
