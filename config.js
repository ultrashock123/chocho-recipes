/* Настройки за акаунтите (Supabase). Попълва се по SETUP.md.
   Ключът "anon" е публичен по дизайн — сигурността се пази от правилата в базата (supabase/schema.sql).
   Докато полетата са празни, приложението работи само локално, без вход. */
window.RIFAY_CONFIG = {
  supabaseUrl: 'https://bstgdpesqkltbfeuxfnk.supabase.co',
  supabaseAnonKey: 'sb_publishable_VUiJJPRMSUb8xzj6TsmDSQ_efIfwWlY',
  providers: { google: false, facebook: false }, // сложи true, след като настроиш входа (виж SETUP.md)
};
