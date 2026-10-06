// Rifay Umami — "Подреди с AI": turns a pasted web page / message into a structured recipe.
// Runs on Supabase (Edge Function). Needs the secret ANTHROPIC_API_KEY. Only signed-in users, with a total limit each.
import { createClient } from 'npm:@supabase/supabase-js@2';

const MODEL = 'claude-haiku-4-5-20251001';
const LIMIT = 20; // AI recipes per user, in total (the admin has no limit)
const MAX_CHARS = 24000;
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const SYSTEM = `You turn text copied from a web page, message or document into a clean recipe. Reply with ONE JSON object and nothing else.
The source can be text and/or photos or screenshots of a recipe (read all the text in them, in order). It may contain page junk (menus, icons such as "book icon", dates, comment counts, share buttons, ads, related links, "bon appetit" lines). Ignore all of it.
Never invent ingredients or steps that are not in the text.
ALWAYS write the whole result in Bulgarian: if the source is in another language, translate the title, ingredients, steps and notes naturally into Bulgarian (cooking terms as Bulgarian cooks say them). Convert oz, lb, °F and fl oz to metric (гр, кг, мл, °C); cups and spoons can stay as ч.ч., с.л., ч.л.
JSON fields:
- "title": short recipe name, no emojis, no site name.
- "ingredients": array of strings, one per ingredient, in the form "<quantity> <unit> <name>", e.g. "400 гр брашно", "2 с.л. зехтин", "1 бр. лук". Use only these units: гр, кг, мл, л, с.л., ч.л., ч.ч., бр., щипка, скилидки, връзка. Fractions like ½, ¼, 1½ are fine. Ranges like "2-3" are fine. If an amount is missing, estimate a typical amount for 4 servings. Names and amounts can be split across lines or glued together in the source: pair them up carefully. A sub-section title (e.g. "За соса") becomes an item "## За соса" placed before its ingredients.
- "steps": array of strings, one per step, no numbering, copied or lightly tidied from the text.
- "notes": 0-2 short sentences of useful intro or tips from the text, or "".
- "servings": number of servings as a string, or "" if unknown.
- "author": the person the recipe is credited to, if the page says so anywhere. It may be a byline ("By Jamie Oliver"), a label ("Автор: Лора Найденова") or a sentence ("Рецептата е от шеф Лора Найденова", "recipe by chef X", "от X"). Return only the name without titles like "шеф", "chef", "готвач" (so "шеф Лора Найденова" gives "Лора Найденова"). Keep names of people as written in the source (do not translate or transliterate them). Do not return the website or shop name as author. If no person is credited, "".
- "book": the cookbook or series it comes from if stated (e.g. "Recipe From Jamie's 20-Minute Meals"), translated to Bulgarian only if it is a descriptive phrase; else "".
- "time": total time like "45 мин" or "1 ч 30 мин", or "".
- "categories": up to 2 of: chicken, pork, beef, pasta, fish, rice, bread, pizza, dessert, sauce, salad, meze, veggie, eggs, drinks, other.`;

// A YouTube link: returns the video id ('' for any other link).
function youtubeId(link: string): string {
  try {
    const u = new URL(link);
    const h = u.hostname.replace(/^www\.|^m\./, '');
    if (h === 'youtu.be') return u.pathname.slice(1).split('/')[0].slice(0, 11);
    if (h === 'youtube.com' || h === 'music.youtube.com') {
      if (u.pathname === '/watch') return (u.searchParams.get('v') || '').slice(0, 11);
      const m = u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/);
      if (m) return m[1];
    }
  } catch (_e) { /* not a link */ }
  return '';
}
// Title, channel and the description of a YouTube video (that is where cooks usually write the recipe).
async function youtubeText(id: string): Promise<string> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${id}`, {
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'accept-language': 'bg,en;q=0.8', cookie: 'CONSENT=YES+1; SOCS=CAI' },
      signal: AbortSignal.timeout(10000),
    });
    const html = (await res.text()).slice(0, 2_500_000);
    const pick = (re: RegExp) => { const m = html.match(re); if (!m) return ''; try { return JSON.parse(`"${m[1]}"`); } catch (_e) { return m[1]; } };
    const title = pick(/"title":"((?:[^"\\]|\\.)*)"/) || pick(/<meta name="title" content="([^"]*)"/);
    const channel = pick(/"ownerChannelName":"((?:[^"\\]|\\.)*)"/);
    const desc = pick(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
    if (!desc && !title) return '';
    return `YouTube video\nTitle: ${title}\nChannel: ${channel}\nDescription:\n${desc}`.slice(0, MAX_CHARS);
  } catch (_e) {
    return '';
  }
}

// Downloads one public web page and returns its readable text ('' when it cannot be opened). Local/private addresses are refused.
async function pageText(link: string): Promise<string> {
  try {
    const u = new URL(link);
    const h = u.hostname.toLowerCase();
    if (!/^https?:$/.test(u.protocol) || h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal')
      || /^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h) || h.includes(':') || !h.includes('.')) return '';
    const res = await fetch(u.toString(), {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; RifayUmami/1.0)', accept: 'text/html,application/xhtml+xml' },
      redirect: 'follow', signal: AbortSignal.timeout(10000),
    });
    if (!res.ok || !(res.headers.get('content-type') || '').includes('html')) return '';
    let html = (await res.text()).slice(0, 1_500_000);
    // The page head often holds what the visible text lacks: title, description (e.g. "recipe by chef …") and structured Recipe data.
    const decode = (s: string) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    const head: string[] = [];
    const ttl = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (ttl) head.push('Page title: ' + decode(ttl[1].trim()));
    for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
      const tag = m[0];
      const name = (tag.match(/(?:name|property)=["']([^"']+)["']/i) || [])[1] || '';
      const content = (tag.match(/content=["']([^"']*)["']/i) || [])[1] || '';
      if (content && /^(description|og:title|og:description|twitter:description|author|article:author)$/i.test(name)) head.push(`${name}: ${decode(content)}`);
    }
    for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) head.push('Structured data: ' + m[1].trim().slice(0, 8000));
    html = html.replace(/<(script|style|noscript|svg|nav|header|footer|form)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|tr|section|article)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
    const all = (head.join('\n') + '\n\n' + html).trim();
    return html.length > 40 || head.length > 1 ? all.slice(0, MAX_CHARS) : '';
  } catch (_e) {
    return '';
  }
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: u } = await admin.auth.getUser(token);
    if (!u?.user) return json({ error: 'login_required' }, 401);

    const { data: banned } = await admin.from('blocked_users').select('user_id').eq('user_id', u.user.id).maybeSingle();
    if (banned) return json({ error: 'blocked' }, 403);

    const key = Deno.env.get('ANTHROPIC_API_KEY');
    if (!key) return json({ error: 'not_configured' }, 503);

    const body = await req.json().catch(() => ({}));

    // total limit per user (admins are unlimited)
    const { data: adm } = await admin.from('app_admins').select('user_id').eq('user_id', u.user.id).maybeSingle();
    const unlimited = !!adm;
    const { data: rows } = await admin.from('ai_usage').select('n').eq('user_id', u.user.id);
    const used = (rows || []).reduce((s: number, x: { n: number }) => s + x.n, 0);
    if (body.check) return json({ left: unlimited ? null : Math.max(0, LIMIT - used) });
    if (!unlimited && used >= LIMIT) return json({ error: 'limit', limit: LIMIT }, 429);

    let text = String(body.text || '').slice(0, MAX_CHARS).trim();
    // Only a link was pasted: open that one page and use its text (the AI itself cannot open links).
    let sourceUrl = '';
    if (/^https?:\/\/\S+$/i.test(text)) {
      const yt = youtubeId(text);
      sourceUrl = yt ? `https://www.youtube.com/watch?v=${yt}` : text;   // a video link is cleaned of playlist parameters
      const page = yt ? await youtubeText(yt) : await pageText(text);
      if (!page) return json({ error: 'fetch_failed' }, 422);
      text = page;
    }
    const images = (Array.isArray(body.images) ? body.images : []).slice(0, 3)
      .filter((i: { media_type?: string; data?: string }) => i && ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(i.media_type || '') && typeof i.data === 'string' && i.data.length < 3_000_000);
    if (text.length < 20 && !images.length) return json({ error: 'too_short' }, 400);
    const day = new Date().toISOString().slice(0, 10);
    const { data: today } = await admin.from('ai_usage').select('n').eq('user_id', u.user.id).eq('day', day).maybeSingle();

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 4000, system: SYSTEM, messages: [{ role: 'user', content: [
        ...images.map((i: { media_type: string; data: string }) => ({ type: 'image', source: { type: 'base64', media_type: i.media_type, data: i.data } })),
        { type: 'text', text: text || 'The recipe is in the image(s).' },
      ] }] }),
    });
    if (!r.ok) return json({ error: 'ai_failed', status: r.status }, 502);
    const out = await r.json();
    const raw: string = out?.content?.[0]?.text || '';
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return json({ error: 'ai_failed' }, 502);
    const rec = JSON.parse(m[0]);

    // nothing that looks like a recipe (e.g. a video without a recipe in its description): do not count it
    if (!Array.isArray(rec.ingredients) || !rec.ingredients.length) {
      if (!Array.isArray(rec.steps) || !rec.steps.length) return json({ error: 'no_recipe' }, 422);
    }

    await admin.from('ai_usage').upsert({ user_id: u.user.id, day, n: (today?.n ?? 0) + 1 });
    return json({
      title: String(rec.title || ''),
      ingredients: (Array.isArray(rec.ingredients) ? rec.ingredients : []).map(String),
      steps: (Array.isArray(rec.steps) ? rec.steps : []).map(String),
      notes: String(rec.notes || ''),
      servings: String(rec.servings || ''),
      time: String(rec.time || ''),
      author: String(rec.author || ''),
      book: String(rec.book || ''),
      url: sourceUrl,
      categories: Array.isArray(rec.categories) ? rec.categories.map(String).slice(0, 2) : [],
      left: unlimited ? null : Math.max(0, LIMIT - used - 1),
    });
  } catch (_e) {
    return json({ error: 'ai_failed' }, 500);
  }
});
