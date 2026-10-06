/* Rifay Umami — home brewing: data, calculations and import of recipes exported from Brewer's Friend.
   Pure functions, no dependency on the rest of the app (the UI lives in brewui.js). Loaded before app.js. */
'use strict';

/* ---------------- Styles (they play the role of the food categories) ---------------- */
const BEER_STYLES = [
  { id: 'b-ipa', emoji: '🍺', h: 38, bg: 'IPA', en: 'IPA', re: /\bipa\b|india pale|neipa|hazy|new england/i },
  { id: 'b-pale', emoji: '🌾', h: 46, bg: 'Пейл ейл', en: 'Pale ale', re: /pale ale|\bapa\b|\besb\b|bitter|amber ale/i },
  { id: 'b-blonde', emoji: '🌼', h: 52, bg: 'Блонд и златна', en: 'Blonde & golden', re: /blonde|golden|cream ale|k[oö]lsch|session/i },
  { id: 'b-lager', emoji: '🍻', h: 48, bg: 'Лагер и пилзнер', en: 'Lager & pilsner', re: /lager|pils|helles|bock|m[aä]rzen|vienna|dunkel|schwarz|rauch/i },
  { id: 'b-wheat', emoji: '🥖', h: 44, bg: 'Пшенична', en: 'Wheat', re: /wheat|weizen|weiss|witbier|hefe|wit\b/i },
  { id: 'b-amber', emoji: '🍂', h: 22, bg: 'Амбър и червена', en: 'Amber & red', re: /amber|red ale|irish red|altbier/i },
  { id: 'b-brown', emoji: '🌰', h: 28, bg: 'Кафява', en: 'Brown', re: /brown/i },
  { id: 'b-porter', emoji: '☕', h: 20, bg: 'Портър', en: 'Porter', re: /porter/i },
  { id: 'b-stout', emoji: '🖤', h: 12, bg: 'Стаут', en: 'Stout', re: /stout/i },
  { id: 'b-belgian', emoji: '🔔', h: 40, bg: 'Белгийска и сезон', en: 'Belgian & saison', re: /belgian|tripel|dubbel|quad|saison|abbey|farmhouse|trappist/i },
  { id: 'b-sour', emoji: '🍋', h: 60, bg: 'Кисела', en: 'Sour', re: /sour|gose|lambic|berliner|gueuze|brett/i },
  { id: 'b-kveik', emoji: '🔥', h: 8, bg: 'Квейк', en: 'Kveik', re: /kveik|voss|hornindal|ebbegarden/i },
  { id: 'b-strong', emoji: '💪', h: 30, bg: 'Силна и ейл', en: 'Strong ales', re: /barley ?wine|strong|imperial|wee heavy|old ale|quad|double|triple/i },
  { id: 'b-fruit', emoji: '🍓', h: 340, bg: 'Плодова и сезонна', en: 'Fruit & seasonal', re: /fruit|seasonal|spice|pumpkin|honey|mead|cider|christmas/i },
  { id: 'b-other', emoji: '🍽️', h: 260, bg: 'Други бири', en: 'Other beers', re: /$^/ },
];
// The first matching style names the category; the yeast (Kveik) can add a second one.
function beerCategories(styleName, title, yeastName) {
  const hay = `${styleName || ''} ${title || ''}`;
  const out = [];
  const order = ['b-ipa', 'b-stout', 'b-porter', 'b-sour', 'b-wheat', 'b-belgian', 'b-strong', 'b-amber', 'b-brown', 'b-blonde', 'b-lager', 'b-pale', 'b-fruit'];
  for (const id of order) { const s = BEER_STYLES.find(x => x.id === id); if (s.re.test(hay)) { out.push(id); break; } }
  if (/kveik|voss/i.test(`${yeastName || ''} ${hay}`) && !out.includes('b-kveik')) out.push('b-kveik');
  return out.length ? out.slice(0, 2) : ['b-other'];
}

/* ---------------- Ingredient reference data (typical values; every number can be edited per recipe) ---------------- */
// ppg = potential in "points per pound per gallon", lov = colour in °Lovibond, sugar = fully fermentable (100% efficiency)
const MALTS = [
  { re: /cara\s?pils|carapils|dextrin|caramel pils/i, ppg: 33, lov: 2, n: 'Carapils' },
  { re: /cara\s?clair|caramel\s?hell|cara\s?hell|carahell/i, ppg: 35, lov: 3.2, n: 'Cara Clair' },
  { re: /cara\s?gold/i, ppg: 34, lov: 25, n: 'Cara Gold' },
  { re: /cara\s?munich\s*(iii|3)/i, ppg: 34, lov: 57, n: 'CaraMunich III' },
  { re: /cara\s?munich\s*(ii|2)/i, ppg: 34, lov: 46, n: 'CaraMunich II' },
  { re: /cara\s?munich/i, ppg: 34, lov: 35, n: 'CaraMunich I' },
  { re: /cara\s?amber|caramel\s?amber/i, ppg: 34, lov: 27, n: 'CaraAmber' },
  { re: /cara\s?aroma/i, ppg: 34, lov: 130, n: 'CaraAroma' },
  { re: /cara\s?red/i, ppg: 34, lov: 20, n: 'CaraRed' },
  { re: /crystal\s*(\d+)|caramel\s*(\d+)|cara\s*(\d+)/i, ppg: 34, lov: 40, n: 'Crystal 40', num: true },
  { re: /pale chocolate/i, ppg: 34, lov: 200, n: 'Pale Chocolate' },
  { re: /chocolate/i, ppg: 34, lov: 350, n: 'Chocolate malt' },
  { re: /roast(ed)?\s*barley|black\s*(patent|malt)?|midnight wheat/i, ppg: 25, lov: 500, n: 'Roasted Barley' },
  { re: /carafa/i, ppg: 32, lov: 450, n: 'Carafa' },
  { re: /special\s?b/i, ppg: 30, lov: 115, n: 'Special B' },
  { re: /munich/i, ppg: 36, lov: 9, n: 'Munich' },
  { re: /vienna/i, ppg: 36, lov: 4, n: 'Vienna' },
  { re: /biscuit/i, ppg: 35, lov: 17, n: 'Biscuit' },
  { re: /victory/i, ppg: 34, lov: 28, n: 'Victory' },
  { re: /melanoidin/i, ppg: 33, lov: 27, n: 'Melanoidin' },
  { re: /aromatic/i, ppg: 36, lov: 20, n: 'Aromatic' },
  { re: /brown malt/i, ppg: 32, lov: 65, n: 'Brown malt' },
  { re: /amber malt/i, ppg: 32, lov: 22, n: 'Amber malt' },
  { re: /smoke|rauch/i, ppg: 37, lov: 3, n: 'Smoked malt' },
  { re: /acid/i, ppg: 27, lov: 3, n: 'Acidulated malt' },
  { re: /flaked\s*oat|oat\s*flakes|oats|oat malt/i, ppg: 33, lov: 1, n: 'Flaked Oats' },
  { re: /flaked\s*wheat|wheat\s*flakes/i, ppg: 36, lov: 2, n: 'Flaked Wheat' },
  { re: /flaked\s*(barley|rye)/i, ppg: 32, lov: 2, n: 'Flaked Barley' },
  { re: /flaked\s*(corn|maize)|corn/i, ppg: 37, lov: 1, n: 'Flaked Corn' },
  { re: /rice(?! hull)/i, ppg: 32, lov: 1, n: 'Flaked Rice' },
  { re: /wheat/i, ppg: 37, lov: 2, n: 'Wheat Malt' },
  { re: /rye/i, ppg: 35, lov: 3, n: 'Rye Malt' },
  { re: /pilsen|pilsner|pils\b/i, ppg: 37, lov: 1.7, n: 'Pilsner' },
  { re: /pale ale|ale malt|maris|golden promise|2-?row|two-?row|pale/i, ppg: 37, lov: 3, n: 'Pale Ale' },
  { re: /lager/i, ppg: 37, lov: 2, n: 'Lager Malt' },
  { re: /dextrose|glucose|corn sugar/i, ppg: 46, lov: 0, n: 'Dextrose', sugar: true },
  { re: /sugar|sucrose|захар/i, ppg: 46, lov: 0, n: 'Table Sugar', sugar: true },
  { re: /dry malt|dme|extract.*dry/i, ppg: 45, lov: 3, n: 'Dry Malt Extract', sugar: true },
  { re: /liquid malt|lme/i, ppg: 36, lov: 3, n: 'Liquid Malt Extract', sugar: true },
  { re: /honey|мед/i, ppg: 35, lov: 1, n: 'Honey', sugar: true },
];
const MALT_NAMES = ['Pale Ale', 'Pilsner', 'Maris Otter', 'Munich', 'Vienna', 'Wheat Malt', 'Flaked Oats', 'Flaked Wheat', 'Carapils', 'Cara Clair', 'CaraMunich I', 'CaraMunich II', 'CaraAmber', 'Cara Gold',
  'Crystal 40', 'Crystal 60', 'Crystal 120', 'Biscuit', 'Victory', 'Melanoidin', 'Aromatic', 'Chocolate malt', 'Pale Chocolate', 'Roasted Barley', 'Carafa II', 'Special B', 'Rye Malt', 'Acidulated malt', 'Smoked malt',
  'Table Sugar', 'Dextrose', 'Dry Malt Extract', 'Liquid Malt Extract', 'Honey'];
function maltInfo(name) {
  const s = String(name || '');
  for (const m of MALTS) {
    const x = s.match(m.re);
    if (x) {
      if (m.num) { const n = +(x[1] || x[2] || x[3]); if (n) return { ppg: m.ppg, lov: n > 10 ? n : 40, sugar: false }; }
      return { ppg: m.ppg, lov: m.lov, sugar: !!m.sugar };
    }
  }
  return { ppg: 35, lov: 4, sugar: false };
}

const HOPS_AA = {
  cascade: 6, centennial: 10, citra: 12, mosaic: 12, amarillo: 8.6, simcoe: 13, columbus: 15, chinook: 13, warrior: 15, magnum: 14, summit: 17, galaxy: 14,
  'nelson sauvin': 12, saaz: 3.5, hallertau: 4, 'hallertau mittelfruh': 3.5, tettnang: 4.5, perle: 8, 'northern brewer': 8, fuggle: 4.5, goldings: 5,
  'east kent goldings': 5, willamette: 5, cluster: 7, 'idaho 7': 12.3, 'el dorado': 15, ekuanot: 14, azacca: 15, motueka: 7, riwaka: 5.5, 'sorachi ace': 13,
  spalt: 4.5, styrian: 4, challenger: 7.5, target: 10.5, admiral: 14, 'bramling cross': 6, 'hallertau blanc': 9, 'strata': 12, 'talus': 8, 'sabro': 14,
};
const HOP_NAMES = Object.keys(HOPS_AA).map(k => k.replace(/\b\w/g, c => c.toUpperCase()));
const hopAA = name => { const k = String(name || '').toLowerCase().trim(); return HOPS_AA[k] ?? null; };

const YEASTS = [
  { n: 'Fermentis / Safale - American Ale US-05', form: 'Dry', att: 81, flocc: 'Medium', tmin: 12.2, tmax: 25, ferm: 18 },
  { n: 'Fermentis / Safale - English Ale S-04', form: 'Dry', att: 75, flocc: 'High', tmin: 15, tmax: 24, ferm: 18 },
  { n: 'Fermentis / Safale - Ale S-33', form: 'Dry', att: 72, flocc: 'High', tmin: 15, tmax: 24, ferm: 18 },
  { n: 'Fermentis / Safbrew - Wheat WB-06', form: 'Dry', att: 86, flocc: 'Low', tmin: 18, tmax: 24, ferm: 20 },
  { n: 'Fermentis / Saflager - W-34/70', form: 'Dry', att: 83, flocc: 'High', tmin: 9, tmax: 15, ferm: 12 },
  { n: 'Fermentis / Saflager - S-23', form: 'Dry', att: 82, flocc: 'High', tmin: 9, tmax: 15, ferm: 12 },
  { n: 'Danstar - Nottingham', form: 'Dry', att: 80, flocc: 'High', tmin: 14, tmax: 21, ferm: 18 },
  { n: 'Danstar - American West Coast BRY-97', form: 'Dry', att: 72, flocc: 'High', tmin: 16.7, tmax: 23.9, ferm: 20 },
  { n: 'Lallemand - Verdant IPA', form: 'Dry', att: 78, flocc: 'Medium', tmin: 18, tmax: 23, ferm: 20 },
  { n: 'Escarpment Labs - Voss Kveik', form: 'Liquid', att: 72.5, flocc: 'High', tmin: 25, tmax: 41.7, ferm: 32 },
  { n: 'Lallemand - LalBrew Voss Kveik', form: 'Dry', att: 78, flocc: 'High', tmin: 25, tmax: 40, ferm: 32 },
  { n: 'Wyeast - 1056 American Ale', form: 'Liquid', att: 75, flocc: 'Medium', tmin: 15, tmax: 22, ferm: 18 },
  { n: 'White Labs - WLP001 California Ale', form: 'Liquid', att: 76, flocc: 'Medium', tmin: 20, tmax: 23, ferm: 20 },
];
const yeastInfo = name => {
  const s = String(name || '').toLowerCase();
  return YEASTS.find(y => y.n.toLowerCase() === s) || YEASTS.find(y => { const k = y.n.toLowerCase().split(/[ -]/).pop(); return k.length > 3 && s.includes(k); }) || null;
};

/* ---------------- Maths ---------------- */
const L_PER_GAL = 3.78541, LB_PER_KG = 2.20462;
const p2sg = p => 1 + p / (258.6 - (p / 258.2) * 227.1);                      // °Plato → specific gravity
const sg2p = sg => -616.868 + 1111.14 * sg - 630.272 * sg * sg + 135.997 * sg * sg * sg;
function srmToHex(srm) {
  const T = [[1, '#FFE699'], [2, '#FFD878'], [3, '#FFBF42'], [4, '#FBB123'], [6, '#E58500'], [8, '#CF6900'], [10, '#BC5300'], [13, '#A13700'], [17, '#7B2A0A'], [20, '#5A1D0A'], [24, '#3B1209'], [30, '#1F0B07'], [40, '#0C0605']];
  if (srm <= T[0][0]) return T[0][1];
  for (let i = 1; i < T.length; i++) if (srm <= T[i][0]) {
    const [a, ca] = T[i - 1], [b, cb] = T[i], k = (srm - a) / (b - a);
    const mix = j => Math.round(parseInt(ca.slice(1 + 2 * j, 3 + 2 * j), 16) * (1 - k) + parseInt(cb.slice(1 + 2 * j, 3 + 2 * j), 16) * k);
    return '#' + [0, 1, 2].map(j => mix(j).toString(16).padStart(2, '0')).join('');
  }
  return T[T.length - 1][1];
}
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

// Hop bitterness: Tinseth, with the boil-time divisor and the whirlpool utilisation tuned to what Brewer's Friend reports.
function hopIBU(h, b, boilSG) {
  const batch = b.batchL || 20;
  const mgL = (h.g || 0) * (h.aa || 0) / 100 * 1000 / batch;
  const big = 1.65 * Math.pow(0.000125, boilSG - 1);
  const btf = m => (1 - Math.exp(-0.04 * m)) / 3.78;
  switch (h.use) {
    case 'boil': return mgL * big * btf(h.min || 0);
    case 'first wort': return mgL * big * btf(b.boilMin || 60) * 1.1;
    case 'whirlpool': return mgL * big * 0.02675 * clamp(((h.temp ?? 80) - 60) / 20, 0, 2);
    case 'mash': return mgL * big * btf(60) * 0.2;
    default: return 0;   // dry hop: no bitterness counted
  }
}
function postBoilVolume(b) { return b.postBoilL || Math.max(b.batchL || 0, (b.boilL || 0) - (b.boilOffL ?? (b.boilL || 0) * 0.08)); }

function calcBeer(b) {
  const batch = b.batchL || 20, gal = batch / L_PER_GAL, eff = clamp((b.eff ?? 72) / 100, 0.2, 1);
  let pts = 0, mcu = 0;
  for (const f of b.fermentables || []) {
    const m = maltInfo(f.name), ppg = f.ppg ?? m.ppg, lov = f.lov ?? m.lov, lb = (f.kg || 0) * LB_PER_KG;
    pts += lb * ppg * (m.sugar ? 1 : eff);
    mcu += lb * lov;
  }
  const ogPts = gal ? pts / gal : 0;
  const att = (b.yeast && b.yeast.att) || 75;
  const fgPts = ogPts * (1 - att / 100);
  const og = 1 + ogPts / 1000, fg = 1 + fgPts / 1000;
  const abv = (og - fg) * 131.25;
  const srm = mcu > 0 ? 1.4922 * Math.pow(mcu / gal, 0.6859) : 0;
  const pre = b.boilL || postBoilVolume(b);
  const boilSG = 1 + (ogPts * postBoilVolume(b) / (pre || 1)) / 1000;
  let ibu = 0; const perHop = [];
  for (const h of b.hops || []) { const v = hopIBU(h, b, boilSG); perHop.push(v); ibu += v; }
  return { og, fg, ogP: sg2p(og), fgP: sg2p(fg), abv, ibu, srm, ebc: srm * 1.97, boilSG, boilP: sg2p(boilSG), perHop };
}
// The numbers shown for a recipe: the ones from the import (as the author had them) when present, otherwise computed.
function beerStats(b) {
  const c = calcBeer(b), s = b.stats || {};
  return {
    ogP: s.ogP ?? c.ogP, fgP: s.fgP ?? c.fgP, abv: s.abv ?? c.abv, ibu: s.ibu ?? c.ibu, srm: s.srm ?? c.srm, computed: !b.stats,
    boilP: s.boilP ?? c.boilP, perHop: c.perHop,
  };
}
// Water temperature for the mash: Tw = 0.41 / R × (T target − T grain) + T target (R in L/kg)
function strikeTemp(targetC, thicknessLkg, grainC) { return (0.41 / (thicknessLkg || 3)) * (targetC - (grainC ?? 20)) + targetC; }
// Priming: grams of sugar for a target CO₂ volume (residual CO₂ depends on the highest fermentation temperature)
function primingSugarG(batchL, volumes, fermC, sugar = 'sucrose') {
  const f = fermC * 9 / 5 + 32, residual = 3.0378 - 0.050062 * f + 0.00026555 * f * f;
  const perL = Math.max(0, volumes - residual) * (sugar === 'dextrose' ? 4.45 : 3.85);
  return { grams: perL * batchL, residual };
}
// Keg pressure (bar) for a target CO₂ volume at a serving temperature (°C)
function kegPressureBar(volumes, tempC) {
  const f = tempC * 9 / 5 + 32;
  const psi = -16.6999 - 0.0101059 * f + 0.00116512 * f * f + 0.173354 * f * volumes + 4.24267 * volumes - 0.0684226 * volumes * volumes;
  return Math.max(0, psi / 14.5038);
}

// A copy of the recipe with all amounts multiplied (batch size scaling). Bitterness and gravity do not change.
function scaleBeer(b, k) {
  if (!k || Math.abs(k - 1) < 1e-9) return b;
  const c = JSON.parse(JSON.stringify(b));
  const sc = x => (x == null ? x : x * k);
  c.batchL = sc(c.batchL); c.boilL = sc(c.boilL); c.boilOffL = sc(c.boilOffL); c.postBoilL = sc(c.postBoilL);
  (c.fermentables || []).forEach(f => { f.kg = sc(f.kg); });
  (c.hops || []).forEach(h => { h.g = sc(h.g); });
  (c.others || []).forEach(o => { o.g = sc(o.g); });
  (c.mash || []).forEach(m => { m.L = sc(m.L); });
  (c.water || []).forEach(w => { w.L = sc(w.L); });
  return c;
}

/* ---------------- Number helpers ---------------- */
const bnum = (x, d = 1) => { if (x == null || isNaN(x)) return '–'; const s = (+x).toFixed(d); return (d ? s.replace(/\.?0+$/, '') : s).replace('.', ','); };
const bkg = x => (x >= 1 ? bnum(x, 2) : bnum(x * 1000, 0).replace(/^/, '')) + (x >= 1 ? ' кг' : ' г');
const bg_ = x => (x >= 1000 ? bnum(x / 1000, 2) + ' кг' : bnum(x, x < 10 ? 1 : 0) + ' г');
const bl = x => bnum(x, x < 10 ? 2 : 1) + ' л';

const USE_BG = { boil: 'Варене', 'first wort': 'Първи сок', whirlpool: 'Водовъртеж', 'dry hop': 'Сух хмел', mash: 'Майш', flameout: 'Край на варенето', fermenter: 'Във ферментатора' };
const HOP_USES = ['boil', 'first wort', 'whirlpool', 'dry hop', 'mash'];
const MASH_TYPES = { strike: 'Майшване', infusion: 'Инфузия', decoction: 'Декокция', temperature: 'Нагряване' };
const METHODS = { 'all-grain': 'Всичко от зърно', extract: 'Екстракт', biab: 'BIAB (в торба)', 'partial-mash': 'Частичен майш' };

/* ---------------- Ingredient lines (for search, sharing and the plain recipe view) ---------------- */
function beerIngredientLines(b) {
  const out = [];
  if ((b.fermentables || []).length) { out.push('## Малц и ферментируеми'); b.fermentables.forEach(f => out.push(`${bkg(f.kg)} ${f.name}`)); }
  if ((b.hops || []).length) {
    out.push('## Хмел');
    b.hops.forEach(h => out.push(`${bg_(h.g)} ${h.name}${h.aa ? ` (${bnum(h.aa)}% AA)` : ''} — ${USE_BG[h.use] || h.use}${h.use === 'dry hop' ? (h.days ? `, ${h.days} дни` : '') : h.use === 'whirlpool' ? `, ${h.min || 0} мин${h.temp ? ` при ${h.temp}°C` : ''}` : h.min != null ? `, ${h.min} мин` : ''}`));
  }
  if ((b.others || []).length) { out.push('## Други'); b.others.forEach(o => out.push(`${bg_(o.g)} ${o.name} — ${USE_BG[o.use] || o.use}${o.min ? `, ${o.min} мин` : ''}`)); }
  if (b.yeast && b.yeast.name) { out.push('## Дрожди'); out.push(b.yeast.name); }
  return out;
}

/* ---------------- Import of "HOME BREW RECIPE" text (Brewer's Friend export) ---------------- */
function parseBrewRecipe(raw) {
  const text = String(raw || '').replace(/\r/g, '').replace(/ /g, ' ');
  if (!/HOME BREW RECIPE/i.test(text) && !(/^\s*Title:/im.test(text) && /FERMENTABLES\s*:/i.test(text))) return null;
  const SECT = /^(STATS|FERMENTABLES|HOPS|OTHER INGREDIENTS|YEAST|PRIMING|TARGET WATER PROFILE|MASH GUIDELINES|WATER REQUIREMENTS|NOTES)\s*:\s*$/i;
  const sec = { HEAD: [], NOTES: [], FOOT: [] };
  let cur = 'HEAD';
  for (const l of text.split('\n')) {
    const m = l.trim().match(SECT);
    if (m) { cur = m[1].toUpperCase(); sec[cur] = sec[cur] || []; continue; }
    if (/^This recipe has been published online at:/i.test(l.trim())) cur = 'FOOT';
    (sec[cur] = sec[cur] || []).push(l);
  }
  const kv = lines => { const o = {}; lines.forEach(l => { const m = l.match(/^\s*([^:]+?):\s*(.*?)\s*$/); if (m) o[m[1].toLowerCase()] = m[2]; }); return o; };
  const num = s => { const m = String(s ?? '').replace(',', '.').match(/-?\d+(?:\.\d+)?/); return m ? parseFloat(m[0]) : null; };
  const head = kv(sec.HEAD), stats = kv(sec.STATS || []);
  const toKg = (v, u) => { u = (u || 'kg').toLowerCase(); return u === 'kg' ? v : u === 'g' ? v / 1000 : u.startsWith('lb') ? v / LB_PER_KG : u === 'oz' ? v / 35.274 : v; };
  const toG = (v, u) => { u = (u || 'g').toLowerCase(); return u === 'g' ? v : u === 'kg' ? v * 1000 : u === 'oz' ? v * 28.3495 : u.startsWith('lb') ? v * 453.592 : v; };

  const fermentables = [];
  for (const l of sec.FERMENTABLES || []) {
    const m = l.trim().match(/^([\d.,]+)\s*(kg|g|lbs?|oz)\s*-\s*(.+?)(?:\s*\(([\d.,]+)%\))?$/i);
    if (m) fermentables.push({ kg: toKg(num(m[1]), m[2]), name: m[3].trim() });
  }
  const parseUse = u => {
    const x = u.trim().match(/^(.+?)(?:\s+for\s+([\d.,]+)\s*(min|mins|minutes|days?|hrs?|hours?))?(?:\s+at\s+([\d.,]+)\s*°?\s*C)?\s*$/i);
    if (!x) return { use: 'boil' };
    let name = x[1].toLowerCase(), hk = /high krausen/.test(name);
    name = name.replace(/\(.*?\)/g, '').trim();
    const use = /dry/.test(name) ? 'dry hop' : /whirl|hop ?stand|steep/.test(name) ? 'whirlpool' : /first wort/.test(name) ? 'first wort' : /mash/.test(name) ? 'mash' : /flame/.test(name) ? 'flameout' : /boil/.test(name) ? 'boil' : /ferment|keg|secondary|primary/.test(name) ? 'dry hop' : 'boil';
    const out = { use };
    if (x[2] != null) { const v = num(x[2]); if (/day/i.test(x[3])) out.days = v; else if (/h/i.test(x[3])) out.min = v * 60; else out.min = v; }
    if (x[4] != null) out.temp = num(x[4]);
    if (hk) out.highKrausen = true;
    return out;
  };
  const hops = [];
  for (const l of sec.HOPS || []) {
    const m = l.trim().match(/^([\d.,]+)\s*(g|kg|oz|lbs?)\s*-\s*(.+)$/i);
    if (!m) continue;
    const rest = m[3], name = rest.split(/,\s*(?:Type|AA|Use):/i)[0].trim();
    const type = (rest.match(/Type:\s*([^,]+)/i) || [])[1];
    const aa = num((rest.match(/AA:\s*([\d.,]+)/i) || [])[1]);
    const use = (rest.match(/Use:\s*(.+?)(?:,\s*IBU:.*)?$/i) || [])[1] || 'Boil';
    const h = Object.assign({ g: toG(num(m[1]), m[2]), name, form: (type || 'Pellet').trim().toLowerCase(), aa }, parseUse(use));
    if (h.use === 'dry hop' && h.days == null && h.min != null && /high krausen/i.test(use)) { /* "for 4 min" in the export means the hop goes in at high krausen */ delete h.min; }
    hops.push(h);
  }
  const others = [];
  for (const l of sec['OTHER INGREDIENTS'] || []) {
    const m = l.trim().match(/^([\d.,]+)\s*(g|kg|oz|lbs?|ml|l|tsp|tbsp|each|items?)?\s*-\s*(.+)$/i);
    if (!m) continue;
    const rest = m[3], name = rest.split(/,\s*(?:Time|Type|Use):/i)[0].trim();
    const use = parseUse((rest.match(/Use:\s*(.+)$/i) || [])[1] || 'Boil').use;
    others.push({ g: /^(g|kg|oz|lb)/i.test(m[2] || 'g') ? toG(num(m[1]), m[2] || 'g') : num(m[1]), unit: /^(ml|l|tsp|tbsp|each|item)/i.test(m[2] || '') ? m[2].toLowerCase() : 'g', name,
      type: ((rest.match(/Type:\s*([^,]+)/i) || [])[1] || '').trim(), use, min: num((rest.match(/Time:\s*([\d.,]+)\s*min/i) || [])[1]) });
  }
  let yeast = null;
  const yl = (sec.YEAST || []).map(s => s.trim()).filter(Boolean);
  if (yl.length) {
    const y = kv(yl.slice(1)), opt = (y['optimum temp'] || '').match(/([\d.]+)\s*-\s*([\d.]+)/);
    yeast = { name: yl[0], starter: /^y/i.test(y.starter || ''), form: y.form || '', att: num(y['attenuation (avg)'] ?? y['attenuation (custom)'] ?? y['attenuation']), flocc: y.flocculation || '',
      tmin: opt ? +opt[1] : null, tmax: opt ? +opt[2] : null, ferm: num(y['fermentation temp']), pitch: num(y['pitch rate']) };
  }
  const pr = kv(sec.PRIMING || []);
  const priming = (sec.PRIMING || []).some(l => l.trim()) ? { method: (pr.method || '').toLowerCase(), vol: num(pr['co2 level']), bar: num(pr.amount) } : null;
  const mash = [];
  const mashKv = kv((sec['MASH GUIDELINES'] || []).filter(l => !/^\s*\d+\)/.test(l)));
  for (const l of sec['MASH GUIDELINES'] || []) {
    const m = l.trim().match(/^\d+\)\s*([A-Za-z ]+?),\s*Start Temp:\s*([^,]+),\s*Target Temp:\s*([^,]+),\s*Time:\s*([\d.]+)\s*min(?:,\s*Amount:\s*([\d.]+)\s*L)?/i);
    if (m) mash.push({ type: m[1].trim().toLowerCase(), startC: num(m[2]), targetC: num(m[3]), min: num(m[4]), L: num(m[5]) });
  }
  const water = [];
  let buf = '';
  for (const l of sec['WATER REQUIREMENTS'] || []) {
    const s = l.trim();
    if (!s || /^WARNING/i.test(s) || /^Total Water Needed/i.test(s)) { if (/^Total Water Needed:\s*([\d.]+)\s*L/i.test(s)) water.push({ key: 'total', label: 'Обща вода', L: num(s.match(/:\s*([\d.]+)/)[1]) }); continue; }
    buf = buf ? buf + ' ' + s : s;
    const m = buf.match(/^(.*),\s*(-?[\d.]+)\s*L$/);
    if (m) {
      const lab = m[1], v = num(m[2]);
      const key = /^Strike water/i.test(lab) ? 'strike' : /^Mash volume/i.test(lab) ? 'mashVol' : /^Grain absorption/i.test(lab) ? 'grainAbs' : /sparge/i.test(lab) ? 'sparge' : /^Pre ?boil/i.test(lab) ? 'preBoil'
        : /^Boil off/i.test(lab) ? 'boilOff' : /^Post boil/i.test(lab) ? 'postBoil' : /^Kettle loss/i.test(lab) ? 'kettleLoss' : /^Top off/i.test(lab) ? 'topOff' : /fermentor|fermenter/i.test(lab) ? 'fermenter'
          : /Hops absorption/i.test(lab) ? 'hopAbs' : /^Misc/i.test(lab) ? 'misc' : /^Mash Lauter/i.test(lab) ? 'lauterLoss' : '';
      if (key) water.push({ key, label: lab.replace(/\s*\(.*?\)/g, ''), L: v });
      buf = '';
    }
  }
  const wv = k => (water.find(w => w.key === k) || {}).L;
  const noteText = (sec.NOTES || []).join('\n').replace(/\n{3,}/g, '\n\n').trim();
  const url = ((sec.FOOT || []).map(s => s.trim()).find(s => /^https?:\/\//.test(s))) || '';

  const batch = num(head['batch size']), styleName = (head['style name'] || '').replace(/^No Profile Selected$/i, '').trim();
  const title = (head.title || '').replace(/\s*\((v\d+|\d+)\)\s*$/i, '').trim() || 'Бира';
  const beer = {
    method: /extract/i.test(head['brew method'] || '') ? 'extract' : /biab/i.test(head['brew method'] || '') ? 'biab' : /partial/i.test(head['brew method'] || '') ? 'partial-mash' : 'all-grain',
    styleName, batchL: batch, boilL: num(head['boil size']), boilMin: num(head['boil time']) || 60, eff: num(head.efficiency),
    boilOffL: wv('boilOff') != null ? Math.abs(wv('boilOff')) : null, postBoilL: wv('postBoil') ?? null,
    fermentables, hops, others, yeast, mash,
    thickness: num(mashKv['starting mash thickness']), grainTempC: num(mashKv['starting grain temp']),
    priming, water: water.filter(w => w.key !== 'hopAbs'),
    stats: {
      ogP: num(stats['original gravity']), fgP: num(stats['final gravity']), abv: num(stats['abv (standard)'] ?? stats.abv), ibu: num(stats['ibu (tinseth)'] ?? stats.ibu),
      srm: num(stats['srm (morey)'] ?? stats.srm), boilP: num(head['boil gravity']),
    },
  };
  if (beer.stats.ogP == null) delete beer.stats;
  const rec = {
    kind: 'beer', title, source: (head.author || '').trim() || null, beer,
    categories: beerCategories(styleName, title, yeast && yeast.name),
    notes: noteText, links: url ? [{ url, label: "Brewer's Friend" }] : [], images: [], collection: 'mine', steps: '', time: '', servings: '',
  };
  rec.ingredients = beerIngredientLines(beer);
  return rec;
}
