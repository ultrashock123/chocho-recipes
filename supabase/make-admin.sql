-- Еднократно: прави твоя акаунт администратор — можеш да премахваш оригинални рецепти за ВСИЧКИ потребители.
-- Пусни в Supabase → SQL Editor (след като си пуснал schema.sql).
insert into public.app_admins (user_id)
select id from auth.users where lower(email) = 'chocho.rifay@gmail.com'
on conflict do nothing;
