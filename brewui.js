/* Rifay Umami — brewing UI: recipe view, brew-day plan with an alarm for every timed step, editor section.
   Uses helpers from app.js (esc, t, $, state, settings, toast, …) only when called. Loaded after brew.js, before app.js. */
'use strict';

const isBeer = r => !!r && r.kind === 'beer';
const brewMode = () => settings.mode === 'brew';
const curCats = () => (brewMode() ? BEER_STYLES : CATEGORIES);
const bFmtMin = m => (m >= 60 ? `${Math.floor(m / 60)} ч${m % 60 ? ' ' + (m % 60) + ' мин' : ''}` : `${bnum(m, 0)} мин`);

/* ---------------- Recipe view ---------------- */
function beerStatsHTML(b) {
  const s = beerStats(b);
  const color = srmToHex(s.srm || 0);
  const cell = (v, lab) => `<div class="bstat"><b>${v}</b><span>${lab}</span></div>`;
  return `<div class="bstats">
    ${cell(bnum(s.ogP, 1) + '°P', 'Начална плътност')}${cell(bnum(s.fgP, 1) + '°P', 'Крайна плътност')}
    ${cell(bnum(s.abv, 1) + '%', 'Алкохол')}${cell(bnum(s.ibu, 0), 'Горчивина IBU')}
    <div class="bstat"><b><i class="beer-dot" style="background:${color}"></i>${bnum(s.srm, 1)}</b><span>Цвят SRM</span></div>
  </div>${s.computed ? '<p class="hint" style="margin:6px 4px 0">Изчислено от състава (приблизително).</p>' : ''}`;
}
function hopTiming(h) {
  if (h.use === 'dry hop') return h.highKrausen ? 'на върха на ферментацията' : h.days ? `${h.days} ${h.days === 1 ? 'ден' : 'дни'}` : '';
  if (h.use === 'whirlpool') return `${h.min || 0} мин${h.temp ? ` при ${h.temp}°C` : ''}`;
  if (h.use === 'first wort') return 'от началото';
  return h.min != null ? `${h.min} мин` : '';
}
function beerRecipeHTML(b0, perHop) {
  const b = b0;
  const rows = (arr, fn) => (arr.length ? `<ul class="brow-list">${arr.map(fn).join('')}</ul>` : '<p class="muted">—</p>');
  const total = (b.fermentables || []).reduce((s, f) => s + (f.kg || 0), 0);
  const ferm = rows(b.fermentables || [], f => `<li><span class="q">${bkg(f.kg)}</span><span class="n">${esc(f.name)}</span><span class="m">${total ? bnum(f.kg / total * 100, 0) + '%' : ''}</span></li>`);
  const hops = rows(b.hops || [], (h, i) => `<li><span class="q">${bg_(h.g)}</span><span class="n">${esc(h.name)}${h.aa ? ` <small>${bnum(h.aa)}% AA</small>` : ''}</span>
    <span class="m">${esc(USE_BG[h.use] || h.use)}${hopTiming(h) ? ' · ' + esc(hopTiming(h)) : ''}${perHop && perHop[i] > 0.05 ? ` · ${bnum(perHop[i], 1)} IBU` : ''}</span></li>`);
  const oth = (b.others || []).length ? `<h3 class="block-title">Други съставки</h3>${rows(b.others, o => `<li><span class="q">${o.unit && o.unit !== 'g' ? bnum(o.g, 1) + ' ' + esc(o.unit) : bg_(o.g)}</span><span class="n">${esc(o.name)}</span><span class="m">${esc(USE_BG[o.use] || o.use)}${o.min ? ' · ' + o.min + ' мин' : ''}</span></li>`)}` : '';
  const y = b.yeast;
  const yeast = y && y.name ? `<h3 class="block-title">Дрожди</h3><div class="yeast-box"><b>${esc(y.name)}</b>
    <span>${[y.form, y.att ? `атенюация ${bnum(y.att)}%` : '', y.flocc ? `флокулация ${esc(y.flocc)}` : '', y.ferm ? `ферментация ${y.ferm}°C` : '', y.tmin && y.tmax ? `оптимално ${bnum(y.tmin)}–${bnum(y.tmax)}°C` : '', y.starter ? 'със стартер' : ''].filter(Boolean).join(' · ')}</span></div>` : '';
  const mash = (b.mash || []).length ? `<h3 class="block-title">Майшване</h3>${rows(b.mash, (m, i) => `<li><span class="q">${i + 1}.</span><span class="n">${esc(MASH_TYPES[m.type] || m.type)}</span>
    <span class="m">${m.targetC != null ? m.targetC + '°C' : m.startC != null ? m.startC + '°C' : ''} · ${m.min} мин${m.L ? ' · ' + bl(m.L) : ''}</span></li>`)}
    ${b.thickness ? `<p class="hint" style="margin:6px 4px 0">Гъстота на майша: ${bnum(b.thickness)} л/кг${b.grainTempC != null ? ` · температура на малца ${b.grainTempC}°C` : ''}</p>` : ''}` : '';
  const wlab = { strike: 'Вода за майш', mashVol: 'Обем на майша', grainAbs: 'Поема малцът', sparge: 'Вода за промиване', preBoil: 'Преди варене', boilOff: 'Изпарение', postBoil: 'След варене',
    kettleLoss: 'Загуби в казана', topOff: 'Доливане', fermenter: 'Във ферментатора', total: 'Обща вода', misc: 'Други загуби', lauterLoss: 'Загуби при филтриране' };
  const water = (b.water || []).length ? `<h3 class="block-title">Вода и обеми</h3><ul class="brow-list">${b.water.map(w => `<li><span class="q">${bl(Math.abs(w.L))}</span><span class="n">${esc(wlab[w.key] || w.label)}</span>
    <span class="m">${w.L < 0 ? 'загуба' : ''}</span></li>`).join('')}</ul>` : '';
  const pr = b.priming;
  let prime = '';
  if (pr && pr.vol) {
    const sug = primingSugarG(b.batchL || 20, pr.vol, (y && y.ferm) || 20);
    prime = `<h3 class="block-title">Газиране</h3><p class="prose" style="margin:0 4px">Цел: <b>${bnum(pr.vol, 2)} обема CO₂</b>.
      За бутилиране с захар: около <b>${bg_(sug.grams)}</b> трапезна захар за ${bl(b.batchL || 20)}. За кег: около <b>${bnum(kegPressureBar(pr.vol, 4), 2)} бара</b> при 4°C.</p>`;
  }
  return `<div class="brew-recipe">
    <h3 class="block-title">Малц и ферментируеми <small>общо ${bkg(total)}</small></h3>${ferm}
    <h3 class="block-title">Хмел <small>общо ${bg_((b.hops || []).reduce((s, h) => s + (h.g || 0), 0))}</small></h3>${hops}${oth}${yeast}${mash}${water}${prime}</div>`;
}
function beerSummaryPills(b) {
  return [
    b.styleName ? `<span class="pill">🍺 ${esc(b.styleName)}</span>` : '',
    `<span class="pill">🧪 ${esc(METHODS[b.method] || '')}</span>`,
    b.batchL ? `<span class="pill">🛢 ${bl(b.batchL)}</span>` : '',
    b.boilMin ? `<span class="pill">⏱ варене ${b.boilMin} мин</span>` : '',
    b.eff ? `<span class="pill">⚙️ ефективност ${bnum(b.eff, 0)}%</span>` : '',
  ].join('');
}
const beerText = r => {
  const b = r.beer || {}, s = beerStats(b);
  return [r.title, r.source ? `Автор: ${r.source}` : '', `${b.styleName || ''} · ${bl(b.batchL)} · ${bnum(s.ogP, 1)}°P → ${bnum(s.fgP, 1)}°P · ${bnum(s.abv, 1)}% · ${bnum(s.ibu, 0)} IBU · SRM ${bnum(s.srm, 1)}`,
    '', beerIngredientLines(b).map(x => (x.startsWith('## ') ? '\n' + x.slice(3) + ':' : '• ' + x)).join('\n'), '', r.notes || '', (r.links || []).map(l => l.url).join('\n')].join('\n').replace(/\n{3,}/g, '\n\n').trim();
};

/* ---------------- Brew-day plan ---------------- */
// Steps in order; "at" (minutes after the boil starts) makes a step part of the boil schedule, "min" gives it a timer.
function brewPlan(r) {
  const b = r.beer, S = [];
  const kgAll = (b.fermentables || []).reduce((s, f) => s + (f.kg || 0), 0);
  const wv = k => {   // volumes from the import when there are some, otherwise worked out from the recipe
    const w = (b.water || []).find(x => x.key === k)?.L;
    if (w != null) return w;
    if (k === 'strike') return kgAll ? kgAll * (b.thickness || 3) : undefined;
    if (k === 'sparge') return kgAll && b.boilL ? Math.max(0, b.boilL - (kgAll * (b.thickness || 3) - kgAll)) : undefined;
    if (k === 'preBoil') return b.boilL || undefined;
    return undefined;
  };
  const add = (phase, text, o = {}) => S.push(Object.assign({ phase, text, id: 's' + S.length }, o));
  const hopsBy = use => (b.hops || []).filter(h => h.use === use);
  const names = hs => hs.map(h => `${bg_(h.g)} ${h.name}`).join(', ');
  const boilMin = b.boilMin || 60;
  const totalKg = (b.fermentables || []).reduce((s, f) => s + (f.kg || 0), 0);

  add('prep', `Приготви и претегли: малц ${bkg(totalKg)}, хмел ${bg_((b.hops || []).reduce((s, h) => s + h.g, 0))}, дрожди${b.yeast ? ' ' + b.yeast.name : ''}${(b.others || []).length ? ', ' + b.others.map(o => o.name).join(', ') : ''}.`);
  add('prep', 'Почисти и дезинфекцирай ферментатора и всичко, което ще докосне изстиналото сусло.');
  const total = wv('total');
  if (total) add('prep', `Подготви вода: общо около ${bl(total)}.`);

  // Mash
  const m0 = (b.mash || [])[0];
  const strikeV = wv('strike');
  const target0 = m0 ? (m0.targetC ?? m0.startC) : null;
  const sT = m0 && m0.startC != null && m0.type === 'strike' ? m0.startC : target0 != null ? strikeTemp(target0, b.thickness || 3, b.grainTempC ?? 20) : null;
  if (strikeV || sT != null) add('mash', `Загрей ${strikeV ? bl(strikeV) + ' вода' : 'водата за майша'}${sT != null ? ` до около ${bnum(sT, 0)}°C` : ''}.`);
  hopsBy('first wort').length && add('mash', `Първи сок (first wort): сложи в казана ${names(hopsBy('first wort'))}.`);
  hopsBy('mash').length && add('mash', `Добави в майша: ${names(hopsBy('mash'))}.`);
  (b.others || []).filter(o => o.use === 'mash').forEach(o => add('mash', `Добави в майша: ${bg_(o.g)} ${o.name}.`));
  add('mash', 'Добави смляния малц във водата, разбъркай да няма буци.');
  (b.mash || []).forEach((m, i) => {
    const t = m.targetC ?? m.startC;
    add('mash', `Майш ${i + 1}: задръж ${t != null ? t + '°C' : 'температурата'} за ${bFmtMin(m.min)}${m.type === 'infusion' && m.L ? ` (добави ${bl(m.L)} вода)` : ''}.`, { min: m.min, label: `Майш ${i + 1} приключи` });
  });
  add('mash', 'Йодов тест (по желание): капка сусло върху йод — ако не потъмнява, майшът е готов.');

  // Sparge / collection
  const sp = wv('sparge'), pre = wv('preBoil') || b.boilL;
  add('sparge', `Промий (sparge)${sp ? ' с ' + bl(sp) + ' вода' : ''} при около 76–78°C и събери сусло${pre ? ' до ' + bl(pre) : ''}.`);
  add('sparge', `Измери плътността преди варене${b.stats && b.stats.boilP ? ` (очаквана ~${bnum(b.stats.boilP, 1)}°P)` : ''} и обема.`);

  // Boil: a master timer that sets an alarm for every addition
  const adds = [];
  (b.hops || []).filter(h => h.use === 'boil' && (h.min || 0) > 0).forEach(h => adds.push({ min: h.min, text: `${bg_(h.g)} ${h.name}${h.aa ? ' (' + bnum(h.aa) + '% AA)' : ''}` }));
  (b.others || []).filter(o => o.use === 'boil' && (o.min || 0) > 0).forEach(o => adds.push({ min: o.min, text: `${bg_(o.g)} ${o.name}` }));
  const flame = (b.hops || []).filter(h => h.use === 'boil' && !(h.min > 0)), flameO = (b.others || []).filter(o => o.use === 'boil' && !(o.min > 0));
  add('boil', 'Загрей до кипене. Разбърквай при образуване на пяната, за да не прекипи.');
  const boilStep = add('boil', `Старт на варенето: ${bFmtMin(boilMin)}. Таймерът ще ти даде аларма за всяко добавяне.`, { boil: true, min: boilMin, label: 'Краят на варенето' });
  const byMin = {};
  adds.forEach(a => { (byMin[a.min] = byMin[a.min] || []).push(a.text); });
  Object.keys(byMin).map(Number).sort((a, c) => c - a).forEach(m => {
    const lab = m >= boilMin ? 'В началото на варенето' : `${bFmtMin(m)} до края`;
    add('boil', `${lab}: добави ${byMin[m].join(', ')}.`, { at: boilMin - m, alarm: 'Добави ' + byMin[m].join(', '), left: m });
  });
  if (flame.length || flameO.length) add('boil', `Край на варенето (flame-out): ${[...flame.map(h => `${bg_(h.g)} ${h.name}`), ...flameO.map(o => `${bg_(o.g)} ${o.name}`)].join(', ')}.`, { at: boilMin, alarm: 'Край на варенето — добави хмела за flame-out', left: 0 });
  add('boil', 'Изключи нагряването.', { at: boilMin, left: 0 });

  // Whirlpool
  const wps = hopsBy('whirlpool');
  if (wps.length) {
    const temp = wps[0].temp ?? 80, min = Math.max(...wps.map(h => h.min || 0));
    add('whirlpool', `Охлади сусло до ${temp}°C, направи водовъртеж.`);
    add('whirlpool', `Добави за водовъртеж: ${names(wps)}${min ? `; задръж ${bFmtMin(min)} при ${temp}°C` : ''}.`, min ? { min, label: 'Водовъртежът приключи' } : {});
  }

  // Cool, pitch, ferment
  const y = b.yeast || {};
  const ferm = y.ferm ?? 20;
  add('ferment', `Охлади бързо до ${ferm}°C.`);
  add('ferment', `Прехвърли във ферментатора${wv('fermenter') || b.batchL ? ' (около ' + bl(wv('fermenter') || b.batchL) + ')' : ''}, аерирай сусло, измери началната плътност${b.stats ? ` (очаквана ~${bnum(b.stats.ogP, 1)}°P)` : ''}.`);
  add('ferment', `Добави дрожди${y.name ? ': ' + y.name : ''}${y.starter ? ' (със стартер)' : ''}.`);
  add('ferment', `Ферментирай при ${ferm}°C${y.tmin && y.tmax ? ` (подходящо ${bnum(y.tmin)}–${bnum(y.tmax)}°C)` : ''}, на тъмно и със стабилна температура.`);
  const hk = hopsBy('dry hop').filter(h => h.highKrausen);
  if (hk.length) add('ferment', `Върху върха на ферментацията (high krausen): ${names(hk)}.`);
  const dh = hopsBy('dry hop').filter(h => !h.highKrausen);
  if (dh.length) {
    const days = Math.max(...dh.map(h => h.days || 0));
    add('ferment', `Сух хмел: ${names(dh)}${days ? ` — остави ${days} ${days === 1 ? 'ден' : 'дни'}` : ''}.`, days ? { days, label: 'Сухият хмел е готов — бутилирай или кегирай' } : {});
  }
  add('ferment', 'Измервай плътността. Когато е една и съща 2–3 дни, ферментацията е свършила.');

  // Bottling
  const pr = b.priming;
  if (pr && pr.vol) {
    const sug = primingSugarG(b.batchL || 20, pr.vol, ferm);
    add('bottle', `Газиране до ${bnum(pr.vol, 2)} обема CO₂: за бутилиране ~${bg_(sug.grams)} трапезна захар за ${bl(b.batchL || 20)}, или в кег ~${bnum(kegPressureBar(pr.vol, 4), 2)} бара при 4°C.`);
  } else add('bottle', 'Бутилирай или кегирай. Остави за газиране и отлежаване.');
  add('bottle', 'Почисти и дезинфекцирай съоръженията.');
  return S;
}
const PHASES = { prep: '🧼 Подготовка', mash: '🌾 Майшване', sparge: '💧 Промиване', boil: '🔥 Варене', whirlpool: '🌀 Водовъртеж', ferment: '🧫 Охлаждане и ферментация', bottle: '🍾 Бутилиране' };

/* ---------------- Brew clock: alarms that survive a reload ---------------- */
const BC_KEY = 'rifay.brewclock', BD_KEY = 'rifay.brewday.';
let bcAlarms = [], bcTick = null, bcQueue = [];
function bcLoad() { try { bcAlarms = JSON.parse(localStorage.getItem(BC_KEY) || '[]'); } catch (e) { bcAlarms = []; } }
function bcSave() { try { localStorage.setItem(BC_KEY, JSON.stringify(bcAlarms)); } catch (e) {} }
function bcSet(id, rid, label, ms) {
  unlockAudio();
  bcAlarms = bcAlarms.filter(a => a.id !== id);
  bcAlarms.push({ id, rid, label, at: Date.now() + ms });
  bcSave(); bcStartTick(); bcRender();
}
function bcClear(id) { bcAlarms = bcAlarms.filter(a => a.id !== id && !a.id.startsWith(id + '|')); bcSave(); bcRender(); }
const bcFind = id => bcAlarms.find(a => a.id === id);
function bcStartTick() { if (!bcTick) bcTick = setInterval(bcCheck, 500); }
function bcCheck() {
  const now = Date.now();
  const due = bcAlarms.filter(a => a.at <= now);
  if (due.length) { bcAlarms = bcAlarms.filter(a => a.at > now); bcSave(); due.sort((a, c) => a.at - c.at).forEach(a => ringWith(a.label)); }
  bcRender();
  if (!bcAlarms.length) { clearInterval(bcTick); bcTick = null; }
}
const bcFmt = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); if (s >= 86400) return `${Math.floor(s / 86400)} д ${Math.floor(s % 86400 / 3600)} ч`; return fmtTime(ms); };
function bcRender() {
  const now = Date.now();
  document.querySelectorAll('[data-bc-left]').forEach(el => {
    const a = bcFind(el.dataset.bcLeft);
    el.textContent = a ? bcFmt(a.at - now) : '';
    el.closest('.bstep')?.classList.toggle('running', !!a);
  });
  document.querySelectorAll('[data-bc-go]').forEach(btn => { const a = bcFind(btn.dataset.bcGo); btn.textContent = a ? '✕' : '▶'; btn.classList.toggle('on', !!a); });
}
function bcInit() { bcLoad(); const now = Date.now(); bcAlarms.filter(a => a.at <= now && now - a.at < 3600e3).forEach(a => ringWith(a.label)); bcAlarms = bcAlarms.filter(a => a.at > now); bcSave(); if (bcAlarms.length) bcStartTick(); }

/* ---------------- Brew-day page ---------------- */
const bdState = rid => { try { return JSON.parse(localStorage.getItem(BD_KEY + rid) || '{}'); } catch (e) { return {}; } };
const bdSave = (rid, s) => { try { localStorage.setItem(BD_KEY + rid, JSON.stringify(s)); } catch (e) {} };
function brewDayHTML(r, plan, st) {
  let phase = '', html = '';
  for (const s of plan) {
    if (s.phase !== phase) { phase = s.phase; html += `<div class="bphase">${PHASES[phase]}</div>`; }
    const done = (st.done || []).includes(s.id);
    const timed = s.min || s.days || s.at != null;
    const cid = `${r.id}|${s.id}`;
    let action = '';
    if (s.boil) action = `<button class="bgo" data-bc-boil="${s.id}" data-bc-go="${cid}">▶</button><span class="bleft" data-bc-left="${cid}"></span>`;
    else if (s.min) action = `<button class="bgo" data-bc-step="${s.id}" data-bc-go="${cid}">▶</button><span class="bleft" data-bc-left="${cid}"></span><small class="bdur">${bFmtMin(s.min)}</small>`;
    else if (s.days) action = `<button class="bgo" data-bc-step="${s.id}" data-bc-go="${cid}">▶</button><span class="bleft" data-bc-left="${cid}"></span><small class="bdur">${s.days} ${s.days === 1 ? 'ден' : 'дни'}</small>`;
    else if (s.at != null) action = `<span class="bleft" data-bc-left="${cid}"></span>`;
    html += `<div class="bstep ${done ? 'done' : ''} ${timed ? 'timed' : ''}" data-bstep="${s.id}"><span class="tick">${I.check}</span><div class="btext">${esc(s.text)}</div><div class="bact">${action}</div></div>`;
  }
  return html;
}
function openBrewDay(id) {
  const r = byId(id);
  if (!r || !isBeer(r)) return;
  const b = r.beer;
  const plan = brewPlan(r);
  const st = bdState(r.id);
  const el = pushPage(`<div class="navbar">
      <button class="nav-btn" data-action="back">Назад</button>
      <h1>🍺 Варка</h1><button class="nav-btn" data-timer="test" title="Тест на алармата">🔔</button>
    </div>
    <div class="brewday" data-rid="${esc(r.id)}">
      <h2 class="bd-title">${esc(r.title)}</h2>
      <p class="muted" style="margin:4px 4px 10px">${bl(b.batchL)} · ${bnum(beerStats(b).ogP, 1)}°P · ${bnum(beerStats(b).abv, 1)}% · ${bnum(beerStats(b).ibu, 0)} IBU. Докосни стъпка, за да я отметнеш. ▶ пуска таймер с аларма.</p>
      <div id="bd-steps">${brewDayHTML(r, plan, st)}</div>
      <div style="margin:22px 0 40px"><button class="btn primary" data-bd-finish>✅ Свърших варката</button>
        <button class="btn" data-bd-reset style="margin-top:10px">↺ Започни наново</button></div>
    </div>`, { modal: true, onClose: () => setWakeLock(false) });
  setWakeLock(true);
  bcRender();
  el.addEventListener('click', async e => {
    const goBtn = e.target.closest('[data-bc-go]');
    const cidOf = btn => btn.dataset.bcGo;
    if (goBtn) {
      e.stopPropagation();
      const cid = cidOf(goBtn);
      if (bcFind(cid) || bcAlarms.some(a => a.id.startsWith(cid + '|'))) { bcClear(cid); return; }
      const s = plan.find(x => x.id === (goBtn.dataset.bcStep || goBtn.dataset.bcBoil));
      if (!s) return;
      if (s.boil) {
        const base = Date.now();
        bcSet(cid, r.id, `${s.label}: ${r.title}`, s.min * 60000);
        plan.filter(x => x.at != null && x.alarm && x.at > 0).forEach(x => bcSet(`${r.id}|${x.id}`, r.id, `${x.alarm} (${bFmtMin(x.left)} до края)`.replace(' (0 мин до края)', ''), x.at * 60000));
        plan.filter(x => x.at != null).forEach(x => { /* shown with a live countdown */ });
        toast('Таймерът за варенето тръгна');
      } else if (s.min) bcSet(cid, r.id, `${s.label || 'Стъпката приключи'}: ${r.title}`, s.min * 60000);
      else if (s.days) { bcSet(cid, r.id, `${s.label}: ${r.title}`, s.days * 86400000); toast('Напомнянето работи, докато приложението е отворено или се отвори пак'); }
      return;
    }
    if (e.target.closest('[data-bd-finish]')) {
      if (!window.confirm('Да отбележа ли варката като направена?')) return;
      await markCooked(r, 1); toast('Варката е записана 🍺'); popPage(); refreshDetail(r); renderTab(); return;
    }
    if (e.target.closest('[data-bd-reset]')) {
      bdSave(r.id, {}); plan.forEach(s => bcClear(`${r.id}|${s.id}`));
      el.querySelectorAll('.bstep.done').forEach(x => x.classList.remove('done')); return;
    }
    const row = e.target.closest('.bstep');
    if (row) {
      row.classList.toggle('done'); haptic();
      const s = bdState(r.id); s.done = [...el.querySelectorAll('.bstep.done')].map(x => x.dataset.bstep); bdSave(r.id, s);
    }
  });
  // countdowns of the boil schedule are shown on the additions
  const sched = () => bcRender();
  sched();
}

/* ---------------- Editor section ---------------- */
const optList = (id, arr) => `<datalist id="${id}">${arr.map(x => `<option value="${esc(x)}">`).join('')}</datalist>`;
function beerEditorHTML(d) {
  const b = d.beer;
  const inp = (k, v, ph, w = '', attrs = '') => `<input class="bf ${w}" data-bf="${k}" value="${esc(v ?? '')}" placeholder="${esc(ph)}" inputmode="decimal" ${attrs}>`;
  const row = (kind, inner) => `<div class="brow" data-brow="${kind}">${inner}<button class="rm" data-b-rm aria-label="Remove">${I.x}</button></div>`;
  const useSel = (v, uses) => `<select class="bf" data-bf="use">${uses.map(u => `<option value="${u}" ${v === u ? 'selected' : ''}>${USE_BG[u]}</option>`).join('')}</select>`;
  const fermRow = f => row('ferm', `${inp('kg', f.kg, 'кг', 'sm')}<input class="bf grow" data-bf="name" list="dl-malt" value="${esc(f.name || '')}" placeholder="Малц / захар">${inp('ppg', f.ppg ?? '', 'PPG', 'xs')}${inp('lov', f.lov ?? '', '°L', 'xs')}`);
  const hopRow = h => row('hop', `${inp('g', h.g, 'г', 'sm')}<input class="bf grow" data-bf="name" list="dl-hop" value="${esc(h.name || '')}" placeholder="Хмел">${inp('aa', h.aa, 'AA%', 'xs')}${useSel(h.use || 'boil', HOP_USES)}${inp(h.use === 'dry hop' ? 'days' : 'min', h.use === 'dry hop' ? h.days : h.min, h.use === 'dry hop' ? 'дни' : 'мин', 'xs')}${inp('temp', h.temp, '°C', 'xs')}`);
  const othRow = o => row('oth', `${inp('g', o.g, 'г', 'sm')}<input class="bf grow" data-bf="name" value="${esc(o.name || '')}" placeholder="Напр. Irish moss">${useSel(o.use || 'boil', ['boil', 'mash', 'fermenter'])}${inp('min', o.min, 'мин', 'xs')}`);
  const mashRow = m => row('mash', `<select class="bf" data-bf="type">${Object.entries(MASH_TYPES).map(([k, v]) => `<option value="${k}" ${m.type === k ? 'selected' : ''}>${v}</option>`).join('')}</select>${inp('startC', m.startC, 'от °C', 'xs')}${inp('targetC', m.targetC, 'до °C', 'xs')}${inp('min', m.min, 'мин', 'xs')}${inp('L', m.L, 'л', 'xs')}`);
  const y = b.yeast || {};
  return `<div class="group-label">Основни данни</div>
    <div class="group bgrid">
      <label>Метод<select class="bf" data-bf="method">${Object.entries(METHODS).map(([k, v]) => `<option value="${k}" ${b.method === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label>Стил<input class="bf" data-bf="styleName" list="dl-style" value="${esc(b.styleName || '')}" placeholder="напр. American IPA"></label>
      <label>Обем във ферментатора (л)${inp('batchL', b.batchL, '20')}</label>
      <label>Обем преди варене (л)${inp('boilL', b.boilL, '25')}</label>
      <label>Варене (мин)${inp('boilMin', b.boilMin, '60')}</label>
      <label>Ефективност (%)${inp('eff', b.eff, '72')}</label>
      <label>Изпарение (л)${inp('boilOffL', b.boilOffL, '3')}</label>
    </div>
    <div class="bstats-live" id="b-live"></div>
    <div class="group-label">Малц и ферментируеми</div>
    <div class="group" id="b-ferm">${(b.fermentables || []).map(fermRow).join('')}<button class="row row-btn" data-b-add="ferm" style="color:var(--accent);font-weight:600">＋ Добави малц</button></div>
    <div class="group-label">Хмел</div>
    <div class="group" id="b-hop">${(b.hops || []).map(hopRow).join('')}<button class="row row-btn" data-b-add="hop" style="color:var(--accent);font-weight:600">＋ Добави хмел</button></div>
    <div class="group-label">Други съставки</div>
    <div class="group" id="b-oth">${(b.others || []).map(othRow).join('')}<button class="row row-btn" data-b-add="oth" style="color:var(--accent);font-weight:600">＋ Добави</button></div>
    <div class="group-label">Дрожди</div>
    <div class="group bgrid">
      <label class="wide">Име<input class="bf" data-bf="y.name" list="dl-yeast" value="${esc(y.name || '')}" placeholder="напр. Safale US-05"></label>
      <label>Атенюация (%)${inp('y.att', y.att, '75')}</label>
      <label>Ферментация (°C)${inp('y.ferm', y.ferm, '20')}</label>
      <label>Оптимум от (°C)${inp('y.tmin', y.tmin, '')}</label>
      <label>Оптимум до (°C)${inp('y.tmax', y.tmax, '')}</label>
      <label>Вид<select class="bf" data-bf="y.form"><option value="Dry" ${y.form === 'Dry' ? 'selected' : ''}>Сухи</option><option value="Liquid" ${y.form === 'Liquid' ? 'selected' : ''}>Течни</option></select></label>
    </div>
    <div class="group-label">Майшване</div>
    <div class="group" id="b-mash">${(b.mash || []).map(mashRow).join('')}<button class="row row-btn" data-b-add="mash" style="color:var(--accent);font-weight:600">＋ Добави стъпка</button></div>
    <div class="group bgrid">
      <label>Гъстота на майша (л/кг)${inp('thickness', b.thickness, '3')}</label>
      <label>Температура на малца (°C)${inp('grainTempC', b.grainTempC, '20')}</label>
      <label>Газиране (обеми CO₂)${inp('p.vol', b.priming && b.priming.vol, '2.4')}</label>
    </div>
    ${optList('dl-malt', MALT_NAMES)}${optList('dl-hop', HOP_NAMES)}${optList('dl-yeast', YEASTS.map(y => y.n))}${optList('dl-style', ['American IPA', 'American Pale Ale', 'Blonde Ale', 'English Bitter', 'Pilsner', 'Hefeweizen', 'Porter', 'Stout', 'Belgian Tripel', 'Saison', 'Kveik Ale'])}`;
}
const bBlank = kind => ({ ferm: { kg: '', name: '' }, hop: { g: '', name: '', aa: '', use: 'boil', min: 60 }, oth: { g: '', name: '', use: 'boil', min: '' }, mash: { type: 'strike', startC: '', targetC: 66, min: 60, L: '' } }[kind]);
const bRowHTML = (kind, d) => { const tmp = { beer: { fermentables: [], hops: [], others: [], mash: [], yeast: {} } }; const h = beerEditorHTML(Object.assign({}, d, { beer: Object.assign({}, tmp.beer, { [{ ferm: 'fermentables', hop: 'hops', oth: 'others', mash: 'mash' }[kind]]: [bBlank(kind)] }) })); const div = document.createElement('div'); div.innerHTML = h; return div.querySelector(`[data-brow="${kind}"]`).outerHTML; };
const nz = v => { const s = String(v ?? '').trim().replace(',', '.'); if (s === '') return null; const x = parseFloat(s); return isNaN(x) ? null : x; };
function readBeerForm(el, d) {
  const b = d.beer || (d.beer = {});
  const val = k => { const x = el.querySelector(`[data-bf="${k}"]`); return x ? x.value : ''; };
  b.method = val('method') || 'all-grain'; b.styleName = val('styleName').trim();
  ['batchL', 'boilL', 'boilMin', 'eff', 'boilOffL', 'thickness', 'grainTempC'].forEach(k => { b[k] = nz(val(k)); });
  const rowsOf = kind => [...el.querySelectorAll(`[data-brow="${kind}"]`)];
  const f = (row, k) => row.querySelector(`[data-bf="${k}"]`)?.value ?? '';
  b.fermentables = rowsOf('ferm').map(r => ({ kg: nz(f(r, 'kg')) || 0, name: f(r, 'name').trim(), ppg: nz(f(r, 'ppg')) ?? undefined, lov: nz(f(r, 'lov')) ?? undefined })).filter(x => x.name || x.kg);
  b.hops = rowsOf('hop').map(r => { const use = f(r, 'use') || 'boil'; const h = { g: nz(f(r, 'g')) || 0, name: f(r, 'name').trim(), form: 'pellet', aa: nz(f(r, 'aa')), use }; if (use === 'dry hop') h.days = nz(f(r, 'days')); else h.min = nz(f(r, 'min')); const tp = nz(f(r, 'temp')); if (tp != null) h.temp = tp; return h; }).filter(x => x.name || x.g);
  b.others = rowsOf('oth').map(r => ({ g: nz(f(r, 'g')) || 0, unit: 'g', name: f(r, 'name').trim(), use: f(r, 'use') || 'boil', min: nz(f(r, 'min')) })).filter(x => x.name);
  b.mash = rowsOf('mash').map(r => ({ type: f(r, 'type') || 'strike', startC: nz(f(r, 'startC')), targetC: nz(f(r, 'targetC')), min: nz(f(r, 'min')) || 0, L: nz(f(r, 'L')) })).filter(x => x.targetC != null || x.startC != null);
  const yn = val('y.name').trim();
  b.yeast = yn ? { name: yn, att: nz(val('y.att')), ferm: nz(val('y.ferm')), tmin: nz(val('y.tmin')), tmax: nz(val('y.tmax')), form: val('y.form') || 'Dry', starter: !!(b.yeast && b.yeast.starter), flocc: (b.yeast && b.yeast.flocc) || '' } : null;
  const vol = nz(val('p.vol')); b.priming = vol ? Object.assign({}, b.priming || {}, { vol }) : null;
  return b;
}
function renderBeerLive(el, d) {
  const box = el.querySelector('#b-live'); if (!box) return;
  const tmp = JSON.parse(JSON.stringify(d.beer || {})); readBeerForm(el, { beer: tmp }); delete tmp.stats;
  const c = calcBeer(tmp);
  box.innerHTML = `<div class="bstats compact"><div class="bstat"><b>${bnum(c.ogP, 1)}°P</b><span>OG</span></div><div class="bstat"><b>${bnum(c.fgP, 1)}°P</b><span>FG</span></div>
    <div class="bstat"><b>${bnum(c.abv, 1)}%</b><span>Алкохол</span></div><div class="bstat"><b>${bnum(c.ibu, 0)}</b><span>IBU</span></div>
    <div class="bstat"><b><i class="beer-dot" style="background:${srmToHex(c.srm)}"></i>${bnum(c.srm, 1)}</b><span>SRM</span></div></div>`;
}
// Fills PPG / colour / alpha acids / yeast defaults when a known name is chosen.
function beerAutofill(input, el) {
  const row = input.closest('.brow'), k = input.dataset.bf;
  if (row && k === 'name') {
    if (row.dataset.brow === 'ferm') { const m = maltInfo(input.value); row.querySelector('[data-bf="ppg"]').placeholder = m.ppg; row.querySelector('[data-bf="lov"]').placeholder = m.lov; }
    if (row.dataset.brow === 'hop') { const aa = hopAA(input.value), f = row.querySelector('[data-bf="aa"]'); if (aa != null && !f.value) f.value = aa; }
  }
  if (k === 'y.name') {
    const y = yeastInfo(input.value);
    if (y) [['y.att', y.att], ['y.ferm', y.ferm], ['y.tmin', y.tmin], ['y.tmax', y.tmax]].forEach(([kk, v]) => { const f = el.querySelector(`[data-bf="${kk}"]`); if (f && !f.value) f.value = v; });
    if (y) el.querySelector('[data-bf="y.form"]').value = y.form;
  }
  if (row && k === 'use') {   // dry hop uses days instead of minutes
    const timeField = row.querySelector('[data-bf="min"],[data-bf="days"]');
    if (timeField && row.dataset.brow === 'hop') { const dry = input.value === 'dry hop'; timeField.dataset.bf = dry ? 'days' : 'min'; timeField.placeholder = dry ? 'дни' : 'мин'; }
  }
}

/* ---------------- Wording that changes in the "Brewing" mode (everything else keeps the cooking texts) ---------------- */
const BREW_T = {
  bg: {
    home_title: 'Какво ще варим?', search_ph: 'Търси бира, малц, хмел…', surprise: 'Рулетка на бирата', surprise_sub: 'Завърти — късметът избира какво да сваряваш',
    all_recipes: 'Всички бири', recipes_n: n => `${n} ${n === 1 ? 'бира' : 'бири'}`, results: n => `${n} ${n === 1 ? 'бира' : 'бири'}`, st_recipes: 'бири',
    tried_rail: 'Сварявани', recent_rail: 'Последно добавени', cat_title: 'Стилове', f_categories: 'Стил', new_recipe: 'Нова бира', edit_recipe: 'Редакция на бира',
    roulette_title: 'Рулетка на бирата', roulette_sub: 'Завърти и съдбата избира какво ще варим', roulette_pool: 'От кой стил да избира?', roulette_win: 'Днес варим…',
    roulette_empty: 'Няма бири в този стил', open_recipe: 'Към бирата', cook: 'Варка', cooked_btn: 'Сварих я', tried: 'Сварявана', not_tried: 'Не е сварявана',
    cooked_n: n => `Сварена ×${n}`, cooked_toast: n => `🍺 Сварена ${n} ${n === 1 ? 'път' : 'пъти'}`, fav_cooked: 'Сварявани', fav_cooked_empty: 'Още нямаш сварени бири',
    fav_cooked_empty_sub: 'Натисни „Сварих я“ в бирата и тя ще се появи тук.', fav_empty_sub: 'Натисни ♥ на бира, за да я запазиш тук.', f_tried: 'Сварявана от мен',
    del_msg_delete: 'Рецептата за бира ще бъде изтрита завинаги, заедно със снимките ѝ.', ingredients: 'Състав', method: 'Процес',
  },
  en: {
    home_title: 'What shall we brew?', search_ph: 'Search beer, malt, hops…', surprise: 'Beer roulette', surprise_sub: 'Spin — let luck pick what to brew', all_recipes: 'All beers',
    recipes_n: n => `${n} ${n === 1 ? 'beer' : 'beers'}`, results: n => `${n} ${n === 1 ? 'beer' : 'beers'}`, st_recipes: 'beers', tried_rail: 'Brewed', cat_title: 'Styles',
    f_categories: 'Style', new_recipe: 'New beer', roulette_title: 'Beer roulette', roulette_sub: 'Spin and let fate pick what to brew', roulette_pool: 'Pick from style…',
    roulette_win: 'Today we brew…', roulette_empty: 'No beers in this style', open_recipe: 'Open beer', cook: 'Brew', cooked_btn: 'I brewed it', tried: 'Brewed', cooked_n: n => `Brewed ×${n}`,
    cooked_toast: n => `🍺 Brewed ${n} time${n === 1 ? '' : 's'}`, fav_cooked: 'Brewed', ingredients: 'Ingredients', method: 'Process',
  },
};

/* ---------------- Mode switch and small helpers used by the screens ---------------- */
const modeSwitchHTML = () => `<div class="mode-switch" role="tablist">
  <button class="${brewMode() ? '' : 'active'}" data-mode="cook">🍳 Готвене</button>
  <button class="${brewMode() ? 'active' : ''}" data-mode="brew">🍺 Варене</button></div>`;
function applyMode() { document.documentElement.dataset.mode = brewMode() ? 'brew' : 'cook'; }
const beerCardMeta = r => { const s = beerStats(r.beer || {}); return `${bnum(s.abv, 1)}% · ${bnum(s.ibu, 0)} IBU · ${bnum(s.srm, 0)} SRM`; };

/* ---------------- Detail page of a beer ---------------- */
function beerPlanPreview(r) {
  const plan = brewPlan(r);
  let phase = '', html = '';
  for (const s of plan) {
    if (s.phase !== phase) { phase = s.phase; html += `<div class="bphase">${PHASES[phase]}</div>`; }
    html += `<div class="bstep preview"><span class="tick dot"></span><div class="btext">${esc(s.text)}</div>${s.min ? `<small class="bdur">⏱ ${bFmtMin(s.min)}</small>` : s.days ? `<small class="bdur">⏱ ${s.days} дни</small>` : ''}</div>`;
  }
  return html;
}
function beerDetailHTML(r, tabSel = 'ing', batch = null) {
  const b0 = r.beer || {}, base = b0.batchL || 20, target = Math.min(500, Math.max(1, batch || base)), k = target / base;
  const b = scaleBeer(b0, k);
  const imgs = r.images || [];
  const cats = (r.categories || []).map(c => `<span class="pill">${CAT[c]?.emoji || ''} ${esc(catName(c))}</span>`).join('');
  const stats = beerStats(b0);
  const batchBar = `<div class="serv-bar"><span>🛢 Обем на варката</span>
    <div class="stepper"><button data-batch="-5" aria-label="-5">−</button><b>${bnum(target, 0)} л</b><button data-batch="5" aria-label="+5">+</button></div>
    <button class="chip small" data-batch-mult="0.5">½×</button><button class="chip small" data-batch-mult="2">2×</button>
    ${target !== base ? `<button class="link" data-batch="reset">Върни на ${bnum(base, 0)} л</button>` : '<small class="muted">Количествата се преизчисляват; горчивината и плътността остават.</small>'}</div>`;
  return `<div class="detail beer" data-id="${esc(r.id)}">
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
        ${r.cooked > 0 ? `<span class="pill ok">🍺 Сварена ×${r.cooked}</span>` : r.tried ? '<span class="pill ok">✓ Сварявана</span>' : ''}
        ${r.source ? `<button class="pill pill-btn" data-chef="${esc(r.source)}">👨‍🍳 ${esc(r.source)}</button>` : ''}
        ${!r.seed && auth.mode !== 'local' ? `<span class="pill ${r.visibility === 'private' ? 'warn' : ''}">${esc(t(r.visibility === 'private' ? 'pill_private' : 'pill_public'))}</span>` : ''}
        ${r.sharedWithMe ? `<span class="pill accent">📥 ${esc(r.sharedBy ? t('shared_by', r.sharedBy) : t('shared_pill'))}</span>` : ''}
        ${r.ownerName && !isMine(r) && !r.seed ? `<span class="pill">👤 ${esc(t('by_author', r.ownerName))}</span>` : ''}
        ${beerSummaryPills(b0)}${cats}
      </div>
      ${ratingsOn() ? ratingBoxHTML('recipe', r.id) : ''}
      ${beerStatsHTML(b0)}
      <div class="quick-actions">
        <button class="qa ${r.tried ? 'on' : ''}" data-action="cooked">${I.check}<span>${r.cooked > 0 ? `Сварена ×${r.cooked}` : r.tried ? 'Сварявана' : 'Сварих я'}</span></button>
        <button class="qa primary-qa" data-action="brewday">${I.flame}<span>Варка</span></button>
        <button class="qa" data-action="share">${I.share}<span>${esc(t('share'))}</span></button>
        ${canSend(r) ? `<button class="qa" data-action="send-user">${I.send}<span>${esc(t('send_user'))}</span></button>` : ''}
      </div>
      <div class="segmented">
        <button class="${tabSel === 'ing' ? 'active' : ''}" data-dtab="ing">Състав</button>
        <button class="${tabSel === 'method' ? 'active' : ''}" data-dtab="method">Процес</button>
      </div>
      <div data-dpane="ing" class="${tabSel === 'ing' ? '' : 'hidden'}">${batchBar}${beerRecipeHTML(b, stats.perHop)}</div>
      <div data-dpane="method" class="${tabSel === 'method' ? '' : 'hidden'}">
        <button class="btn primary" data-action="brewday" style="margin:6px 0 12px">🍺 Започни варка — със таймери и аларми</button>
        ${beerPlanPreview(Object.assign({}, r, { beer: b }))}
      </div>
      ${r.notes ? `<div class="notes-box"><h4>📝 ${esc(t('notes'))}</h4><div class="prose">${linkify(esc(r.notes))}</div></div>` : ''}
      ${videosHTML(r)}
      ${otherLinks(r).length ? `<h3 class="block-title">${esc(t('links'))}</h3><div class="links">${otherLinks(r).map(linkCard).join('')}</div>` : ''}
      ${canWrite() ? `<div class="danger-zone"><button class="danger-link" data-action="delete-flow">${esc(t('del_link'))}</button></div>` : ''}
    </div>
  </div>`;
}
