/* Rifay Umami — chat: 1-to-1 messages between friends, recipe tags, unread badge and notifications.
   Loaded before app.js; it only uses app.js helpers (t, esc, $, pushPage …) at call time. */
'use strict';

const chat = { threads: {}, partners: {}, unread: 0, open: null, draftRecipe: null, poll: null, user: null };
const CHAT_POLL_MS = 60000;

const chatName = id => (chat.partners[id] && chat.partners[id].name) || '…';
const myMsg = m => m.sender_id === auth.user.id;
const isUnread = m => m.recipient_id === auth.user.id && !m.read_at;
const chatUnreadFor = id => (chat.threads[id] || []).filter(isUnread).length;

function renderChatBadge() {
  chat.unread = Object.values(chat.threads).reduce((n, list) => n + list.filter(isUnread).length, 0);
  const b = document.getElementById('chat-badge');
  if (b) { b.textContent = chat.unread > 99 ? '99+' : String(chat.unread); b.classList.toggle('hidden', !chat.unread); }
  const tab = document.querySelector('.tab[data-tab="chat"]');
  if (tab) tab.classList.toggle('hidden', auth.mode !== 'user');
  try { if (navigator.setAppBadge) { if (chat.unread) navigator.setAppBadge(chat.unread); else navigator.clearAppBadge(); } } catch (e) {}
}

/* ---------------- Loading & realtime ---------------- */
async function loadChat() {
  const rows = await cloud.loadMessages();
  const threads = {};
  rows.reverse().forEach(m => { const other = myMsg(m) ? m.recipient_id : m.sender_id; (threads[other] = threads[other] || []).push(m); });
  chat.threads = threads;
  const ids = Object.keys(threads).filter(id => !chat.partners[id]);
  if (ids.length) {
    const found = await cloud.profilesByIds(ids);
    ids.forEach(id => { const p = found[id]; chat.partners[id] = { id, name: p ? p.display_name : '…', avatar: p ? p.avatar_url : null }; });
  }
  renderChatBadge();
}

function startChat() {
  if (auth.mode !== 'user') { stopChat(); return; }
  if (chat.user === auth.user.id && cloud.chatChannel) { refreshChat(); return; }
  stopChat();
  chat.user = auth.user.id;
  loadChat().then(() => { if (state.tab === 'chat' && !state.pages.length) renderTab(); }).catch(() => {});
  cloud.subscribeMessages(onIncoming);
  chat.poll = setInterval(() => { if (!document.hidden) refreshChat(); }, CHAT_POLL_MS);
}
function stopChat() {
  cloud.unsubscribeMessages();
  clearInterval(chat.poll); chat.poll = null;
  chat.user = null; chat.threads = {}; chat.open = null; chat.draftRecipe = null;
  renderChatBadge();
}
// Safety net when Realtime is unavailable: reload and announce messages that arrived unnoticed.
async function refreshChat() {
  try {
    const known = new Set(Object.values(chat.threads).flat().map(m => m.id));
    await loadChat();
    const fresh = Object.values(chat.threads).flat().filter(m => !known.has(m.id) && isUnread(m));
    fresh.slice(-3).forEach(m => notifyIncoming(m));
    if (chat.open) renderOpenConversation();
    else if (state.tab === 'chat' && !state.pages.length) renderTab();
  } catch (e) {}
}
async function onIncoming(m) {
  const other = m.sender_id;
  if (!chat.partners[other]) {
    const found = await cloud.profilesByIds([other]).catch(() => ({}));
    const p = found[other];
    chat.partners[other] = { id: other, name: p ? p.display_name : t('chat_someone'), avatar: p ? p.avatar_url : null };
  }
  const list = chat.threads[other] = chat.threads[other] || [];
  if (list.some(x => x.id === m.id)) return;
  list.push(m);
  if (chat.open === other && !document.hidden) { m.read_at = new Date().toISOString(); cloud.markRead(other).catch(() => {}); renderOpenConversation(); }
  else notifyIncoming(m);
  renderChatBadge();
  if (state.tab === 'chat' && !state.pages.length) renderTab();
}

/* ---------------- Notifications ---------------- */
let pingCtx = null;
function playPing() {
  try {
    pingCtx = pingCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (pingCtx.state === 'suspended') pingCtx.resume();
    [[880, 0], [1320, 0.12]].forEach(([f, w]) => {
      const o = pingCtx.createOscillator(), g = pingCtx.createGain(), t0 = pingCtx.currentTime + w;
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
      o.connect(g); g.connect(pingCtx.destination); o.start(t0); o.stop(t0 + 0.3);
    });
  } catch (e) {}
}
function chatToast(m) {
  const el = document.getElementById('chat-toast');
  if (!el) return;
  const text = m.recipe_id ? '📎 ' + m.body : m.body;
  el.innerHTML = `<b>💬 ${esc(chatName(m.sender_id))}</b><span>${esc(text.slice(0, 90))}</span>`;
  el.dataset.partner = m.sender_id;
  el.classList.add('show');
  clearTimeout(chatToast._t);
  chatToast._t = setTimeout(() => el.classList.remove('show'), 5200);
}
function notifyIncoming(m) {
  haptic(); playPing(); chatToast(m);
  if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
    const title = chatName(m.sender_id), opts = { body: m.body.slice(0, 120), icon: 'icons/icon-192.png', tag: 'chat-' + m.sender_id, data: { partner: m.sender_id } };
    navigator.serviceWorker && navigator.serviceWorker.getRegistration().then(reg => {
      if (reg && reg.showNotification) reg.showNotification(title, opts); else new Notification(title, opts);
    }).catch(() => { try { new Notification(title, opts); } catch (e) {} });
  }
}
async function enableNotifications() {
  if (!('Notification' in window)) { toast(t('chat_notif_unsupported')); return; }
  const res = await Notification.requestPermission();
  toast(t(res === 'granted' ? 'chat_notif_on' : 'chat_notif_denied'));
  if (state.tab === 'chat' && !state.pages.length) renderTab();
}

/* ---------------- Chat tab ---------------- */
const chatAvatar = (id, cls = '') => {
  const p = chat.partners[id] || {};
  return `<span class="avatar ${cls}">${p.avatar ? imgTag(p.avatar, '', false) : esc((p.name || '?').charAt(0).toUpperCase())}</span>`;
};
function fmtChatTime(iso) {
  const d = new Date(iso), now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString(settings.lang === 'bg' ? 'bg-BG' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
  const diff = (now - d) / 864e5;
  if (diff < 7) return d.toLocaleDateString(settings.lang === 'bg' ? 'bg-BG' : 'en-GB', { weekday: 'short' });
  return d.toLocaleDateString(settings.lang === 'bg' ? 'bg-BG' : 'en-GB', { day: 'numeric', month: 'short' });
}
function chatView() {
  const threads = Object.entries(chat.threads).map(([id, list]) => ({ id, list, last: list[list.length - 1] }))
    .sort((a, b) => Date.parse(b.last.created_at) - Date.parse(a.last.created_at));
  const canNotify = 'Notification' in window;
  const notifBanner = canNotify && Notification.permission !== 'granted'
    ? `<button class="notif-banner" data-chat="notif"><span>🔔</span><span><b>${esc(t('chat_notif_title'))}</b><small>${esc(t(Notification.permission === 'denied' ? 'chat_notif_blocked' : 'chat_notif_hint'))}</small></span></button>` : '';
  return `<section class="view">
    <div class="topbar"><div class="greeting">${esc(t('chat_sub'))}</div>
      <button class="btn-login" data-chat="new">✏️ ${esc(t('chat_new'))}</button></div>
    <h1 class="large-title">${esc(t('chat_title'))}</h1>
    ${notifBanner}
    ${threads.length ? `<div class="threads">${threads.map(th => {
      const un = chatUnreadFor(th.id), m = th.last;
      return `<button class="thread ${un ? 'unread' : ''}" data-chat-open="${esc(th.id)}">${chatAvatar(th.id)}
        <span class="thread-main"><b>${esc(chatName(th.id))}</b>
          <span class="thread-last">${myMsg(m) ? esc(t('chat_you')) + ': ' : ''}${m.recipe_id ? '📎 ' : ''}${esc(m.body.slice(0, 80))}</span></span>
        <span class="thread-meta"><small>${esc(fmtChatTime(m.created_at))}</small>${un ? `<i class="dot">${un}</i>` : ''}</span></button>`;
    }).join('')}</div>`
      : `<div class="empty"><div class="big">💬</div><h3>${esc(t('chat_empty'))}</h3><p>${esc(t('chat_empty_sub'))}</p>
        <button class="chip" data-chat="new">✏️ ${esc(t('chat_new'))}</button></div>`}
  </section>`;
}

/* ---------------- Conversation ---------------- */
function recipeChipHTML(id) {
  const r = byId(id);
  if (!r) return `<div class="tagged missing">📎 ${esc(t('chat_recipe_missing'))}</div>`;
  const cover = (r.images || [])[0];
  return `<button class="tagged" data-open="${esc(r.id)}"><span class="tagged-thumb">${cover ? imgTag(cover, '', false) : placeholder(r)}</span>
    <span class="tagged-text"><b>${esc(r.title)}</b><small>${(CAT[(r.categories || [])[0]] || CAT.other).emoji} ${esc(catName((r.categories || [])[0] || 'other'))}${statOf('recipe', r.id) ? ' · ' + fmtScore(statOf('recipe', r.id).avg) : ''}</small></span></button>`;
}
function messageHTML(m) {
  const mine = myMsg(m);
  const text = m.recipe_id && m.body === t('chat_recipe_default') ? '' : `<div class="bubble">${linkify(esc(m.body)).replace(/\n/g, '<br>')}</div>`;
  return `<div class="msg ${mine ? 'mine' : 'theirs'}" data-msg="${esc(m.id)}">${m.recipe_id ? recipeChipHTML(m.recipe_id) : ''}${text}
    <small>${esc(fmtChatTime(m.created_at))}${mine ? (m.read_at ? ' ✓✓' : ' ✓') : ''}</small></div>`;
}
function conversationBodyHTML(partnerId) {
  const list = chat.threads[partnerId] || [];
  if (!list.length) return `<div class="empty"><div class="big">👋</div><p>${esc(t('chat_say_hi'))}</p></div>`;
  let day = '', out = '';
  for (const m of list) {
    const d = new Date(m.created_at).toDateString();
    if (d !== day) { day = d; out += `<div class="day">${esc(new Date(m.created_at).toLocaleDateString(settings.lang === 'bg' ? 'bg-BG' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' }))}</div>`; }
    out += messageHTML(m);
  }
  return out;
}
function draftTagHTML() {
  const r = chat.draftRecipe ? byId(chat.draftRecipe) : null;
  return r ? `<div class="draft-tag"><span>📎 <b>${esc(r.title)}</b></span><button data-chat="untag" aria-label="${esc(t('cancel'))}">✕</button></div>` : '';
}
function renderOpenConversation() {
  const el = document.querySelector('.chat-page');
  if (!el || !chat.open) return;
  const body = el.querySelector('#chat-body');
  const atBottom = body.scrollHeight - body.scrollTop - body.clientHeight < 80;
  body.innerHTML = conversationBodyHTML(chat.open);
  hydratePhotos(body);
  if (atBottom) body.scrollTop = body.scrollHeight;
  el.querySelector('#chat-tag').innerHTML = draftTagHTML();
}
function markOpenRead() {
  if (!chat.open || document.hidden) return;
  const list = chat.threads[chat.open] || [];
  if (!list.some(isUnread)) return;
  list.forEach(m => { if (isUnread(m)) m.read_at = new Date().toISOString(); });
  cloud.markRead(chat.open).catch(() => {});
  renderChatBadge();
}
function openConversation(partnerId, { recipeId = null } = {}) {
  if (!chat.partners[partnerId]) chat.partners[partnerId] = { id: partnerId, name: (friends.find(f => f.id === partnerId) || {}).display_name || '…', avatar: (friends.find(f => f.id === partnerId) || {}).avatar_url || null };
  chat.open = partnerId;
  if (recipeId) chat.draftRecipe = recipeId;
  const el = pushPage(`<div class="navbar">
      <button class="nav-btn" data-action="back" aria-label="${esc(t('close'))}">‹ ${esc(t('chat_back'))}</button>
      <h1 class="chat-title">${chatAvatar(partnerId, 'sm')}<span>${esc(chatName(partnerId))}</span></h1><span style="width:70px"></span>
    </div>
    <div class="chat-body" id="chat-body"></div>
    <div class="chat-compose">
      <div id="chat-tag"></div>
      <div class="chat-row">
        <button class="round" data-chat="tag" aria-label="${esc(t('chat_tag'))}" title="${esc(t('chat_tag'))}">📎</button>
        <textarea id="chat-input" rows="1" maxlength="2000" placeholder="${esc(t('chat_ph'))}"></textarea>
        <button class="round send" data-chat="send" aria-label="${esc(t('chat_send'))}">➤</button>
      </div>
    </div>`, { modal: true, onClose: () => { chat.open = null; chat.draftRecipe = null; if (state.tab === 'chat') renderTab(); renderChatBadge(); } });
  el.classList.add('chat-page');
  renderOpenConversation();
  const body = el.querySelector('#chat-body'); body.scrollTop = body.scrollHeight;
  markOpenRead();
  setTimeout(() => { const i = el.querySelector('#chat-input'); if (i && !/Android|iPhone|iPad/i.test(navigator.userAgent)) i.focus(); }, 350);
}
async function chatSend(el) {
  const input = el.querySelector('#chat-input');
  const body = input.value.trim();
  if (!body && !chat.draftRecipe) return;
  const partner = chat.open, rid = chat.draftRecipe;
  const btn = el.querySelector('[data-chat="send"]'); btn.disabled = true;
  try {
    const r = rid ? byId(rid) : null;
    if (r && isMine(r) && r.visibility === 'private') await cloud.share(r.id, partner); // let the friend open it
    const m = await cloud.sendMessage(partner, body || t('chat_recipe_default'), rid);
    (chat.threads[partner] = chat.threads[partner] || []).push(m);
    input.value = ''; input.style.height = ''; chat.draftRecipe = null;
    renderOpenConversation();
    const bodyEl = el.querySelector('#chat-body'); bodyEl.scrollTop = bodyEl.scrollHeight;
  } catch (e) {
    toast(String((e && e.message) || '').includes('row-level security') ? t('chat_need_friend') : t('chat_send_err'));
  }
  btn.disabled = false; input.focus();
}

/* ---------------- Pickers ---------------- */
function openRecipePicker(onPick) {
  const el = pushPage(`<div class="navbar">
      <button class="nav-btn" data-action="back">${esc(t('cancel'))}</button><h1>📎 ${esc(t('chat_pick_recipe'))}</h1><span style="width:60px"></span></div>
    <div class="form"><div class="group" style="margin-top:12px"><label class="search-field" style="border-radius:0;background:transparent">${I.search}
      <input id="pick-q" type="search" autocomplete="off" placeholder="${esc(t('search_ph'))}"></label></div>
      <div id="pick-list" class="pick-list"></div></div>`, { modal: true });
  const list = $('#pick-list', el);
  const draw = () => {
    const q = $('#pick-q', el).value.trim();
    let rows;
    if (q) { const terms = buildTerms(q); rows = state.recipes.filter(canSend).map(r => [r, searchScore(r, terms)]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).map(x => x[0]); }
    else rows = [...state.recipes.filter(r => r.cooked > 0), ...state.recipes.filter(r => r.favorite && !(r.cooked > 0)), ...state.recipes.filter(isMine)]
      .filter((r, i, a) => a.indexOf(r) === i && canSend(r));
    list.innerHTML = rows.slice(0, 40).map(r => `<button class="pick-row" data-pick="${esc(r.id)}">
      <span class="tagged-thumb">${(r.images || [])[0] ? imgTag(r.images[0], '', false) : placeholder(r)}</span><span><b>${esc(r.title)}</b><small>${(CAT[(r.categories || [])[0]] || CAT.other).emoji} ${esc(catName((r.categories || [])[0] || 'other'))}</small></span></button>`).join('')
      || `<p class="hint" style="margin:14px 6px">${esc(t('no_results'))}</p>`;
    hydratePhotos(list);
  };
  draw();
  let tm = null;
  el.addEventListener('input', e => { if (e.target.id === 'pick-q') { clearTimeout(tm); tm = setTimeout(draw, 150); } });
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-pick]');
    if (!b) return;
    popPage(); setTimeout(() => onPick(b.dataset.pick), 280);
  });
  setTimeout(() => $('#pick-q', el).focus(), 350);
}

// Choose a friend (or search anybody) to write to; optionally with a recipe attached.
function openNewChat(recipeId = null) {
  let found = [], tm = null;
  const el = pushPage(`<div class="navbar">
      <button class="nav-btn" data-action="back">${esc(t('cancel'))}</button><h1>✏️ ${esc(t('chat_new'))}</h1><span style="width:60px"></span></div>
    <div class="form">
      ${recipeId && byId(recipeId) ? `<p class="muted" style="margin:10px 4px 0">📎 <b>${esc(byId(recipeId).title)}</b></p>` : ''}
      <p class="hint" style="margin:10px 4px 12px">${esc(t('chat_new_hint'))}</p>
      <div class="group"><label class="search-field" style="border-radius:0;background:transparent">${I.search}
        <input id="nc-q" type="search" autocomplete="off" placeholder="${esc(t('share_search_ph'))}"></label></div>
      <div id="nc-results" class="people"></div>
      <div class="group-label">⭐ ${esc(t('friends_title'))}</div><div id="nc-friends" class="people"></div></div>`, { modal: true });
  const row = p => `<button class="person person-pick" data-nc="${esc(p.id)}">
      <span class="avatar">${p.avatar_url ? imgTag(p.avatar_url, '', false) : esc((p.display_name || '?').charAt(0).toUpperCase())}</span><b>${esc(p.display_name || '')}</b><span class="chev">›</span></button>`;
  const drawFriends = () => {
    $('#nc-friends', el).innerHTML = friends.length ? friends.map(row).join('') : `<p class="hint">${esc(t('friends_empty'))}</p>`;
    hydratePhotos(el);
  };
  drawFriends();
  const search = async () => {
    const q = $('#nc-q', el).value.trim();
    if (q.length < 2) { $('#nc-results', el).innerHTML = ''; return; }
    try { found = await cloud.searchUsers(q); } catch (e) { found = []; }
    $('#nc-results', el).innerHTML = found.length ? found.map(row).join('') : `<p class="hint">${esc(t('share_none'))}</p>`;
    hydratePhotos(el);
  };
  el.addEventListener('input', e => { if (e.target.id === 'nc-q') { clearTimeout(tm); tm = setTimeout(search, 250); } });
  el.addEventListener('click', async e => {
    const b = e.target.closest('[data-nc]');
    if (!b) return;
    const id = b.dataset.nc, p = friends.find(f => f.id === id) || found.find(f => f.id === id);
    if (!friends.some(f => f.id === id) && !(chat.threads[id] || []).length) {
      // Writing to people is limited to friends (or those who wrote first): offer to add as a friend.
      try { await cloud.addFriend(id); friends.push(p); toast(t('friend_added', p.display_name)); } catch (err) { toast(t('save_err')); return; }
    }
    chat.partners[id] = { id, name: p.display_name, avatar: p.avatar_url || null };
    popPage(); setTimeout(() => openConversation(id, { recipeId }), 280);
  });
  setTimeout(() => $('#nc-q', el).focus(), 350);
}

/* ---------------- Events ---------------- */
function bindChatEvents() {
  document.addEventListener('click', async e => {
    const open = e.target.closest('[data-chat-open]');
    if (open) { openConversation(open.dataset.chatOpen); return; }
    const toastEl = e.target.closest('#chat-toast');
    if (toastEl && toastEl.dataset.partner) { toastEl.classList.remove('show'); while (state.pages.length) popPage(); state.tab = 'chat'; renderTab(); openConversation(toastEl.dataset.partner); return; }
    const c = e.target.closest('[data-chat]');
    if (c) {
      const page = c.closest('.chat-page');
      switch (c.dataset.chat) {
        case 'new': openNewChat(); break;
        case 'notif': enableNotifications(); break;
        case 'send': if (page) chatSend(page); break;
        case 'tag': openRecipePicker(id => { chat.draftRecipe = id; renderOpenConversation(); }); break;
        case 'untag': chat.draftRecipe = null; renderOpenConversation(); break;
      }
      return;
    }
    const msg = e.target.closest('.msg.mine .bubble, .msg.mine small');
    if (msg) {
      const id = msg.closest('.msg').dataset.msg;
      const v = await actionSheet(t('chat_msg'), [{ label: '🗑 ' + t('chat_delete'), danger: true, value: true }]);
      if (v) {
        try {
          await cloud.deleteMessage(id);
          const list = chat.threads[chat.open] || [];
          const i = list.findIndex(m => m.id === id); if (i >= 0) list.splice(i, 1);
          renderOpenConversation();
        } catch (err) { toast(t('save_err')); }
      }
    }
  });
  document.addEventListener('keydown', e => {
    if (e.target.id === 'chat-input' && e.key === 'Enter' && !e.shiftKey && !/Android|iPhone|iPad/i.test(navigator.userAgent)) {
      e.preventDefault(); const page = e.target.closest('.chat-page'); if (page) chatSend(page);
    }
  });
  document.addEventListener('input', e => {
    if (e.target.id === 'chat-input') { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 130) + 'px'; }
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { markOpenRead(); if (chat.user) refreshChat(); } });
  if (navigator.serviceWorker) navigator.serviceWorker.addEventListener('message', e => {
    if (e.data && e.data.type === 'open-chat' && e.data.partner) { while (state.pages.length) popPage(); state.tab = 'chat'; renderTab(); openConversation(e.data.partner); }
  });
}
