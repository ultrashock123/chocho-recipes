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
- "author": the chef or author of the recipe if the page names one (e.g. "By Jamie Oliver" gives "Jamie Oliver"; keep names of people as written, do not translate them), else "".
- "book": the cookbook or series it comes from if stated (e.g. "Recipe From Jamie's 20-Minute Meals"), translated to Bulgarian only if it is a descriptive phrase; else "".
- "time": total time like "45 мин" or "1 ч 30 мин", or "".
- "categories": up to 2 of: chicken, pork, beef, pasta, fish, rice, bread, pizza, dessert, sauce, salad, meze, veggie, eggs, drinks, other.`;

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

    const text = String(body.text || '').slice(0, MAX_CHARS).trim();
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
      categories: Array.isArray(rec.categories) ? rec.categories.map(String).slice(0, 2) : [],
      left: unlimited ? null : Math.max(0, LIMIT - used - 1),
    });
  } catch (_e) {
    return json({ error: 'ai_failed' }, 500);
  }
});
