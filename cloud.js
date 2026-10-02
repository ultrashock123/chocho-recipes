/* Rifay Umami — accounts + shared recipes on Supabase (see SETUP.md).
   Without keys in config.js the app stays local-only, exactly as before. */
'use strict';

const BUCKET = 'recipe-images';
const auth = { mode: 'local', user: null, profile: null }; // mode: local | guest | user
let sb = null;

const cloudCfg = () => window.RIFAY_CONFIG || {};
const cloudOn = () => !!(cloudCfg().supabaseUrl && cloudCfg().supabaseAnonKey && window.supabase);
const guestChosen = () => { try { return localStorage.getItem('chocho.guest') === '1'; } catch (e) { return false; } };
const setGuestChosen = on => { try { on ? localStorage.setItem('chocho.guest', '1') : localStorage.removeItem('chocho.guest'); } catch (e) {} };

/* ---------------- Session ---------------- */
async function initCloud() {
  if (!cloudOn()) return;
  const c = cloudCfg();
  sb = window.supabase.createClient(c.supabaseUrl, c.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
  });
  auth.mode = 'guest';
  try { const { data } = await sb.auth.getSession(); await applySession(data.session); } catch (e) {}
  sb.auth.onAuthStateChange((event, session) => {
    // Deferred: calling Supabase from inside this callback can deadlock.
    setTimeout(async () => {
      if (event === 'PASSWORD_RECOVERY') { openAuth({ view: 'newpass' }); return; }
      if (event !== 'SIGNED_IN' && event !== 'SIGNED_OUT') return;
      const before = auth.user && auth.user.id;
      await applySession(session);
      if ((auth.user && auth.user.id) !== before) {
        closeAuth(); await reloadAll();
        if (auth.mode === 'guest' && !guestChosen()) openAuth({ view: 'signin', dismissible: false });
      }
    }, 0);
  });
}

async function applySession(session) {
  const user = (session && session.user) || null;
  auth.user = user; auth.profile = null;
  if (!user) { auth.mode = 'guest'; return; }
  auth.mode = 'user';
  setGuestChosen(false);
  const meta = user.user_metadata || {};
  const fallback = {
    id: user.id,
    display_name: meta.display_name || meta.full_name || meta.name || (user.email || '').split('@')[0],
    avatar_url: meta.avatar_url || meta.picture || null,
    show_author: true,
  };
  try {
    const { data } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (data) auth.profile = data;
    else { await sb.from('profiles').upsert(fallback); auth.profile = fallback; }
  } catch (e) { auth.profile = fallback; }
}

async function saveProfile(patch) {
  if (auth.mode !== 'user') return;
  auth.profile = Object.assign({}, auth.profile, patch);
  const row = { id: auth.user.id, display_name: auth.profile.display_name, avatar_url: auth.profile.avatar_url || null };
  if ('show_author' in patch) row.show_author = !!patch.show_author; // column exists after the sharing update of schema.sql
  try {
    const { error } = await sb.from('profiles').upsert(row);
    if (error) throw error;
  } catch (e) { toast(t('save_err')); }
}
const showsAuthor = () => !auth.profile || auth.profile.show_author !== false;

const signInOAuth = provider => sb.auth.signInWithOAuth({ provider, options: { redirectTo: location.origin + location.pathname } });
const signInEmail = (email, password) => sb.auth.signInWithPassword({ email, password });
const signUpEmail = (name, email, password) => sb.auth.signUp({
  email, password, options: { data: { display_name: name }, emailRedirectTo: location.origin + location.pathname },
});
const resetPassword = email => sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
const setNewPassword = password => sb.auth.updateUser({ password });
async function signOut() { try { await sb.auth.signOut(); } catch (e) {} }

/* ---------------- Cloud backend ---------------- */
const photoPath = url => {
  const m = String(url || '').match(new RegExp('/' + BUCKET + '/(.+?)(?:\\?|$)'));
  return m ? decodeURIComponent(m[1]) : null;
};
const isOwnCloudPhoto = url => !!(auth.user && (photoPath(url) || '').startsWith(auth.user.id + '/'));

const cloud = {
  async list() {
    const { data, error } = await sb.from('recipes')
      .select('id,owner_id,visibility,based_on,data,created_at,updated_at')
      .order('created_at', { ascending: false }).limit(2000);
    if (error) throw error;
    const names = {};
    const ids = [...new Set(data.map(r => r.owner_id))];
    if (ids.length) {
      const { data: ps } = await sb.from('profiles').select('id,display_name').in('id', ids);
      (ps || []).forEach(p => { names[p.id] = p.display_name; });
    }
    return data.map(row => Object.assign({}, row.data, {
      id: row.id, owner: row.owner_id, ownerName: names[row.owner_id] || '', visibility: row.visibility,
      basedOn: row.based_on || null, createdAt: Date.parse(row.created_at), updatedAt: Date.parse(row.updated_at), seed: false,
    }));
  },
  async save(r) {
    const data = {};
    RECIPE_FIELDS.forEach(k => { data[k] = r[k]; });
    const { error } = await sb.from('recipes').upsert({
      id: r.id, owner_id: auth.user.id, visibility: r.visibility || 'public', based_on: r.basedOn || null,
      data, created_at: new Date(r.createdAt || Date.now()).toISOString(), updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  },
  async remove(r) {
    const { error } = await sb.from('recipes').delete().eq('id', r.id).eq('owner_id', auth.user.id);
    if (error) throw error;
    const paths = (r.images || []).map(photoPath).filter(p => p && p.startsWith(auth.user.id + '/'));
    if (paths.length) { try { await sb.storage.from(BUCKET).remove(paths); } catch (e) {} }
  },
  // People who allow to be found (Settings → "Show my name"). Matches by display name only; emails are never exposed.
  async searchUsers(q) {
    const term = q.replace(/[%_,()]/g, ' ').trim();
    if (term.length < 2) return [];
    const { data, error } = await sb.from('profiles').select('id,display_name,avatar_url')
      .ilike('display_name', `%${term}%`).neq('id', auth.user.id).limit(20);
    if (error) throw error;
    return data || [];
  },
  async profilesByIds(ids) {
    if (!ids.length) return {};
    const { data } = await sb.from('profiles').select('id,display_name,avatar_url').in('id', ids);
    return Object.fromEntries((data || []).map(p => [p.id, p]));
  },
  // Sends I made for a recipe (any recipe: originals and other people's too).
  async listShares(recipeId) {
    const { data, error } = await sb.from('recipe_shares').select('shared_with').eq('recipe_id', recipeId).eq('owner_id', auth.user.id);
    if (error) throw error;
    const ids = (data || []).map(s => s.shared_with);
    const byId = await this.profilesByIds(ids);
    return ids.map(id => byId[id] || { id, display_name: '…', avatar_url: null });
  },
  async share(recipeId, userId) {
    const { error } = await sb.from('recipe_shares').upsert({ recipe_id: recipeId, owner_id: auth.user.id, shared_with: userId });
    if (error) throw error;
  },
  async unshare(recipeId, userId) {
    const { error } = await sb.from('recipe_shares').delete().eq('recipe_id', recipeId).eq('shared_with', userId).eq('owner_id', auth.user.id);
    if (error) throw error;
  },
  // Recipes sent to me: { recipeId: { from: 'Name' } }
  async incoming() {
    const { data, error } = await sb.from('recipe_shares').select('recipe_id,owner_id,created_at').eq('shared_with', auth.user.id);
    if (error) throw error;
    const byId = await this.profilesByIds([...new Set((data || []).map(s => s.owner_id))]);
    const out = {};
    (data || []).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
      .forEach(s => { out[s.recipe_id] = { from: (byId[s.owner_id] || {}).display_name || '' }; });
    return out;
  },
  async listFriends() {
    const { data, error } = await sb.from('friends').select('friend_id').eq('user_id', auth.user.id);
    if (error) throw error;
    const ids = (data || []).map(f => f.friend_id);
    const byId = await this.profilesByIds(ids);
    return ids.map(id => byId[id] || { id, display_name: '…', avatar_url: null });
  },
  async addFriend(id) {
    const { error } = await sb.from('friends').upsert({ user_id: auth.user.id, friend_id: id });
    if (error) throw error;
  },
  async removeFriend(id) {
    const { error } = await sb.from('friends').delete().eq('user_id', auth.user.id).eq('friend_id', id);
    if (error) throw error;
  },
  // Originals removed for everybody by the site admin.
  async removedList() {
    const { data, error } = await sb.from('removed_recipes').select('recipe_id');
    if (error) throw error;
    return (data || []).map(r => r.recipe_id);
  },
  async isAdmin() {
    const { data, error } = await sb.from('app_admins').select('user_id').eq('user_id', auth.user.id).maybeSingle();
    return !error && !!data;
  },
  async removeGlobal(id) {
    const { error } = await sb.from('removed_recipes').upsert({ recipe_id: id, removed_by: auth.user.id });
    if (error) throw error;
  },
  async loadStates() {
    let res = await sb.from('recipe_states').select('recipe_id,favorite,tried,cooked,last_cooked,hidden').eq('user_id', auth.user.id);
    // Before the v1.5 database update the extra columns do not exist: fall back to the basic ones.
    if (res.error) res = await sb.from('recipe_states').select('recipe_id,favorite,tried').eq('user_id', auth.user.id);
    if (res.error) throw res.error;
    return Object.fromEntries(res.data.map(s => [s.recipe_id, {
      favorite: !!s.favorite, tried: s.tried, cooked: s.cooked || 0, hidden: !!s.hidden,
      lastCooked: s.last_cooked ? Date.parse(s.last_cooked) : null,
    }]));
  },
  async saveState(id, st) {
    const row = {
      user_id: auth.user.id, recipe_id: id, favorite: !!st.favorite, tried: st.tried === undefined ? null : st.tried,
      updated_at: new Date().toISOString(),
    };
    if (st.cooked !== undefined) row.cooked = st.cooked || 0;
    if (st.lastCooked) row.last_cooked = new Date(st.lastCooked).toISOString();
    if (st.hidden !== undefined) row.hidden = !!st.hidden;
    const { error } = await sb.from('recipe_states').upsert(row);
    if (error) throw error;
  },
  async uploadPhoto(blob) {
    const path = `${auth.user.id}/${uid('p')}.jpg`;
    const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
    if (error) throw error;
    return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  },
  async deletePhoto(url) {
    const p = photoPath(url);
    if (p && p.startsWith(auth.user.id + '/')) { try { await sb.storage.from(BUCKET).remove([p]); } catch (e) {} }
  },
};

/* ---------------- Auth screen ---------------- */
const BRAND_ICONS = {
  google: '<svg viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24"><path fill="#1877F2" stroke="none" d="M24 12c0-6.63-5.37-12-12-12S0 5.37 0 12c0 5.99 4.39 10.95 10.13 11.85v-8.38H7.08V12h3.05V9.36c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.69.23 2.69.23v2.95h-1.51c-1.49 0-1.96.93-1.96 1.87V12h3.33l-.53 3.47h-2.8v8.38C19.61 22.95 24 17.99 24 12z"/></svg>',
};

let authView = null; // { view: 'signin'|'signup'|'forgot'|'newpass', dismissible }
function closeAuth() { const r = $('#auth-root'); if (r) r.innerHTML = ''; authView = null; }

function openAuth({ view = 'signin', dismissible = true } = {}) {
  if (!cloudOn()) return;
  authView = { view, dismissible };
  renderAuth();
}

function renderAuth(msg = '', kind = '') {
  const root = $('#auth-root');
  if (!root || !authView) return;
  const { view, dismissible } = authView;
  const cfg = cloudCfg().providers || {};
  const title = { signin: t('auth_signin'), signup: t('auth_signup'), forgot: t('auth_forgot_title'), newpass: t('auth_newpass_title') }[view];
  const oauth = (view === 'signin' || view === 'signup') ? `
      ${cfg.google !== false ? `<button class="oauth" data-auth="google">${BRAND_ICONS.google}<span>${esc(t('auth_google'))}</span></button>` : ''}
      ${cfg.facebook !== false ? `<button class="oauth" data-auth="facebook">${BRAND_ICONS.facebook}<span>${esc(t('auth_facebook'))}</span></button>` : ''}
      ${cfg.google !== false || cfg.facebook !== false ? `<div class="or"><span>${esc(t('auth_or_email'))}</span></div>` : ''}` : '';
  const fields = {
    signin: `<input class="field" type="email" name="email" autocomplete="email" placeholder="${esc(t('auth_email'))}" required>
             <input class="field" type="password" name="password" autocomplete="current-password" placeholder="${esc(t('auth_password'))}" required>`,
    signup: `<input class="field" type="text" name="name" autocomplete="name" placeholder="${esc(t('your_name'))}" maxlength="40" required>
             <input class="field" type="email" name="email" autocomplete="email" placeholder="${esc(t('auth_email'))}" required>
             <input class="field" type="password" name="password" autocomplete="new-password" minlength="6" placeholder="${esc(t('auth_password_new'))}" required>`,
    forgot: `<input class="field" type="email" name="email" autocomplete="email" placeholder="${esc(t('auth_email'))}" required>`,
    newpass: `<input class="field" type="password" name="password" autocomplete="new-password" minlength="6" placeholder="${esc(t('auth_password_new'))}" required>`,
  }[view];
  const submit = { signin: t('auth_signin'), signup: t('auth_signup'), forgot: t('auth_send_link'), newpass: t('save') }[view];
  const links = view === 'signin'
    ? `<button class="auth-link" data-auth="to-signup">${esc(t('auth_no_account'))}</button><button class="auth-link" data-auth="to-forgot">${esc(t('auth_forgot'))}</button>`
    : view === 'newpass' ? '' : `<button class="auth-link" data-auth="to-signin">${esc(t('auth_have_account'))}</button>`;

  root.innerHTML = `<div class="auth"><div class="auth-card">
      ${dismissible ? `<button class="auth-close" data-auth="close" aria-label="${esc(t('cancel'))}">${I.x}</button>` : ''}
      <img src="icons/logo.svg" alt="" class="auth-logo">
      <h1>Rifay <b>Umami</b></h1>
      <p class="auth-sub">${esc(t('auth_tagline'))}</p>
      <h2 class="auth-title">${esc(title)}</h2>
      ${oauth}
      <form id="auth-form" novalidate>
        ${fields}
        <button class="btn primary" type="submit">${esc(submit)}</button>
      </form>
      <div class="auth-msg ${kind}" role="status">${esc(msg)}</div>
      <div class="auth-links">${links}</div>
      ${view === 'newpass' ? '' : `<button class="btn auth-guest" data-auth="guest">${esc(t('auth_guest'))}</button>
      <p class="hint center">${esc(t('auth_guest_hint'))}</p>`}
    </div></div>`;
}

function authError(e) {
  const m = String((e && e.message) || e || '').toLowerCase();
  if (m.includes('invalid login')) return t('auth_err_creds');
  if (m.includes('not confirmed')) return t('auth_err_confirm');
  if (m.includes('already registered') || m.includes('already been registered')) return t('auth_err_exists');
  if (m.includes('password') && m.includes('6')) return t('auth_err_short');
  if (m.includes('rate limit') || m.includes('too many')) return t('auth_err_rate');
  if (m.includes('provider is not enabled') || m.includes('unsupported provider')) return t('auth_err_provider');
  if (m.includes('failed to fetch') || m.includes('network')) return t('auth_err_net');
  return t('auth_err_generic');
}

function bindAuthEvents() {
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-auth]');
    if (!b || !authView) return;
    const act = b.dataset.auth;
    if (act === 'close') { closeAuth(); return; }
    if (act === 'guest') { setGuestChosen(true); closeAuth(); return; }
    if (act === 'to-signup' || act === 'to-signin' || act === 'to-forgot') {
      authView.view = act.slice(3); renderAuth(); return;
    }
    if (act === 'google' || act === 'facebook') {
      b.disabled = true;
      const { error } = await signInOAuth(act);
      if (error) { b.disabled = false; renderAuth(authError(error), 'err'); }
    }
  });
  document.addEventListener('submit', async e => {
    if (e.target.id !== 'auth-form' || !authView) return;
    e.preventDefault();
    const f = new FormData(e.target);
    const email = String(f.get('email') || '').trim(), password = String(f.get('password') || ''), name = String(f.get('name') || '').trim();
    const btn = e.target.querySelector('button[type=submit]');
    const view = authView.view;
    if (view !== 'newpass' && !/^\S+@\S+\.\S+$/.test(email)) { renderAuth(t('auth_err_email'), 'err'); return; }
    if ((view === 'signup' || view === 'newpass') && password.length < 6) { renderAuth(t('auth_err_short'), 'err'); return; }
    if (view === 'signin' && !password) { renderAuth(t('auth_err_creds'), 'err'); return; }
    btn.disabled = true;
    try {
      if (view === 'signin') {
        const { error } = await signInEmail(email, password);
        if (error) throw error;
      } else if (view === 'signup') {
        const { data, error } = await signUpEmail(name, email, password);
        if (error) throw error;
        // Existing confirmed address: Supabase returns a user with no identities instead of an error.
        if (data.user && data.user.identities && !data.user.identities.length) throw new Error('already registered');
        if (!data.session) { authView.view = 'signin'; renderAuth(t('auth_check_mail'), 'ok'); return; }
      } else if (view === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) throw error;
        authView.view = 'signin'; renderAuth(t('auth_reset_sent'), 'ok'); return;
      } else if (view === 'newpass') {
        const { error } = await setNewPassword(password);
        if (error) throw error;
        closeAuth(); toast(t('saved'));
      }
    } catch (err) {
      renderAuth(authError(err), 'err');
    }
  });
}
