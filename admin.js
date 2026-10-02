/* Rifay Umami — admin panel: who registered, how many, how active. Only works for accounts in app_admins:
   the database functions refuse everybody else, so this file holds no secrets. Loaded before app.js. */
'use strict';

const ADMIN_PROVIDERS = { email: ['📧', 'Имейл'], facebook: ['🟦', 'Facebook'], google: ['🔴', 'Google'] };
const dayKey = d => { const x = new Date(d); return x.getFullYear() + '-' + (x.getMonth() + 1) + '-' + x.getDate(); };
const startOfDay = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };

function relTime(iso) {
  if (!iso) return t('admin_never');
  const min = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (min < 2) return t('admin_just_now');
  if (min < 60) return t('admin_min_ago', min);
  const h = Math.round(min / 60);
  if (h < 24) return t('admin_h_ago', h);
  const d = Math.round(h / 24);
  if (d < 31) return t('admin_d_ago', d);
  return new Date(iso).toLocaleDateString(settings.lang === 'bg' ? 'bg-BG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
const fullDate = iso => iso ? new Date(iso).toLocaleString(settings.lang === 'bg' ? 'bg-BG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

function adminSummary(users) {
  const today = startOfDay(Date.now()), d7 = today - 6 * 864e5, d30 = today - 29 * 864e5;
  const created = u => Date.parse(u.r_created);
  const perDay = {};
  users.forEach(u => { const k = dayKey(u.r_created); perDay[k] = (perDay[k] || 0) + 1; });
  const days = Array.from({ length: 30 }, (_, i) => { const d = new Date(d30 + i * 864e5); return { d, n: perDay[dayKey(d)] || 0 }; });
  const providers = {};
  users.forEach(u => { providers[u.r_provider] = (providers[u.r_provider] || 0) + 1; });
  return {
    total: users.length,
    today: users.filter(u => created(u) >= today).length,
    week: users.filter(u => created(u) >= d7).length,
    month: users.filter(u => created(u) >= d30).length,
    active7: users.filter(u => u.r_last_login && Date.parse(u.r_last_login) >= d7).length,
    withRecipes: users.filter(u => u.r_recipes > 0).length,
    cooking: users.filter(u => u.r_cooked > 0).length,
    unconfirmed: users.filter(u => !u.r_confirmed).length,
    blocked: users.filter(u => u.r_blocked).length,
    days, providers,
  };
}

function adminChartHTML(days) {
  const max = Math.max(1, ...days.map(x => x.n));
  return `<div class="adm-chart" role="img" aria-label="${esc(t('admin_chart'))}">${days.map(x => `<div class="adm-bar" title="${esc(x.d.toLocaleDateString('bg-BG', { day: 'numeric', month: 'short' }))}: ${x.n}">
      <i style="height:${Math.max(3, Math.round(x.n / max * 100))}%" class="${x.n ? 'on' : ''}"></i></div>`).join('')}</div>
    <div class="adm-axis"><span>${esc(days[0].d.toLocaleDateString(settings.lang === 'bg' ? 'bg-BG' : 'en-GB', { day: 'numeric', month: 'short' }))}</span><span>${esc(t('admin_today'))}</span></div>`;
}

const ACTIVITY_SERIES = [['r_recipes', 'admin_s_recipes', '#E8552F'], ['r_messages', 'admin_s_messages', '#3A7BF2'], ['r_ratings', 'admin_s_ratings', '#F2A33C'], ['r_cooked', 'admin_s_cooked', '#2FA36B']];
function adminActivityHTML(act) {
  if (!act || !act.length) return `<p class="hint">${esc(t('admin_activity_none'))}</p>`;
  const lang = settings.lang === 'bg' ? 'bg-BG' : 'en-GB';
  const maxActive = Math.max(1, ...act.map(d => +d.r_active));
  const total = d => ACTIVITY_SERIES.reduce((n, [k]) => n + (+d[k]), 0);
  const maxTotal = Math.max(1, ...act.map(total));
  const label = d => new Date(d.r_day).toLocaleDateString(lang, { day: 'numeric', month: 'short' });
  const sum = k => act.reduce((n, d) => n + (+d[k]), 0);
  return `<div class="rating-box adm-chart-box" style="display:block">
      <div class="adm-chart-title">${esc(t('admin_active_per_day'))}</div>
      <div class="adm-chart">${act.map(d => `<div class="adm-bar" title="${esc(label(d))}: ${d.r_active}"><i style="height:${Math.max(3, Math.round(+d.r_active / maxActive * 100))}%" class="${+d.r_active ? 'on' : ''}"></i></div>`).join('')}</div>
      <div class="adm-axis"><span>${esc(label(act[0]))}</span><span>${esc(t('admin_today'))}</span></div>
    </div>
    <div class="rating-box adm-chart-box" style="display:block;margin-top:10px">
      <div class="adm-chart-title">${esc(t('admin_actions_per_day'))}</div>
      <div class="adm-chart">${act.map(d => `<div class="adm-bar stack" title="${esc(label(d))}: ${total(d)}">${ACTIVITY_SERIES.map(([k, , col]) => +d[k] ? `<i style="height:${Math.max(2, Math.round(+d[k] / maxTotal * 100))}%;background:${col}"></i>` : '').join('')}</div>`).join('')}</div>
      <div class="adm-legend">${ACTIVITY_SERIES.map(([k, name, col]) => `<span><i style="background:${col}"></i>${esc(t(name))} <b>${sum(k)}</b></span>`).join('')}</div>
    </div>`;
}

function adminUserRow(u) {
  const [ico, label] = ADMIN_PROVIDERS[u.r_provider] || ['👤', u.r_provider];
  const name = u.r_name || '—';
  const badge = u.r_is_admin ? `<span class="adm-badge admin">🛡 ${esc(t('admin_badge'))}</span>` : u.r_blocked ? `<span class="adm-badge blocked">⛔ ${esc(t('admin_blocked'))}</span>` : '';
  const action = u.r_is_admin ? '' : `<button class="adm-act ${u.r_blocked ? '' : 'danger'}" data-adm-block="${esc(u.r_id)}" data-blocked="${u.r_blocked ? 1 : 0}">${esc(t(u.r_blocked ? 'admin_unblock' : 'admin_block'))}</button>`;
  return `<div class="adm-user ${u.r_blocked ? 'is-blocked' : ''}">
    <span class="avatar">${esc(name.charAt(0).toUpperCase())}</span>
    <div class="adm-user-main">
      <b>${esc(name)} ${badge}</b>
      <small class="adm-email">${esc(u.r_email || '')}</small>
      <small>${ico} ${esc(label)} · ${esc(t('admin_joined'))}: <span title="${esc(fullDate(u.r_created))}">${esc(relTime(u.r_created))}</span> · ${esc(t('admin_last'))}: ${esc(relTime(u.r_last_login))}${u.r_confirmed ? '' : ' · ⚠️ ' + esc(t('admin_unconfirmed'))}</small>
    </div>
    <div class="adm-nums"><span title="${esc(t('admin_recipes_short'))}">📖 ${u.r_recipes}</span><span title="${esc(t('admin_cooked_short'))}">🍳 ${u.r_cooked}</span>${action}</div>
  </div>`;
}

function adminBodyHTML(users, totals, q = '', act = null) {
  const s = adminSummary(users);
  const kpi = (n, label, sub = '') => `<div class="adm-kpi"><b>${n}</b><span>${esc(label)}</span>${sub ? `<small>${esc(sub)}</small>` : ''}</div>`;
  const term = q.trim().toLowerCase();
  const list = term ? users.filter(u => ((u.r_name || '') + ' ' + (u.r_email || '')).toLowerCase().includes(term)) : users;
  return `<div class="adm-kpis">
      ${kpi(s.total, t('admin_total'))}${kpi(s.today, t('admin_today'))}${kpi(s.week, t('admin_7d'))}${kpi(s.month, t('admin_30d'))}
    </div>
    <div class="group-label">${esc(t('admin_chart'))}</div>
    <div class="rating-box adm-chart-box" style="display:block">${adminChartHTML(s.days)}</div>
    <div class="group-label">${esc(t('admin_activity_title'))}</div>
    ${adminActivityHTML(act)}
    <div class="group-label">${esc(t('admin_activity'))}</div>
    <div class="adm-kpis small">
      ${kpi(s.active7, t('admin_active7'))}${kpi(s.withRecipes, t('admin_with_recipes'))}${kpi(s.cooking, t('admin_cooking'))}${kpi(s.unconfirmed, t('admin_unconfirmed'))}${kpi(s.blocked, t('admin_blocked'))}
    </div>
    ${totals ? `<div class="adm-totals">📖 ${totals.t_recipes} ${esc(t('admin_recipes'))} · 💬 ${totals.t_messages} ${esc(t('admin_msgs'))} · ⭐ ${totals.t_ratings} ${esc(t('admin_ratings'))} · 👥 ${totals.t_friends} ${esc(t('admin_friends'))}</div>` : ''}
    <div class="group-label">${esc(t('admin_providers'))}</div>
    <div class="adm-providers">${Object.entries(s.providers).sort((a, b) => b[1] - a[1]).map(([k, n]) => {
      const [ico, label] = ADMIN_PROVIDERS[k] || ['👤', k];
      return `<span class="pill">${ico} ${esc(label)} <b>${n}</b></span>`;
    }).join('')}</div>
    <div class="group-label">${esc(t('admin_list'))} (${list.length})</div>
    <div class="group"><label class="search-field" style="border-radius:0;background:transparent">${I.search}
      <input id="adm-q" type="search" autocomplete="off" placeholder="${esc(t('admin_search'))}" value="${esc(q)}"></label></div>
    <div class="adm-users">${list.length ? list.map(adminUserRow).join('') : `<p class="hint">${esc(t('no_results'))}</p>`}</div>
    <p class="hint" style="margin-top:14px">${esc(t('admin_privacy_note'))}</p>`;
}

function adminCSV(users) {
  const esc2 = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const head = ['name', 'email', 'provider', 'registered', 'last_login', 'email_confirmed', 'recipes', 'times_cooked'];
  const rows = users.map(u => [u.r_name, u.r_email, u.r_provider, u.r_created, u.r_last_login, u.r_confirmed ? 'yes' : 'no', u.r_recipes, u.r_cooked]);
  return '﻿' + [head, ...rows].map(r => r.map(esc2).join(',')).join('\n');
}

async function openAdminUsers() {
  const el = pushPage(`<div class="navbar">
      <button class="nav-btn" data-action="back">${esc(t('close'))}</button>
      <h1>🛡 ${esc(t('admin_users'))}</h1>
      <button class="nav-btn" data-adm="refresh" aria-label="${esc(t('admin_refresh'))}">↻</button>
    </div>
    <div class="form"><div id="adm-body"><div class="empty"><div class="spinner" style="border-top-color:var(--accent);border-color:var(--fill-strong);margin:0 auto"></div></div></div>
      <div style="margin-top:16px"><button class="btn" data-adm="csv">⬇ ${esc(t('admin_export'))}</button></div></div>`, { modal: true });
  let users = [], totals = null, act = null;
  const body = $('#adm-body', el);
  const load = async () => {
    try {
      [users, totals, act] = await Promise.all([cloud.adminUsers(), cloud.adminTotals().catch(() => null), cloud.adminActivity().catch(() => null)]);
      body.innerHTML = adminBodyHTML(users, totals, $('#adm-q', el) ? $('#adm-q', el).value : '', act);
    } catch (e) {
      body.innerHTML = `<div class="empty"><div class="big">🔒</div><h3>${esc(t('admin_err_title'))}</h3><p>${esc(t('admin_err'))}</p></div>`;
    }
  };
  await load();
  el.addEventListener('input', e => {
    if (e.target.id === 'adm-q') {
      const pos = e.target.selectionStart;
      body.innerHTML = adminBodyHTML(users, totals, e.target.value, act);
      const i = $('#adm-q', el); i.focus(); i.setSelectionRange(pos, pos);
    }
  });
  el.addEventListener('click', async e => {
    const blk = e.target.closest('[data-adm-block]');
    if (blk) {
      const u = users.find(x => x.r_id === blk.dataset.admBlock);
      if (!u) return;
      const block = !u.r_blocked;
      const ok = await actionSheet(t(block ? 'admin_block_q' : 'admin_unblock_q', u.r_name || u.r_email),
        [{ label: t(block ? 'admin_block' : 'admin_unblock'), danger: block, value: true }]);
      if (!ok) return;
      try {
        await cloud.adminSetBlocked(u.r_id, block);
        u.r_blocked = block;
        const q = $('#adm-q', el);
        body.innerHTML = adminBodyHTML(users, totals, q ? q.value : '', act);
        toast(t(block ? 'admin_blocked_done' : 'admin_unblocked_done'));
      } catch (err) { toast(t('save_err')); }
      return;
    }
    const b = e.target.closest('[data-adm]');
    if (!b) return;
    if (b.dataset.adm === 'refresh') { load(); toast(t('admin_refreshed')); }
    if (b.dataset.adm === 'csv') {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([adminCSV(users)], { type: 'text/csv;charset=utf-8' }));
      a.download = `rifay-umami-users-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }
  });
}
