-- Rifay Umami v1.20: администраторът редактира и изтрива всички (публични) рецепти.
-- Пуска се еднократно в SQL Editor. Безопасно е да се пусне повторно.

-- 1) Чужди потребителски рецепти: админът може да ги променя и трие.
drop policy if exists "recipes: admin update" on public.recipes;
create policy "recipes: admin update" on public.recipes
  for update to authenticated
  using (exists (select 1 from public.app_admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.app_admins a where a.user_id = auth.uid()));

drop policy if exists "recipes: admin delete" on public.recipes;
create policy "recipes: admin delete" on public.recipes
  for delete to authenticated
  using (exists (select 1 from public.app_admins a where a.user_id = auth.uid()));

-- 2) Оригиналните рецепти (от recipes.json) се променят глобално чрез „корекции", които важат за всички.
create table if not exists public.recipe_overrides (
  recipe_id  text primary key,
  data       jsonb not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.recipe_overrides enable row level security;
grant select on public.recipe_overrides to anon, authenticated;
grant insert, update, delete on public.recipe_overrides to authenticated;

drop policy if exists "overrides: everyone reads" on public.recipe_overrides;
create policy "overrides: everyone reads" on public.recipe_overrides
  for select to anon, authenticated using (true);
drop policy if exists "overrides: admin insert" on public.recipe_overrides;
create policy "overrides: admin insert" on public.recipe_overrides
  for insert to authenticated with check (exists (select 1 from public.app_admins a where a.user_id = auth.uid()));
drop policy if exists "overrides: admin update" on public.recipe_overrides;
create policy "overrides: admin update" on public.recipe_overrides
  for update to authenticated
  using (exists (select 1 from public.app_admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.app_admins a where a.user_id = auth.uid()));
drop policy if exists "overrides: admin delete" on public.recipe_overrides;
create policy "overrides: admin delete" on public.recipe_overrides
  for delete to authenticated using (exists (select 1 from public.app_admins a where a.user_id = auth.uid()));
