/* Rifay Umami — safety tools that Google Play and the App Store require for apps with user content:
   report content, block people, delete the own account, and (for the administrator) a list of reports.
   Loaded before app.js; uses app.js helpers (actionSheet, toast, t, esc, pushPage …) only when called. */
'use strict';

let blockedIds = new Set();   // people this user has blocked: their recipes and messages are hidden
const REPORT_REASONS = [['abuse', 'Обидно или неподходящо'], ['spam', 'Спам или реклама'], ['copyright', 'Нарушава авторски права'], ['illegal', 'Незаконно или опасно'], ['other', 'Друго']];
const REASON_LABEL = Object.fromEntries(REPORT_REASONS);

async function loadBlocked() {
  if (typeof auth === 'undefined' || auth.mode !== 'user') { blockedIds = new Set(); return; }
  try { blockedIds = new Set(await cloud.blockedList()); } catch (e) { blockedIds = new Set(); }   // before the database update: nobody is blocked
}

async function reportFlow(type, targetId, ownerId, what) {
  if (auth.mode !== 'user') { promptLogin(); return; }
  const v = await actionSheet(`Докладвай: ${what}`, REPORT_REASONS.map(([value, label]) => ({ label, value })));
  if (!v) return;
  try { await cloud.reportContent(type, targetId, ownerId, v); toast('Благодарим! Ще го прегледаме.', 3500); }
  catch (e) { toast('Докладът не можа да се изпрати. Опитай пак.'); }
}

async function blockFlow(userId, name) {
  if (auth.mode !== 'user') { promptLogin(); return; }
  const ok = await actionSheet(`Да блокирам ли ${name || 'този потребител'}? Няма да виждаш рецептите и съобщенията му.`, [{ label: '🚫 Блокирай', danger: true, value: true }]);
  if (!ok) return;
  try {
    await cloud.blockUser(userId);
    blockedIds.add(userId);
    if (friends.some(f => f.id === userId)) { try { await cloud.removeFriend(userId); friends = friends.filter(f => f.id !== userId); } catch (e) {} }
    if (typeof chat !== 'undefined') { delete chat.threads[userId]; renderChatBadge(); }
    while (state.pages.length) popPage();
    compose(); renderTab();
    toast(`${name || 'Потребителят'} е блокиран`);
  } catch (e) { toast('Не успях да блокирам. Опитай пак.'); }
}

async function openBlockedPage() {
  const el = pushPage(`<div class="navbar">
      <button class="nav-btn" data-action="back">${esc(t('close'))}</button><h1>🚫 Блокирани</h1><span style="width:60px"></span></div>
    <div class="form"><div id="blk-body"><div class="empty"><div class="spinner" style="border-top-color:var(--accent);border-color:var(--fill-strong);margin:0 auto"></div></div></div></div>`, { modal: true });
  const draw = async () => {
    const ids = [...blockedIds];
    const body = $('#blk-body', el);
    if (!ids.length) { body.innerHTML = '<div class="empty"><div class="big">🙂</div><p>Нямаш блокирани потребители.</p></div>'; return; }
    const names = await cloud.profilesByIds(ids).catch(() => ({}));
    body.innerHTML = `<div class="group">${ids.map(id => `<div class="row"><span class="lbl">${esc((names[id] && names[id].display_name) || 'Потребител')}</span>
      <button class="btn small" data-unblock="${esc(id)}">Отблокирай</button></div>`).join('')}</div>`;
  };
  el.addEventListener('click', async e => {
    const b = e.target.closest('[data-unblock]');
    if (!b) return;
    try { await cloud.unblockUser(b.dataset.unblock); blockedIds.delete(b.dataset.unblock); compose(); renderTab(); draw(); } catch (err) { toast('Не успях. Опитай пак.'); }
  });
  draw();
}

async function deleteAccountFlow() {
  const ok = await confirmCaptcha('Изтриване на акаунта',
    'Акаунтът ти и всички твои данни (рецепти, снимки, любими, съобщения, оценки) ще бъдат изтрити завинаги. Това не може да се отмени.', 'Изтрий акаунта');
  if (!ok) return;
  toast('Изтривам…', 6000);
  try {
    await cloud.deleteMyAccount();
    try { await signOut(); } catch (e) {}
    try { localStorage.removeItem('chocho.guest'); } catch (e) {}
    toast('Акаунтът е изтрит. Довиждане! 👋', 5000);
    setTimeout(() => location.reload(), 1200);
  } catch (e) {
    const msg = String((e && e.message) || e);
    toast(/administrator/i.test(msg) ? 'Администраторски акаунт не може да се изтрие от приложението.' : 'Не успях да изтрия акаунта. Опитай пак или пиши на chocho.rifay@gmail.com', 6000);
  }
}

/* ---------------- Reports for the administrator ---------------- */
async function openAdminReports() {
  const el = pushPage(`<div class="navbar">
      <button class="nav-btn" data-action="back">${esc(t('close'))}</button><h1>🚩 Доклади</h1><button class="nav-btn" data-rep="refresh" aria-label="Refresh">↻</button></div>
    <div class="form"><div id="rep-body"><div class="empty"><div class="spinner" style="border-top-color:var(--accent);border-color:var(--fill-strong);margin:0 auto"></div></div></div></div>`, { modal: true });
  let rows = [];
  const draw = () => {
    const body = $('#rep-body', el);
    if (!rows.length) { body.innerHTML = '<div class="empty"><div class="big">✅</div><p>Няма доклади.</p></div>'; return; }
    body.innerHTML = rows.map(r => `<div class="group rep ${r.rep_status === 'open' ? '' : 'done'}" style="margin-bottom:12px;padding:12px">
      <div><b>${r.rep_type === 'recipe' ? '📖 ' + esc(r.rep_title || 'рецепта') : r.rep_type === 'user' ? '👤 Потребител' : '💬 Съобщение'}</b>
        <small class="muted"> · ${esc(REASON_LABEL[r.rep_reason] || r.rep_reason)} · ${new Date(r.rep_created).toLocaleDateString('bg-BG')}</small></div>
      <div class="muted" style="margin:4px 0 8px">Автор: ${esc(r.rep_owner_name || '—')} · Докладвал: ${esc(r.rep_reporter_name || '—')}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${r.rep_type === 'recipe' ? `<button class="btn small" data-rep="open" data-id="${esc(r.rep_target)}">Виж</button><button class="btn small danger" data-rep="del" data-id="${esc(r.rep_target)}" data-rid="${esc(r.rep_id)}">Изтрий рецептата</button>` : ''}
        ${r.rep_owner ? `<button class="btn small danger" data-rep="block" data-uid="${esc(r.rep_owner)}" data-rid="${esc(r.rep_id)}">Блокирай автора</button>` : ''}
        ${r.rep_status === 'open' ? `<button class="btn small" data-rep="done" data-rid="${esc(r.rep_id)}">Приключи</button>` : '<small class="muted">приключен</small>'}
      </div></div>`).join('');
  };
  const load = async () => { try { rows = await cloud.adminReports(); draw(); } catch (e) { $('#rep-body', el).innerHTML = '<div class="empty"><p>Не мога да заредя докладите. Пуснал ли си supabase/store-ready.sql?</p></div>'; } };
  el.addEventListener('click', async e => {
    const b = e.target.closest('[data-rep]');
    if (!b) return;
    const act = b.dataset.rep;
    try {
      if (act === 'refresh') await load();
      else if (act === 'open') { const r = byId(b.dataset.id); if (r) openRecipe(r.id); else toast('Рецептата вече я няма'); }
      else if (act === 'del') {
        const r = byId(b.dataset.id);
        if (r && window.confirm('Да изтрия ли рецептата за постоянно?')) { await removeRecipe(r); await cloud.adminResolveReport(b.dataset.rid); toast('Изтрита'); await load(); }
      } else if (act === 'block') {
        if (window.confirm('Да блокирам ли този потребител за всички?')) { await cloud.adminSetBlocked(b.dataset.uid, true); await cloud.adminResolveReport(b.dataset.rid); toast('Блокиран'); await load(); }
      } else if (act === 'done') { await cloud.adminResolveReport(b.dataset.rid); await load(); }
    } catch (err) { toast('Не успях. Опитай пак.'); }
  });
  load();
}
