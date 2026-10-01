/* Rifay Umami — recipe book (PWA, no build step). */
'use strict';

const APP_VERSION = '1.2.0';
// Bump when recipes.json changes so installed apps pick up the corrected recipes.
const SEED_VERSION = 2;

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
async function storePhoto(file, max) {
  const blob = await compressImage(file, max);
  const id = uid('p');
  await DB.put('photos', { id, blob, created: Date.now() });
  return 'idb:' + id;
}
async function deletePhoto(ref) {
  if (!ref || !ref.startsWith('idb:')) return;
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

/* ---------------- State ---------------- */
const state = {
  recipes: [],
  tab: 'home',
  query: '',
  cat: null,
  coll: null,
  pages: [],
};
const byId = id => state.recipes.find(r => r.id === id);

async function loadData() {
  await DB.open();
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
  const seeded = await DB.get('kv', 'seedVersion');
  if (!seeded) {
    const seed = await fetch('recipes.json').then(r => r.json());
    const now = Date.now();
    await DB.putMany('recipes', seed.map((r, i) => normalizeSeed(r, now - (seed.length - i) * 1000)));
    await DB.put('kv', SEED_VERSION, 'seedVersion');
  } else if (seeded < SEED_VERSION) {
    await upgradeSeed();
    await DB.put('kv', SEED_VERSION, 'seedVersion');
  }
  state.recipes = await DB.all('recipes');
  state.recipes.forEach(indexRecipe);
}
function normalizeSeed(r, created) {
  return {
    id: r.id, title: r.title, collection: r.collection, categories: r.categories || [],
    source: r.source || null, tried: r.tried === true, ingredients: r.ingredients || [], steps: r.steps || '',
    notes: r.notes || '', links: r.links || [], images: r.images || [], favorite: false,
    time: r.time || '', servings: r.servings || '', createdAt: created, updatedAt: created, seed: true,
  };
}
// Refresh original recipes with corrected content. Keeps favorites, "tried" marks and the
// user's own photos; skips recipes the user edited or deleted.
async function upgradeSeed() {
  const seed = await fetch('recipes.json', { cache: 'no-store' }).then(r => r.json());
  const have = new Map((await DB.all('recipes')).map(r => [r.id, r]));
  const updates = [];
  for (const s of seed) {
    const cur = have.get(s.id);
    if (!cur || cur.edited) continue;
    const fresh = normalizeSeed(s, cur.createdAt);
    updates.push(Object.assign(cur, {
      title: fresh.title, collection: fresh.collection, categories: fresh.categories, source: fresh.source,
      ingredients: fresh.ingredients, steps: fresh.steps, notes: fresh.notes, links: fresh.links,
      time: fresh.time || cur.time || '', servings: fresh.servings || cur.servings || '',
      images: [...fresh.images, ...(cur.images || []).filter(i => i.startsWith('idb:'))],
      tried: cur.tried || fresh.tried,
    }));
  }
  if (updates.length) await DB.putMany('recipes', updates);
}
async function saveRecipe(r) {
  r.updatedAt = Date.now();
  const clean = Object.fromEntries(Object.entries(r).filter(([k]) => !k.startsWith('_')));
  await DB.put('recipes', clean);
  indexRecipe(r);
  const i = state.recipes.findIndex(x => x.id === r.id);
  if (i >= 0) state.recipes[i] = r; else state.recipes.push(r);
}
async function removeRecipe(r) {
  for (const ref of r.images || []) await deletePhoto(ref);
  await DB.del('recipes', r.id);
  state.recipes = state.recipes.filter(x => x.id !== r.id);
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
      <span class="fav-dot ${r.favorite ? 'on' : ''}" data-fav="${esc(r.id)}">${I.heart}</span>
    </div>
    <div class="card-body">
      <div class="card-title">${esc(r.title)}</div>
      <div class="card-meta">${c.emoji} ${esc(catName(c.id))} · ${esc(collName(r.collection))}</div>
    </div>
  </button>`;
}
function sorted(list) {
  const s = settings.sort;
  const a = [...list];
  if (s === 'new') a.sort((x, y) => y.createdAt - x.createdAt);
  else if (s === 'tried') a.sort((x, y) => (y.tried - x.tried) || x.title.localeCompare(y.title, 'bg'));
  else a.sort((x, y) => x.title.localeCompare(y.title, 'bg'));
  return a;
}
function greeting() {
  const h = new Date().getHours();
  return t(h < 11 ? 'morning' : h < 18 ? 'day' : 'evening');
}
function avatarHTML() {
  if (settings.avatar) return `<span class="avatar">${imgTag(settings.avatar, '', false)}</span>`;
  const name = (settings.name || '').trim();
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
  else root.innerHTML = settingsView();
  hydratePhotos(root);
}

function filtered() {
  let list = state.recipes;
  if (state.cat) list = list.filter(r => (r.categories || []).includes(state.cat));
  if (state.coll) list = list.filter(r => r.collection === state.coll);
  const q = state.query.trim();
  if (q) {
    const terms = buildTerms(q);
    return list.map(r => [r, searchScore(r, terms)]).filter(x => x[1] > 0)
      .sort((a, b) => b[1] - a[1] || a[0].title.localeCompare(b[0].title, 'bg')).map(x => x[0]);
  }
  return sorted(list);
}

function homeView() {
  const counts = {};
  state.recipes.forEach(r => (r.categories || []).forEach(c => { counts[c] = (counts[c] || 0) + 1; }));
  const collCounts = {};
  state.recipes.forEach(r => { collCounts[r.collection] = (collCounts[r.collection] || 0) + 1; });
  const filtering = state.query.trim() || state.cat || state.coll;
  const list = filtered();

  let body = '';
  if (!filtering) {
    const tried = state.recipes.filter(r => r.tried && (r.images || []).length);
    const recent = [...state.recipes].sort((a, b) => b.createdAt - a.createdAt).filter(r => !r.seed).slice(0, 10);
    body += `<button class="surprise" data-action="roulette"><span class="wheel-mini">${miniWheelSVG()}</span><span><b>${esc(t('surprise'))}</b><span>${esc(t('surprise_sub'))}</span></span><span class="go">${I.ext}</span></button>`;
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
      <button data-tab-go="settings" aria-label="Profile">${avatarHTML()}</button>
    </div>
    <div class="greeting" style="margin-top:14px">${esc(greeting())} 👋</div>
    <h1 class="large-title">${esc(t('home_title'))}</h1>
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
      <button class="chip small ${!state.coll ? 'active' : ''}" data-coll="">${esc(t('all'))}</button>
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
      ${COLLECTIONS.filter(c => collCounts[c.id]).map((c, i) => `<button class="tile" style="--h:${[20, 280, 38, 160][i]}" data-go-coll="${c.id}">
        <b>${esc(c[settings.lang])}</b><span>${esc(t('recipes_n', collCounts[c.id]))}</span><div class="emo">${c.emoji}</div></button>`).join('')}
    </div>
  </section>`;
}

function favoritesView() {
  const list = sorted(state.recipes.filter(r => r.favorite));
  return `<section class="view">
    <div class="topbar"><div class="greeting">${esc(t('recipes_n', list.length))}</div></div>
    <h1 class="large-title">${esc(t('fav_title'))} ❤️</h1>
    ${list.length ? `<div class="grid">${list.map(card).join('')}</div>` :
      `<div class="empty"><div class="big">🤍</div><h3>${esc(t('fav_empty'))}</h3><p>${esc(t('fav_empty_sub'))}</p></div>`}
  </section>`;
}

function settingsView() {
  const n = state.recipes.length, f = state.recipes.filter(r => r.favorite).length, tr = state.recipes.filter(r => r.tried).length;
  const scaleIdx = Math.max(0, SCALES.indexOf(Number(settings.scale)));
  const seg = (key, opts) => `<div class="segmented">${opts.map(([v, label]) =>
    `<button class="${settings[key] === v ? 'active' : ''}" data-set="${key}" data-val="${v}">${esc(label)}</button>`).join('')}</div>`;
  return `<section class="view">
    <h1 class="large-title" style="margin-top:8px">${esc(t('settings'))}</h1>
    <div class="profile-card">
      <button data-action="avatar">${avatarHTML()}</button>
      <div style="flex:1;min-width:0">
        <input id="profile-name" value="${esc(settings.name)}" placeholder="${esc(t('your_name'))}" maxlength="40">
        <small>${esc(t('personal'))}</small>
      </div>
    </div>
    <div class="stats">
      <div class="stat"><b>${n}</b><span>${esc(t('st_recipes'))}</span></div>
      <div class="stat"><b>${f}</b><span>${esc(t('st_fav'))}</span></div>
      <div class="stat"><b>${tr}</b><span>${esc(t('st_tried'))}</span></div>
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

    <div class="group-label">${esc(t('data'))}</div>
    <div class="group">
      <button class="row row-btn" data-action="export"><span class="lbl"><span class="ic" style="background:#2FA36B">⬆︎</span>${esc(t('export'))}</span></button>
      <button class="row row-btn" data-action="import"><span class="lbl"><span class="ic" style="background:#3A7BF2">⬇︎</span>${esc(t('import'))}</span></button>
      <button class="row row-btn" data-action="restore-seed"><span class="lbl"><span class="ic" style="background:#E8552F">↺</span>${esc(t('restore_seed'))}</span></button>
    </div>
    <p class="hint">${esc(t('storage_hint'))}</p>
    <p class="footer-note">👨‍🍳 ${esc(t('about'))} ${APP_VERSION}<br>${esc(t('install_hint'))}</p>
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

function detailHTML(r, tabSel = 'ing') {
  const imgs = r.images || [];
  const cats = (r.categories || []).map(c => `<span class="pill">${CAT[c]?.emoji || ''} ${esc(catName(c))}</span>`).join('');
  const hasIng = (r.ingredients || []).length > 0;
  const steps = String(r.steps || '').trim();
  const paras = steps ? steps.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean) : [];
  const stepsHTML = !steps ? `<p class="muted">${esc(t('no_method'))}</p>` :
    paras.length > 1 ? `<div class="steps">${paras.map(p => `<div class="step">${linkify(esc(p)).replace(/\n/g, '<br>')}</div>`).join('')}</div>` :
      `<div class="prose">${linkify(esc(steps))}</div>`;
  const isSub = x => x.startsWith('## ') || (x.length < 60 && /:\s*$/.test(x));
  const ingHTML = hasIng ? `<ul class="ing-list">${r.ingredients.map((x, i) => isSub(x)
    ? `<li class="sub">${esc(x.replace(/^## /, '').replace(/:\s*$/, ''))}</li>`
    : `<li data-ing="${i}"><span class="tick">${I.check}</span><span>${esc(x)}</span></li>`).join('')}</ul>` :
    `<p class="muted">${esc(t('no_ingredients'))}</p>`;
  const meta = [
    r.time ? `<span class="pill">⏱ ${esc(r.time)}</span>` : '',
    r.servings ? `<span class="pill">🍽 ${esc(r.servings)} ${esc(t('servings'))}</span>` : '',
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
          <button class="glass" data-action="recipe-menu" aria-label="More">${I.more}</button>
        </div>
      </div>
    </div>
    <div class="sheet-body">
      <h1 class="detail-title">${esc(r.title)}</h1>
      <div class="meta-row">
        <span class="pill accent">${COLL[r.collection]?.emoji || ''} ${esc(collName(r.collection))}</span>
        ${r.tried ? `<span class="pill ok">✓ ${esc(t('tried'))}</span>` : ''}
        ${r.source ? `<span class="pill">✍️ ${esc(r.source)}</span>` : ''}
        ${meta}${cats}
      </div>
      <div class="quick-actions">
        <button class="qa ${r.tried ? 'on' : ''}" data-action="toggle-tried">${I.check}<span>${esc(t('tried'))}</span></button>
        <button class="qa" data-action="cook">${I.flame}<span>${esc(t('cook'))}</span></button>
        <button class="qa" data-action="share">${I.share}<span>${esc(t('share'))}</span></button>
      </div>
      <div class="segmented">
        <button class="${tabSel === 'ing' ? 'active' : ''}" data-dtab="ing">${esc(t('ingredients'))}${hasIng ? ` · ${r.ingredients.filter(x => !isSub(x)).length}` : ''}</button>
        <button class="${tabSel === 'method' ? 'active' : ''}" data-dtab="method">${esc(t('method'))}</button>
      </div>
      <div data-dpane="ing" class="${tabSel === 'ing' ? '' : 'hidden'}">${ingHTML}</div>
      <div data-dpane="method" class="${tabSel === 'method' ? '' : 'hidden'}">${stepsHTML}</div>
      ${r.notes ? `<div class="notes-box"><h4>📝 ${esc(t('notes'))}</h4><div class="prose">${linkify(esc(r.notes))}</div></div>` : ''}
      ${videosHTML(r)}
      ${otherLinks(r).length ? `<h3 class="block-title">${esc(t('links'))}</h3><div class="links">${otherLinks(r).map(linkCard).join('')}</div>` : ''}
    </div>
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
function refreshDetail(r) {
  const p = topPage();
  if (!p) return;
  const cur = p.el.querySelector('[data-dtab].active')?.dataset.dtab || 'ing';
  const scroll = p.el.scrollTop;
  const cook = p.el.classList.contains('cook-mode');
  const done = [...p.el.querySelectorAll('[data-ing].done')].map(li => li.dataset.ing);
  p.el.innerHTML = detailHTML(r, cur);
  if (cook) p.el.classList.add('cook-mode');
  done.forEach(i => p.el.querySelector(`[data-ing="${i}"]`)?.classList.add('done'));
  p.el.scrollTop = scroll;
  hydratePhotos(p.el);
  bindGallery(p.el);
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
  })) : {
    title: '', images: [], categories: state.cat ? [state.cat] : [], collection: 'mine', ingredients: [], steps: '', notes: '',
    links: [], tried: false, time: '', servings: '',
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
      const r = existing || { id: uid('r'), createdAt: Date.now(), favorite: false, source: null, seed: false };
      Object.assign(r, d, { edited: true });
      await saveRecipe(r);
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
      if (ref && ref.startsWith('idb:')) (added.includes(ref) ? deletePhoto(ref) : removed.push(ref));
      rerenderPhotos();
      return;
    }
    if (b.dataset.pickCat) {
      const c = b.dataset.pickCat;
      d.categories = d.categories.includes(c) ? d.categories.filter(x => x !== c) : [...d.categories, c];
      b.classList.toggle('active');
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
      const ok = await actionSheet(t('delete_q') + ' ' + t('delete_sub'), [{ label: t('delete'), danger: true, value: true }]);
      if (!ok) return;
      saved = true;
      added.forEach(deletePhoto);
      await removeRecipe(existing);
      popPage();
      setTimeout(() => { popPage(); renderTab(); toast(t('deleted')); }, 120);
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
    { label: t('add_ai'), value: 'ai' },
    { label: t('add_ai_photo'), value: 'ai-photo' },
    { label: t('add_manual'), value: 'manual' },
  ]);
  if (v === 'manual') openEditor(null);
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
  const out = { app: 'chocho-recipes', version: 1, exportedAt: new Date().toISOString(), settings, recipes, photos: [] };
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
      await DB.putMany('recipes', data.recipes);
      state.recipes = await DB.all('recipes');
      state.recipes.forEach(indexRecipe);
      renderTab();
      toast(t('import_done', data.recipes.length));
    } catch (e) { toast(t('import_err')); }
  };
  input.click();
}
async function restoreSeed() {
  const seed = await fetch('recipes.json').then(r => r.json());
  const have = new Set(state.recipes.map(r => r.id));
  const missing = seed.filter(r => !have.has(r.id)).map((r, i) => normalizeSeed(r, Date.now() - 1e9 + i));
  if (missing.length) {
    await DB.putMany('recipes', missing);
    missing.forEach(r => { indexRecipe(r); state.recipes.push(r); });
  }
  renderTab();
  toast(t('restore_done', missing.length));
}

/* ---------------- Events ---------------- */
function bindEvents() {
  document.addEventListener('click', async e => {
    const favBtn = e.target.closest('[data-fav]');
    if (favBtn) {
      e.stopPropagation();
      const r = byId(favBtn.dataset.fav);
      r.favorite = !r.favorite; haptic();
      await saveRecipe(r);
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
    if (collBtn) { state.coll = collBtn.dataset.coll || null; renderTab(); return; }
    const goCat = e.target.closest('[data-go-cat]');
    if (goCat) { state.cat = goCat.dataset.goCat; state.coll = null; state.query = ''; state.tab = 'home'; renderTab(); window.scrollTo(0, 0); return; }
    const goColl = e.target.closest('[data-go-coll]');
    if (goColl) { state.coll = goColl.dataset.goColl; state.cat = null; state.query = ''; state.tab = 'home'; renderTab(); window.scrollTo(0, 0); return; }

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
      case 'new-recipe': askAddMode(); break;
      case 'roulette': openRoulette(); break;
      case 'back': popPage(); break;
      case 'clear-q': state.query = ''; renderTab(); $('#q')?.focus(); break;
      case 'clear-filters': state.query = ''; state.cat = null; state.coll = null; renderTab(); break;
      case 'surprise': {
        const pool = filtered().length ? filtered() : state.recipes;
        openRecipe(pool[Math.floor(Math.random() * pool.length)].id); break;
      }
      case 'sort': {
        const v = await actionSheet(t('sort'), [
          { label: (settings.sort === 'az' ? '✓ ' : '') + t('sort_az'), value: 'az' },
          { label: (settings.sort === 'new' ? '✓ ' : '') + t('sort_new'), value: 'new' },
          { label: (settings.sort === 'tried' ? '✓ ' : '') + t('sort_tried'), value: 'tried' },
        ]);
        if (v) { settings.sort = v; saveSettings(); renderTab(); }
        break;
      }
      case 'toggle-fav':
        r.favorite = !r.favorite; haptic(); await saveRecipe(r);
        a.classList.toggle('on', r.favorite); renderTab(); break;
      case 'toggle-tried':
        r.tried = !r.tried; haptic(); await saveRecipe(r); refreshDetail(r); renderTab(); break;
      case 'cook': {
        const page = a.closest('.page');
        const on = !page.classList.contains('cook-mode');
        page.classList.toggle('cook-mode', on);
        a.classList.toggle('on', on);
        setWakeLock(on);
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
        const v = await actionSheet(r.title, [
          { label: '✏️ ' + t('edit'), value: 'edit' },
          { label: '🗑 ' + t('delete'), value: 'delete', danger: true },
        ]);
        if (v === 'edit') openEditor(r);
        if (v === 'delete') {
          const ok = await actionSheet(t('delete_q') + ' ' + t('delete_sub'), [{ label: t('delete'), danger: true, value: true }]);
          if (ok) { await removeRecipe(r); popPage(); renderTab(); toast(t('deleted')); }
        }
        break;
      }
      case 'avatar': {
        const opts = [{ label: '📷 ' + t('camera'), value: 'camera' }, { label: '🖼 ' + t('gallery'), value: 'gallery' }];
        if (settings.avatar) opts.push({ label: t('remove_photo'), value: 'remove', danger: true });
        const v = await actionSheet(t('change_photo'), opts);
        if (!v) break;
        if (v === 'remove') { await deletePhoto(settings.avatar); settings.avatar = null; }
        else {
          const [f] = await pickFiles(v);
          if (!f) break;
          const ref = await storePhoto(f, 400);
          if (settings.avatar) await deletePhoto(settings.avatar);
          settings.avatar = ref;
        }
        saveSettings(); renderTab(); break;
      }
      case 'export': exportBackup(); break;
      case 'import': importBackup(); break;
      case 'restore-seed': restoreSeed(); break;
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
    if (e.target.id === 'profile-name') { settings.name = e.target.value; saveSettings(); }
    if (e.target.id === 'ai-code') { settings.aiCode = e.target.value.trim(); saveSettings(); }
  });
  document.addEventListener('keydown', e => {
    if (e.target.id === 'q' && e.key === 'Enter') e.target.blur();
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyAppearance);
}

/* ---------------- Boot ---------------- */
(async function boot() {
  applyAppearance();
  bindEvents();
  try { await loadData(); }
  catch (e) {
    $('#tabs-root').innerHTML = `<div class="view"><div class="empty"><div class="big">⚠️</div><h3>Error</h3><p>${esc(e.message || e)}</p></div></div>`;
    return;
  }
  renderTab();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
