/* Rifay Umami — recipe book (PWA, no build step). */
'use strict';

const APP_VERSION = '1.13.2';
const SITE_AUTHOR = 'Chocho Rifay'; // author of the original recipes (recipes.json)
// Fields of a recipe that are stored (locally or in the cloud). Favorite/tried live in per-user "states".
const RECIPE_FIELDS = ['title', 'collection', 'categories', 'source', 'ingredients', 'steps', 'notes', 'links', 'images', 'time', 'servings'];

/* ---------------- Static data ---------------- */
const CATEGORIES = [
  { id: 'chicken', emoji: '🍗', h: 32, bg: 'Пилешко', en: 'Chicken' },
  { id: 'pork', emoji: '🥓', h: 350, bg: 'Свинско', en: 'Pork' },
  { id: 'beef', emoji: '🥩', h: 8, bg: 'Телешко', en: 'Beef' },
  { id: 'pasta', emoji: '🍝', h: 45, bg: 'Паста', en: 'Pasta' },
  { id: 'fish', emoji: '🐟', h: 200, bg: 'Риба и морски', en: 'Fish & seafood' },
  { id: 'rice', emoji: '🍚', h: 50, bg: 'Ориз и ризото', en: 'Rice & risotto' },
  { id: 'bread', emoji: '🍞', h: 30, bg: 'Хляб и тесто', en: 'Bread & dough' },
  { id: 'pizza', emoji: '🍕', h: 15, bg: 'Пица', en: 'Pizza' },
  { id: 'dessert', emoji: '🍰', h: 330, bg: 'Десерти', en: 'Desserts' },
  { id: 'sauce', emoji: '🥫', h: 0, bg: 'Сосове и подправки', en: 'Sauces & spices' },
  { id: 'salad', emoji: '🥗', h: 110, bg: 'Салати', en: 'Salads' },
  { id: 'meze', emoji: '🧀', h: 40, bg: 'Мезета и разядки', en: 'Starters & dips' },
  { id: 'veggie', emoji: '🥦', h: 130, bg: 'Зеленчуци', en: 'Vegetables' },
  { id: 'eggs', emoji: '🍳', h: 48, bg: 'Яйца и закуски', en: 'Eggs & breakfast' },
  { id: 'drinks', emoji: '☕', h: 25, bg: 'Напитки', en: 'Drinks' },
  { id: 'other', emoji: '🍽️', h: 260, bg: 'Други', en: 'Other' },
];
const CAT = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

const COLLECTIONS = [
  { id: 'chef', emoji: '👨‍🍳', bg: 'Подбрани', en: "Chef's picks" },
  { id: 'instantpot', emoji: '♨️', bg: 'Instant Pot', en: 'Instant Pot' },
  { id: 'bread', emoji: '🥖', bg: 'Хляб и квас', en: 'Bread & sourdough' },
  { id: 'mine', emoji: '⭐', bg: 'Мои нови', en: 'My new' },
];
const COLL = Object.fromEntries(COLLECTIONS.map(c => [c.id, c]));

const I18N = {
  bg: {
    tab_home: 'Рецепти', tab_categories: 'Категории', tab_favorites: 'Любими', tab_settings: 'Настройки',
    morning: 'Добро утро', day: 'Добър ден', evening: 'Добър вечер',
    home_title: 'Какво ще готвим?', search_ph: 'Търси рецепта, продукт…',
    all: 'Всички', surprise: 'Рулетка на вкуса', surprise_sub: 'Завърти — късметът избира днешната рецепта',
    tried_rail: 'Изпробвани рецепти', recent_rail: 'Последно добавени', all_recipes: 'Всички рецепти',
    results: n => `${n} ${n === 1 ? 'рецепта' : 'рецепти'}`, recipes_n: n => `${n} ${n === 1 ? 'рецепта' : 'рецепти'}`,
    no_results: 'Нищо не намерих', no_results_sub: 'Опитай с друга дума или махни филтрите.',
    clear_filters: 'Изчисти филтрите', see_all: 'Виж всички',
    fav_title: 'Любими', fav_empty: 'Още нямаш любими', fav_empty_sub: 'Натисни ♥ на рецепта, за да я запазиш тук.',
    cat_title: 'Категории', collections: 'Колекции',
    ingredients: 'Продукти', method: 'Приготвяне', notes: 'Бележки', links: 'Линкове и видео',
    no_ingredients: 'Продуктите са описани в приготвянето.', no_method: 'Няма описание — виж снимките и линковете.',
    tried: 'Изпробвана', not_tried: 'Не е пробвана', cook: 'Готвене', share: 'Сподели', edit: 'Редактирай',
    cook_on: 'Режим готвене: екранът остава включен', cook_off: 'Режим готвене изключен',
    delete: 'Изтрий', delete_q: 'Да изтрия ли рецептата?', delete_sub: 'Това не може да се отмени.', cancel: 'Отказ',
    deleted: 'Рецептата е изтрита', saved: 'Запазено ✓', from_source: 'Източник',
    new_recipe: 'Нова рецепта', edit_recipe: 'Редакция', save: 'Запази',
    f_title: 'Име на рецептата', f_photos: 'Снимки', camera: 'Камера', gallery: 'Галерия', cover: 'Корица',
    f_categories: 'Категории', f_collection: 'Колекция', f_ingredients: 'Продукти',
    f_ing_ph: 'По един продукт на ред\nнапр. 500 г пилешко филе\n2 скилидки чесън\n## За соса  ← подзаглавие',
    f_steps: 'Приготвяне', f_steps_ph: 'Опиши стъпките. Празен ред = нова стъпка.',
    f_notes: 'Лични бележки', f_notes_ph: 'Съвети, какво да променя следващия път…',
    f_links: 'Линкове', f_add_link: 'Добави линк', f_link_ph: 'https://…',
    f_time: 'Време', f_time_ph: 'напр. 45 мин', f_servings: 'Порции', f_servings_ph: 'напр. 4',
    f_tried: 'Изпробвана от мен', need_title: 'Въведи име на рецептата',
    photo_err: 'Снимката не можа да се зареди',
    settings: 'Настройки', profile: 'Профил', your_name: 'Твоето име', personal: 'Rifay Umami · книга с рецепти',
    st_recipes: 'рецепти', st_fav: 'любими', st_tried: 'изпробвани',
    appearance: 'Изглед', theme: 'Тема', th_auto: 'Авто', th_light: 'Светла', th_dark: 'Тъмна',
    text_size: 'Големина на текста', size_preview: 'Така ще изглежда текстът в рецептите.',
    language: 'Език', data: 'Данни', export: 'Резервно копие (експорт)', import: 'Възстанови от копие',
    restore_seed: 'Върни изтритите оригинални рецепти', export_done: 'Копието е готово',
    import_done: n => `Възстановени ${n} рецепти`, import_err: 'Файлът не е валидно копие',
    restore_done: n => n ? `Върнати ${n} рецепти` : 'Всички оригинални рецепти са налице',
    about: 'Версия', storage_hint: 'Новите рецепти и снимки се пазят само на този телефон. Прави резервно копие от време на време.',
    change_photo: 'Смени снимката', remove_photo: 'Премахни снимката', sort: 'Подреди',
    sort_az: 'По азбучен ред', sort_new: 'Най-нови първо', sort_tried: 'Изпробваните първо',
    servings: 'порции', install_hint: 'За да го инсталираш: Safari → Сподели → „Добави към началния екран“.',
    roulette_title: 'Рулетка на вкуса', roulette_sub: 'Завърти и съдбата избира какво ще готвиш',
    spin: 'Завърти', spin_again: 'Завърти пак', open_recipe: 'Към рецептата', roulette_pool: 'От какво да избира?',
    roulette_win: 'Днес готвиш…', roulette_empty: 'Няма рецепти в тази категория',
    video: 'Видео', play_video: 'Пусни видеото',
    add_how: 'Как да добавим рецептата?', add_manual: '✍️ Ръчно', add_ai: '✨ С AI — опиши я с думи', add_ai_photo: '📷 С AI — от снимка на рецепта',
    ai_title: 'Рецепта с AI', ai_hint: 'Разкажи рецептата както би я обяснил на приятел — продукти, количества, как се прави. Можеш да диктуваш с микрофона на клавиатурата 🎤.',
    ai_ph: 'напр. Взимам 4 пилешки бутчета, мариновам ги с кисело мляко, чесън, къри и малко кетчуп за 2 часа, после ги пека на 200 градуса около 40 минути…',
    ai_photo: 'Снимка на рецепта (по желание)', ai_go: '✨ Направи рецептата', ai_working: 'AI пише рецептата…',
    ai_need_code: 'Въведи AI кода за достъп в Настройки → AI', ai_err: 'AI не успя. Опитай пак.',
    ai_bad_code: 'Грешен AI код за достъп', ai_not_configured: 'AI още не е настроен на сървъра (липсва API ключ).',
    ai_need_input: 'Напиши нещо или добави снимка', ai_section: 'AI помощник', ai_code: 'Код за достъп до AI',
    ai_code_hint: 'Кодът се задава в Netlify (APP_ACCESS_CODE). Пази бюджета ти — без него AI функциите не работят.',
    auth_tagline: 'Книга с рецепти — твоите и на другите', auth_signin: 'Вход', auth_signup: 'Регистрация',
    auth_google: 'Продължи с Google', auth_facebook: 'Продължи с Facebook', auth_or_email: 'или с имейл',
    auth_email: 'Имейл', auth_password: 'Парола', auth_password_new: 'Парола (поне 6 символа)',
    auth_no_account: 'Нямаш акаунт? Регистрирай се', auth_have_account: 'Вече имаш акаунт? Влез',
    auth_forgot: 'Забравена парола', auth_forgot_title: 'Нова парола', auth_newpass_title: 'Избери нова парола',
    auth_send_link: 'Изпрати линк', auth_guest: 'Продължи като гост',
    auth_guest_hint: 'Като гост виждаш само публичните рецепти и не можеш да добавяш свои.',
    auth_check_mail: 'Изпратихме ти имейл — натисни линка в него, за да потвърдиш акаунта, и после влез.',
    auth_reset_sent: 'Ако има такъв акаунт, ще получиш имейл с линк за нова парола.',
    auth_err_creds: 'Грешен имейл или парола', auth_err_confirm: 'Потвърди имейла си (виж пощата) и опитай пак',
    auth_err_exists: 'Вече има акаунт с този имейл — влез или направи нова парола', auth_err_short: 'Паролата трябва да е поне 6 символа',
    auth_err_rate: 'Твърде много опити — изчакай малко', auth_err_provider: 'Този начин за вход още не е настроен',
    auth_err_net: 'Няма връзка с интернет', auth_err_email: 'Въведи валиден имейл', auth_err_generic: 'Нещо се обърка. Опитай пак.',
    account: 'Акаунт', logout: 'Изход', login: 'Вход', login_to_add: 'Влез, за да добавяш свои рецепти',
    login_prompt: 'Влез или се регистрирай, за да добавяш рецепти, любими и да ги споделяш.',
    guest_card: 'Гост режим', guest_card_sub: 'Виждаш само публичните рецепти.', signed_as: 'Влязъл като',
    logout_q: 'Да излезеш ли от акаунта?', logged_out: 'Излезе от акаунта',
    f_visibility: 'Кой я вижда', vis_public: '🌍 Публична', vis_private: '🔒 Лична',
    vis_public_sub: 'Всички потребители могат да я видят.', vis_private_sub: 'Само ти я виждаш.',
    pill_public: '🌍 Публична', pill_private: '🔒 Лична', made_public: 'Рецептата е публична', made_private: 'Рецептата е лична',
    make_public: 'Направи публична', make_private: 'Направи лична', by_author: n => `от ${n}`,
    edit_mine: 'Редактирай като моя версия', copy_mine: 'Копирай в моите', copied: 'Копирано в твоите рецепти',
    display_name_label: 'Показвано име', display_name_hint: 'Така те виждат другите — като автор на рецептите ти и при търсене.', name_saved: 'Името е запазено',
    send_user: 'Изпрати',
    add_paste: '📋 Постави текст (безплатно, без AI)', paste_title: 'Постави рецепта', paste_from_clip: 'Постави от клипборда', paste_go: 'Преработи рецептата',
    paste_hint: 'Копирай рецептата от сайт, съобщение или документ и я постави тук — цялата, заедно със съставките и приготвянето. Приложението само ще ги подреди.',
    paste_ph: 'Необходими съставки:\n10 бр. сушени чушки\n1 чаена чаша булгур\n…\n\nРецептата:\n1. Заливате чушките с вряла вода…\n2. …',
    paste_free: 'Работи в телефона ти, безплатно и без интернет услуги. Накрая ще видиш готовата рецепта и ще можеш да поправиш каквото искаш, преди да я запазиш.',
    paste_nothing: 'Не открих съставки или приготвяне. Опитай с по-пълен текст.', paste_clip_err: 'Не мога да чета клипборда — натисни и задръж в полето и избери „Постави“.',
    paste_done: (a, b) => `Готово: ${a} продукта, ${b} ${b === 1 ? 'стъпка' : 'стъпки'}. Прегледай и запази.`,
    invite_title: 'Покани приятели', invite_short: 'Покани', invite_intro: 'Изпрати лична връзка на приятелите си. Който се регистрира през нея, става твой приятел автоматично и можете веднага да си пишете.',
    invite_emails: 'Имейли на приятели', invite_emails_ph: 'ivan@abv.bg, maria@gmail.com…', invite_preview: 'Съобщение, което ще се изпрати', invite_send_mail: 'Изпрати по имейл',
    invite_share: 'Сподели (Viber, WhatsApp, SMS…)', invite_copy: 'Копирай връзката', invite_copied: 'Копирано ✓',
    invite_hint: 'Писмото се отваря в твоята пощенска програма, подготвено и скрито за получателите (BCC) — натискаш „Изпрати“ там.',
    invite_need_email: 'Въведи поне един валиден имейл', invite_mail_opened: n => `Отварям пощата за ${n} ${n === 1 ? 'приятел' : 'приятели'}…`,
    invite_need_update: 'Поканите още не са включени в базата (пусни schema.sql).', invite_accepted: 'Вие с човека, който те покани, вече сте приятели 🎉',
    invite_from: n => `${n} те покани в Rifay Umami`, invite_from_generic: 'Покани те приятел в Rifay Umami',
    invite_subject: 'Покана за Rifay Umami — книга с рецепти', invite_text: n => `Здравей! Аз съм ${n}. Ползвам Rifay Umami — приложение с рецепти, където можем да си споделяме рецепти и да си пишем. Регистрирай се оттук и ще сме приятели:`,
    chat_not_friend: 'не е в приятелите ти', chat_add_friend: 'Добави в приятели',
    admin_activity_title: 'Активност по дни', admin_active_per_day: 'Активни потребители на ден (последните 30 дни)', admin_actions_per_day: 'Действия на ден', admin_activity_none: 'Още няма данни за активност (обнови базата със schema.sql).',
    admin_s_recipes: 'Рецепти', admin_s_messages: 'Съобщения', admin_s_ratings: 'Оценки', admin_s_cooked: 'Готвения',
    admin_blocked: 'Блокиран', admin_badge: 'админ', admin_block: 'Блокирай', admin_unblock: 'Отблокирай',
    admin_block_q: n => `Да блокирам ли „${n}“? Няма да може да влиза и да добавя нищо.`, admin_unblock_q: n => `Да отблокирам ли „${n}“?`,
    admin_blocked_done: 'Потребителят е блокиран', admin_unblocked_done: 'Потребителят е отблокиран', auth_err_banned: 'Този акаунт е блокиран от администратора.',
    admin_section: 'Администратор', admin_users: 'Потребители', admin_users_sub: 'Кой се е регистрирал', admin_total: 'Регистрирани', admin_today: 'Днес', admin_7d: '7 дни', admin_30d: '30 дни',
    admin_chart: 'Регистрации — последните 30 дни', admin_activity: 'Активност', admin_active7: 'Влизали (7 дни)', admin_with_recipes: 'Със свои рецепти', admin_cooking: 'Готвили',
    admin_unconfirmed: 'Непотвърден имейл', admin_providers: 'Начин на вход', admin_list: 'Всички потребители', admin_search: 'Търси по име или имейл…',
    admin_joined: 'регистриран', admin_last: 'последен вход', admin_never: 'не е влизал', admin_just_now: 'току-що', admin_min_ago: n => `преди ${n} мин`, admin_h_ago: n => `преди ${n} ч`, admin_d_ago: n => `преди ${n} дни`,
    admin_recipes: 'рецепти', admin_msgs: 'съобщения', admin_ratings: 'оценки', admin_friends: 'приятелства', admin_recipes_short: 'Добавени рецепти', admin_cooked_short: 'Пъти сготвено',
    admin_refresh: 'Обнови', admin_refreshed: 'Обновено', admin_export: 'Свали списъка (CSV)', admin_err_title: 'Няма достъп до данните',
    admin_err: 'Или не си администратор, или базата още не е обновена (пусни supabase/schema.sql и make-admin.sql).',
    admin_privacy_note: 'Имейлите се виждат само от теб като администратор и никога от другите потребители.',
    tab_chat: 'Общност', social_title: 'Общност', social_sub: 'Чат, приятели и покани', soc_chat: 'Чат', soc_friends: 'Приятели', soc_invite: 'Покани', invite_stat_sent: 'изпратени покани', invite_stat_joined: 'присъединили се', chat_title: 'Съобщения', chat_sub: 'Чат с приятели', chat_new: 'Ново', chat_empty: 'Още няма разговори',
    chat_empty_sub: 'Добави приятели и им пиши — можеш да тагваш рецепти в съобщенията.', chat_you: 'Ти', chat_someone: 'Някой',
    chat_recipe_missing: 'Рецептата не е достъпна за теб', chat_recipe_default: 'Виж тази рецепта', chat_back: 'Назад', chat_tag: 'Тагни рецепта',
    chat_ph: 'Напиши съобщение…', chat_send: 'Изпрати', chat_say_hi: 'Поздрави приятеля си 👋', chat_pick_recipe: 'Избери рецепта',
    chat_new_hint: 'Избери приятел или потърси по име. Ако го няма в приятелите, ще го добавим автоматично.', chat_msg: 'Съобщение', chat_delete: 'Изтрий съобщението',
    chat_need_friend: 'Първо добави човека в приятели', chat_send_err: 'Съобщението не се изпрати. Опитай пак.',
    chat_notif_title: 'Включи известията', chat_notif_hint: 'За да виждаш кога някой ти пише, дори когато приложението е във фонов режим.',
    chat_notif_blocked: 'Известията са блокирани — разреши ги от настройките на браузъра/телефона.', chat_notif_on: 'Известията са включени 🔔',
    chat_notif_denied: 'Известията не бяха разрешени', chat_notif_unsupported: 'Този браузър не поддържа известия', chat_discuss: 'Обсъди с приятел',
    fav_only: 'Любими', fav_cooked: 'Сготвени', fav_cooked_empty: 'Още нямаш сготвени рецепти', fav_cooked_empty_sub: 'Натисни „Сготвих я“ в рецептата и тя ще се появи тук.',
    privacy: 'Поверителност', delete_data: 'Изтриване на данни',
    kpi_mine: 'твои',
    timer_test_toast: '🔔 Проба на алармата — ако не чуваш, увеличи звука на телефона',
    top_title: 'Топ рецепти',
    rating_none: 'Още няма оценки', rating_votes: n => `${n} ${n === 1 ? 'оценка' : 'оценки'}`, your_rating: 'Твоята оценка',
    rate_own: 'Не можеш да оценяваш своя рецепта', rate_self: 'Не можеш да оценяваш себе си', rate_thanks: 'Благодарим за оценката ★', rate_removed: 'Оценката е премахната',
    score_exc: 'Изключително', score_top: 'Отлично', score_vgood: 'Много добро', score_good: 'Добро', score_ok: 'Задоволително', score_bad: 'Слабо',
    sort_rating: 'По оценка', user_title: 'Потребител', user_recipes: n => `${n} ${n === 1 ? 'публична рецепта' : 'публични рецепти'}`, my_rating_title: 'Оценка за теб от другите',
    cooked_btn: 'Сготвих я', cooked_n: n => `Сготвена ×${n}`, cooked_toast: n => `🍳 Сготвена ${n} ${n === 1 ? 'път' : 'пъти'}`,
    cooked_again: 'Сготвих я пак (+1)', cooked_minus: 'Намали с 1', cooked_reset: 'Не е пробвана (нулирай)',
    portions: 'Порции', serv_reset: n => `Върни на ${n}`, serv_hint: 'Количествата се преизчисляват',
    timer_custom: 'друго…', timer_custom_q: 'Колко минути?', timer_done: 'Времето изтече!', timer_stop: 'Спри', timer_title: 'Таймер', timer_cancel: 'Спри таймера',
    del_link: 'Изтрий рецептата…', captcha_ask: 'Препиши кода, за да потвърдиш',
    del_title_delete: 'Изтриване на рецептата', del_msg_delete: 'Рецептата ще бъде изтрита завинаги, заедно със снимките ѝ.', del_btn_delete: 'Изтрий завинаги',
    del_title_global: 'Премахване за всички', del_msg_global: 'Това е оригинална рецепта. Ще бъде премахната за ВСИЧКИ потребители.', del_btn_global: 'Премахни за всички',
    del_title_hide: 'Скриване на рецептата', del_msg_hide: 'Рецептата ще бъде скрита само за теб. Можеш да я върнеш от Настройки.', del_btn_hide: 'Скрий',
    hidden_done: 'Рецептата е скрита', hidden_title: 'Скрити рецепти', restore_hidden: 'Върни скритите рецепти', restored_n: n => n ? `Върнати ${n} рецепти` : 'Няма скрити рецепти',
    friends_title: 'Приятели', friends_hint: 'Добави хора със звездичка ☆, за да ги избираш бързо, когато изпращаш рецепти.', friends_empty: 'Още нямаш приятели — потърси по име и натисни ☆.',
    friend_toggle: 'Приятел', friend_added: n => `${n} е добавен в приятели`,
    share_hint_private: 'Рецептата е лична: получателят ще я вижда, но не може да я променя. Намират се само потребители, които са разрешили името им да се вижда.',
    share_hint_public: 'Получателят ще я намери в „Споделени с мен“. Намират се само потребители, които са разрешили името им да се вижда.',
    shared_by: n => `Споделена с теб от ${n}`, st_cooked: 'сготвени', st_cook_times: 'готвения',
    scope_mine: 'Мои рецепти', scope_shared: 'Споделени с мен', mine_sub: 'Всичко, което си добавил', shared_sub: 'Изпратени от други',
    share_menu: 'Изпрати на потребител', share_title: 'Изпрати рецепта', share_search_ph: 'Търси потребител по име…',
    share_hint: 'Получателят ще вижда рецептата (дори да е лична), но не може да я променя. Намират се само потребители, които са разрешили името им да се вижда.',
    share_min: 'Въведи поне 2 букви', share_none: 'Не намерих такъв потребител', share_with: 'Изпратена на', share_nobody: 'Още не е изпращана на никого',
    share_done: n => `Изпратено на ${n}`, share_removed: 'Достъпът е премахнат', share_send: 'Изпрати', share_remove: 'Премахни', close: 'Затвори',
    shared_pill: 'Споделена с теб', show_author: 'Показвай името ми', show_author_hint: 'Ако е включено, името ти се вижда като автор на публичните ти рецепти и другите могат да те намерят, за да ти изпращат рецепти.',
    save_err: 'Не успях да запазя — провери връзката', load_offline: 'Няма връзка — показвам запазените рецепти',
    local_found: n => `Намерени ${n} рецепти само на този телефон`, upload_local: 'Качи рецептите от този телефон в акаунта',
    upload_local_q: 'Как да ги качим?', upload_done: n => `Качени ${n} рецепти`, upload_busy: 'Качвам…', cloud_hint: 'Рецептите и снимките ти се пазят в акаунта и са достъпни от всяко устройство.',
  },
  en: {
    tab_home: 'Recipes', tab_categories: 'Categories', tab_favorites: 'Favorites', tab_settings: 'Settings',
    morning: 'Good morning', day: 'Good afternoon', evening: 'Good evening',
    home_title: "What's cooking?", search_ph: 'Search recipes, ingredients…',
    all: 'All', surprise: 'Flavor roulette', surprise_sub: "Spin — luck picks today's recipe",
    tried_rail: 'Tried & tested', recent_rail: 'Recently added', all_recipes: 'All recipes',
    results: n => `${n} recipe${n === 1 ? '' : 's'}`, recipes_n: n => `${n} recipe${n === 1 ? '' : 's'}`,
    no_results: 'Nothing found', no_results_sub: 'Try another word or clear the filters.',
    clear_filters: 'Clear filters', see_all: 'See all',
    fav_title: 'Favorites', fav_empty: 'No favorites yet', fav_empty_sub: 'Tap ♥ on a recipe to keep it here.',
    cat_title: 'Categories', collections: 'Collections',
    ingredients: 'Ingredients', method: 'Method', notes: 'Notes', links: 'Links & video',
    no_ingredients: 'Ingredients are described in the method.', no_method: 'No description — see photos and links.',
    tried: 'Tried', not_tried: 'Not tried', cook: 'Cook', share: 'Share', edit: 'Edit',
    cook_on: 'Cook mode: screen stays on', cook_off: 'Cook mode off',
    delete: 'Delete', delete_q: 'Delete this recipe?', delete_sub: 'This cannot be undone.', cancel: 'Cancel',
    deleted: 'Recipe deleted', saved: 'Saved ✓', from_source: 'Source',
    new_recipe: 'New recipe', edit_recipe: 'Edit recipe', save: 'Save',
    f_title: 'Recipe name', f_photos: 'Photos', camera: 'Camera', gallery: 'Gallery', cover: 'Cover',
    f_categories: 'Categories', f_collection: 'Collection', f_ingredients: 'Ingredients',
    f_ing_ph: 'One ingredient per line\ne.g. 500 g chicken breast\n2 garlic cloves\n## For the sauce  ← subheading',
    f_steps: 'Method', f_steps_ph: 'Describe the steps. Blank line = new step.',
    f_notes: 'Personal notes', f_notes_ph: 'Tips, what to change next time…',
    f_links: 'Links', f_add_link: 'Add link', f_link_ph: 'https://…',
    f_time: 'Time', f_time_ph: 'e.g. 45 min', f_servings: 'Servings', f_servings_ph: 'e.g. 4',
    f_tried: 'Tried it myself', need_title: 'Please enter a recipe name',
    photo_err: 'Could not load the photo',
    settings: 'Settings', profile: 'Profile', your_name: 'Your name', personal: 'Rifay Umami · recipe book',
    st_recipes: 'recipes', st_fav: 'favorites', st_tried: 'tried',
    appearance: 'Appearance', theme: 'Theme', th_auto: 'Auto', th_light: 'Light', th_dark: 'Dark',
    text_size: 'Text size', size_preview: 'This is how recipe text will look.',
    language: 'Language', data: 'Data', export: 'Backup (export)', import: 'Restore from backup',
    restore_seed: 'Bring back deleted original recipes', export_done: 'Backup is ready',
    import_done: n => `Restored ${n} recipes`, import_err: 'Not a valid backup file',
    restore_done: n => n ? `Restored ${n} recipes` : 'All original recipes are present',
    about: 'Version', storage_hint: 'New recipes and photos are stored only on this phone. Make a backup now and then.',
    change_photo: 'Change photo', remove_photo: 'Remove photo', sort: 'Sort',
    sort_az: 'Alphabetical', sort_new: 'Newest first', sort_tried: 'Tried first',
    servings: 'servings', install_hint: 'To install: Safari → Share → “Add to Home Screen”.',
    roulette_title: 'Flavor roulette', roulette_sub: 'Spin and let fate pick what you cook',
    spin: 'Spin', spin_again: 'Spin again', open_recipe: 'Open recipe', roulette_pool: 'Pick from…',
    roulette_win: "Today you're cooking…", roulette_empty: 'No recipes in this category',
    video: 'Video', play_video: 'Play video',
    add_how: 'How do you want to add it?', add_manual: '✍️ Manually', add_ai: '✨ With AI — describe it in words', add_ai_photo: '📷 With AI — from a recipe photo',
    ai_title: 'Recipe with AI', ai_hint: 'Tell the recipe like you would to a friend — ingredients, amounts, how to make it. You can dictate with the keyboard mic 🎤.',
    ai_ph: 'e.g. I take 4 chicken thighs, marinate them in yogurt, garlic, curry and a little ketchup for 2 hours, then roast at 200°C for about 40 minutes…',
    ai_photo: 'Photo of a recipe (optional)', ai_go: '✨ Create recipe', ai_working: 'AI is writing the recipe…',
    ai_need_code: 'Enter the AI access code in Settings → AI', ai_err: 'AI failed. Try again.',
    ai_bad_code: 'Wrong AI access code', ai_not_configured: 'AI is not set up on the server yet (missing API key).',
    ai_need_input: 'Write something or add a photo', ai_section: 'AI assistant', ai_code: 'AI access code',
    ai_code_hint: 'The code is set in Netlify (APP_ACCESS_CODE). It protects your budget — AI features need it.',
    auth_tagline: 'A recipe book — yours and everyone’s', auth_signin: 'Sign in', auth_signup: 'Sign up',
    auth_google: 'Continue with Google', auth_facebook: 'Continue with Facebook', auth_or_email: 'or with email',
    auth_email: 'Email', auth_password: 'Password', auth_password_new: 'Password (min. 6 characters)',
    auth_no_account: 'No account? Sign up', auth_have_account: 'Already have an account? Sign in',
    auth_forgot: 'Forgot password', auth_forgot_title: 'Reset password', auth_newpass_title: 'Choose a new password',
    auth_send_link: 'Send link', auth_guest: 'Continue as guest',
    auth_guest_hint: 'As a guest you only see public recipes and cannot add your own.',
    auth_check_mail: 'We sent you an email — tap the link in it to confirm your account, then sign in.',
    auth_reset_sent: 'If that account exists, you will get an email with a reset link.',
    auth_err_creds: 'Wrong email or password', auth_err_confirm: 'Confirm your email (check your inbox) and try again',
    auth_err_exists: 'An account with this email already exists — sign in or reset the password', auth_err_short: 'Password must be at least 6 characters',
    auth_err_rate: 'Too many attempts — wait a bit', auth_err_provider: 'This sign-in method is not set up yet',
    auth_err_net: 'No internet connection', auth_err_email: 'Enter a valid email', auth_err_generic: 'Something went wrong. Try again.',
    account: 'Account', logout: 'Sign out', login: 'Sign in', login_to_add: 'Sign in to add your own recipes',
    login_prompt: 'Sign in or sign up to add recipes, favorites and share them.',
    guest_card: 'Guest mode', guest_card_sub: 'You only see public recipes.', signed_as: 'Signed in as',
    logout_q: 'Sign out of your account?', logged_out: 'Signed out',
    f_visibility: 'Who can see it', vis_public: '🌍 Public', vis_private: '🔒 Private',
    vis_public_sub: 'All users can see it.', vis_private_sub: 'Only you can see it.',
    pill_public: '🌍 Public', pill_private: '🔒 Private', made_public: 'Recipe is now public', made_private: 'Recipe is now private',
    make_public: 'Make public', make_private: 'Make private', by_author: n => `by ${n}`,
    edit_mine: 'Edit as my version', copy_mine: 'Copy to mine', copied: 'Copied to your recipes',
    display_name_label: 'Display name', display_name_hint: 'This is how others see you — as the author of your recipes and in search.', name_saved: 'Name saved',
    send_user: 'Send',
    add_paste: '📋 Paste text (free, no AI)', paste_title: 'Paste a recipe', paste_from_clip: 'Paste from clipboard', paste_go: 'Convert the recipe',
    paste_hint: 'Copy a recipe from a website, message or document and paste it here — the whole thing, ingredients and method. The app will just tidy it up.',
    paste_ph: 'Ingredients:\n10 dried peppers\n1 cup bulgur\n…\n\nMethod:\n1. Pour boiling water over the peppers…\n2. …',
    paste_free: 'Runs on your phone, free, with no online service. You will see the finished recipe and can fix anything before saving.',
    paste_nothing: 'No ingredients or method found. Try with a fuller text.', paste_clip_err: 'Cannot read the clipboard — long-press in the box and choose “Paste”.',
    paste_done: (a, b) => `Done: ${a} ingredients, ${b} step${b === 1 ? '' : 's'}. Review and save.`,
    invite_title: 'Invite friends', invite_short: 'Invite', invite_intro: 'Send your personal link to friends. Whoever registers through it becomes your friend automatically and you can write to each other right away.',
    invite_emails: 'Friends’ emails', invite_emails_ph: 'ivan@mail.com, maria@gmail.com…', invite_preview: 'Message that will be sent', invite_send_mail: 'Send by email',
    invite_share: 'Share (Viber, WhatsApp, SMS…)', invite_copy: 'Copy the link', invite_copied: 'Copied ✓',
    invite_hint: 'The email opens in your own mail app, prepared and hidden from recipients (BCC) — you press “Send” there.',
    invite_need_email: 'Enter at least one valid email', invite_mail_opened: n => `Opening your mail for ${n} friend${n === 1 ? '' : 's'}…`,
    invite_need_update: 'Invitations are not enabled in the database yet (run schema.sql).', invite_accepted: 'You and the person who invited you are now friends 🎉',
    invite_from: n => `${n} invited you to Rifay Umami`, invite_from_generic: 'A friend invited you to Rifay Umami',
    invite_subject: 'Invitation to Rifay Umami — a recipe book', invite_text: n => `Hi! I'm ${n}. I use Rifay Umami — an app with recipes where we can share recipes and chat. Sign up here and we'll be friends:`,
    chat_not_friend: 'is not in your friends', chat_add_friend: 'Add to friends',
    admin_activity_title: 'Activity by day', admin_active_per_day: 'Active users per day (last 30 days)', admin_actions_per_day: 'Actions per day', admin_activity_none: 'No activity data yet (update the database with schema.sql).',
    admin_s_recipes: 'Recipes', admin_s_messages: 'Messages', admin_s_ratings: 'Ratings', admin_s_cooked: 'Cooked',
    admin_blocked: 'Blocked', admin_badge: 'admin', admin_block: 'Block', admin_unblock: 'Unblock',
    admin_block_q: n => `Block “${n}”? They will not be able to sign in or add anything.`, admin_unblock_q: n => `Unblock “${n}”?`,
    admin_blocked_done: 'User blocked', admin_unblocked_done: 'User unblocked', auth_err_banned: 'This account has been blocked by the administrator.',
    admin_section: 'Admin', admin_users: 'Users', admin_users_sub: 'Who has registered', admin_total: 'Registered', admin_today: 'Today', admin_7d: '7 days', admin_30d: '30 days',
    admin_chart: 'Registrations — last 30 days', admin_activity: 'Activity', admin_active7: 'Signed in (7 days)', admin_with_recipes: 'With own recipes', admin_cooking: 'Cooked',
    admin_unconfirmed: 'Unconfirmed email', admin_providers: 'Sign-in method', admin_list: 'All users', admin_search: 'Search by name or email…',
    admin_joined: 'joined', admin_last: 'last sign-in', admin_never: 'never signed in', admin_just_now: 'just now', admin_min_ago: n => `${n} min ago`, admin_h_ago: n => `${n} h ago`, admin_d_ago: n => `${n} days ago`,
    admin_recipes: 'recipes', admin_msgs: 'messages', admin_ratings: 'ratings', admin_friends: 'friendships', admin_recipes_short: 'Recipes added', admin_cooked_short: 'Times cooked',
    admin_refresh: 'Refresh', admin_refreshed: 'Refreshed', admin_export: 'Download list (CSV)', admin_err_title: 'No access to the data',
    admin_err: 'Either you are not an admin or the database is not updated yet (run supabase/schema.sql and make-admin.sql).',
    admin_privacy_note: 'Emails are visible only to you as the admin and never to other users.',
    tab_chat: 'Social', social_title: 'Social', social_sub: 'Chat, friends and invites', soc_chat: 'Chat', soc_friends: 'Friends', soc_invite: 'Invite', invite_stat_sent: 'invites sent', invite_stat_joined: 'joined', chat_title: 'Messages', chat_sub: 'Chat with friends', chat_new: 'New', chat_empty: 'No conversations yet',
    chat_empty_sub: 'Add friends and write to them — you can tag recipes in your messages.', chat_you: 'You', chat_someone: 'Someone',
    chat_recipe_missing: 'This recipe is not available to you', chat_recipe_default: 'Look at this recipe', chat_back: 'Back', chat_tag: 'Tag a recipe',
    chat_ph: 'Write a message…', chat_send: 'Send', chat_say_hi: 'Say hi to your friend 👋', chat_pick_recipe: 'Pick a recipe',
    chat_new_hint: 'Pick a friend or search by name. If they are not in your friends yet, we will add them.', chat_msg: 'Message', chat_delete: 'Delete message',
    chat_need_friend: 'Add the person as a friend first', chat_send_err: 'The message was not sent. Try again.',
    chat_notif_title: 'Turn on notifications', chat_notif_hint: 'See when someone writes to you, even when the app is in the background.',
    chat_notif_blocked: 'Notifications are blocked — allow them in the browser/phone settings.', chat_notif_on: 'Notifications are on 🔔',
    chat_notif_denied: 'Notifications were not allowed', chat_notif_unsupported: 'This browser does not support notifications', chat_discuss: 'Discuss with a friend',
    fav_only: 'Favorites', fav_cooked: 'Cooked', fav_cooked_empty: 'No cooked recipes yet', fav_cooked_empty_sub: 'Tap “I cooked it” in a recipe and it will show up here.',
    privacy: 'Privacy', delete_data: 'Delete my data',
    kpi_mine: 'yours',
    timer_test_toast: '🔔 Alarm test — if you hear nothing, turn the phone volume up',
    top_title: 'Top recipes',
    rating_none: 'No ratings yet', rating_votes: n => `${n} rating${n === 1 ? '' : 's'}`, your_rating: 'Your rating',
    rate_own: 'You cannot rate your own recipe', rate_self: 'You cannot rate yourself', rate_thanks: 'Thanks for rating ★', rate_removed: 'Rating removed',
    score_exc: 'Exceptional', score_top: 'Superb', score_vgood: 'Very good', score_good: 'Good', score_ok: 'Okay', score_bad: 'Poor',
    sort_rating: 'By rating', user_title: 'User', user_recipes: n => `${n} public recipe${n === 1 ? '' : 's'}`, my_rating_title: 'Your rating from others',
    cooked_btn: 'I cooked it', cooked_n: n => `Cooked ×${n}`, cooked_toast: n => `🍳 Cooked ${n} time${n === 1 ? '' : 's'}`,
    cooked_again: 'Cooked again (+1)', cooked_minus: 'Decrease by 1', cooked_reset: 'Not tried (reset)',
    portions: 'Servings', serv_reset: n => `Back to ${n}`, serv_hint: 'Amounts are recalculated',
    timer_custom: 'other…', timer_custom_q: 'How many minutes?', timer_done: 'Time is up!', timer_stop: 'Stop', timer_title: 'Timer', timer_cancel: 'Stop the timer',
    del_link: 'Delete recipe…', captcha_ask: 'Type the code to confirm',
    del_title_delete: 'Delete recipe', del_msg_delete: 'The recipe will be deleted forever, with its photos.', del_btn_delete: 'Delete forever',
    del_title_global: 'Remove for everyone', del_msg_global: 'This is an original recipe. It will be removed for ALL users.', del_btn_global: 'Remove for all',
    del_title_hide: 'Hide recipe', del_msg_hide: 'The recipe will be hidden only for you. You can bring it back from Settings.', del_btn_hide: 'Hide',
    hidden_done: 'Recipe hidden', hidden_title: 'Hidden recipes', restore_hidden: 'Bring back hidden recipes', restored_n: n => n ? `Restored ${n} recipes` : 'No hidden recipes',
    friends_title: 'Friends', friends_hint: 'Add people with the star ☆ to pick them quickly when sending recipes.', friends_empty: 'No friends yet — search by name and tap ☆.',
    friend_toggle: 'Friend', friend_added: n => `${n} added to friends`,
    share_hint_private: 'The recipe is private: the recipient can see it but not change it. Only users who allow their name to be shown can be found.',
    share_hint_public: 'The recipient will find it in “Shared with me”. Only users who allow their name to be shown can be found.',
    shared_by: n => `Shared with you by ${n}`, st_cooked: 'cooked', st_cook_times: 'times cooked',
    scope_mine: 'My recipes', scope_shared: 'Shared with me', mine_sub: 'Everything you added', shared_sub: 'Sent by others',
    share_menu: 'Send to a user', share_title: 'Send recipe', share_search_ph: 'Search user by name…',
    share_hint: 'The recipient can see the recipe (even if private) but cannot change it. Only users who allow their name to be shown can be found.',
    share_min: 'Type at least 2 letters', share_none: 'No such user found', share_with: 'Sent to', share_nobody: 'Not sent to anyone yet',
    share_done: n => `Sent to ${n}`, share_removed: 'Access removed', share_send: 'Send', share_remove: 'Remove', close: 'Close',
    shared_pill: 'Shared with you', show_author: 'Show my name', show_author_hint: 'When on, your name is shown as the author of your public recipes and others can find you to send you recipes.',
    save_err: 'Could not save — check your connection', load_offline: 'Offline — showing saved recipes',
    local_found: n => `Found ${n} recipes only on this phone`, upload_local: 'Upload recipes from this phone to your account',
    upload_local_q: 'How should we upload them?', upload_done: n => `Uploaded ${n} recipes`, upload_busy: 'Uploading…', cloud_hint: 'Your recipes and photos are stored in your account and available on any device.',
  },
};

const SCALES = [0.88, 1, 1.12, 1.25, 1.4];

/* ---------------- Icons ---------------- */
const I = {
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/></svg>',
  more: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  flame: '<svg viewBox="0 0 24 24"><path d="M12 21c4 0 7-2.8 7-6.8 0-3.6-2.6-6.3-4.3-8.2-.4 2-1.4 3.3-2.7 3.9.3-2.7-.8-5.5-3.3-6.9.2 3-2 4.9-3.4 6.8C4.2 11.3 5 14.6 5 14.6 5 18.3 8 21 12 21z"/></svg>',
  share: '<svg viewBox="0 0 24 24"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></svg>',
  camera: '<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/></svg>',
  image: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/></svg>',
  ext: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  sort: '<svg viewBox="0 0 24 24"><path d="M4 7h16M7 12h10M10 17h4"/></svg>',
  send: '<svg viewBox="0 0 24 24"><path d="M21 3 10 14"/><path d="M21 3l-6.5 18-3.5-7.5L3.5 10z"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
};

/* ---------------- Utils ---------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = (p = 'r') => p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const haptic = () => { try { navigator.vibrate && navigator.vibrate(8); } catch (e) {} };

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2200);
}

/* ---------------- Settings ---------------- */
const settings = Object.assign(
  { theme: 'auto', scale: 1, lang: 'bg', name: '', avatar: null, sort: 'az', aiCode: '' },
  (() => { try { return JSON.parse(localStorage.getItem('chocho.settings') || '{}'); } catch (e) { return {}; } })()
);
function saveSettings() { try { localStorage.setItem('chocho.settings', JSON.stringify(settings)); } catch (e) {} }
const t = (k, ...a) => { const v = I18N[settings.lang][k] ?? I18N.bg[k] ?? k; return typeof v === 'function' ? v(...a) : v; };
const catName = id => (CAT[id] || CAT.other)[settings.lang];
const collName = id => (COLL[id] || COLL.mine)[settings.lang];

function applyAppearance() {
  const root = document.documentElement;
  if (settings.theme === 'auto') delete root.dataset.theme; else root.dataset.theme = settings.theme;
  root.style.setProperty('--scale', settings.scale);
  root.lang = settings.lang;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  const dark = settings.theme === 'dark' || (settings.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', dark ? '#0D0D0F' : '#F6F3EE'));
}

/* ---------------- IndexedDB ---------------- */
const DB = {
  db: null,
  open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('chocho-recipes', 1);
      req.onupgradeneeded = () => {
        const d = req.result;
        d.createObjectStore('recipes', { keyPath: 'id' });
        d.createObjectStore('photos', { keyPath: 'id' });
        d.createObjectStore('kv');
      };
      req.onsuccess = () => { this.db = req.result; resolve(); };
      req.onerror = () => reject(req.error);
    });
  },
  req(store, mode, fn) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, mode);
      const r = fn(tx.objectStore(store));
      tx.oncomplete = () => resolve(r && r.result);
      tx.onerror = () => reject(tx.error);
    });
  },
  all: s => DB.req(s, 'readonly', st => st.getAll()),
  get: (s, k) => DB.req(s, 'readonly', st => st.get(k)),
  put: (s, v, k) => DB.req(s, 'readwrite', st => (k === undefined ? st.put(v) : st.put(v, k))),
  del: (s, k) => DB.req(s, 'readwrite', st => st.delete(k)),
  clear: s => DB.req(s, 'readwrite', st => st.clear()),
  putMany(s, items) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(s, 'readwrite');
      const st = tx.objectStore(s);
      items.forEach(i => st.put(i));
      tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
    });
  },
};

/* ---------------- Photos ---------------- */
const photoURLs = new Map();
async function photoURL(ref) {
  if (!ref) return null;
  if (!ref.startsWith('idb:')) return ref;
  const id = ref.slice(4);
  if (photoURLs.has(id)) return photoURLs.get(id);
  const rec = await DB.get('photos', id);
  if (!rec) return null;
  const url = URL.createObjectURL(rec.blob);
  photoURLs.set(id, url);
  return url;
}
function imgTag(ref, cls = '', lazy = true) {
  if (!ref) return '';
  if (ref.startsWith('idb:')) return `<img class="${cls}" data-photo="${esc(ref)}" alt="">`;
  return `<img class="${cls}" src="${esc(ref)}" alt="" ${lazy ? 'loading="lazy" decoding="async"' : ''}>`;
}
async function hydratePhotos(root = document) {
  for (const img of root.querySelectorAll('img[data-photo]')) {
    const url = await photoURL(img.dataset.photo);
    if (url) img.src = url;
    img.removeAttribute('data-photo');
  }
}
async function compressImage(file, max = 1600, quality = 0.82) {
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch (e) {
    bmp = await new Promise((res, rej) => {
      const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = URL.createObjectURL(file);
    });
  }
  const w = bmp.width, h = bmp.height, k = Math.min(1, max / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * k); c.height = Math.round(h * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise(res => c.toBlob(res, 'image/jpeg', quality));
}
// Signed-in users store photos in the cloud (a URL); everyone else on this device (idb: reference).
async function storePhoto(file, max) {
  const blob = await compressImage(file, max);
  if (auth.mode === 'user') return cloud.uploadPhoto(blob);
  const id = uid('p');
  await DB.put('photos', { id, blob, created: Date.now() });
  return 'idb:' + id;
}
const isOwnedPhoto = ref => !!ref && (ref.startsWith('idb:') || isOwnCloudPhoto(ref));
async function deletePhoto(ref) {
  if (!ref) return;
  if (!ref.startsWith('idb:')) { if (auth.mode === 'user') await cloud.deletePhoto(ref); return; }
  const id = ref.slice(4);
  await DB.del('photos', id);
  if (photoURLs.has(id)) { URL.revokeObjectURL(photoURLs.get(id)); photoURLs.delete(id); }
}
function pickFiles(kind) {
  return new Promise(resolve => {
    const input = $(kind === 'camera' ? '#file-camera' : '#file-gallery');
    input.value = '';
    input.onchange = () => resolve([...input.files]);
    input.click();
  });
}

/* ---------------- Search ---------------- */
const LAT = [['sht', 'щ'], ['sh', 'ш'], ['ch', 'ч'], ['zh', 'ж'], ['ts', 'ц'], ['yu', 'ю'], ['ya', 'я'], ['a', 'а'], ['b', 'б'], ['v', 'в'], ['w', 'в'], ['g', 'г'], ['d', 'д'], ['e', 'е'], ['z', 'з'], ['i', 'и'], ['y', 'й'], ['j', 'й'], ['k', 'к'], ['q', 'к'], ['l', 'л'], ['m', 'м'], ['n', 'н'], ['o', 'о'], ['p', 'п'], ['r', 'р'], ['s', 'с'], ['t', 'т'], ['u', 'у'], ['f', 'ф'], ['h', 'х'], ['c', 'к'], ['x', 'кс']];
const CYR = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sht', ъ: 'a', ь: 'y', ю: 'yu', я: 'ya' };
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ё/g, 'е').replace(/ѝ/g, 'и');
function toCyr(s) {
  let out = '', i = 0;
  outer: while (i < s.length) {
    for (const [l, c] of LAT) if (s.startsWith(l, i)) { out += c; i += l.length; continue outer; }
    out += s[i++];
  }
  return out;
}
const toLat = s => [...s].map(ch => CYR[ch] ?? ch).join('');
function indexRecipe(r) {
  r._title = norm(r.title);
  r._ing = norm((r.ingredients || []).join(' '));
  r._rest = norm([r.steps, r.notes, r.source, ...(r.categories || []).flatMap(c => [CAT[c]?.bg, CAT[c]?.en]), COLL[r.collection]?.bg, COLL[r.collection]?.en].join(' '));
}
function searchScore(r, terms) {
  let score = 0;
  for (const variants of terms) {
    let best = 0;
    for (const v of variants) {
      if (r._title.includes(v)) best = Math.max(best, r._title.startsWith(v) ? 14 : 10);
      else if (r._ing.includes(v)) best = Math.max(best, 4);
      else if (r._rest.includes(v)) best = Math.max(best, 1);
    }
    if (!best) return 0;
    score += best;
  }
  return score;
}
function buildTerms(q) {
  return norm(q).split(/\s+/).filter(Boolean).map(w => {
    const v = new Set([w]);
    if (/[a-z]/.test(w)) v.add(toCyr(w));
    if (/[а-я]/.test(w)) v.add(toLat(w));
    return [...v].filter(x => x.length);
  });
}

/* ---------------- State & data ---------------- */
const state = {
  recipes: [],
  tab: 'home',
  query: '',
  cat: null,
  coll: null,
  scope: 'all', // 'all' | 'mine' | 'shared' | 'top'
  favFilter: 'all', // Favorites tab: 'all' | 'fav' | 'cooked'
  pages: [],
};
const byId = id => state.recipes.find(r => r.id === id);

let seeds = [];   // the original recipes from recipes.json: public and read-only
let custom = [];  // recipes made by people: own ones (+ other people's public ones when the cloud is on)
let states = {};  // per-user { [recipeId]: { favorite, tried, cooked, lastCooked, hidden } }
let incoming = {}; // recipes sent to me: { recipeId: { from } }
let friends = [];  // my quick list of people to send recipes to
let removed = new Set(); // originals the admin removed for everybody
let isAdmin = false;
let hiddenCount = 0;
let ratingStats = {}; // public totals: { 'recipe:id' | 'user:id': { avg, count } }
let myRatings = {};   // my votes: { 'recipe:id' | 'user:id': 1..5 }

const isMine = r => auth.mode === 'user' ? r.owner === auth.user.id : auth.mode === 'local' && !r.seed;
const canWrite = () => auth.mode !== 'guest';
const stateKey = () => auth.mode === 'user' ? auth.user.id : auth.mode;
const storable = r => Object.fromEntries(Object.entries(r).filter(([k]) => !k.startsWith('_') && !['favorite', 'tried', 'owner', 'ownerName', 'cooked', 'lastCooked', 'sharedWithMe', 'sharedBy'].includes(k)));

// Recipes made on this device (used when accounts are off, and as the source for "upload to my account").
const localBackend = {
  list: () => DB.all('recipes'),
  save: r => DB.put('recipes', storable(r)),
  remove: r => DB.del('recipes', r.id),
};
const backend = () => auth.mode === 'user' ? cloud : localBackend;

async function loadData() {
  await DB.open();
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
  const raw = await fetch('recipes.json').then(r => r.json());
  seeds = raw.map((r, i) => normalizeSeed(r, 1.7e12 + i * 1000));
  await migrateLegacy();
  await loadUserData();
}
async function loadUserData() {
  const key = stateKey();
  states = (await DB.get('kv', 'states:' + key)) || {};
  if (auth.mode === 'local') { custom = await localBackend.list(); incoming = {}; friends = []; isAdmin = false; }
  else {
    try {
      custom = await cloud.list();
      if (auth.mode === 'user') states = await cloud.loadStates();
      await DB.put('kv', custom, 'cache:' + key);
      await DB.put('kv', states, 'states:' + key);
    } catch (e) {
      custom = (await DB.get('kv', 'cache:' + key)) || [];
      toast(t('load_offline'));
    }
    // Optional parts: they exist only after the v1.5 database update, so failures are not fatal.
    try { removed = new Set(await cloud.removedList()); await DB.put('kv', [...removed], 'removed'); }
    catch (e) { removed = new Set((await DB.get('kv', 'removed')) || []); }
    if (auth.mode === 'user') {
      await applyPendingInvite();
      incoming = await cloud.incoming().catch(() => ({}));
      friends = await cloud.listFriends().catch(() => []);
      isAdmin = await cloud.isAdmin().catch(() => false);
    } else { incoming = {}; friends = []; isAdmin = false; }
  }
  if (auth.mode === 'local') { ratingStats = {}; myRatings = {}; }
  else {
    try { ratingStats = await cloud.ratingStats(); await DB.put('kv', ratingStats, 'ratingStats'); }
    catch (e) { ratingStats = (await DB.get('kv', 'ratingStats')) || {}; }
    if (auth.mode === 'user') {
      try { myRatings = await cloud.myRatings(); await DB.put('kv', myRatings, 'myRatings:' + key); }
      catch (e) { myRatings = (await DB.get('kv', 'myRatings:' + key)) || {}; }
    } else myRatings = {};
  }
  settingsView.localCount = auth.mode === 'user' ? (await localBackend.list()).length : 0;
  if (auth.mode === 'user') startChat(); else stopChat();
  compose();
}
async function reloadAll() {
  while (state.pages.length) popPage();
  await loadUserData();
  renderTab();
}
// Merge originals + people's recipes with this user's marks (favorite, cooked, hidden) and what was sent to them.
function compose() {
  // An original the user replaced with their own edited version is hidden for them.
  const replaced = new Set(custom.filter(r => r.basedOn && isMine(r)).map(r => r.basedOn));
  const all = [...seeds.filter(s => !replaced.has(s.id) && !removed.has(s.id)), ...custom];
  const visible = [];
  hiddenCount = 0;
  all.forEach(r => {
    const st = states[r.id] || {};
    if (st.hidden) { hiddenCount++; return; }
    r.favorite = !!st.favorite;
    r.cooked = st.cooked || 0;
    r.lastCooked = st.lastCooked || null;
    r.tried = r.cooked > 0 || (st.tried === undefined || st.tried === null ? !!r.seedTried : !!st.tried);
    const inc = incoming[r.id];
    r.sharedWithMe = !!inc && !isMine(r);
    r.sharedBy = inc ? inc.from : '';
    indexRecipe(r);
    visible.push(r);
  });
  state.recipes = visible;
}
function normalizeSeed(r, created) {
  return {
    id: r.id, title: r.title, collection: r.collection, categories: r.categories || [],
    source: r.source || null, seedTried: r.tried === true, ingredients: r.ingredients || [], steps: r.steps || '',
    notes: r.notes || '', links: r.links || [], images: r.images || [], favorite: false, tried: r.tried === true,
    time: r.time || '', servings: r.servings || '', createdAt: created, updatedAt: created, seed: true,
    owner: null, ownerName: SITE_AUTHOR, visibility: 'public',
  };
}
// v1.2 kept everything (originals, favorites, edits) in one IndexedDB store. Split it: favorites/tried become
// "states", edited originals become the user's own versions, originals themselves are read from recipes.json.
async function migrateLegacy() {
  if (await DB.get('kv', 'migratedV3')) return;
  const old = await DB.all('recipes');
  const st = (await DB.get('kv', 'states:local')) || {};
  const seedMap = new Map(seeds.map(s => [s.id, s]));
  const keep = [];
  for (const r of old) {
    const s = seedMap.get(r.id);
    if (r.seed || s) {
      if (s && (r.favorite || !!r.tried !== s.seedTried)) st[r.id] = { favorite: !!r.favorite, tried: !!r.tried };
      if (r.edited) keep.push(Object.assign({}, r, { id: uid('r'), seed: false, basedOn: r.id }));
    } else {
      if (r.favorite || r.tried) st[r.id] = { favorite: !!r.favorite, tried: !!r.tried };
      keep.push(Object.assign({}, r, { seed: false }));
    }
  }
  await DB.clear('recipes');
  await DB.putMany('recipes', keep.map(storable));
  await DB.put('kv', st, 'states:local');
  await DB.put('kv', true, 'migratedV3');
}

async function saveRecipe(r) {
  r.updatedAt = Date.now();
  await backend().save(r);
  const i = custom.findIndex(x => x.id === r.id);
  if (i >= 0) custom[i] = r; else custom.push(r);
  compose();
}
async function removeRecipe(r) {
  if (auth.mode !== 'user') for (const ref of r.images || []) await deletePhoto(ref);
  await backend().remove(r);
  custom = custom.filter(x => x.id !== r.id);
  compose();
}
async function setState(r, patch) {
  const next = Object.assign({}, states[r.id], patch);
  states[r.id] = next;
  r.favorite = !!next.favorite;
  if ('tried' in patch) r.tried = !!next.tried;
  if ('cooked' in patch) { r.cooked = next.cooked || 0; r.lastCooked = next.lastCooked || null; r.tried = r.cooked > 0 || !!next.tried; }
  try { await DB.put('kv', states, 'states:' + stateKey()); } catch (e) {}
  if (auth.mode === 'user') { try { await cloud.saveState(r.id, next); } catch (e) { toast(t('save_err')); } }
}
// "I cooked it": counts how many times a recipe was cooked; cooking marks it as tried automatically.
async function markCooked(r, delta) {
  const n = Math.max(0, (r.cooked || 0) + delta);
  const patch = { cooked: n, lastCooked: delta > 0 ? Date.now() : (states[r.id] && states[r.id].lastCooked) || null };
  if (n > 0) patch.tried = true;
  await setState(r, patch);
}
async function resetCooked(r) { await setState(r, { cooked: 0, tried: false, lastCooked: null }); }
const cookStats = () => {
  let recipes = 0, times = 0;
  for (const s of Object.values(states)) if (s && s.cooked > 0) { recipes++; times += s.cooked; }
  return { recipes, times };
};

// Copy recipes made on this phone (before accounts) into the signed-in account.
async function uploadLocalRecipes(visibility) {
  const local = await localBackend.list();
  const localStates = (await DB.get('kv', 'states:local')) || {};
  let n = 0;
  for (const r of local) {
    try {
      const images = [];
      for (const ref of r.images || []) {
        if (ref.startsWith('idb:')) {
          const rec = await DB.get('photos', ref.slice(4));
          images.push(rec ? await cloud.uploadPhoto(rec.blob) : null);
        } else images.push(ref);
      }
      const up = Object.assign({}, r, { images: images.filter(Boolean), owner: auth.user.id, visibility });
      await cloud.save(up);
      if (localStates[r.id]) { states[r.id] = localStates[r.id]; await cloud.saveState(r.id, localStates[r.id]); }
      for (const ref of r.images || []) if (ref.startsWith('idb:')) await deletePhoto(ref);
      await localBackend.remove(r);
      n++;
    } catch (e) { /* keep the local copy; it can be retried */ }
  }
  return n;
}

/* ---------------- Rendering helpers ---------------- */
function placeholder(r) {
  const c = CAT[(r.categories || [])[0]] || CAT.other;
  return `<div class="ph" style="--h:${c.h}"><span>${c.emoji}</span></div>`;
}
function card(r) {
  const cover = (r.images || [])[0];
  const c = CAT[(r.categories || [])[0]] || CAT.other;
  return `<button class="card" data-open="${esc(r.id)}">
    <div class="thumb">${cover ? imgTag(cover) : placeholder(r)}
      ${r.tried ? `<span class="badge-tl">✓ ${esc(t('tried'))}</span>` : ''}
      ${r.visibility === 'private' && auth.mode !== 'local' ? `<span class="badge-bl" title="${esc(t('pill_private'))}">🔒</span>` : ''}
      <span class="fav-dot ${r.favorite ? 'on' : ''}" data-fav="${esc(r.id)}">${I.heart}</span>
    </div>
    <div class="card-body">
      <div class="card-title">${esc(r.title)}</div>
      <div class="card-meta">${(statOf('recipe', r.id) || {}).count ? `<span class="mini-score">${fmtScore(statOf('recipe', r.id).avg)}</span>` : ''}${c.emoji} ${esc(catName(c.id))} · ${esc(collName(r.collection))}</div>
      ${!r.seed && r.ownerName && !isMine(r) ? `<div class="card-author">👤 ${esc(r.ownerName)}</div>` : ''}
    </div>
  </button>`;
}
function sorted(list) {
  const s = settings.sort;
  const a = [...list];
  if (s === 'new') a.sort((x, y) => y.createdAt - x.createdAt);
  else if (s === 'rating') a.sort((x, y) => ((weightedScore(y) ?? -1) - (weightedScore(x) ?? -1)) || x.title.localeCompare(y.title, 'bg'));
  else if (s === 'tried') a.sort((x, y) => (y.tried - x.tried) || x.title.localeCompare(y.title, 'bg'));
  else a.sort((x, y) => x.title.localeCompare(y.title, 'bg'));
  return a;
}
function greeting() {
  const h = new Date().getHours();
  return t(h < 11 ? 'morning' : h < 18 ? 'day' : 'evening');
}
const myName = () => (auth.mode === 'user' ? (auth.profile && auth.profile.display_name) || '' : settings.name || '').trim();
const myAvatar = () => auth.mode === 'user' ? (auth.profile && auth.profile.avatar_url) : settings.avatar;
function avatarHTML() {
  const av = myAvatar();
  if (av) return `<span class="avatar">${imgTag(av, '', false)}</span>`;
  const name = myName();
  if (name) return `<span class="avatar">${esc(name.charAt(0).toUpperCase())}</span>`;
  return `<span class="avatar avatar-empty"><svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="4"/><path d="M4.5 20.5c1.2-4 4.1-6 7.5-6s6.3 2 7.5 6"/></svg></span>`;
}
const brandHTML = () => `<div class="brand"><img src="icons/logo.svg" alt="" class="brand-mark"><span>Rifay <b>Umami</b></span></div>`;

/* ---------------- Tabs ---------------- */
function renderTab() {
  const root = $('#tabs-root');
  document.querySelectorAll('.tab[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === state.tab));
  if (state.tab === 'home') root.innerHTML = homeView();
  else if (state.tab === 'categories') root.innerHTML = categoriesView();
  else if (state.tab === 'favorites') root.innerHTML = favoritesView();
  else if (state.tab === 'chat') root.innerHTML = chatView();
  else root.innerHTML = settingsView();
  hydratePhotos(root);
}

function filtered() {
  let list = state.recipes;
  if (state.scope === 'mine') list = list.filter(isMine);
  else if (state.scope === 'shared') list = list.filter(r => r.sharedWithMe);
  else if (state.scope === 'top') { const top = new Set(topRecipes().map(r => r.id)); list = list.filter(r => top.has(r.id)); }
  if (state.cat) list = list.filter(r => (r.categories || []).includes(state.cat));
  if (state.coll) list = list.filter(r => r.collection === state.coll);
  const q = state.query.trim();
  if (q) {
    const terms = buildTerms(q);
    return list.map(r => [r, searchScore(r, terms)]).filter(x => x[1] > 0)
      .sort((a, b) => b[1] - a[1] || a[0].title.localeCompare(b[0].title, 'bg')).map(x => x[0]);
  }
  if (state.scope === 'top') return [...list].sort((a, b) => weightedScore(b) - weightedScore(a) || a.title.localeCompare(b.title, 'bg'));
  return sorted(list);
}

function homeView() {
  const counts = {};
  state.recipes.forEach(r => (r.categories || []).forEach(c => { counts[c] = (counts[c] || 0) + 1; }));
  const collCounts = {};
  state.recipes.forEach(r => { collCounts[r.collection] = (collCounts[r.collection] || 0) + 1; });
  const filtering = state.query.trim() || state.cat || state.coll || state.scope !== 'all';
  const list = filtered();
  const mineCount = state.recipes.filter(isMine).length;
  const sharedCount = state.recipes.filter(r => r.sharedWithMe).length;
  const topCount = ratingsOn() ? topRecipes().length : 0;

  let body = '';
  if (!filtering) {
    const tried = state.recipes.filter(r => r.tried && (r.images || []).length);
    const recent = [...state.recipes].sort((a, b) => b.createdAt - a.createdAt).filter(r => !r.seed).slice(0, 10);
    body += `<button class="surprise" data-action="roulette"><span class="wheel-mini">${miniWheelSVG()}</span><span><b>${esc(t('surprise'))}</b><span>${esc(t('surprise_sub'))}</span></span><span class="go">${I.ext}</span></button>`;
    const topList = ratingsOn() ? topRecipes().slice(0, 10) : [];
    if (topList.length) body += `<div class="section-head"><h2>🏆 ${esc(t('top_title'))}</h2><button class="link" data-go-scope="top">${esc(t('see_all'))} ›</button></div><div class="rail">${topList.map(card).join('')}</div>`;
    if (recent.length) body += `<div class="section-head"><h2>${esc(t('recent_rail'))}</h2></div><div class="rail">${recent.map(card).join('')}</div>`;
    if (tried.length) body += `<div class="section-head"><h2>${esc(t('tried_rail'))} ✓</h2></div><div class="rail">${shuffle(tried).slice(0, 12).map(card).join('')}</div>`;
    body += `<div class="section-head"><h2>${esc(t('all_recipes'))}</h2>
      <button class="link" data-action="sort">${esc(t('sort'))} ↕</button></div>
      <div class="grid">${list.map(card).join('')}</div>`;
  } else if (!list.length) {
    body += `<div class="empty"><div class="big">🔍</div><h3>${esc(t('no_results'))}</h3><p>${esc(t('no_results_sub'))}</p>
      <button class="chip" data-action="clear-filters">${esc(t('clear_filters'))}</button></div>`;
  } else {
    body += `<div class="result-count">${esc(t('results', list.length))}</div><div class="grid">${list.map(card).join('')}</div>`;
  }

  return `<section class="view home">
    <div class="topbar">
      ${brandHTML()}
      ${auth.mode === 'guest'
        ? `<button class="btn-login" data-action="login">${esc(t('login'))}</button>`
        : `<button data-tab-go="settings" aria-label="Profile">${avatarHTML()}</button>`}
    </div>
    <div class="hero-row">
      <div class="hero-text">
        <div class="greeting">${esc(greeting())} 👋</div>
        <h1 class="large-title">${esc(t('home_title'))}</h1>
      </div>
      <button class="kpi" data-action="clear-filters" aria-label="${esc(t('all_recipes'))}">
        <b>${state.recipes.length}</b><span>${esc(t('st_recipes'))}</span>
        ${auth.mode !== 'guest' && mineCount ? `<small>👤 ${mineCount} ${esc(t('kpi_mine'))}</small>` : ''}
      </button>
    </div>
    <div class="search">
      <div class="search-inner">
        <label class="search-field">${I.search}
          <input id="q" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" autocorrect="off" placeholder="${esc(t('search_ph'))}" value="${esc(state.query)}">
          ${state.query ? `<button class="search-clear" data-action="clear-q" aria-label="Clear">${I.x}</button>` : ''}
        </label>
        <button class="icon-btn" data-action="sort" aria-label="Sort">${I.sort}</button>
      </div>
    </div>
    <div class="chips seg">
      <button class="chip small ${!state.coll && state.scope === 'all' ? 'active' : ''}" data-coll="">${esc(t('all'))}</button>
      ${auth.mode !== 'guest' ? `<button class="chip small ${state.scope === 'mine' ? 'active' : ''}" data-scope="mine">👤 ${esc(t('scope_mine'))} <span class="count">${mineCount}</span></button>` : ''}
      ${topCount ? `<button class="chip small ${state.scope === 'top' ? 'active' : ''}" data-scope="top">🏆 ${esc(t('top_title'))} <span class="count">${topCount}</span></button>` : ''}
      ${sharedCount ? `<button class="chip small ${state.scope === 'shared' ? 'active' : ''}" data-scope="shared">📥 ${esc(t('scope_shared'))} <span class="count">${sharedCount}</span></button>` : ''}
      ${COLLECTIONS.filter(c => collCounts[c.id]).map(c => `<button class="chip small ${state.coll === c.id ? 'active' : ''}" data-coll="${c.id}">${c.emoji} ${esc(c[settings.lang])} <span class="count">${collCounts[c.id]}</span></button>`).join('')}
    </div>
    <div class="chips">
      <button class="chip ${!state.cat ? 'active' : ''}" data-cat="">${esc(t('all'))} <span class="count">${state.recipes.length}</span></button>
      ${CATEGORIES.filter(c => counts[c.id]).map(c => `<button class="chip ${state.cat === c.id ? 'active' : ''}" data-cat="${c.id}">${c.emoji} ${esc(c[settings.lang])} <span class="count">${counts[c.id]}</span></button>`).join('')}
    </div>
    <div id="home-results">${body}</div>
  </section>`;
}

function shuffle(a) {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; }
  return x;
}

function categoriesView() {
  const counts = {};
  state.recipes.forEach(r => (r.categories || []).forEach(c => { counts[c] = (counts[c] || 0) + 1; }));
  const collCounts = {};
  state.recipes.forEach(r => { collCounts[r.collection] = (collCounts[r.collection] || 0) + 1; });
  return `<section class="view">
    <div class="topbar"><div class="greeting">${esc(t('recipes_n', state.recipes.length))}</div></div>
    <h1 class="large-title">${esc(t('cat_title'))}</h1>
    <div class="tiles">
      ${CATEGORIES.filter(c => counts[c.id]).map(c => `<button class="tile" style="--h:${c.h}" data-go-cat="${c.id}">
        <b>${esc(c[settings.lang])}</b><span>${esc(t('recipes_n', counts[c.id]))}</span><div class="emo">${c.emoji}</div></button>`).join('')}
    </div>
    <div class="section-head"><h2>${esc(t('collections'))}</h2></div>
    <div class="tiles">
      ${auth.mode !== 'guest' ? `<button class="tile tile-mine" style="--h:14" data-go-scope="mine">
        <b>${esc(t('scope_mine'))}</b><span>${esc(t('recipes_n', state.recipes.filter(isMine).length))}</span><div class="emo">👤</div></button>` : ''}
      ${ratingsOn() && topRecipes().length ? `<button class="tile" style="--h:45" data-go-scope="top">
        <b>${esc(t('top_title'))}</b><span>${esc(t('recipes_n', topRecipes().length))}</span><div class="emo">🏆</div></button>` : ''}
      ${state.recipes.some(r => r.sharedWithMe) ? `<button class="tile" style="--h:210" data-go-scope="shared">
        <b>${esc(t('scope_shared'))}</b><span>${esc(t('recipes_n', state.recipes.filter(r => r.sharedWithMe).length))}</span><div class="emo">📥</div></button>` : ''}
      ${COLLECTIONS.filter(c => collCounts[c.id]).map((c, i) => `<button class="tile" style="--h:${[20, 280, 38, 160][i]}" data-go-coll="${c.id}">
        <b>${esc(c[settings.lang])}</b><span>${esc(t('recipes_n', collCounts[c.id]))}</span><div class="emo">${c.emoji}</div></button>`).join('')}
    </div>
  </section>`;
}

function favoritesView() {
  const favs = state.recipes.filter(r => r.favorite), cooked = state.recipes.filter(r => r.cooked > 0);
  const f = state.favFilter || 'all';
  const all = state.recipes.filter(r => r.favorite || r.cooked > 0);
  const list = sorted(f === 'fav' ? favs : f === 'cooked' ? cooked : all);
  const chip = (id, label, n) => `<button class="chip small ${f === id ? 'active' : ''}" data-fav-filter="${id}">${label} <span class="count">${n}</span></button>`;
  return `<section class="view">
    <div class="topbar"><div class="greeting">${esc(t('recipes_n', list.length))}</div></div>
    <h1 class="large-title">${esc(t('fav_title'))} ❤️</h1>
    <div class="chips seg">${chip('all', esc(t('all')), all.length)}${chip('fav', '❤️ ' + esc(t('fav_only')), favs.length)}${chip('cooked', '🍳 ' + esc(t('fav_cooked')), cooked.length)}</div>
    ${list.length ? `<div class="grid">${list.map(card).join('')}</div>` :
      `<div class="empty"><div class="big">${f === 'cooked' ? '🍳' : '🤍'}</div><h3>${esc(t(f === 'cooked' ? 'fav_cooked_empty' : 'fav_empty'))}</h3><p>${esc(t(f === 'cooked' ? 'fav_cooked_empty_sub' : 'fav_empty_sub'))}</p></div>`}
  </section>`;
}

function settingsView() {
  const n = state.recipes.length, f = state.recipes.filter(r => r.favorite).length, cs = cookStats();
  const scaleIdx = Math.max(0, SCALES.indexOf(Number(settings.scale)));
  const seg = (key, opts) => `<div class="segmented">${opts.map(([v, label]) =>
    `<button class="${settings[key] === v ? 'active' : ''}" data-set="${key}" data-val="${v}">${esc(label)}</button>`).join('')}</div>`;
  return `<section class="view narrow">
    <h1 class="large-title" style="margin-top:8px">${esc(t('settings'))}</h1>
    ${auth.mode === 'guest' ? `<div class="profile-card guest-card">
      <span class="avatar avatar-empty"><svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="4"/><path d="M4.5 20.5c1.2-4 4.1-6 7.5-6s6.3 2 7.5 6"/></svg></span>
      <div style="flex:1;min-width:0"><b>${esc(t('guest_card'))}</b><br><small>${esc(t('guest_card_sub'))}</small></div>
      <button class="btn primary" style="width:auto;padding:0 18px" data-action="login">${esc(t('login'))}</button>
    </div>` : `<div class="profile-card">
      <button data-action="avatar">${avatarHTML()}</button>
      <div style="flex:1;min-width:0">
        ${auth.mode === 'user' ? `<div class="profile-name-text">${esc(myName() || t('your_name'))}</div>`
          : `<input id="profile-name" value="${esc(myName())}" placeholder="${esc(t('your_name'))}" maxlength="40">`}
        <small>${esc(auth.mode === 'user' ? auth.user.email || '' : t('personal'))}</small>
      </div>
    </div>`}
    ${auth.mode === 'user' ? `<div class="group-label">${esc(t('my_rating_title'))}</div><div class="rating-box">${scoreHTML('user', auth.user.id)}</div>` : ''}
    ${auth.mode === 'user' ? `<div class="group-label">${esc(t('display_name_label'))}</div>
    <div class="group"><div class="name-edit">
      <input class="field" id="display-name" value="${esc(myName())}" placeholder="${esc(t('your_name'))}" maxlength="40" autocomplete="name">
      <button class="btn primary" data-action="save-name">${esc(t('save'))}</button>
    </div></div>
    <p class="hint">${esc(t('display_name_hint'))}</p>
    <div class="group" style="margin-top:12px"><label class="row"><span class="lbl">👤 ${esc(t('show_author'))}</span><span class="switch"><input type="checkbox" id="show-author" ${showsAuthor() ? 'checked' : ''}><span></span></span></label></div>
    <p class="hint">${esc(t('show_author_hint'))}</p>` : ''}
    <div class="stats">
      <div class="stat"><b>${n}</b><span>${esc(t('st_recipes'))}</span></div>
      <div class="stat"><b>${f}</b><span>${esc(t('st_fav'))}</span></div>
      <div class="stat"><b>${cs.recipes}</b><span>${esc(t("st_cooked"))}</span></div>
      <div class="stat"><b>${cs.times}</b><span>${esc(t("st_cook_times"))}</span></div>
    </div>

    <div class="group-label">${esc(t('appearance'))}</div>
    <div class="group">
      <div class="seg-row">${seg('theme', [['auto', '◐ ' + t('th_auto')], ['light', '☀️ ' + t('th_light')], ['dark', '🌙 ' + t('th_dark')]])}</div>
      <div>
        <div class="row" style="padding-bottom:0"><span class="lbl">${esc(t('text_size'))}</span></div>
        <div class="size-preview">${esc(t('size_preview'))}</div>
        <div class="slider-row"><span class="a-small">A</span>
          <input type="range" id="scale" min="0" max="${SCALES.length - 1}" step="1" value="${scaleIdx}">
          <span class="a-big">A</span></div>
      </div>
    </div>

    <div class="group-label">${esc(t('language'))}</div>
    <div class="group"><div class="seg-row">${seg('lang', [['bg', '🇧🇬 Български'], ['en', '🇬🇧 English']])}</div></div>

    <div class="group-label">✨ ${esc(t('ai_section'))}</div>
    <div class="group">
      <input class="field" id="ai-code" type="password" autocomplete="off" autocapitalize="off" placeholder="${esc(t('ai_code'))}" value="${esc(settings.aiCode || '')}">
    </div>
    <p class="hint">${esc(t('ai_code_hint'))}</p>

    ${auth.mode === 'local' ? `<div class="group-label">${esc(t('data'))}</div>
    <div class="group">
      <button class="row row-btn" data-action="export"><span class="lbl"><span class="ic" style="background:#2FA36B">⬆︎</span>${esc(t('export'))}</span></button>
      <button class="row row-btn" data-action="import"><span class="lbl"><span class="ic" style="background:#3A7BF2">⬇︎</span>${esc(t('import'))}</span></button>
    </div>
    <p class="hint">${esc(t('storage_hint'))}</p>` : ''}
    ${auth.mode === 'user' && isAdmin ? `<div class="group-label">🛡 ${esc(t('admin_section'))}</div><div class="group"><button class="row row-btn" data-action="admin-users"><span class="lbl"><span class="ic" style="background:#6C5CE7">👥</span>${esc(t('admin_users'))}</span><span class="val">${esc(t('admin_users_sub'))}</span></button></div>` : ''}
    ${hiddenCount ? `<div class="group-label">${esc(t('hidden_title'))}</div><div class="group"><button class="row row-btn" data-action="restore-hidden"><span class="lbl"><span class="ic" style="background:#2FA36B">↺</span>${esc(t('restore_hidden'))} (${hiddenCount})</span></button></div>` : ''}
    ${auth.mode === 'user' ? `<div class="group-label">${esc(t('account'))}</div>
    <div class="group">
      <button class="row row-btn" data-action="invite"><span class="lbl"><span class="ic" style="background:#2FA36B">👋</span>${esc(t('invite_title'))}</span></button>
      <button class="row row-btn" data-action="friends"><span class="lbl"><span class="ic" style="background:#F2A33C">👥</span>${esc(t('friends_title'))} (${friends.length})</span></button>
      ${settingsView.localCount ? `<button class="row row-btn" data-action="upload-local"><span class="lbl"><span class="ic" style="background:#3A7BF2">⬆︎</span>${esc(t('upload_local'))} (${settingsView.localCount})</span></button>` : ''}
      <button class="row row-btn" data-action="logout"><span class="lbl"><span class="ic" style="background:#E0393E">⎋</span>${esc(t('logout'))}</span></button>
    </div>
    <p class="hint">${esc(t('cloud_hint'))}</p>` : ''}
    <p class="footer-note">👨‍🍳 ${esc(t('about'))} ${APP_VERSION}<br>${esc(t('install_hint'))}<br><a href="privacy.html" target="_blank" rel="noopener">${esc(t('privacy'))}</a> · <a href="delete-data.html" target="_blank" rel="noopener">${esc(t('delete_data'))}</a></p>
  </section>`;
}

/* ---------------- Pages (detail / editor) ---------------- */
function pushPage(html, { modal = false, onClose } = {}) {
  const el = document.createElement('div');
  el.className = 'page' + (modal ? ' modal' : '');
  el.innerHTML = html;
  $('#pages-root').appendChild(el);
  state.pages.push({ el, onClose });
  $('#tabbar').classList.add('hide');
  if (!modal) enableSwipeBack(el);
  hydratePhotos(el);
  return el;
}
function popPage() {
  const p = state.pages.pop();
  if (!p) return;
  p.onClose && p.onClose();
  p.el.classList.add('closing');
  setTimeout(() => p.el.remove(), 260);
  if (!state.pages.length) $('#tabbar').classList.remove('hide');
}
function topPage() { return state.pages[state.pages.length - 1]; }

function enableSwipeBack(el) {
  let x0 = null, y0 = 0, dx = 0, locked = false;
  el.addEventListener('touchstart', e => {
    const tch = e.touches[0];
    if (tch.clientX < 28) { x0 = tch.clientX; y0 = tch.clientY; dx = 0; locked = false; el.style.transition = 'none'; }
  }, { passive: true });
  el.addEventListener('touchmove', e => {
    if (x0 === null) return;
    const tch = e.touches[0];
    dx = Math.max(0, tch.clientX - x0);
    if (!locked && Math.abs(tch.clientY - y0) > 20 && dx < 20) { x0 = null; el.style.transform = ''; return; }
    locked = true;
    el.style.transform = `translateX(${dx}px)`;
  }, { passive: true });
  el.addEventListener('touchend', () => {
    if (x0 === null) return;
    x0 = null;
    el.style.transition = 'transform .22s ease';
    if (dx > window.innerWidth * 0.3) {
      el.style.transform = 'translateX(100%)';
      const p = state.pages.pop();
      p && p.onClose && p.onClose();
      setTimeout(() => el.remove(), 230);
      if (!state.pages.length) $('#tabbar').classList.remove('hide');
    } else el.style.transform = '';
  });
}

/* ----- Recipe detail ----- */
let wakeLock = null;
async function setWakeLock(on) {
  try {
    if (on && 'wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
    else if (wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch (e) { wakeLock = null; }
}

const canSend = r => auth.mode === 'user' && (r.seed || r.visibility !== 'private' || isMine(r));
const cookLabel = r => r.cooked > 0 ? t('cooked_n', r.cooked) : r.tried ? t('tried') : t('cooked_btn');

function cookBarHTML() {
  return `<div class="cook-bar">
    <div class="cook-timer">
      <span class="cook-time" data-timer-display>0:00</span>
      <button class="round" data-timer="toggle" data-timer-toggle aria-label="Start / pause">▶</button>
      <button class="round" data-timer="reset" data-timer-reset aria-label="Reset">↺</button>
      <button class="round" data-timer="test" aria-label="Test sound" title="Test sound">🔔</button>
      <button class="round wide" data-timer="add" aria-label="+1 min">+1'</button>
    </div>
    <div class="cook-presets">${[5, 10, 15, 20, 30, 45, 60].map(m => `<button class="chip small" data-timer-set="${m}">${m}'</button>`).join('')}
      <button class="chip small" data-timer="custom">${esc(t('timer_custom'))}</button></div>
    <button class="btn primary cook-done" data-action="cooked-done">✅ ${esc(t('cooked_btn'))}</button>
  </div>`;
}

function detailHTML(r, tabSel = 'ing', serv = null) {
  const imgs = r.images || [];
  const cats = (r.categories || []).map(c => `<span class="pill">${CAT[c]?.emoji || ''} ${esc(catName(c))}</span>`).join('');
  const hasIng = (r.ingredients || []).length > 0;
  const steps = String(r.steps || '').trim();
  let paras = steps ? steps.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean) : [];
  if (paras.length === 1) { const lines = paras[0].split('\n').map(s => s.trim()).filter(Boolean); if (lines.length > 2) paras = lines; }
  const stepsHTML = !steps ? `<p class="muted">${esc(t('no_method'))}</p>` :
    paras.length > 1 ? `<div class="steps">${paras.map((p, i) => `<div class="step" data-step="${i}">${linkify(esc(p)).replace(/\n/g, '<br>')}</div>`).join('')}</div>` :
      `<div class="prose">${linkify(esc(steps))}</div>`;
  const isSub = x => x.startsWith('## ') || (x.length < 60 && /:\s*$/.test(x));
  const base = baseServings(r);
  const target = base ? Math.min(99, Math.max(1, serv || base)) : null;
  const factor = base ? target / base : 1;
  const ingHTML = hasIng ? `<ul class="ing-list">${r.ingredients.map((x, i) => isSub(x)
    ? `<li class="sub">${esc(x.replace(/^## /, '').replace(/:\s*$/, ''))}</li>`
    : `<li data-ing="${i}"><span class="tick">${I.check}</span><span>${esc(scaleLine(x, factor))}</span></li>`).join('')}</ul>` :
    `<p class="muted">${esc(t('no_ingredients'))}</p>`;
  const servBar = base && hasIng ? `<div class="serv-bar"><span>🍽 ${esc(t('portions'))}</span>
      <div class="stepper"><button data-serv="-1" aria-label="-">−</button><b>${target}</b><button data-serv="1" aria-label="+">+</button></div>
      <button class="chip small" data-serv-mult="0.5">½×</button><button class="chip small" data-serv-mult="2">2×</button>
      ${target !== base ? `<button class="link" data-serv="reset">${esc(t('serv_reset', base))}</button>` : `<small class="muted">${esc(t('serv_hint'))}</small>`}</div>` : '';
  const meta = [
    r.time ? `<span class="pill">⏱ ${esc(r.time)}</span>` : '',
    r.servings ? `<span class="pill">🍽 ${target || esc(r.servings)} ${esc(t('servings'))}</span>` : '',
  ].join('');

  return `<div class="detail" data-id="${esc(r.id)}">
    <div class="detail-hero">
      <div class="gallery" id="gallery">${imgs.length ? imgs.map(i => `<div>${imgTag(i, '', false)}</div>`).join('') : `<div>${placeholder(r)}</div>`}</div>
      <div class="hero-fade"></div>
      ${imgs.length > 1 ? `<div class="dots">${imgs.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>` : ''}
      <div class="hero-bar">
        <button class="glass" data-action="back" aria-label="Back">${I.back}</button>
        <div class="hero-actions">
          <button class="glass ${r.favorite ? 'on' : ''}" data-action="toggle-fav" aria-label="Favorite">${I.heart}</button>
          ${canWrite() ? `<button class="glass" data-action="recipe-menu" aria-label="More">${I.more}</button>` : ''}
        </div>
      </div>
    </div>
    <div class="sheet-body">
      <h1 class="detail-title">${esc(r.title)}</h1>
      <div class="meta-row">
        <span class="pill accent">${COLL[r.collection]?.emoji || ''} ${esc(collName(r.collection))}</span>
        ${r.cooked > 0 ? `<span class="pill ok">🍳 ${esc(t('cooked_n', r.cooked))}</span>` : r.tried ? `<span class="pill ok">✓ ${esc(t('tried'))}</span>` : ''}
        ${r.source ? `<span class="pill">✍️ ${esc(r.source)}</span>` : ''}
        ${!r.seed && auth.mode !== 'local' ? `<span class="pill ${r.visibility === 'private' ? 'warn' : ''}">${esc(t(r.visibility === 'private' ? 'pill_private' : 'pill_public'))}</span>` : ''}
        ${r.sharedWithMe ? `<span class="pill accent">📥 ${esc(r.sharedBy ? t('shared_by', r.sharedBy) : t('shared_pill'))}</span>` : ''}
        ${r.ownerName && !isMine(r) ? (r.owner && ratingsOn() ? `<button class="pill pill-btn" data-user="${esc(r.owner)}" data-user-name="${esc(r.ownerName)}">👤 ${esc(t('by_author', r.ownerName))} ›</button>` : `<span class="pill">👤 ${esc(t('by_author', r.ownerName))}</span>`) : ''}
        ${isMine(r) && !r.seed && auth.mode === 'user' && showsAuthor() && myName() ? `<span class="pill">👤 ${esc(t('by_author', myName()))}</span>` : ''}
        ${meta}${cats}
      </div>
      ${ratingsOn() ? ratingBoxHTML('recipe', r.id) : ''}
      <div class="quick-actions">
        <button class="qa ${r.tried ? 'on' : ''}" data-action="cooked">${I.check}<span>${esc(cookLabel(r))}</span></button>
        <button class="qa" data-action="cook">${I.flame}<span>${esc(t('cook'))}</span></button>
        <button class="qa" data-action="share">${I.share}<span>${esc(t('share'))}</span></button>
        ${canSend(r) ? `<button class="qa" data-action="send-user">${I.send}<span>${esc(t('send_user'))}</span></button>` : ''}
      </div>
      <div class="segmented">
        <button class="${tabSel === 'ing' ? 'active' : ''}" data-dtab="ing">${esc(t('ingredients'))}${hasIng ? ` · ${r.ingredients.filter(x => !isSub(x)).length}` : ''}</button>
        <button class="${tabSel === 'method' ? 'active' : ''}" data-dtab="method">${esc(t('method'))}</button>
      </div>
      <div data-dpane="ing" class="${tabSel === 'ing' ? '' : 'hidden'}">${servBar}${ingHTML}</div>
      <div data-dpane="method" class="${tabSel === 'method' ? '' : 'hidden'}">${stepsHTML}</div>
      ${r.notes ? `<div class="notes-box"><h4>📝 ${esc(t('notes'))}</h4><div class="prose">${linkify(esc(r.notes))}</div></div>` : ''}
      ${videosHTML(r)}
      ${otherLinks(r).length ? `<h3 class="block-title">${esc(t('links'))}</h3><div class="links">${otherLinks(r).map(linkCard).join('')}</div>` : ''}
      ${canWrite() ? `<div class="danger-zone"><button class="danger-link" data-action="delete-flow">${esc(t('del_link'))}</button></div>` : ''}
    </div>
    ${cookBarHTML()}
  </div>`;
}
/* ----- YouTube ----- */
function youtubeInfo(url) {
  let u;
  try { u = new URL(url); } catch (e) { return null; }
  const host = u.hostname.replace(/^(www|m)\./, '');
  let id = null;
  if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = u.searchParams.get('v') || (u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/) || [])[1];
  }
  if (!id || !/^[\w-]{11}$/.test(id)) return null;
  const tm = (u.searchParams.get('t') || u.searchParams.get('start') || '').match(/^(?:(\d+)h)?(?:(\d+)m)?(\d+)s?$/);
  const start = tm ? (+(tm[1] || 0)) * 3600 + (+(tm[2] || 0)) * 60 + (+tm[3] || 0) : 0;
  return { id, start };
}
const otherLinks = r => (r.links || []).filter(l => !youtubeInfo(l.url));
function videosHTML(r) {
  const vids = (r.links || []).map(l => youtubeInfo(l.url)).filter(Boolean);
  if (!vids.length) return '';
  return `<h3 class="block-title">▶️ ${esc(t('video'))}</h3>${vids.map(v => `
    <button class="yt" data-yt="${v.id}" data-start="${v.start}" aria-label="${esc(t('play_video'))}"
      style="background-image:url('https://i.ytimg.com/vi/${v.id}/hqdefault.jpg')">
      <span class="yt-play"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/></svg></span>
    </button>`).join('')}`;
}
function playYouTube(btn) {
  const { yt, start } = btn.dataset;
  const wrap = document.createElement('div');
  wrap.className = 'yt';
  wrap.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&playsinline=1&rel=0${+start ? `&start=${start}` : ''}"
    title="YouTube" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  btn.replaceWith(wrap);
}

function linkify(s) { return s.replace(/https?:\/\/[^\s<]+/g, u => `<a href="${u}" target="_blank" rel="noopener">${u.length > 40 ? u.slice(0, 40) + '…' : u}</a>`); }
function linkCard(l) {
  const url = l.url || '';
  let host = '';
  try { host = new URL(url).hostname.replace(/^www\./, ''); } catch (e) { host = url; }
  const ico = /youtu/.test(host) ? '▶️' : /instagram/.test(host) ? '📸' : /facebook/.test(host) ? '👥' : /tiktok/.test(host) ? '🎵' : '🔗';
  return `<a class="link-card" href="${esc(url)}" target="_blank" rel="noopener">
    <span class="ico">${ico}</span><span class="t"><b>${esc(l.label || host)}</b><small>${esc(url.replace(/^https?:\/\/(www\.)?/, ''))}</small></span>${I.ext}</a>`;
}

function openRecipe(id) {
  const r = byId(id);
  if (!r) return;
  const el = pushPage(detailHTML(r), { onClose: () => { setWakeLock(false); } });
  bindGallery(el);
}
function refreshDetail(r, serv) {
  const p = topPage();
  if (!p) return;
  if (serv !== undefined) { if (serv) p.el.dataset.servings = serv; else delete p.el.dataset.servings; }
  const cur = p.el.querySelector('[data-dtab].active')?.dataset.dtab || 'ing';
  const scroll = p.el.scrollTop;
  const cook = p.el.classList.contains('cook-mode');
  const done = [...p.el.querySelectorAll('[data-ing].done')].map(li => li.dataset.ing);
  const doneSteps = [...p.el.querySelectorAll('[data-step].done')].map(li => li.dataset.step);
  p.el.innerHTML = detailHTML(r, cur, Number(p.el.dataset.servings) || null);
  if (cook) p.el.classList.add('cook-mode');
  done.forEach(i => p.el.querySelector(`[data-ing="${i}"]`)?.classList.add('done'));
  doneSteps.forEach(i => p.el.querySelector(`[data-step="${i}"]`)?.classList.add('done'));
  p.el.scrollTop = scroll;
  hydratePhotos(p.el);
  bindGallery(p.el);
  renderTimer();
}
function bindGallery(el) {
  const g = el.querySelector('#gallery');
  const dots = el.querySelectorAll('.dots i');
  if (!g || !dots.length) return;
  g.addEventListener('scroll', () => {
    const i = Math.round(g.scrollLeft / g.clientWidth);
    dots.forEach((d, k) => d.classList.toggle('on', k === i));
  }, { passive: true });
}

function recipeText(r) {
  return [r.title, '', (r.ingredients || []).length ? t('ingredients') + ':\n' + r.ingredients.map(x => x.startsWith('## ') ? '\n' + x.slice(3) + ':' : '• ' + x).join('\n') : '',
    '', r.steps ? t('method') + ':\n' + r.steps : '', r.notes ? '\n' + r.notes : '',
    (r.links || []).map(l => l.url).join('\n')].filter(x => x !== undefined).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/* ----- Editor ----- */
function editorHTML(d, isNew) {
  return `<div class="navbar">
      <button class="nav-btn" data-action="editor-cancel">${esc(t('cancel'))}</button>
      <h1>${esc(isNew ? t('new_recipe') : t('edit_recipe'))}</h1>
      <button class="nav-btn strong" data-action="editor-save">${esc(t('save'))}</button>
    </div>
    <div class="form">
      <div class="group" style="margin-top:8px">
        <input class="field title-field" id="e-title" placeholder="${esc(t('f_title'))}" value="${esc(d.title)}" maxlength="160">
      </div>

      ${auth.mode === 'user' ? `<div class="group-label">${esc(t('f_visibility'))}</div>
      <div class="group"><div class="seg-row"><div class="segmented" id="e-vis">
        <button class="${d.visibility !== 'private' ? 'active' : ''}" data-pick-vis="public">${esc(t('vis_public'))}</button>
        <button class="${d.visibility === 'private' ? 'active' : ''}" data-pick-vis="private">${esc(t('vis_private'))}</button>
      </div></div></div>
      <p class="hint" id="e-vis-hint">${esc(t(d.visibility === 'private' ? 'vis_private_sub' : 'vis_public_sub'))}</p>` : ''}

      <div class="group-label">${esc(t('f_photos'))}</div>
      <div class="group">
        <div id="e-photos">${photoStrip(d)}</div>
        <div class="photo-add" ${d.images.length ? '' : 'style="padding-top:14px"'}>
          <button class="btn primary" data-action="add-photo" data-kind="camera">${I.camera} ${esc(t('camera'))}</button>
          <button class="btn" data-action="add-photo" data-kind="gallery">${I.image} ${esc(t('gallery'))}</button>
        </div>
      </div>

      <div class="group-label">${esc(t('f_categories'))}</div>
      <div class="group"><div class="chip-pick" id="e-cats">
        ${CATEGORIES.map(c => `<button class="chip small ${d.categories.includes(c.id) ? 'active' : ''}" data-pick-cat="${c.id}">${c.emoji} ${esc(c[settings.lang])}</button>`).join('')}
      </div></div>

      <div class="group-label">${esc(t('f_collection'))}</div>
      <div class="group"><div class="chip-pick" id="e-coll">
        ${COLLECTIONS.map(c => `<button class="chip small ${d.collection === c.id ? 'active' : ''}" data-pick-coll="${c.id}">${c.emoji} ${esc(c[settings.lang])}</button>`).join('')}
      </div></div>

      <div class="group" style="margin-top:18px">
        <div class="inline-fields">
          <input class="field" id="e-time" placeholder="⏱ ${esc(t('f_time_ph'))}" value="${esc(d.time)}">
          <input class="field" id="e-servings" placeholder="🍽 ${esc(t('f_servings_ph'))}" value="${esc(d.servings)}">
        </div>
        <label class="row"><span class="lbl">✓ ${esc(t('f_tried'))}</span><span class="switch"><input type="checkbox" id="e-tried" ${d.tried ? 'checked' : ''}><span></span></span></label>
      </div>

      <div class="group-label">${esc(t('f_ingredients'))}</div>
      <div class="group"><textarea class="field" id="e-ing" rows="8" placeholder="${esc(t('f_ing_ph'))}">${esc(d.ingredients.join('\n'))}</textarea></div>

      <div class="group-label">${esc(t('f_steps'))}</div>
      <div class="group"><textarea class="field" id="e-steps" rows="10" placeholder="${esc(t('f_steps_ph'))}">${esc(d.steps)}</textarea></div>

      <div class="group-label">${esc(t('f_notes'))}</div>
      <div class="group"><textarea class="field" id="e-notes" rows="4" placeholder="${esc(t('f_notes_ph'))}">${esc(d.notes)}</textarea></div>

      <div class="group-label">${esc(t('f_links'))}</div>
      <div class="group" id="e-links">
        ${d.links.map((l, i) => linkRow(l, i)).join('')}
        <button class="row row-btn" data-action="add-link" style="color:var(--accent);font-weight:600">＋ ${esc(t('f_add_link'))}</button>
      </div>

      ${isNew ? '' : `<div style="margin-top:28px"><button class="btn danger" data-action="delete-recipe">${I.trash} ${esc(t('delete'))}</button></div>`}
    </div>`;
}
function photoStrip(d) {
  if (!d.images.length) return '';
  return `<div class="photo-strip">${d.images.map((ref, i) => `<div class="photo-tile">${imgTag(ref, '', false)}
    ${i === 0 ? `<span class="cover">${esc(t('cover'))}</span>` : ''}
    <button class="x" data-rm-photo="${i}" aria-label="Remove">${I.x}</button></div>`).join('')}</div>`;
}
function linkRow(l, i) {
  return `<div class="link-row" data-link-row="${i}">
    <input type="url" inputmode="url" autocapitalize="off" placeholder="${esc(t('f_link_ph'))}" value="${esc(l.url)}" data-link-url>
    <button class="rm" data-rm-link="${i}" aria-label="Remove">${I.x}</button></div>`;
}

function openEditor(existing, prefill = null) {
  const isNew = !existing;
  const d = existing ? JSON.parse(JSON.stringify({
    title: existing.title, images: existing.images || [], categories: existing.categories || [], collection: existing.collection,
    ingredients: existing.ingredients || [], steps: existing.steps || '', notes: existing.notes || '', links: existing.links || [],
    tried: !!existing.tried, time: existing.time || '', servings: existing.servings || '',
    visibility: existing.visibility || 'public', basedOn: existing.basedOn || null,
  })) : {
    title: '', images: [], categories: state.cat ? [state.cat] : [], collection: 'mine', ingredients: [], steps: '', notes: '',
    links: [], tried: false, time: '', servings: '', visibility: 'public', basedOn: null,
    ...(prefill || {}),
  };
  const added = [];      // photos stored during this edit session
  const removed = [];    // photos to delete on save
  let saved = false;
  const el = pushPage(editorHTML(d, isNew), {
    modal: true,
    onClose: () => { if (!saved) added.forEach(deletePhoto); },
  });

  const readForm = () => {
    d.title = $('#e-title', el).value.trim();
    d.ingredients = $('#e-ing', el).value.split('\n').map(s => s.trim()).filter(Boolean);
    d.steps = $('#e-steps', el).value.trim();
    d.notes = $('#e-notes', el).value.trim();
    d.time = $('#e-time', el).value.trim();
    d.servings = $('#e-servings', el).value.trim();
    d.tried = $('#e-tried', el).checked;
    d.links = [...el.querySelectorAll('[data-link-url]')].map((inp, i) => {
      let url = inp.value.trim();
      if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
      const prev = d.links[i];
      let label = '';
      try { label = new URL(url).hostname.replace(/^www\./, ''); } catch (e) {}
      return { url, label: prev && prev.url === url && prev.label ? prev.label : label };
    }).filter(l => l.url);
  };
  const rerenderPhotos = () => { $('#e-photos', el).innerHTML = photoStrip(d); hydratePhotos(el); };

  el.addEventListener('click', async e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.action === 'editor-cancel') { popPage(); return; }
    if (b.dataset.action === 'editor-save') {
      readForm();
      if (!d.title) { toast(t('need_title')); $('#e-title', el).focus(); return; }
      if (!d.categories.length) d.categories = ['other'];
      const r = existing || { id: uid('r'), createdAt: Date.now(), favorite: false, source: null, seed: false,
        owner: auth.mode === 'user' ? auth.user.id : null, ownerName: myName() };
      const wasTried = existing ? !!existing.tried : false;
      const { tried, ...fields } = d;
      Object.assign(r, fields);
      try { await saveRecipe(r); }
      catch (err) { toast(t('save_err')); return; }
      if (tried !== wasTried) await setState(r, { tried });
      for (const ref of removed) await deletePhoto(ref);
      saved = true;
      popPage();
      haptic();
      toast(t('saved'));
      renderTab();
      if (existing) refreshDetail(r); else setTimeout(() => openRecipe(r.id), 280);
      return;
    }
    if (b.dataset.action === 'add-photo') {
      const files = await pickFiles(b.dataset.kind);
      for (const f of files) {
        try { const ref = await storePhoto(f); d.images.push(ref); added.push(ref); }
        catch (err) { toast(t('photo_err')); }
      }
      rerenderPhotos();
      return;
    }
    if (b.dataset.rmPhoto !== undefined) {
      const [ref] = d.images.splice(Number(b.dataset.rmPhoto), 1);
      if (isOwnedPhoto(ref)) (added.includes(ref) ? deletePhoto(ref) : removed.push(ref));
      rerenderPhotos();
      return;
    }
    if (b.dataset.pickCat) {
      const c = b.dataset.pickCat;
      d.categories = d.categories.includes(c) ? d.categories.filter(x => x !== c) : [...d.categories, c];
      b.classList.toggle('active');
      return;
    }
    if (b.dataset.pickVis) {
      d.visibility = b.dataset.pickVis;
      el.querySelectorAll('[data-pick-vis]').forEach(x => x.classList.toggle('active', x === b));
      $('#e-vis-hint', el).textContent = t(d.visibility === 'private' ? 'vis_private_sub' : 'vis_public_sub');
      return;
    }
    if (b.dataset.pickColl) {
      d.collection = b.dataset.pickColl;
      el.querySelectorAll('[data-pick-coll]').forEach(x => x.classList.toggle('active', x === b));
      return;
    }
    if (b.dataset.action === 'add-link') {
      readForm();
      d.links.push({ url: '', label: '' });
      const wrap = $('#e-links', el);
      wrap.insertAdjacentHTML('beforeend', '');
      b.insertAdjacentHTML('beforebegin', linkRow({ url: '' }, d.links.length - 1));
      b.previousElementSibling.querySelector('input').focus();
      return;
    }
    if (b.dataset.rmLink !== undefined) { b.closest('.link-row').remove(); return; }
    if (b.dataset.action === 'delete-recipe') {
      await deleteFlow(existing);
    }
  });
}

/* ---------------- Flavor roulette ---------------- */
const WHEEL_N = 8;
const WHEEL_COLORS = ['#FF8A3D', '#E8552F', '#FFB547', '#C93A2E', '#FF9F5A', '#D9472B', '#F7C45A', '#B8322A'];
const polar = (deg, r) => { const a = deg * Math.PI / 180; return [r * Math.sin(a), -r * Math.cos(a)]; };

function miniWheelSVG() {
  const seg = 360 / WHEEL_N;
  return `<svg viewBox="-50 -50 100 100">${WHEEL_COLORS.map((c, i) => {
    const [x0, y0] = polar(i * seg, 48), [x1, y1] = polar((i + 1) * seg, 48);
    return `<path d="M0 0L${x0} ${y0}A48 48 0 0 1 ${x1} ${y1}Z" fill="${i % 2 ? '#fff' : 'rgba(255,255,255,.55)'}"/>`;
  }).join('')}<circle r="10" fill="#E8552F" stroke="#fff" stroke-width="4"/></svg>`;
}

function wheelSVG(items) {
  const seg = 360 / items.length;
  const slices = items.map((r, i) => {
    const [x0, y0] = polar(i * seg, 98), [x1, y1] = polar((i + 1) * seg, 98);
    const mid = i * seg + seg / 2;
    const [ex, ey] = polar(mid, 66);
    const emoji = (CAT[(r.categories || [])[0]] || CAT.other).emoji;
    return `<path d="M0 0L${x0.toFixed(2)} ${y0.toFixed(2)}A98 98 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}Z" fill="${WHEEL_COLORS[i % WHEEL_COLORS.length]}" stroke="rgba(255,255,255,.9)" stroke-width="1.2"/>
      <text x="${ex.toFixed(2)}" y="${ey.toFixed(2)}" font-size="20" text-anchor="middle" dominant-baseline="central" transform="rotate(${mid} ${ex.toFixed(2)} ${ey.toFixed(2)})">${emoji}</text>`;
  }).join('');
  const studs = Array.from({ length: items.length * 2 }, (_, i) => {
    const [x, y] = polar(i * seg / 2, 103);
    return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="2.2" fill="#fff"/>`;
  }).join('');
  return `<svg viewBox="-110 -110 220 220" class="wheel-svg"><circle r="108" fill="#2A1712"/>${studs}<g>${slices}</g><circle r="24" fill="#fff"/></svg>`;
}

function openRoulette() {
  let poolCat = state.cat || null;
  let items = [];
  let rotation = 0;
  let spinning = false;
  const counts = {};
  state.recipes.forEach(r => (r.categories || []).forEach(c => { counts[c] = (counts[c] || 0) + 1; }));

  const pickItems = () => {
    const pool = state.recipes.filter(r => !poolCat || (r.categories || []).includes(poolCat));
    const withImg = shuffle(pool.filter(r => (r.images || []).length));
    const rest = shuffle(pool.filter(r => !(r.images || []).length));
    items = [...withImg, ...rest].slice(0, WHEEL_N);
    while (items.length && items.length < WHEEL_N) items = items.concat(items).slice(0, WHEEL_N);
  };
  pickItems();

  const el = pushPage(`<div class="navbar">
      <button class="nav-btn" data-action="back">${esc(t('cancel'))}</button>
      <h1>🎰 ${esc(t('roulette_title'))}</h1><span style="width:60px"></span>
    </div>
    <div class="roulette">
      <p class="muted center">${esc(t('roulette_sub'))}</p>
      <div class="group-label">${esc(t('roulette_pool'))}</div>
      <div class="chips" id="rl-cats">
        <button class="chip small ${!poolCat ? 'active' : ''}" data-rl-cat="">${esc(t('all'))}</button>
        ${CATEGORIES.filter(c => counts[c.id] >= 2).map(c => `<button class="chip small ${poolCat === c.id ? 'active' : ''}" data-rl-cat="${c.id}">${c.emoji} ${esc(c[settings.lang])}</button>`).join('')}
      </div>
      <div class="wheel-wrap">
        <div class="wheel-pointer"></div>
        <div class="wheel" id="rl-wheel"></div>
        <button class="wheel-hub" id="rl-spin">${esc(t('spin'))}</button>
      </div>
      <div class="ticker" id="rl-ticker">&nbsp;</div>
      <div id="rl-result"></div>
    </div>`, { modal: true });

  const wheel = $('#rl-wheel', el), ticker = $('#rl-ticker', el), result = $('#rl-result', el);
  const drawWheel = () => {
    wheel.style.transition = 'none';
    wheel.style.transform = `rotate(${rotation}deg)`;
    wheel.innerHTML = items.length ? wheelSVG(items) : `<div class="empty">${esc(t('roulette_empty'))}</div>`;
    result.innerHTML = '';
    ticker.innerHTML = '&nbsp;';
  };
  drawWheel();

  const indexAt = rot => {
    const seg = 360 / items.length;
    return Math.floor((((360 - (rot % 360)) % 360) + 360) % 360 / seg) % items.length;
  };

  const spin = () => {
    if (spinning || !items.length) return;
    spinning = true;
    result.innerHTML = '';
    el.querySelector('#rl-spin').disabled = true;
    const seg = 360 / items.length;
    const win = Math.floor(Math.random() * items.length);
    const center = win * seg + seg / 2;
    const jitter = (Math.random() - 0.5) * seg * 0.6;
    const base = rotation + 360 * (5 + Math.floor(Math.random() * 3));
    const target = base + ((360 - center - (base % 360)) % 360 + 360) % 360 + jitter;
    const duration = 4600;
    wheel.style.transition = `transform ${duration}ms cubic-bezier(.12,.72,.08,1)`;
    wheel.style.transform = `rotate(${target}deg)`;

    let last = -1;
    const tick = () => {
      if (!spinning) return;
      const m = getComputedStyle(wheel).transform;
      if (m && m !== 'none') {
        const [a, b] = m.slice(7, -1).split(',').map(Number);
        const deg = (Math.atan2(b, a) * 180 / Math.PI + 360) % 360;
        const i = indexAt(deg);
        if (i !== last) { last = i; ticker.textContent = items[i].title; haptic(); }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    setTimeout(() => {
      spinning = false;
      rotation = target;
      const r = items[indexAt(target)];
      ticker.textContent = '';
      el.querySelector('#rl-spin').disabled = false;
      const cover = (r.images || [])[0];
      result.innerHTML = `<div class="win-card">
        <div class="win-label">🎉 ${esc(t('roulette_win'))}</div>
        <div class="win-thumb">${cover ? imgTag(cover, '', false) : placeholder(r)}</div>
        <h2>${esc(r.title)}</h2>
        <div class="win-actions">
          <button class="btn primary" data-rl-open="${esc(r.id)}">${esc(t('open_recipe'))}</button>
          <button class="btn" data-rl-again>${esc(t('spin_again'))}</button>
        </div></div>${confettiHTML()}`;
      hydratePhotos(result);
      result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, duration + 80);
  };

  el.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.id === 'rl-spin' || b.hasAttribute('data-rl-again')) { spin(); return; }
    if (b.dataset.rlOpen) { const id = b.dataset.rlOpen; popPage(); setTimeout(() => openRecipe(id), 280); return; }
    if (b.dataset.rlCat !== undefined) {
      if (spinning) return;
      poolCat = b.dataset.rlCat || null;
      el.querySelectorAll('[data-rl-cat]').forEach(x => x.classList.toggle('active', x === b));
      pickItems(); drawWheel();
    }
  });
}
function confettiHTML() {
  const bits = ['🍅', '🧄', '🌶️', '🍋', '🌿', '🧀', '✨', '🥕'];
  return `<div class="confetti" aria-hidden="true">${Array.from({ length: 18 }, (_, i) =>
    `<i style="--x:${Math.round(Math.random() * 100)}%;--d:${(0.9 + Math.random() * 0.9).toFixed(2)}s;--r:${Math.round(Math.random() * 720 - 360)}deg">${bits[i % bits.length]}</i>`).join('')}</div>`;
}

/* ---------------- AI recipe input ---------------- */
const AI_ERRORS = { bad_access_code: 'ai_bad_code', not_configured: 'ai_not_configured' };
async function askAddMode() {
  const v = await actionSheet(t('add_how'), [
    { label: t('add_paste'), value: 'paste' },
    { label: t('add_ai'), value: 'ai' },
    { label: t('add_ai_photo'), value: 'ai-photo' },
    { label: t('add_manual'), value: 'manual' },
  ]);
  if (v === 'paste') openPasteImport();
  else if (v === 'manual') openEditor(null);
  else if (v) openAIComposer(v === 'ai-photo');
}

function openAIComposer(withPhoto) {
  let image = null; // { media_type, data, url }
  const el = pushPage(`<div class="navbar">
      <button class="nav-btn" data-action="back">${esc(t('cancel'))}</button>
      <h1>✨ ${esc(t('ai_title'))}</h1><span style="width:60px"></span>
    </div>
    <div class="form">
      <p class="muted" style="margin:10px 4px 14px">${esc(t('ai_hint'))}</p>
      <div class="group"><textarea class="field" id="ai-text" rows="9" placeholder="${esc(t('ai_ph'))}"></textarea></div>
      <div class="group-label">${esc(t('ai_photo'))}</div>
      <div class="group">
        <div id="ai-photo"></div>
        <div class="photo-add" style="padding-top:14px">
          <button class="btn" data-ai-photo="camera">${I.camera} ${esc(t('camera'))}</button>
          <button class="btn" data-ai-photo="gallery">${I.image} ${esc(t('gallery'))}</button>
        </div>
      </div>
      <div style="margin-top:22px"><button class="btn primary ai-go" id="ai-go">${esc(t('ai_go'))}</button></div>
    </div>`, { modal: true });

  const setPhoto = () => {
    $('#ai-photo', el).innerHTML = image ? `<div class="photo-strip"><div class="photo-tile"><img src="${image.url}" alt="">
      <button class="x" data-ai-rm aria-label="Remove">${I.x}</button></div></div>` : '';
  };
  const addPhoto = async kind => {
    const [f] = await pickFiles(kind);
    if (!f) return;
    try {
      const blob = await compressImage(f, 1568, 0.85);
      const data = (await blobToDataURL(blob)).split(',')[1];
      image = { media_type: 'image/jpeg', data, url: URL.createObjectURL(blob) };
      setPhoto();
    } catch (err) { toast(t('photo_err')); }
  };
  if (withPhoto) setTimeout(() => addPhoto('gallery'), 350); else setTimeout(() => $('#ai-text', el).focus(), 350);

  el.addEventListener('click', async e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.aiPhoto) { addPhoto(b.dataset.aiPhoto); return; }
    if (b.hasAttribute('data-ai-rm')) { image = null; setPhoto(); return; }
    if (b.id !== 'ai-go') return;
    const text = $('#ai-text', el).value.trim();
    if (!text && !image) { toast(t('ai_need_input')); return; }
    if (!settings.aiCode) { toast(t('ai_need_code')); return; }
    b.disabled = true;
    b.innerHTML = `<span class="spinner"></span> ${esc(t('ai_working'))}`;
    try {
      const res = await fetch('/api/parse-recipe', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-access-code': settings.aiCode },
        body: JSON.stringify({ text, image: image && { media_type: image.media_type, data: image.data } }),
      });
      const raw = (await res.text()).trim();
      let out = {};
      try { out = JSON.parse(raw); } catch (err) { out = { error: 'bad_response' }; }
      if (!out.recipe) throw new Error(out.error || 'ai_error');
      const r = out.recipe;
      popPage();
      setTimeout(() => openEditor(null, {
        title: r.title || '',
        ingredients: r.ingredients || [],
        steps: (r.steps || []).join('\n\n'),
        notes: r.notes || '',
        categories: (r.categories || []).filter(c => CAT[c]),
        time: r.time || '',
        servings: r.servings || '',
      }), 280);
    } catch (err) {
      toast(t(AI_ERRORS[err.message] || 'ai_err'));
      b.disabled = false;
      b.textContent = t('ai_go');
    }
  });
}

/* ---------------- Smart paste (no AI) ---------------- */
function openPasteImport() {
  const el = pushPage(`<div class="navbar">
      <button class="nav-btn" data-action="back">${esc(t('cancel'))}</button>
      <h1>📋 ${esc(t('paste_title'))}</h1><span style="width:60px"></span>
    </div>
    <div class="form">
      <p class="muted" style="margin:10px 4px 12px">${esc(t('paste_hint'))}</p>
      <div class="group"><textarea class="field" id="paste-text" rows="12" placeholder="${esc(t('paste_ph'))}" style="min-height:260px"></textarea></div>
      <div style="display:grid;gap:10px;margin-top:16px">
        <button class="btn" id="paste-clip">📋 ${esc(t('paste_from_clip'))}</button>
        <button class="btn primary ai-go" id="paste-go">⚙️ ${esc(t('paste_go'))}</button>
      </div>
      <p class="hint" style="margin-top:12px">${esc(t('paste_free'))}</p>
    </div>`, { modal: true });
  const box = $('#paste-text', el);
  $('#paste-clip', el).onclick = async () => {
    try { box.value = await navigator.clipboard.readText(); box.focus(); } catch (e) { toast(t('paste_clip_err')); box.focus(); }
  };
  $('#paste-go', el).onclick = () => {
    const text = box.value.trim();
    if (!text) { toast(t('ai_need_input')); return; }
    const r = smartParseRecipe(text);
    if (!r.stats.ingredients && (!r.stats.steps || text.split(/\s+/).length < 8)) { toast(t('paste_nothing')); return; }
    popPage();
    setTimeout(() => {
      openEditor(null, {
        title: r.title, ingredients: r.ingredients, steps: r.steps, notes: r.notes,
        categories: (r.categories || []).filter(c => CAT[c]), servings: r.servings, links: r.links,
      });
      toast(t('paste_done', r.stats.ingredients, r.stats.steps));
    }, 280);
  };
  setTimeout(() => box.focus(), 350);
}

/* ---------------- Action sheet ---------------- */
function actionSheet(title, options) {
  return new Promise(resolve => {
    const root = $('#sheet-root');
    root.innerHTML = `<div class="backdrop"></div><div class="action-sheet">
      <div class="as-group">${title ? `<div class="as-title">${esc(title)}</div>` : ''}
        ${options.map((o, i) => `<button class="as-btn ${o.danger ? 'danger' : ''}" data-i="${i}">${esc(o.label)}</button>`).join('')}</div>
      <button class="as-btn cancel" data-i="-1">${esc(t('cancel'))}</button></div>`;
    const close = v => {
      root.querySelector('.backdrop').classList.add('closing');
      root.querySelector('.action-sheet').classList.add('closing');
      setTimeout(() => { root.innerHTML = ''; }, 220);
      resolve(v);
    };
    root.querySelector('.backdrop').onclick = () => close(null);
    root.querySelectorAll('[data-i]').forEach(b => b.onclick = () => {
      const i = Number(b.dataset.i);
      close(i < 0 ? null : options[i].value);
    });
  });
}

/* ---------------- Backup ---------------- */
const blobToDataURL = b => new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); });
async function exportBackup() {
  const recipes = await DB.all('recipes');
  const photos = await DB.all('photos');
  const out = { app: 'chocho-recipes', version: 2, exportedAt: new Date().toISOString(), settings, recipes, states: (await DB.get('kv', 'states:local')) || {}, photos: [] };
  for (const p of photos) out.photos.push({ id: p.id, data: await blobToDataURL(p.blob) });
  const name = `recipes-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File([JSON.stringify(out)], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); toast(t('export_done')); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast(t('export_done'));
}
async function importBackup() {
  const input = $('#file-import');
  input.value = '';
  input.onchange = async () => {
    const f = input.files[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (data.app !== 'chocho-recipes' || !Array.isArray(data.recipes)) throw new Error('bad');
      for (const p of data.photos || []) {
        const blob = await (await fetch(p.data)).blob();
        await DB.put('photos', { id: p.id, blob, created: Date.now() });
      }
      // Backups from v1.2 hold the original recipes too: keep only people's own recipes and edited originals.
      const mine = data.recipes.filter(r => !r.seed || r.edited)
        .map(r => r.seed ? Object.assign({}, r, { id: uid('r'), seed: false, basedOn: r.id }) : r);
      await DB.putMany('recipes', mine.map(storable));
      const st = (await DB.get('kv', 'states:local')) || {};
      for (const r of data.recipes) if (r.favorite || r.tried) st[r.id] = { favorite: !!r.favorite, tried: !!r.tried };
      Object.assign(st, data.states || {});
      await DB.put('kv', st, 'states:local');
      await loadUserData();
      renderTab();
      toast(t('import_done', mine.length));
    } catch (e) { toast(t('import_err')); }
  };
  input.click();
}

/* ---------------- Events ---------------- */
function bindEvents() {
  document.addEventListener('click', async e => {
    if (e.target.id === 'pages-root') { popPage(); return; } // click on the dimmed backdrop (desktop)
    const tm = e.target.closest('[data-timer],[data-timer-set]');
    if (tm) { handleTimerClick(tm); return; }
    const sv = e.target.closest('[data-serv],[data-serv-mult]');
    if (sv) {
      const page = sv.closest('.page'), rr = byId(page.querySelector('.detail').dataset.id), base = baseServings(rr);
      const cur = Number(page.dataset.servings) || base;
      let next = cur;
      if (sv.dataset.serv === 'reset') next = base;
      else if (sv.dataset.serv) next = cur + Number(sv.dataset.serv);
      else next = Math.round(cur * Number(sv.dataset.servMult));
      next = Math.max(1, Math.min(99, next));
      refreshDetail(rr, next === base ? null : next);
      return;
    }
    const rate = e.target.closest('.stars-input [data-stars]');
    if (rate) {
      const box = rate.closest('.stars-input');
      if (await setRating(box.dataset.rateType, box.dataset.rateId, Number(rate.dataset.stars))) refreshAfterRating();
      return;
    }
    const userBtn = e.target.closest('[data-user]');
    if (userBtn) { openUserPage({ id: userBtn.dataset.user, name: userBtn.dataset.userName || '', avatar: null }); return; }
    const stepEl = e.target.closest('.step[data-step]');
    if (stepEl && !e.target.closest('a')) { stepEl.classList.toggle('done'); haptic(); return; }
    const favBtn = e.target.closest('[data-fav]');
    if (favBtn) {
      e.stopPropagation();
      const r = byId(favBtn.dataset.fav);
      haptic();
      await setState(r, { favorite: !r.favorite });
      favBtn.classList.toggle('on', r.favorite);
      if (state.tab === 'favorites') renderTab();
      return;
    }
    const open = e.target.closest('[data-open]');
    if (open) { openRecipe(open.dataset.open); return; }

    const tabBtn = e.target.closest('[data-tab]');
    if (tabBtn) {
      while (state.pages.length) popPage();
      if (state.tab === tabBtn.dataset.tab) window.scrollTo({ top: 0, behavior: 'smooth' });
      state.tab = tabBtn.dataset.tab; renderTab(); return;
    }
    const go = e.target.closest('[data-tab-go]');
    if (go) { state.tab = go.dataset.tabGo; renderTab(); window.scrollTo(0, 0); return; }

    const catBtn = e.target.closest('[data-cat]');
    if (catBtn) { state.cat = catBtn.dataset.cat || null; renderTab(); return; }
    const collBtn = e.target.closest('[data-coll]');
    if (collBtn) { state.coll = collBtn.dataset.coll || null; if (!state.coll) state.scope = 'all'; renderTab(); return; }
    const favF = e.target.closest('[data-fav-filter]');
    if (favF) { state.favFilter = favF.dataset.favFilter; renderTab(); return; }
    const scopeBtn = e.target.closest('[data-scope]');
    if (scopeBtn) { state.scope = state.scope === scopeBtn.dataset.scope ? 'all' : scopeBtn.dataset.scope; renderTab(); return; }
    const goCat = e.target.closest('[data-go-cat]');
    if (goCat) { state.cat = goCat.dataset.goCat; state.coll = null; state.scope = 'all'; state.query = ''; state.tab = 'home'; renderTab(); window.scrollTo(0, 0); return; }
    const goScope = e.target.closest('[data-go-scope]');
    if (goScope) { state.scope = goScope.dataset.goScope; state.cat = null; state.coll = null; state.query = ''; state.tab = 'home'; renderTab(); window.scrollTo(0, 0); return; }
    const goColl = e.target.closest('[data-go-coll]');
    if (goColl) { state.coll = goColl.dataset.goColl; state.cat = null; state.scope = 'all'; state.query = ''; state.tab = 'home'; renderTab(); window.scrollTo(0, 0); return; }

    const setBtn = e.target.closest('[data-set]');
    if (setBtn) {
      settings[setBtn.dataset.set] = setBtn.dataset.val; saveSettings(); applyAppearance(); renderTab(); return;
    }

    const dtab = e.target.closest('[data-dtab]');
    if (dtab) {
      const page = dtab.closest('.page');
      page.querySelectorAll('[data-dtab]').forEach(b => b.classList.toggle('active', b === dtab));
      page.querySelectorAll('[data-dpane]').forEach(p => p.classList.toggle('hidden', p.dataset.dpane !== dtab.dataset.dtab));
      return;
    }
    const ing = e.target.closest('[data-ing]');
    if (ing) { ing.classList.toggle('done'); haptic(); return; }
    const yt = e.target.closest('button[data-yt]');
    if (yt) { playYouTube(yt); return; }

    const a = e.target.closest('[data-action]');
    if (!a) return;
    const act = a.dataset.action;
    const detail = a.closest('.detail');
    const r = detail ? byId(detail.dataset.id) : null;
    switch (act) {
      case 'new-recipe': if (canWrite()) askAddMode(); else promptLogin(); break;
      case 'login': openAuth({ view: 'signin' }); break;
      case 'friends': goSocial('friends'); break;
      case 'invite': openInvitePage(); break;
      case 'admin-users': openAdminUsers(); break;
      case 'restore-hidden': await restoreHidden(); break;
      case 'send-user': if (r) openSharePage(r); break;
      case 'save-name': {
        const name = ($('#display-name').value || '').trim();
        if (!name) { toast(t('need_title')); break; }
        await saveProfile({ display_name: name });
        await loadUserData(); renderTab(); toast(t('name_saved'));
        break;
      }
      case 'logout': {
        const ok = await actionSheet(t('logout_q'), [{ label: t('logout'), danger: true, value: true }]);
        if (ok) { await signOut(); toast(t('logged_out')); }
        break;
      }
      case 'upload-local': {
        const v = await actionSheet(t('upload_local_q'), [
          { label: t('vis_public'), value: 'public' }, { label: t('vis_private'), value: 'private' }]);
        if (!v) break;
        toast(t('upload_busy'));
        const n = await uploadLocalRecipes(v);
        await reloadAll();
        toast(t('upload_done', n));
        break;
      }
      case 'roulette': openRoulette(); break;
      case 'back': popPage(); break;
      case 'clear-q': state.query = ''; renderTab(); $('#q')?.focus(); break;
      case 'clear-filters': state.query = ''; state.cat = null; state.coll = null; state.scope = 'all'; renderTab(); break;
      case 'surprise': {
        const pool = filtered().length ? filtered() : state.recipes;
        openRecipe(pool[Math.floor(Math.random() * pool.length)].id); break;
      }
      case 'sort': {
        const v = await actionSheet(t('sort'), [
          { label: (settings.sort === 'az' ? '✓ ' : '') + t('sort_az'), value: 'az' },
          { label: (settings.sort === 'new' ? '✓ ' : '') + t('sort_new'), value: 'new' },
          { label: (settings.sort === 'tried' ? '✓ ' : '') + t('sort_tried'), value: 'tried' },
          ...(ratingsOn() ? [{ label: (settings.sort === 'rating' ? '✓ ' : '') + t('sort_rating'), value: 'rating' }] : []),
        ]);
        if (v) { settings.sort = v; saveSettings(); renderTab(); }
        break;
      }
      case 'toggle-fav':
        haptic(); await setState(r, { favorite: !r.favorite });
        a.classList.toggle('on', r.favorite); renderTab(); break;
      case 'toggle-tried':
        haptic(); await setState(r, { tried: !r.tried }); refreshDetail(r); renderTab(); break;
      case 'cooked': {
        if (!r.cooked && !r.tried) { haptic(); await markCooked(r, 1); toast(t('cooked_toast', r.cooked)); }
        else {
          const opts = [{ label: '🍳 ' + t('cooked_again'), value: 'add' }];
          if (r.cooked > 0) opts.push({ label: '− ' + t('cooked_minus'), value: 'sub' });
          opts.push({ label: t('cooked_reset'), danger: true, value: 'reset' });
          const v = await actionSheet(r.cooked > 0 ? t('cooked_n', r.cooked) : t('tried'), opts);
          if (v === 'add') { await markCooked(r, 1); toast(t('cooked_toast', r.cooked)); }
          else if (v === 'sub') await markCooked(r, -1);
          else if (v === 'reset') await resetCooked(r);
          else break;
        }
        refreshDetail(r); renderTab(); break;
      }
      case 'cooked-done': haptic(); await markCooked(r, 1); toast(t('cooked_toast', r.cooked)); refreshDetail(r); renderTab(); break;
      case 'delete-flow': if (r) await deleteFlow(r); break;
      case 'cook': {
        const page = a.closest('.page');
        const on = !page.classList.contains('cook-mode');
        page.classList.toggle('cook-mode', on);
        a.classList.toggle('on', on);
        setWakeLock(on); renderTimer();
        toast(t(on ? 'cook_on' : 'cook_off'));
        break;
      }
      case 'share': {
        const text = recipeText(r);
        try {
          if (navigator.share) await navigator.share({ title: r.title, text });
          else { await navigator.clipboard.writeText(text); toast('📋 ✓'); }
        } catch (err) {}
        break;
      }
      case 'recipe-menu': {
        const mine = isMine(r);
        const opts = mine ? [{ label: '✏️ ' + t('edit'), value: 'edit' }] : r.seed
          ? [{ label: '✏️ ' + t('edit_mine'), value: 'fork' }]
          : [{ label: '📋 ' + t('copy_mine'), value: 'copy' }];
        if (mine && auth.mode === 'user') {
          opts.push({ label: '📤 ' + t('share_menu'), value: 'share' });
          opts.push(r.visibility === 'private'
            ? { label: t('make_public'), value: 'public' } : { label: t('make_private'), value: 'private' });
        }
        if (auth.mode === 'user' && canSend(r)) opts.push({ label: '💬 ' + t('chat_discuss'), value: 'chat' });
        const v = await actionSheet(r.title, opts);
        if (v === 'edit') openEditor(r);
        if (v === 'share') openSharePage(r);
        if (v === 'chat') openNewChat(r.id);
        if (v === 'fork' || v === 'copy') {
          openEditor(null, Object.assign(JSON.parse(JSON.stringify(Object.fromEntries(RECIPE_FIELDS.map(k => [k, r[k]])))),
            { basedOn: v === 'fork' ? r.id : null, tried: r.tried, source: null }));
        }
        if (v === 'public' || v === 'private') {
          r.visibility = v;
          try { await saveRecipe(r); refreshDetail(r); renderTab(); toast(t(v === 'public' ? 'made_public' : 'made_private')); }
          catch (err) { toast(t('save_err')); }
        }
        break;
      }
      case 'avatar': {
        const cloudUser = auth.mode === 'user';
        const cur = myAvatar();
        const opts = [{ label: '📷 ' + t('camera'), value: 'camera' }, { label: '🖼 ' + t('gallery'), value: 'gallery' }];
        if (cur) opts.push({ label: t('remove_photo'), value: 'remove', danger: true });
        const v = await actionSheet(t('change_photo'), opts);
        if (!v) break;
        let next = null;
        if (v !== 'remove') {
          const [f] = await pickFiles(v);
          if (!f) break;
          try { next = await storePhoto(f, 400); } catch (err) { toast(t('save_err')); break; }
        }
        if (cur) await deletePhoto(cur);
        if (cloudUser) await saveProfile({ avatar_url: next });
        else { settings.avatar = next; saveSettings(); }
        renderTab(); break;
      }
      case 'export': exportBackup(); break;
      case 'import': importBackup(); break;
    }
  });

  document.addEventListener('input', e => {
    if (e.target.id === 'q') {
      state.query = e.target.value;
      clearTimeout(bindEvents._q);
      bindEvents._q = setTimeout(() => {
        // re-render results only, keeping focus in the search field
        const tmp = document.createElement('div');
        tmp.innerHTML = homeView();
        $('#home-results').replaceWith(tmp.querySelector('#home-results'));
        const clearBtn = document.querySelector('.search-clear');
        if (state.query && !clearBtn) e.target.insertAdjacentHTML('afterend', `<button class="search-clear" data-action="clear-q" aria-label="Clear">${I.x}</button>`);
        if (!state.query && clearBtn) clearBtn.remove();
        hydratePhotos($('#home-results'));
      }, 120);
    }
    if (e.target.id === 'scale') {
      settings.scale = SCALES[Number(e.target.value)]; saveSettings(); applyAppearance();
    }
    if (e.target.id === 'show-author') saveProfile({ show_author: e.target.checked });
    if (e.target.id === 'profile-name') {
      if (auth.mode === 'user') {
        clearTimeout(bindEvents._n);
        bindEvents._n = setTimeout(() => saveProfile({ display_name: e.target.value.trim() }), 600);
      } else { settings.name = e.target.value; saveSettings(); }
    }
    if (e.target.id === 'ai-code') { settings.aiCode = e.target.value.trim(); saveSettings(); }
  });
  document.addEventListener('keydown', e => {
    if (e.target.id === 'q' && e.key === 'Enter') e.target.blur();
    if (e.target.id === 'display-name' && e.key === 'Enter') $('[data-action="save-name"]').click();
    if (e.key === 'Escape' && !$('#sheet-root').firstChild && !$('#auth-root').firstChild) popPage();
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyAppearance);
}

/* ---------------- Servings scaling ---------------- */
const baseServings = r => { const m = String(r.servings || '').match(/\d+/); return m ? Math.max(1, parseInt(m[0], 10)) : null; };
const FRAC_CHARS = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875 };
function fmtQty(x) {
  if (x >= 10) return String(Math.round(x));
  const whole = Math.floor(x + 1e-9);
  const frac = x - whole;
  const marks = [[0, ''], [0.125, '⅛'], [0.25, '¼'], [1 / 3, '⅓'], [0.375, '⅜'], [0.5, '½'], [0.625, '⅝'], [2 / 3, '⅔'], [0.75, '¾'], [0.875, '⅞'], [1, '']];
  let best = null;
  for (const m of marks) if (Math.abs(frac - m[0]) < 0.06 && (!best || Math.abs(frac - m[0]) < Math.abs(frac - best[0]))) best = m;
  if (best) {
    const w = whole + (best[0] === 1 ? 1 : 0);
    return best[1] ? (w ? `${w}${best[1]}` : best[1]) : String(w || 0);
  }
  return String(Math.round(x * 10) / 10).replace('.', ',');
}
// Multiplies the quantities in an ingredient line. Text in (parentheses), percentages, temperatures and times are left alone.
const QTY_RE = /\([^)]*\)|(\d+)\s*-\s*([½¼¾⅓⅔⅛⅜⅝⅞])|(\d+)\s+(\d+)\/(\d+)|(\d+)\/(\d+)|(\d+)\s*([½¼¾⅓⅔⅛⅜⅝⅞])|([½¼¾⅓⅔⅛⅜⅝⅞])|(\d+(?:[.,]\d+)?)(?!\d)(?!\s*(?:%|°|мин|минути|час|часа|см\b|cm\b|mm\b|мм\b|сек))/g;
const PLURALS = [[/малка глава/g, 'малки глави'], [/голяма глава/g, 'големи глави'], [/(?<!\p{L})глава(?!\p{L})/gu, 'глави'], [/(?<!\p{L})яйце(?!\p{L})/gu, 'яйца'], [/(?<!\p{L})скилидка(?!\p{L})/gu, 'скилидки']];
function scaleLine(line, f) {
  if (!f || Math.abs(f - 1) < 1e-9) return line;
  const out = scaleNumbers(line, f);
  return f > 1 ? PLURALS.reduce((s, [re, to]) => s.replace(re, to), out) : out;
}
function scaleNumbers(line, f) {
  return line.replace(QTY_RE, (m, a1, a2, b1, b2, b3, c1, c2, d1, d2, e1, g1) => {
    if (m[0] === '(') return m;
    let v;
    if (a1 !== undefined) v = +a1 + FRAC_CHARS[a2];
    else if (b1 !== undefined) v = +b1 + (+b2) / (+b3);
    else if (c1 !== undefined) v = (+c1) / (+c2);
    else if (d1 !== undefined) v = +d1 + FRAC_CHARS[d2];
    else if (e1 !== undefined) v = FRAC_CHARS[e1];
    else v = parseFloat(g1.replace(',', '.'));
    return fmtQty(v * f);
  });
}

/* ---------------- Delete (hidden + captcha) ---------------- */
const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function confirmCaptcha(title, message, confirmLabel) {
  return new Promise(resolve => {
    const code = Array.from({ length: 5 }, () => CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)]).join('');
    const root = $('#sheet-root');
    root.innerHTML = `<div class="backdrop"></div><div class="dialog" role="dialog" aria-modal="true">
      <h3>${esc(title)}</h3><p>${esc(message)}</p>
      <div class="captcha" aria-hidden="true">${[...code].map(c => `<i style="transform:rotate(${Math.round(Math.random() * 24 - 12)}deg) translateY(${Math.round(Math.random() * 6 - 3)}px)">${c}</i>`).join('')}</div>
      <label class="hint" for="cap-in" style="margin:6px 0 4px">${esc(t('captcha_ask'))}</label>
      <input id="cap-in" class="field" autocomplete="off" autocapitalize="characters" maxlength="5" style="text-align:center;letter-spacing:.3em;font-weight:700;border-radius:12px;box-shadow:inset 0 0 0 1px var(--line)">
      <div class="dialog-actions"><button class="btn" data-cap="cancel">${esc(t('cancel'))}</button>
        <button class="btn danger" data-cap="ok" disabled>${esc(confirmLabel)}</button></div></div>`;
    const input = $('#cap-in', root), ok = $('[data-cap="ok"]', root);
    const close = v => { root.innerHTML = ''; resolve(v); };
    input.addEventListener('input', () => { ok.disabled = input.value.trim().toUpperCase() !== code; });
    input.addEventListener('keydown', e => { if (e.key === 'Enter' && !ok.disabled) close(true); });
    root.querySelector('.backdrop').onclick = () => close(false);
    $('[data-cap="cancel"]', root).onclick = () => close(false);
    ok.onclick = () => { if (!ok.disabled) close(true); };
    setTimeout(() => input.focus(), 120);
  });
}
// What "delete" means depends on whose recipe it is.
function deleteKind(r) {
  if (isMine(r)) return 'delete';
  if (r.seed && isAdmin) return 'global';
  return 'hide';
}
async function deleteFlow(r) {
  const kind = deleteKind(r);
  const ok = await confirmCaptcha(t('del_title_' + kind), t('del_msg_' + kind), t('del_btn_' + kind));
  if (!ok) return false;
  try {
    if (kind === 'delete') await removeRecipe(r);
    else if (kind === 'global') { await cloud.removeGlobal(r.id); removed.add(r.id); compose(); }
    else { await setState(r, { hidden: true }); compose(); }
  } catch (e) { toast(t('save_err')); return false; }
  while (state.pages.length) popPage();
  renderTab();
  toast(t(kind === 'hide' ? 'hidden_done' : 'deleted'));
  return true;
}
async function restoreHidden() {
  const ids = Object.keys(states).filter(id => states[id] && states[id].hidden);
  for (const id of ids) {
    states[id] = Object.assign({}, states[id], { hidden: false });
    if (auth.mode === 'user') { try { await cloud.saveState(id, states[id]); } catch (e) {} }
  }
  try { await DB.put('kv', states, 'states:' + stateKey()); } catch (e) {}
  compose(); renderTab(); toast(t('restored_n', ids.length));
}

/* ---------------- Cook timer with alarm ---------------- */
const timer = { endAt: 0, total: 0, running: false, paused: 0, ringing: false };
let audioCtx = null, ringTimer = null, tickTimer = null;
const TIMER_KEY = 'chocho.timer';
function saveTimer() { try { localStorage.setItem(TIMER_KEY, JSON.stringify({ endAt: timer.endAt, total: timer.total, running: timer.running, paused: timer.paused })); } catch (e) {} }
function loadTimer() { try { Object.assign(timer, JSON.parse(localStorage.getItem(TIMER_KEY) || '{}')); } catch (e) {} }
const timerLeft = () => timer.running ? Math.max(0, timer.endAt - Date.now()) : timer.paused;
const fmtTime = ms => { const s = Math.ceil(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s % 60).padStart(2, '0'); };
// A pleasant bell chime (rising G-B-D-G arpeggio, soft overtones, gentle decay) generated as a WAV file.
// It is played through a normal <audio> element: on iPhone that keeps sounding with the silent switch on,
// unlike the Web Audio API.
let alarmAudio = null, fallbackTimer = null;
function buildAlarmWav() {
  const rate = 22050, secs = 3.4, n = Math.floor(rate * secs);
  const mix = new Float32Array(n);
  const notes = [[783.99, 0], [987.77, 0.3], [1174.66, 0.6], [1567.98, 0.9]];
  const partials = [[1, 1], [2, 0.32], [3, 0.12], [4.2, 0.05]];
  for (const [f, t0] of notes) {
    const start = Math.floor(t0 * rate);
    for (let i = 0; start + i < n; i++) {
      const tt = i / rate, env = Math.min(1, tt / 0.006) * Math.exp(-tt * 2.8);
      if (tt > 0.05 && env < 0.0008) break; // (env is 0 at t=0 because of the attack ramp)
      let s = 0;
      for (const [m, a] of partials) s += a * Math.sin(2 * Math.PI * f * m * tt);
      mix[start + i] += s * env * 0.34;
    }
  }
  const buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, mix[i])) * 32767, true);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}
function getAlarmAudio() {
  if (!alarmAudio) { alarmAudio = new Audio(buildAlarmWav()); alarmAudio.preload = 'auto'; alarmAudio.loop = true; }
  return alarmAudio;
}
// Must run inside a tap: browsers only let a page play sound later if it was "unlocked" by a user gesture.
function unlockAudio() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) {}
  try {
    const a = getAlarmAudio();
    a.muted = true;
    const p = a.play();
    if (p && p.then) p.then(() => { a.pause(); a.currentTime = 0; a.muted = false; }).catch(() => { a.muted = false; });
  } catch (e) {}
}
function beep(freq = 880, dur = 0.18, when = 0) {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain(), t0 = audioCtx.currentTime + when;
  o.type = 'sine'; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.3, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(audioCtx.destination); o.start(t0); o.stop(t0 + dur + 0.02);
}
const vibrateAlarm = () => { try { navigator.vibrate && navigator.vibrate([450, 200, 450, 200, 450]); } catch (e) {} };
function playAlarmSound(loop) {
  const a = getAlarmAudio();
  a.muted = false; a.loop = loop; a.volume = 1; a.currentTime = 0;
  const p = a.play();
  if (p && p.catch) p.catch(() => {
    // Autoplay blocked: fall back to synthesized chimes
    const chime = () => [784, 988, 1175, 1568].forEach((f, i) => beep(f, 0.5, i * 0.28));
    chime(); if (loop) fallbackTimer = setInterval(chime, 3200);
  });
}
function ring() {
  if (timer.ringing) return;
  timer.ringing = true;
  playAlarmSound(true);
  vibrateAlarm(); ringTimer = setInterval(vibrateAlarm, 3400);
  $('#alarm-root').innerHTML = `<div class="alarm"><div class="alarm-card"><div class="alarm-bell">⏰</div><h2>${esc(t('timer_done'))}</h2>
    <button class="btn primary" data-timer="stop">${esc(t('timer_stop'))}</button></div></div>`;
  renderTimer();
}
function testAlarm() {
  unlockAudio();
  setTimeout(() => {
    playAlarmSound(false); vibrateAlarm();
    setTimeout(() => { if (!timer.ringing && alarmAudio) { alarmAudio.pause(); alarmAudio.currentTime = 0; alarmAudio.loop = true; } }, 2600);
  }, 80);
  toast(t('timer_test_toast'));
}
function stopAlarm() {
  clearInterval(ringTimer); ringTimer = null; clearInterval(fallbackTimer); fallbackTimer = null; timer.ringing = false;
  if (alarmAudio) { alarmAudio.pause(); alarmAudio.currentTime = 0; alarmAudio.loop = true; }
  const a = $('#alarm-root'); if (a) a.innerHTML = '';
  try { navigator.vibrate && navigator.vibrate(0); } catch (e) {}
}
function startTimer(ms) {
  unlockAudio();
  timer.total = ms; timer.running = true; timer.endAt = Date.now() + ms; timer.paused = 0; timer.ringing = false;
  saveTimer(); startTick(); renderTimer();
}
function pauseTimer() { if (!timer.running) return; timer.paused = timerLeft(); timer.running = false; saveTimer(); renderTimer(); }
function resumeTimer() { if (timer.running || !timer.paused) return; unlockAudio(); timer.running = true; timer.endAt = Date.now() + timer.paused; saveTimer(); startTick(); renderTimer(); }
function resetTimer() { timer.running = false; timer.paused = 0; timer.endAt = 0; timer.total = 0; stopAlarm(); saveTimer(); renderTimer(); }
function addTime(ms) {
  if (timer.running) timer.endAt += ms; else timer.paused += ms;
  timer.total += ms; saveTimer(); renderTimer();
}
function startTick() { clearInterval(tickTimer); tickTimer = setInterval(tickTimerFn, 250); }
function tickTimerFn() {
  if (timer.running && Date.now() >= timer.endAt) { timer.running = false; timer.paused = 0; timer.endAt = 0; saveTimer(); ring(); }
  renderTimer();
  if (!timer.running && !timer.ringing) clearInterval(tickTimer);
}
function renderTimer() {
  const left = timerLeft(), active = timer.running || timer.paused > 0;
  document.querySelectorAll('[data-timer-display]').forEach(el => { el.textContent = active ? fmtTime(left) : '0:00'; el.classList.toggle('run', timer.running); });
  document.querySelectorAll('[data-timer-toggle]').forEach(el => { el.textContent = timer.running ? '⏸' : '▶'; el.disabled = !active; });
  document.querySelectorAll('[data-timer-reset]').forEach(el => { el.disabled = !active; });
  const pill = $('#timer-pill');
  if (pill) {
    const hide = !active || !!document.querySelector('.cook-mode');
    pill.classList.toggle('hidden', hide);
    pill.textContent = '⏱ ' + fmtTime(left);
  }
}
function handleTimerClick(b) {
  if (b.dataset.timerSet) { startTimer(Number(b.dataset.timerSet) * 60000); return; }
  switch (b.dataset.timer) {
    case 'toggle': if (timer.running) pauseTimer(); else resumeTimer(); break;
    case 'reset': resetTimer(); break;
    case 'add': unlockAudio(); addTime(60000); break;
    case 'stop': stopAlarm(); break;
    case 'test': testAlarm(); break;
    case 'custom': {
      const v = window.prompt(t('timer_custom_q'), '25');
      const m = parseFloat(String(v || '').replace(',', '.'));
      if (m > 0 && m < 1000) startTimer(Math.round(m * 60000));
      break;
    }
    case 'pill': actionSheet(t('timer_title') + ' ' + fmtTime(timerLeft()), [{ label: t('timer_cancel'), danger: true, value: true }])
      .then(v => { if (v) resetTimer(); }); break;
  }
}
function initTimer() {
  loadTimer();
  if (timer.running) {
    if (Date.now() < timer.endAt) startTick();
    else if (Date.now() - timer.endAt < 3600e3) { timer.running = false; timer.paused = 0; saveTimer(); ring(); }
    else resetTimer();
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tickTimerFn(); });
  renderTimer();
}

/* ---------------- Ratings (1–5 stars, one vote per person; overall score like Booking) ---------------- */
const rkey = (type, id) => type + ':' + id;
const statOf = (type, id) => ratingStats[rkey(type, id)] || null;
const score10 = avg => Math.round(avg * 20) / 10; // 4.3 stars -> 8.6 / 10
const fmtScore = avg => score10(avg).toFixed(1).replace('.', ',');
// Ranking: a recipe with a few perfect votes must not beat one with many good votes, so the average is pulled
// towards the overall average (Bayesian average, 3 "virtual" votes).
function weightedScore(r) {
  const st = statOf('recipe', r.id);
  if (!st || !st.count) return null;
  let sum = 0, n = 0;
  for (const [k, v] of Object.entries(ratingStats)) if (k.startsWith('recipe:')) { sum += v.avg * v.count; n += v.count; }
  const mean = n ? sum / n : 3.5, m = 3;
  return (st.count / (st.count + m)) * st.avg + (m / (st.count + m)) * mean;
}
const topRecipes = () => state.recipes.filter(r => weightedScore(r) !== null)
  .sort((a, b) => weightedScore(b) - weightedScore(a) || statOf('recipe', b.id).count - statOf('recipe', a.id).count || a.title.localeCompare(b.title, 'bg'));
const scoreLabel = avg => { const s = score10(avg); return t(s >= 9 ? 'score_exc' : s >= 8 ? 'score_top' : s >= 7 ? 'score_vgood' : s >= 6 ? 'score_good' : s >= 5 ? 'score_ok' : 'score_bad'); };
const ratingsOn = () => auth.mode !== 'local';
function canRate(type, id) {
  if (auth.mode !== 'user') return false;
  return type === 'recipe' || id !== auth.user.id; // any recipe (also your own); not yourself as a user
}
function scoreHTML(type, id) {
  const st = statOf(type, id);
  if (!st || !st.count) return `<div class="score none"><span class="score-text"><small>${esc(t('rating_none'))}</small></span></div>`;
  return `<div class="score"><span class="score-badge">${fmtScore(st.avg)}</span>
    <span class="score-text"><b>${esc(scoreLabel(st.avg))}</b><small>${esc(t('rating_votes', st.count))}</small></span></div>`;
}
function starsHTML(type, id) {
  const mine = myRatings[rkey(type, id)] || 0;
  return `<div class="stars-input" data-rate-type="${type}" data-rate-id="${esc(id)}" role="group" aria-label="${esc(t('your_rating'))}">
    ${[1, 2, 3, 4, 5].map(n => `<button data-stars="${n}" class="${n <= mine ? 'on' : ''}" aria-label="${n}">★</button>`).join('')}</div>`;
}
function ratingBoxHTML(type, id) {
  let vote;
  if (auth.mode === 'guest') vote = `<div class="rate-row"><span>${esc(t('your_rating'))}</span>${starsHTML(type, id)}</div>`;
  else if (canRate(type, id)) vote = `<div class="rate-row"><span>${esc(t('your_rating'))}</span>${starsHTML(type, id)}</div>`;
  else vote = `<small class="muted">${esc(t(type === 'user' ? 'rate_self' : 'rate_own'))}</small>`;
  return `<div class="rating-box">${scoreHTML(type, id)}${vote}</div>`;
}
// Saves my vote (tapping my own star again removes it) and keeps the totals in sync without a reload.
async function setRating(type, id, stars) {
  if (auth.mode === 'guest') { promptLogin(); return false; }
  if (!canRate(type, id)) return false;
  const k = rkey(type, id), prev = myRatings[k] || 0;
  const st = ratingStats[k] || { avg: 0, count: 0 };
  let sum = st.avg * st.count, count = st.count;
  try {
    if (prev === stars) {
      await cloud.unrate(type, id); delete myRatings[k]; sum -= prev; count--; toast(t('rate_removed'));
    } else {
      await cloud.rate(type, id, stars); myRatings[k] = stars; sum += stars - prev; if (!prev) count++; toast(t('rate_thanks'));
    }
  } catch (e) { toast(t('save_err')); return false; }
  if (count > 0) ratingStats[k] = { avg: sum / count, count }; else delete ratingStats[k];
  try { await DB.put('kv', myRatings, 'myRatings:' + stateKey()); } catch (e) {}
  return true;
}
function refreshAfterRating() {
  const top = topPage();
  if (top && top.el.querySelector('.detail')) refreshDetail(byId(top.el.querySelector('.detail').dataset.id));
  else if (top && top.el.dataset.userId) renderUserBody(top.el);
  renderTab();
}

/* ----- User profile page ----- */
function userBodyHTML(u) {
  const recipes = state.recipes.filter(r => r.owner === u.id && r.visibility !== 'private');
  return `<div class="user-head">
      <span class="avatar big">${u.avatar ? imgTag(u.avatar, '', false) : esc((u.name || '?').charAt(0).toUpperCase())}</span>
      <h2>${esc(u.name || '')}</h2>
    </div>
    ${ratingBoxHTML('user', u.id)}
    <div class="section-head"><h2>${esc(t('user_recipes', recipes.length))}</h2></div>
    ${recipes.length ? `<div class="grid">${recipes.map(card).join('')}</div>` : ''}`;
}
function renderUserBody(el) {
  const u = el._user;
  $('.user-body', el).innerHTML = userBodyHTML(u);
  hydratePhotos(el);
}
function openUserPage(u) {
  const el = pushPage(`<div class="navbar">
      <button class="nav-btn" data-action="back">${esc(t('close'))}</button>
      <h1>${esc(t('user_title'))}</h1><span style="width:60px"></span>
    </div><div class="form user-body"></div>`, { modal: true });
  el.dataset.userId = u.id; el._user = u;
  renderUserBody(el);
  if (cloudOn() && sb && !u.avatar) {
    cloud.profilesByIds([u.id]).then(m => {
      const p = m[u.id];
      if (p && el.isConnected) { u.name = p.display_name || u.name; u.avatar = p.avatar_url || null; renderUserBody(el); }
    }).catch(() => {});
  }
}

/* ---------------- Send a recipe to another user / manage friends ---------------- */
const personRow = (p, { fav, action, label, cls = '', chat = false }) => `<div class="person" data-uid="${esc(p.id)}">
  <button class="person-main" data-person="profile">
    <span class="avatar">${p.avatar_url ? imgTag(p.avatar_url, '', false) : esc((p.display_name || '?').charAt(0).toUpperCase())}</span>
    <b>${esc(p.display_name || '')}</b>${(statOf('user', p.id) || {}).count ? `<span class="mini-score">${fmtScore(statOf('user', p.id).avg)}</span>` : ''}
  </button>
  ${chat ? `<button class="star" data-person="chat" aria-label="Chat" title="Chat">💬</button>` : ''}
  ${fav === undefined ? '' : `<button class="star ${fav ? 'on' : ''}" data-person="star" aria-label="${esc(t('friend_toggle'))}" title="${esc(t('friend_toggle'))}">${fav ? '★' : '☆'}</button>`}
  ${action ? `<button class="btn ${cls}" style="width:auto;height:36px;padding:0 14px" data-person="${action}">${esc(label)}</button>` : ''}</div>`;

// r = the recipe to send; null = only manage the friends list.
function openPeoplePage(r) {
  let timerId = null, sent = [], found = [];
  const isFriend = id => friends.some(f => f.id === id);
  const hint = !r ? t('friends_hint') : r.visibility === 'private' ? t('share_hint_private') : t('share_hint_public');
  const el = pushPage(`<div class="navbar">
      <button class="nav-btn" data-action="back">${esc(t('close'))}</button>
      <h1>${r ? '📤 ' + esc(t('share_title')) : '👥 ' + esc(t('friends_title'))}</h1><span style="width:60px"></span>
    </div>
    <div class="form">
      ${r ? `<p class="muted" style="margin:10px 4px 4px"><b>${esc(r.title)}</b></p>` : ''}
      <p class="hint" style="margin:${r ? '0' : '10px'} 4px 12px">${esc(hint)}</p>
      <div class="group"><label class="search-field" style="border-radius:0;background:transparent">${I.search}
        <input id="pp-q" type="search" autocomplete="off" placeholder="${esc(t('share_search_ph'))}"></label></div>
      <div id="pp-results" class="people"></div>
      <div class="group-label">⭐ ${esc(t('friends_title'))}</div>
      <div id="pp-friends" class="people"></div>
      ${r ? `<div class="group-label">${esc(t('share_with'))}</div><div id="pp-sent" class="people"></div>` : ''}
    </div>`, { modal: true });
  const $r = $('#pp-results', el), $f = $('#pp-friends', el), $s = r ? $('#pp-sent', el) : null;
  const known = id => friends.find(p => p.id === id) || found.find(p => p.id === id) || sent.find(p => p.id === id);
  const drawFriends = () => {
    $f.innerHTML = friends.length
      ? friends.map(p => personRow(p, r && !sent.some(s => s.id === p.id) ? { fav: true, chat: true, action: 'send', label: t('share_send'), cls: 'primary' } : { fav: true, chat: true })).join('')
      : `<p class="hint">${esc(t('friends_empty'))}</p>`;
    hydratePhotos($f);
  };
  const drawSent = () => {
    if (!$s) return;
    $s.innerHTML = sent.length ? sent.map(p => personRow(p, { action: 'unsend', label: t('share_remove'), cls: 'danger' })).join('')
      : `<p class="hint">${esc(t('share_nobody'))}</p>`;
    hydratePhotos($s);
  };
  const drawResults = () => {
    const q = $('#pp-q', el).value.trim();
    if (q.length < 2) { $r.innerHTML = q ? `<p class="hint">${esc(t('share_min'))}</p>` : ''; return; }
    const rows = found.filter(p => !(r && sent.some(s => s.id === p.id)));
    $r.innerHTML = rows.length
      ? rows.map(p => personRow(p, Object.assign({ fav: isFriend(p.id) }, r ? { action: 'send', label: t('share_send'), cls: 'primary' } : {}))).join('')
      : `<p class="hint">${esc(t('share_none'))}</p>`;
    hydratePhotos($r);
  };
  const redraw = () => { drawFriends(); drawSent(); drawResults(); };
  if (r) cloud.listShares(r.id).then(s => { sent = s; redraw(); }).catch(() => toast(t('save_err')));
  redraw();

  const search = async () => {
    const q = $('#pp-q', el).value;
    if (q.trim().length >= 2) { try { found = await cloud.searchUsers(q); } catch (e) { toast(t('save_err')); found = []; } }
    drawResults();
  };
  el.addEventListener('input', e => { if (e.target.id === 'pp-q') { clearTimeout(timerId); timerId = setTimeout(search, 250); } });
  el.addEventListener('click', async e => {
    const b = e.target.closest('[data-person]');
    if (!b) return;
    const id = b.closest('.person').dataset.uid, p = known(id);
    if (b.dataset.person === 'chat') { popPage(); setTimeout(() => openConversation(id, { recipeId: r ? r.id : null }), 280); return; }
    if (b.dataset.person === 'profile') { openUserPage({ id, name: p.display_name, avatar: p.avatar_url }); return; }
    try {
      if (b.dataset.person === 'star') {
        if (isFriend(id)) { await cloud.removeFriend(id); friends = friends.filter(f => f.id !== id); }
        else { await cloud.addFriend(id); friends.push(p); toast(t('friend_added', p.display_name)); }
      } else if (b.dataset.person === 'send') {
        await cloud.share(r.id, id); sent.push(p); toast(t('share_done', p.display_name));
      } else if (b.dataset.person === 'unsend') {
        await cloud.unshare(r.id, id); sent = sent.filter(x => x.id !== id); toast(t('share_removed'));
      }
      redraw();
    } catch (err) { toast(t('save_err')); }
  });
  setTimeout(() => $('#pp-q', el).focus(), 350);
}
const openSharePage = openPeoplePage;

/* ---------------- Login prompt ---------------- */
async function promptLogin() {
  const v = await actionSheet(t('login_prompt'), [{ label: t('login'), value: true }]);
  if (v) openAuth({ view: 'signin' });
}

/* ---------------- Boot ---------------- */
(async function boot() {
  applyAppearance();
  bindEvents();
  captureInviteFromUrl();
  bindAuthEvents();
  bindChatEvents();
  initTimer();
  try { await initCloud(); await loadData(); }
  catch (e) {
    $('#tabs-root').innerHTML = `<div class="view"><div class="empty"><div class="big">⚠️</div><h3>Error</h3><p>${esc(e.message || e)}</p></div></div>`;
    return;
  }
  renderTab();
  // First visit (or after signing out): ask to sign in. "Continue as guest" is remembered.
  loadInviteInfo();
  if (auth.mode === 'guest' && (!guestChosen() || pendingInvite())) openAuth({ view: pendingInvite() ? 'signup' : 'signin', dismissible: !!guestChosen() && !pendingInvite() });
  // Pick up recipes other people published while the app was in the background.
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', async () => {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    if (auth.mode !== 'local' && hiddenAt && Date.now() - hiddenAt > 120000 && !state.pages.length) { await loadUserData(); renderTab(); }
  });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
