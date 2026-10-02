-- Еднократно: задава показваното име „Chocho Rifay“ на твоя акаунт (рецептите ти показват това име като автор).
-- Пусни в Supabase → SQL Editor. Може да смениш и от приложението: Настройки → името в профила.
update public.profiles p
set display_name = 'Chocho Rifay'
from auth.users u
where u.id = p.id
  and (lower(u.email) = 'chocho.rifay@gmail.com' or lower(p.display_name) = 'chocho');
