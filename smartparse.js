/* Rifay Umami — "smart paste": turns a recipe copied from anywhere into the app's format WITHOUT any AI.
   Recognises the ingredient and method sections, tidies quantities and units (so servings can be scaled) and guesses
   a title and categories. Pure rules running in the browser: free, instant, offline. Loaded before app.js. */
'use strict';

const SP_Q = String.raw`(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?\s*[-–]\s*\d+(?:[.,]\d+)?|\d+\s*[-–]\s*[½¼¾⅓⅔⅛]|\d+\s*[½¼¾⅓⅔⅛]|[½¼¾⅓⅔⅛]|\d+(?:[.,]\d+)?)`;
const SP_END = String.raw`(?![\p{L}\d])\.?`;
const SP_UNITS = [
  [new RegExp(`^(?:кг|килограма?|kg|kilograms?)${SP_END}`, 'iu'), 'кг'],
  [new RegExp(`^(?:гр|грама?|г|g|gr|grams?)${SP_END}`, 'iu'), 'гр'],
  [new RegExp(`^(?:мл|милилитра?|ml|millilit\\p{L}*)${SP_END}`, 'iu'), 'мл'],
  [new RegExp(`^(?:л|литра?|litres?|liters?|l)${SP_END}`, 'iu'), 'л'],
  [new RegExp(`^(?:с\\s*\\.\\s*л|сл|ст\\s*\\.\\s*л|супена\\s+лъжица|супени\\s+лъжици|tbsp|tablespoons?)${SP_END}`, 'iu'), 'с.л.'],
  [new RegExp(`^(?:ч\\s*\\.\\s*л|кл|к\\s*\\.\\s*л|малка\\s+мерителна\\s+лъжичка|чаена\\s+лъжичка|чаена\\s+лъжица|чаени\\s+лъжички|чаени\\s+лъжици|кафена\\s+лъжичка|десертна\\s+лъжица|tsp|teaspoons?)${SP_END}`, 'iu'), 'ч.л.'],
  [new RegExp(`^(?:ч\\s*\\.\\s*ч|чаена\\s+чаша|чаени\\s+чаши|чаша|чаши|чашка|чашки|cups?)${SP_END}`, 'iu'), 'ч.ч.'],
  [new RegExp(`^(?:бр|броя|брой|броеве|pcs?|pieces?)${SP_END}`, 'iu'), 'бр.'],
  [new RegExp(`^(?:см|cm)${SP_END}`, 'iu'), 'см'],
];
const SP_NOUN_UNIT = new RegExp(String.raw`^((?:(?:малк|голям|средн|пресн)\p{L}*\s+)?(?:скилидк|глав|стръчет|стръ|стъбл|връзк|щипк|пакет|кубч|филии|филийк|парч|лист|шеп|капк|банк|кутийк|консерв|резен|клонк|пъпк|кор)\p{L}*)(?![\p{L}\d])\.?`, 'iu');
const SP_FRAC = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 0.125 };

function spNum(q) {
  q = q.trim();
  let m;
  if ((m = q.match(/^(\d+)\s*[-–]\s*([½¼¾⅓⅔⅛])$/))) return +m[1] + SP_FRAC[m[2]];
  if ((m = q.match(/^(\d+)\s*([½¼¾⅓⅔⅛])$/))) return +m[1] + SP_FRAC[m[2]];
  if ((m = q.match(/^([½¼¾⅓⅔⅛])$/))) return SP_FRAC[m[1]];
  if ((m = q.match(/^(\d+)\s+(\d+)\/(\d+)$/))) return +m[1] + +m[2] / +m[3];
  if ((m = q.match(/^(\d+)\/(\d+)$/))) return +m[1] / +m[2];
  if (/^\d+(?:[.,]\d+)?$/.test(q)) return parseFloat(q.replace(',', '.'));
  return null;
}
const spFmtQ = q => { const v = spNum(q); return v !== null && !/[-–]\s*\d/.test(q) ? fmtQty(v) : q.replace(/\s*[-–]\s*/g, '-'); };
function spSplitUnit(rest) {
  for (const [re, u] of SP_UNITS) { const m = rest.match(re); if (m) return [u, rest.slice(m[0].length).trim()]; }
  const n = rest.match(SP_NOUN_UNIT);
  if (n) return [n[1].toLowerCase(), rest.slice(n[0].length).trim()];
  return null;
}
const spLowerFirst = s => /^[А-ЯA-Z][а-яa-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s;

// Typical amounts for ingredients written without any quantity (scaled by servings/4).
const SP_EST = [
  [/кисело мляко|yogh?urt|йогурт/i, 200, 'гр', 1], [/прясно мляко|мляко|milk/i, 200, 'мл', 1], [/сметана|cream/i, 200, 'мл', 1],
  [/сол\b|salt/i, 1, 'ч.л.', 0], [/черен пипер|black pepper/i, 0.5, 'ч.л.', 0], [/червен пипер|паприка|paprika/i, 1, 'ч.л.', 0],
  [/канела|ванилия|кимион|къри|куркума|мащерка|риган|розмарин|чубрица|кориандър|джоджен|джинджифил|подправк/i, 1, 'ч.л.', 0],
  [/магданоз|копър|босилек|мента|зелен лук/i, 0.5, 'връзка', 0], [/чесън/i, 2, 'скилидки', 1], [/лимонов сок|сок от лимон/i, 2, 'с.л.', 0], [/лимон/i, 1, 'бр.', 1],
  [/оцет/i, 1, 'с.л.', 0], [/соев сос/i, 2, 'с.л.', 1], [/горчица/i, 1, 'с.л.', 0], [/кетчуп|майонеза/i, 2, 'с.л.', 1], [/мед\b|сироп/i, 1, 'с.л.', 1],
  [/зехтин|олио|olive oil/i, 2, 'с.л.', 1], [/масло|butter/i, 2, 'с.л.', 1], [/захар|sugar/i, 1, 'с.л.', 1], [/брашно|flour/i, 250, 'гр', 1], [/яйц|egg/i, 2, 'бр.', 1],
  [/бульон|stock/i, 500, 'мл', 1], [/вино/i, 100, 'мл', 1], [/вода|water/i, 200, 'мл', 1], [/сирене|кашкавал|cheese/i, 150, 'гр', 1],
  [/домат/i, 2, 'бр.', 1], [/лук\b|onion/i, 1, 'бр.', 1], [/морков/i, 2, 'бр.', 1], [/картоф/i, 500, 'гр', 1], [/чушк/i, 2, 'бр.', 1],
  [/ориз|булгур|rice/i, 200, 'гр', 1], [/макарон|спагет|паста\b|pasta/i, 250, 'гр', 1], [/кайма/i, 400, 'гр', 1],
  [/пиле|пилешк|свинск|телешк|месо|chicken|beef|pork/i, 500, 'гр', 1], [/риба|сьомга|fish|salmon/i, 400, 'гр', 1], [/гъби|печурк/i, 250, 'гр', 1],
];
function spEstimate(name, servings) {
  const m = Math.max(0.5, (parseInt(servings, 10) || 4) / 4);
  if (/фолио|хартия|кесия|клечки|шпажи|форма\b|тава\b|памучен/i.test(name)) return null;      // not food: no amount
  for (const [re, qty, unit, scale] of SP_EST) {
    // match at the start of a word (so "фолио" does not count as "олио")
    if (!new RegExp(`(?<![\\p{L}])(?:${re.source})`, 'iu').test(name)) continue;
    let q = qty;
    if (scale) {
      q *= m;
      q = unit === 'гр' || unit === 'мл' ? Math.max(25, Math.round(q / 25) * 25) : unit === 'с.л.' || unit === 'ч.л.' ? Math.max(0.5, Math.round(q * 2) / 2) : Math.max(1, Math.round(q));
    }
    return `${fmtQty(q)} ${unit} ${name}`;
  }
  return null;
}

/* ---------- text cleaning ---------- */
function spStrip(text) {
  const links = [];
  let s = String(text || '').replace(/\r/g, '').replace(/ /g, ' ').replace(/​/g, '');
  s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, '');                                    // images
  s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)[^)]*\)/g, (_, label, url) => { links.push({ label: label.trim(), url }); return label; }); // [text](url) -> text
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/__([^_]+)__/g, '$1').replace(/<[^>]+>/g, '');
  s = s.replace(/\\([*_#\[\]().!-])/g, '$1');
  return { text: s, links };
}
const SP_ING_HEAD = /^(?:#+\s*)?[*_]*(?:необходими\s+|нужни\s+)?(?:съставки|продукти|материали|ingredients?)[*_]*\s*(?::\s*(.*))?$/i;
const SP_STEP_HEAD = /^(?:#+\s*)?[*_]*(?:рецептата|приготвяне(?:то)?|начин(?:ът)?\s+на\s+приготвяне|метод|подготовка|инструкции|направа|как\s+се\s+прави|instructions?|directions?|method|preparation|steps?)[*_]*\s*(?::\s*(.*))?$/i;

/* ---------- ingredients ---------- */
function spIngredientLines(lines, servings) {
  const out = [], extra = []; let estimated = 0;
  const qtyOnly = line => {
    const m = line.match(new RegExp(`^${SP_Q}\\s*(.*)$`, 'u'));
    if (!m) return null;
    const su = spSplitUnit(m[2].trim());
    if (su && !su[1]) return [m[1], su[0]];                   // "10 броя", "1 чаена чаша", "2 глави"
    if (!m[2].trim()) return [m[1], 'бр.'];                    // just "3"
    return null;
  };
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].replace(/^[\s·•*\-–—]+/, '').replace(/[\s;,.]+$/, '').replace(/\s+/g, ' ').trim();
    if (!line) continue;
    if (/^[👉➡→]/u.test(line)) { extra.push(line.replace(/^[👉➡→️\s]+/u, '')); continue; }   // an instruction in the list ("👉 Разделяш на 5 топки…") is a step
    if (/:$/.test(line) && line.length < 60) { out.push('## ' + line.replace(/:$/, '')); continue; }       // sub-heading ("За соса:")
    // name line followed by a quantity-only line (supichka style)
    const next = lines[i + 1] ? lines[i + 1].replace(/^[\s·•*\-–—]+/, '').trim() : '';
    const q = !/\d/.test(line) && next ? qtyOnly(next) : null;
    if (q) { out.push(`${spFmtQ(q[0])} ${q[1]} ${spLowerFirst(line)}`.replace(/\s+/g, ' ')); i++; continue; }
    // quantity first: "500 гр брашно", "2 с.л. зехтин", "1 1/2 ч.ч. мляко"
    let m = line.match(new RegExp(`^${SP_Q}\\s*(.*)$`, 'u'));
    if (m) {
      const rest = m[2].trim(), su = spSplitUnit(rest);
      if (su) { out.push(`${spFmtQ(m[1])} ${su[0]} ${spLowerFirst(su[1])}`.replace(/\s+/g, ' ').trim()); continue; }
      if (/^\p{L}/u.test(rest)) { out.push(`${spFmtQ(m[1])} бр. ${spLowerFirst(rest)}`); continue; }
      out.push(line); continue;
    }
    // quantity last: "брашно - 500 гр", "Зехтин 2 с.л.", "Чесън – 5 скилидки"
    m = line.match(new RegExp(`^([^\\d½¼¾⅓⅔⅛]+?)[\\s\\-–:(]*${SP_Q}\\s*(.*)$`, 'u'));
    if (m) {
      const su = spSplitUnit(m[3].trim().replace(/\)$/, ''));
      if (su && /\/\s*~?\s*$/.test(m[1]) && su[1]) { out.push(`${spFmtQ(m[2])} ${su[0]} ${spLowerFirst(su[1])} / ${spLowerFirst(m[1].replace(/[\s/~]+$/, ''))}`); continue; }   // "щипка мая / ~38 гр закваска"
      if (su && m[1].trim().length <= 60) { out.push(`${spFmtQ(m[2])} ${su[0]} ${spLowerFirst(m[1].trim())}${su[1] ? ', ' + su[1] : ''}`); continue; }
    }
    // "щипка сол", "връзка магданоз": the unit comes first, the amount is one
    m = line.match(/^(щипка|шепа|китка|връзка|клонка|стрък|стръкче|скилидка|глава)\s+(.+)$/iu);
    if (m) { out.push(`1 ${m[1].toLowerCase()} ${spLowerFirst(m[2])}`); continue; }
    // no quantity at all: estimate a typical amount, so the recipe can still be scaled
    const est = !/\d/.test(line) ? spEstimate(line, servings) : null;
    if (est) { out.push(est); estimated++; } else out.push(spLowerFirst(line));
  }
  return { list: out, estimated, extra };
}

/* ---------- categories ---------- */
const SP_CATS = [
  ['pizza', /пица/i], ['pasta', /паста|спагет|макарон|лазаня|тестени/i], ['chicken', /пиле|пилеш|кокошк/i], ['pork', /свинск|свинс/i], ['beef', /телешк|говежд|кайма/i],
  ['fish', /риба|сьомга|скумрия|морск|скарид/i], ['rice', /ориз|булгур|ризото|кускус/i], ['bread', /хляб|тесто|питка|пърленк|кифл|погача|мекиц|тестен/i], ['dessert', /торта|сладкиш|десерт|крем|кекс|бисквит|палачинк|мус\b/i],
  ['salad', /салата/i], ['sauce', /сос\b|дресинг|мариновка/i], ['meze', /разядка|мезе|хумус|дип|намаз/i], ['veggie', /чушк|зеленчук|тиквичк|патладжан|боб|леща|гъби|картоф/i],
  ['eggs', /яйц|омлет|бъркани/i], ['drinks', /напитка|коктейл|смути|кафе|чай\b|лимонада/i],
];

/* ---------- main ---------- */
function smartParseRecipe(raw) {
  const { text, links } = spStrip(raw);
  const all = text.split('\n').map(l => l.replace(/\s+$/, ''));
  // 1) sections
  let ingAt = -1, stepAt = -1, ingInline = '', stepInline = '';
  all.forEach((l, i) => {
    const t = l.trim();
    if (!t || t.length > 600) return;
    let m;
    if (ingAt < 0 && (m = t.match(SP_ING_HEAD))) { ingAt = i; ingInline = m[1] || ""; return; }
    if (stepAt < 0 && (m = t.match(SP_STEP_HEAD))) { stepAt = i; stepInline = m[1] || ""; }
  });
  let head = [], ingLines = [], stepLines = [];
  if (ingAt >= 0 && stepAt > ingAt) {
    head = all.slice(0, ingAt); ingLines = all.slice(ingAt + 1, stepAt); stepLines = all.slice(stepAt + 1);
  } else if (stepAt >= 0 && ingAt > stepAt) {                       // method first, ingredients after
    head = all.slice(0, stepAt); stepLines = all.slice(stepAt + 1, ingAt); ingLines = all.slice(ingAt + 1);
  } else if (ingAt >= 0) {
    head = all.slice(0, ingAt); const rest = all.slice(ingAt + 1);
    const cut = rest.findIndex((l, i) => i > 1 && (/^\s*\d+[.)]\s+\p{L}/u.test(l) || l.trim().length > 90));
    ingLines = cut >= 0 ? rest.slice(0, cut) : rest; stepLines = cut >= 0 ? rest.slice(cut) : [];
  } else {
    // no headings: short lines that start with a quantity (or contain quantity + unit) are ingredients, wherever they are;
    // everything else is the method. Times and temperatures ("35 минути", "180°") and full sentences are not ingredients.
    const qtyUnit = /\d[\d.,/½¼¾\s-]*\s*(?:(?:кг|гр|г|мл|л|с\.?\s?л|ч\.?\s?л|ч\.?\s?ч|бр|g|ml|tbsp|tsp|cups?)(?![\p{L}])|скилид|глав|връзк|щипк|чаш|лъжиц|лъжичк)/iu;
    const timeWord = /(?:минут|мин\b|час(?:а|ове)?\b|градус|°|сек\b|секунд)/i;
    const isIng = l => {
      const t = l.trim();
      if (!t || t.length >= 75 || /^\d+[.)]\s+\p{L}/u.test(t)) return false;
      if (timeWord.test(t) && !qtyUnit.test(t.replace(timeWord, ''))) return false;
      if (/[.!?]$/.test(t) && t.split(/\s+/).length > 6) return false;
      return new RegExp(`^[\\s·•*\\-–—]*${SP_Q}`, 'u').test(t) || /^[\s·•*\-–—]\s*\p{L}/u.test(t) || qtyUnit.test(t);
    };
    const idx = all.map((l, i) => (isIng(l) ? i : -1)).filter(i => i >= 0);
    if (idx.length >= 3) {
      const set = new Set(idx);
      head = all.slice(0, idx[0]); ingLines = idx.map(i => all[i]);
      stepLines = all.filter((l, i) => i > idx[0] && !set.has(i));
    } else { head = []; stepLines = all; }
  }
  if (ingInline) ingLines = ingInline.split(/\s*[;,]\s*(?![^()]*\))/).concat(ingLines);
  if (stepInline) stepLines = [stepInline].concat(stepLines);

  // 2) title: first short line of the head, else guessed from "Рецептата за …" link text
  let title = '';
  const headText = head.map(l => l.trim()).filter(Boolean);
  const cand = headText.find(l => l.length <= 80 && !/[.!?]$/.test(l) && !/^[*\-•]/.test(l));
  if (cand) title = cand.replace(/^#+\s*/, '').replace(/^[*_]+|[*_]+$/g, '').trim();
  if (!title) {
    const lk = links.find(l => /^рецепт(ата|а)\s+(за|на)\s+/i.test(l.label));
    if (lk) title = lk.label.replace(/^рецепт(ата|а)\s+(за|на)\s+/i, '').trim();
    else if (links[0]) title = links[0].label.replace(/^рецепт(ата|а)\s+(за|на)\s+/i, '').trim();
  }
  if (title) title = title.charAt(0).toUpperCase() + title.slice(1);

  // 3) servings (from the text if present, else a sensible default)
  const sv = text.match(/(?:за|serves?|порции:?)\s*(\d{1,2})\s*(?:порции|човека|души|persons?|servings?)?/i);
  let servings = sv && /порци|човека|души|serv|person/i.test(sv[0]) ? sv[1] : '';
  if (!servings) { const sv2 = head.map(l => l.match(/(?:^|[\s*•-])(\d{1,2})\s*порции(?![\p{L}])/iu)).find(Boolean); if (sv2) servings = sv2[1]; }   // "8 порции" in the page header
  const tm = head.map(l => l.match(/^[\s*•-]*(\d{1,3})\s*(?:мин|mins?|minutes?)\.?\s*$/i)).find(Boolean);                                       // "15 мин." in the page header
  const time = tm ? `${tm[1]} мин` : '';
  // author ("By Jamie Oliver") and book ("Recipe From" + next line) printed on the page
  const byM = all.map(l => l.trim().match(/^[Bb]y\s+(\p{Lu}[\p{L}.'’-]*(?:\s+\p{Lu}[\p{L}.'’-]*){0,3})$/u)).find(Boolean);
  const author = byM ? byM[1] : '';
  const rfAt = all.findIndex(l => /^recipe\s+from\s*$/i.test(l.trim()));
  const book = rfAt >= 0 ? (all.slice(rfAt + 1, rfAt + 4).map(l => l.trim()).find(l => l && !/^by\s/i.test(l)) || '') : '';
  const titleAndIng = (title + ' ' + ingLines.join(' '));
  const categories = SP_CATS.filter(([, re]) => re.test(titleAndIng)).map(c => c[0]).slice(0, 2);
  if (!servings) servings = '4';

  // 4) ingredients
  const ing = spIngredientLines(ingLines.filter(l => l.trim() || true), servings);

  // 5) method: numbered steps if present (text before the first one is a description), otherwise one step per paragraph
  const numRe = /^(?:шаг|стъпка|step)?\s*(\d+)\s*[.):-]\s+(.*)$/i;
  const pre = [], numbered = []; let cur = null, seen = false;
  const closing = /^рецепт(?:ата|а)\s+(?:за|на)\s+.+?\s+(?:е\s+)?(?:изпълнена|готова)[.!]*$/i;
  for (const l of stepLines) {
    const t = l.trim(), m = t.match(numRe);
    if (m) { seen = true; if (cur !== null) numbered.push(cur); cur = m[2]; continue; }
    if (!t) { if (cur !== null) { (seen ? numbered : pre).push(cur); cur = null; } continue; }   // a blank line ends a paragraph / step
    if (closing.test(t)) break;                                                                  // "Рецептата за … е изпълнена!" — everything after it is page footer
    cur = cur !== null ? cur + ' ' + t : t;
  }
  if (cur !== null) (seen ? numbered : pre).push(cur);
  const stepsList = (seen ? numbered : pre).map(s => s.trim()).filter(Boolean).concat(ing.extra);
  const intro = seen ? pre : [];
  const noteParts = [];
  if (intro.length) noteParts.push(intro.join('\n'));
  const source = links.find(l => /^рецепт/i.test(l.label));
  return {
    title, ingredients: ing.list, steps: stepsList.join('\n\n'), notes: noteParts.join('\n').slice(0, 1500),
    categories, servings, time, author, book, links: source ? [{ url: source.url, label: spHost(source.url) }] : [],
    stats: { ingredients: ing.list.filter(x => !x.startsWith('## ')).length, steps: stepsList.length, estimated: ing.estimated },
  };
}
function spHost(url) { try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return url; } }
