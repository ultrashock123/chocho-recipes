/* Rifay Umami — invitations. Every user has a personal link; whoever registers through it becomes a friend of the
   inviter. The e-mail is sent from the user's own mail app (mailto) or any messenger via the share sheet.
   Loaded before app.js; uses app helpers (t, esc, $, pushPage, toast …) only at call time. */
'use strict';

const INVITE_KEY = 'chocho.invite';
const SITE_URL = 'https://rifay-recipes.netlify.app';
let inviteName = ''; // who invited the person who just opened an invite link

function captureInviteFromUrl() {
  try {
    const p = new URLSearchParams(location.search).get('invite');
    if (p && /^[a-z0-9]{6,32}$/i.test(p)) localStorage.setItem(INVITE_KEY, p);
    if (p) history.replaceState(null, '', location.pathname + location.hash);
  } catch (e) {}
}
const pendingInvite = () => { try { return localStorage.getItem(INVITE_KEY) || ''; } catch (e) { return ''; } };

async function loadInviteInfo() {
  const code = pendingInvite();
  if (!code || typeof cloud === 'undefined' || !sb) return;
  try { inviteName = await cloud.inviteInfo(code); } catch (e) { inviteName = ''; }
  if (typeof authView !== 'undefined' && authView) renderAuth();
}

// After signing in with a pending invite: become friends with the person who invited us.
async function applyPendingInvite() {
  const code = pendingInvite();
  if (!code || auth.mode !== 'user') return;
  try {
    const inviter = await cloud.acceptInvite(code);
    try { localStorage.removeItem(INVITE_KEY); } catch (e) {}
    inviteName = '';
    if (inviter) toast(t('invite_accepted'));
  } catch (e) { /* offline or not ready: the code stays for the next start */ }
}

const parseEmails = text => [...new Set(String(text || '').split(/[\s,;]+/).map(s => s.trim().toLowerCase()).filter(s => /^\S+@\S+\.\S+$/.test(s)))].slice(0, 30);

/* ---------------- "Invite" section of the Social tab ---------------- */
const inviteState = { code: '', loaded: false, failed: false, sent: 0, joined: 0 };
const inviteLink = () => `${SITE_URL}/?invite=${inviteState.code}`;
const inviteMessage = () => `${t('invite_text', myName() || 'Rifay Umami')}\n${inviteLink()}`;

async function loadInviteState() {
  try {
    inviteState.code = await cloud.myInviteCode();
    inviteState.failed = false;
    const s = await cloud.inviteStats().catch(() => ({ sent: 0, joined: 0 }));
    inviteState.sent = s.sent; inviteState.joined = s.joined;
  } catch (e) { inviteState.failed = true; }
  inviteState.loaded = true;
  if (state.tab === 'chat' && social.section === 'invite' && !state.pages.length) renderTab();
}

function inviteSectionHTML() {
  if (!inviteState.loaded) { loadInviteState(); return `<div class="empty"><div class="spinner" style="border-top-color:var(--accent);border-color:var(--fill-strong);margin:0 auto"></div></div>`; }
  if (inviteState.failed) return `<div class="empty"><div class="big">🔒</div><p>${esc(t('invite_need_update'))}</p></div>`;
  return `<p class="muted" style="margin:6px 4px 0">${esc(t('invite_intro'))}</p>
    <div class="adm-kpis" style="grid-template-columns:repeat(2,1fr)">
      <div class="adm-kpi"><b>${inviteState.sent}</b><span>${esc(t('invite_stat_sent'))}</span></div>
      <div class="adm-kpi"><b>${inviteState.joined}</b><span>${esc(t('invite_stat_joined'))}</span></div></div>
    <div class="group-label">${esc(t('invite_emails'))}</div>
    <div class="group"><textarea class="field" id="inv-emails" rows="3" placeholder="${esc(t('invite_emails_ph'))}" style="min-height:84px"></textarea></div>
    <div class="invite-preview"><small>${esc(t('invite_preview'))}</small><div>${esc(inviteMessage()).replace(/\n/g, '<br>')}</div></div>
    <div class="invite-actions">
      <button class="btn primary" data-inv="mail">✉️ ${esc(t('invite_send_mail'))}</button>
      <button class="btn" data-inv="share">📤 ${esc(t('invite_share'))}</button>
      <button class="btn" data-inv="copy">📋 ${esc(t('invite_copy'))}</button>
    </div>
    <p class="hint" style="margin-top:12px">${esc(t('invite_hint'))}</p>`;
}

async function handleInviteClick(b) {
  const kind = b.dataset.inv;
  if (kind === 'mail') {
    const box = document.getElementById('inv-emails');
    const list = parseEmails(box ? box.value : '');
    if (!list.length) { toast(t('invite_need_email')); return; }
    cloud.logInvites(list).then(() => { inviteState.sent += list.length; }).catch(() => {});
    location.href = `mailto:?bcc=${encodeURIComponent(list.join(','))}&subject=${encodeURIComponent(t('invite_subject'))}&body=${encodeURIComponent(inviteMessage())}`;
    toast(t('invite_mail_opened', list.length));
  } else if (kind === 'share') {
    try {
      if (navigator.share) await navigator.share({ title: t('invite_subject'), text: t('invite_text', myName() || 'Rifay Umami'), url: inviteLink() });
      else { await navigator.clipboard.writeText(inviteMessage()); toast(t('invite_copied')); }
    } catch (err) { /* cancelled */ }
  } else if (kind === 'copy') {
    try { await navigator.clipboard.writeText(inviteLink()); toast(t('invite_copied')); } catch (err) { window.prompt(t('invite_copy'), inviteLink()); }
  }
}

// Everywhere the app used to open a separate invite/friends page, it now goes to the Social tab.
function openInvitePage() { goSocial('invite'); }
