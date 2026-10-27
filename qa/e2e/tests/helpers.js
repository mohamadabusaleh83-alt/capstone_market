import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const API = process.env.QA_API_URL || 'http://127.0.0.1:8000';
export const PASSWORD = 'QaTest#2026';
export const USERS = {
  student: 'qa_student@test.local',
  student2: 'qa_student2@test.local',
  company: 'qa_company@test.local',
  company2: 'qa_company2@test.local',
  supervisor: 'qa_supervisor@test.local',
  admin: 'qa_admin@test.local',
};

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const QA_DIR = path.resolve(HERE, '..', '..');
export const SHOTS = path.join(QA_DIR, 'screenshots');
export const RESULTS = path.resolve(HERE, '..', 'results');
fs.mkdirSync(SHOTS, { recursive: true });
fs.mkdirSync(RESULTS, { recursive: true });

export function writeResult(name, data) {
  fs.writeFileSync(path.join(RESULTS, `${name}.json`), JSON.stringify(data, null, 2), 'utf-8');
}

export async function apiToken(request, role) {
  const r = await request.post(`${API}/login`, { form: { username: USERS[role], password: PASSWORD } });
  if (!r.ok()) throw new Error(`login ${role} -> ${r.status()}`);
  return (await r.json()).access_token;
}

export async function api(request, role, method, url, data) {
  const token = role ? await apiToken(request, role) : null;
  const r = await request.fetch(`${API}${url}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    data,
  });
  return { status: r.status(), body: await r.json().catch(() => null) };
}

/** Mirror of AuthContext's user object so the SPA boots already logged in. */
export async function sessionFor(request, role) {
  const token = await apiToken(request, role);
  const me = await (await request.get(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } })).json();
  const norm = me.role === 'partner' || me.role === 'business' ? 'company' : me.role;
  return { token, user: { id: me.id, name: me.full_name, email: me.email, role: norm, rawRole: me.role, title: norm } };
}

/** Put the browser in a given auth/lang/theme state, then open `route`. */
export async function openAs(page, request, role, route, { lang = 'ar', theme = 'light', skipOnboarding = true } = {}) {
  const sess = role ? await sessionFor(request, role) : null;
  await page.goto('/about');
  await page.evaluate(({ sess, lang, theme, skipOnboarding }) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('app_language', lang);
    localStorage.setItem('app_theme', theme);
    if (sess) {
      localStorage.setItem('token', sess.token);
      localStorage.setItem('app_user_role', JSON.stringify(sess.user));
    }
    if (skipOnboarding) sessionStorage.setItem('skip_student_onboarding', 'true');
  }, { sess, lang, theme, skipOnboarding });
  await page.goto(route);
  await settle(page);
  return sess;
}

export async function settle(page, ms = 900) {
  // the SPA keeps polling (/notifications every 30s), so cap the idle wait
  await page.waitForLoadState('networkidle', { timeout: 2500 }).catch(() => {});
  await page.waitForTimeout(ms);
}

export async function loginViaUI(page, role, { lang = 'en' } = {}) {
  await page.goto('/login');
  await page.evaluate((lang) => { localStorage.clear(); localStorage.setItem('app_language', lang); }, lang);
  await page.reload();
  await page.locator('input[type="email"]').fill(USERS[role]);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15000 });
  await settle(page);
}

/** Collect console errors, page errors, failed and >=400 network requests. */
export function watch(page) {
  const log = { console: [], pageErrors: [], failed: [], http: [] };
  page.on('console', (m) => { if (m.type() === 'error') log.console.push(m.text().slice(0, 300)); });
  page.on('pageerror', (e) => log.pageErrors.push(String(e).slice(0, 300)));
  page.on('requestfailed', (r) => log.failed.push(`${r.method()} ${r.url()} :: ${r.failure()?.errorText}`));
  page.on('response', (r) => { if (r.status() >= 400) log.http.push(`${r.status()} ${r.request().method()} ${r.url()}`); });
  return log;
}

export function shotName(...parts) {
  return path.join(SHOTS, parts.join('__').replace(/[^\w.-]+/g, '_') + '.png');
}
