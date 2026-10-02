# Включване на акаунтите (Supabase)

Докато `config.js` е празен, приложението работи както преди — само локално, без вход.
За да заработят потребители, вход с Google/Facebook/имейл, гост режим и публични/лични рецепти, трябва да свържеш безплатен проект в Supabase. Това е еднократно (~20 мин).

## 1. Проект в Supabase
1. Влез в https://supabase.com → **New project** (име: `rifay-umami`, регион близо до теб, запомни паролата на базата).
2. **SQL Editor → New query** → постави цялото съдържание на `supabase/schema.sql` → **Run**.
   Това създава таблиците, правилата за достъп (кой какво вижда) и контейнера за снимки.
3. **Project Settings → API** → копирай **Project URL** и **anon public key** и ги сложи в `config.js`:
   ```js
   supabaseUrl: 'https://xxxx.supabase.co',
   supabaseAnonKey: 'eyJ…',
   ```
   (`anon` ключът е публичен по дизайн. **Никога** не слагай `service_role` ключа в приложението.)

## 2. Адреси за пренасочване
**Authentication → URL Configuration**
- **Site URL:** `https://rifay-recipes.netlify.app`
- **Redirect URLs:** добави `https://rifay-recipes.netlify.app/**` и (за тест) `http://localhost:8080/**`

## 3. Вход с имейл
**Authentication → Providers → Email** е включен по подразбиране. Препоръчвам да оставиш *Confirm email* включено.
Забележка: вграденият имейл на Supabase праща само няколко писма на час. За реално ползване добави собствен SMTP (**Authentication → SMTP Settings**, напр. Resend или Brevo — безплатни планове).

## 4. Вход с Google
1. https://console.cloud.google.com → нов проект → **APIs & Services → OAuth consent screen** (External, име „Rifay Umami“).
2. **Credentials → Create credentials → OAuth client ID → Web application.**
   - **Authorized redirect URI:** `https://<твоят-проект>.supabase.co/auth/v1/callback`
3. Копирай **Client ID** и **Client secret** в Supabase → **Authentication → Providers → Google** → Enable → Save.

## 5. Вход с Facebook
1. https://developers.facebook.com → **Create app** (тип *Consumer/Authenticate*), добави продукта **Facebook Login**.
2. **Facebook Login → Settings → Valid OAuth Redirect URIs:** `https://<твоят-проект>.supabase.co/auth/v1/callback`
3. **App settings → Basic:** копирай **App ID** и **App secret** в Supabase → **Providers → Facebook** → Enable → Save.
4. За да влизат и други хора (не само ти), приложението във Facebook трябва да е в режим **Live** (изисква политика за поверителност — URL).

Ако не искаш някой от начините, в `config.js` сложи `providers: { google: false }` и бутонът се скрива.

## 6. Публикуване
Качи промените в GitHub (`main`) — Netlify публикува автоматично. Не са нужни променливи в Netlify за акаунтите.

## Как работи
| Кой | Какво вижда | Какво може |
| --- | --- | --- |
| Гост | оригиналните рецепти + публичните на всички | да разглежда; любими само на устройството |
| Потребител | горното + собствените си лични | да добавя, редактира, трие свои; да ги прави публични/лични; любими навсякъде |

- Нова рецепта е **публична по подразбиране**; в редактора има превключвател *Публична / Лична*.
- Оригиналните рецепти (от `recipes.json`) са общи и само за четене. „Редактирай като моя версия“ прави лично копие, което замества оригинала само за теб.
- Чужда публична рецепта може да се копира в моите.
- Рецептите, създадени преди акаунтите (само на телефона), се качват от **Настройки → Акаунт → Качи рецептите от този телефон**.

## Ограничения, които е добре да знаеш
- На iPhone приложението, добавено на началния екран, пази вход отделно от Safari. Вход с Google/Facebook там отваря Safari и връщането не винаги довършва вход в приложението — имейл + парола работи без проблем.
- Снимките са в публичен контейнер: адресите са случайни и не се изброяват, но който получи точния линк на снимка (дори от лична рецепта), може да я отвори.
- AI функцията („С AI“) още е защитена с общия код за достъп, не с акаунт.
