/* Rifay Umami — "add to the home screen" prompt. Shown on a phone, once, with the method that fits the device
   (iPhone: Share → Add to Home Screen; Android: the real install button; Facebook/Instagram browser: open in the phone's browser).
   Remembers "do not show again". Also reachable from Settings. Loaded before app.js. */
'use strict';

const INSTALL_KEY = 'rifay.install';   // { never: true } | { snoozeUntil: ms, shown: n }
let installPrompt = null;              // the browser's own install dialog (Chrome on Android), when it offers one

window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; });
window.addEventListener('appinstalled', () => { installSave({ never: true }); installClose(); });

const installLoad = () => { try { return JSON.parse(localStorage.getItem(INSTALL_KEY) || '{}'); } catch (e) { return {}; } };
const installSave = s => { try { localStorage.setItem(INSTALL_KEY, JSON.stringify(s)); } catch (e) {} };
const isStandalone = () => { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; } };

// What kind of device and browser this is (ua can be passed in for testing).
function installDevice(ua = navigator.userAgent, touchPoints = navigator.maxTouchPoints || 0, platform = navigator.platform || '') {
  const ios = /iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && touchPoints > 1);
  const android = /Android/i.test(ua);
  const inApp = /FBAN|FBAV|FB_IAB|Instagram|Messenger|musical_ly|TikTok|Snapchat|Line\/|Pinterest|LinkedInApp|Twitter/i.test(ua)
    || (android && /; wv\)/.test(ua)) || (ios && !/Safari\//.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua));
  const mobile = ios || android;
  const samsung = /SamsungBrowser/i.test(ua), firefox = /Firefox|FxiOS/i.test(ua), chrome = /Chrome|CriOS/i.test(ua) && !samsung && !/Edg/i.test(ua);
  return { ios, android, mobile, inApp, samsung, firefox, chrome };
}

const IOS_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" style="vertical-align:-3px" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';

function installStepsHTML(d) {
  const li = (n, html) => `<li><b>${n}</b><span>${html}</span></li>`;
  if (d.inApp) {
    return `<p>Сега си във вграден браузър (Facebook, Instagram…). Оттук приложението не може да се добави.</p>
      <ol class="inst-steps">${li(1, 'Натисни <b>⋯</b> или <b>⋮</b> най-горе или най-долу в ъгъла.')}${li(2, d.ios ? 'Избери <b>„Отвори в Safari"</b>.' : 'Избери <b>„Отвори в Chrome"</b> (или „Отвори в браузъра").')}${li(3, 'После това съобщение ще ти покаже как да го добавиш.')}</ol>`;
  }
  if (d.ios) {
    return `<ol class="inst-steps">${li(1, `Натисни бутона <b>Сподели</b> ${IOS_ICON} (в долната лента на Safari; в Chrome е горе вдясно).`)}
      ${li(2, 'Превърти и избери <b>„Добави към началния екран"</b> ➕.')}${li(3, 'Натисни <b>„Добави"</b>. Иконата ще се появи на екрана.')}</ol>`;
  }
  if (installPrompt) return '<p>Приложението ще се инсталира с един бутон — като обикновено приложение, без магазин.</p>';
  if (d.samsung) return `<ol class="inst-steps">${li(1, 'Натисни менюто <b>☰</b> долу вдясно.')}${li(2, 'Избери <b>„Добави страницата към"</b> → <b>„Начален екран"</b>.')}</ol>`;
  if (d.firefox) return `<ol class="inst-steps">${li(1, 'Натисни менюто <b>⋮</b>.')}${li(2, 'Избери <b>„Инсталиране"</b> (или „Добави към началния екран").')}</ol>`;
  return `<ol class="inst-steps">${li(1, 'Натисни менюто <b>⋮</b> горе вдясно в Chrome.')}${li(2, 'Избери <b>„Инсталиране на приложението"</b> (или „Добави към началния екран").')}${li(3, 'Потвърди с <b>„Инсталирай"</b>.')}</ol>`;
}

function installClose() { const el = document.getElementById('install-root'); if (el) el.remove(); }

// force = opened by hand from Settings (always shows, even on a computer, and ignores "do not show again")
function showInstall(force = false) {
  const d = installDevice();
  if (!force && (!d.mobile || isStandalone())) return false;
  installClose();
  const root = document.createElement('div');
  root.id = 'install-root';
  const canInstall = !d.inApp && !d.ios && !!installPrompt;
  const alreadyInstalled = isStandalone();
  const desktop = !d.mobile;
  root.innerHTML = `<div class="inst-back" data-inst="later"></div><div class="inst-card" role="dialog" aria-modal="true">
    <div class="inst-head"><img src="icons/logo.svg" alt=""><div><b>Добави Rifay Umami на телефона</b><small>Като истинско приложение — без магазин</small></div></div>
    ${alreadyInstalled ? '<p>Приложението вече е добавено на този телефон. 🎉</p>' : desktop ? '<p>Отвори https://rifayumami.online на телефона си и ще получиш подсказка как да го добавиш. На компютър (Chrome/Edge) натисни иконата за инсталиране в адресната лента.</p>' : installStepsHTML(d)}
    <div class="inst-actions">
      ${canInstall ? '<button class="btn primary" data-inst="install">📲 Инсталирай</button>' : ''}
      ${alreadyInstalled || desktop || force ? '<button class="btn primary" data-inst="later">Разбрах</button>' : '<button class="btn" data-inst="later">По-късно</button>'}
      ${!force && !alreadyInstalled ? '<button class="link inst-never" data-inst="never">Не показвай повече</button>' : ''}
    </div></div>`;
  document.body.appendChild(root);
  root.addEventListener('click', async e => {
    const b = e.target.closest('[data-inst]');
    if (!b) return;
    const act = b.dataset.inst;
    if (act === 'install' && installPrompt) {
      try { installPrompt.prompt(); const r = await installPrompt.userChoice; if (r && r.outcome === 'accepted') installSave({ never: true }); } catch (err) {}
      installPrompt = null; installClose(); return;
    }
    if (act === 'never') { installSave({ never: true }); installClose(); return; }
    if (!force) { const s = installLoad(); installSave({ shown: (s.shown || 0) + 1, snoozeUntil: Date.now() + 7 * 864e5 }); }
    installClose();
  });
  return true;
}

// Automatic: the first time on a phone (and again after a week up to 3 times if it was only postponed).
function maybeShowInstall(tries = 0) {
  const d = installDevice(), s = installLoad();
  if (!d.mobile || isStandalone() || s.never || (s.snoozeUntil && Date.now() < s.snoozeUntil) || (s.shown || 0) >= 3) return;
  if (document.querySelector('#auth-root')?.firstChild || document.querySelector('#sheet-root')?.firstChild || (typeof state !== 'undefined' && state.pages.length)) {
    if (tries < 30) setTimeout(() => maybeShowInstall(tries + 1), 2500);   // wait until sign-in and the first questions are done
    return;
  }
  if (!s.shown) installSave({ shown: 0 });
  showInstall(false);
}
