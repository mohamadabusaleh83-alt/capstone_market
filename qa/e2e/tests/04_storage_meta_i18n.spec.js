import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { openAs, settle, shotName, writeResult, api, QA_DIR } from './helpers.js';

const SRC = path.resolve(QA_DIR, '..', 'frontend', 'src');

test.describe('data that lives only in localStorage', () => {
  test('favorites survive a login on another device', async ({ browser, request }) => {
    const a = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const pa = await a.newPage();
    await openAs(pa, request, 'student', '/projects', { lang: 'en' });
    await pa.locator('button[aria-label*="avorite"], button[title*="avorite"], button[title*="المفضلة"]').first().click();
    const keys = await pa.evaluate(() => Object.keys(localStorage));
    const fav = await pa.evaluate(() => Object.entries(localStorage).filter(([k]) => k.startsWith('favorites_')));
    await a.close();

    const b = await browser.newContext(); // "another device": fresh storage
    const pb = await b.newPage();
    await openAs(pb, request, 'student', '/projects?tab=favorites', { lang: 'en' });
    const favAfter = await pb.evaluate(() => Object.entries(localStorage).filter(([k]) => k.startsWith('favorites_')));
    await b.close();
    writeResult('favorites_device', { keysOnDeviceA: keys, favOnA: fav, favOnB: favAfter });
    expect(fav.length, 'favorite click did not store anything').toBeGreaterThan(0);
    expect(favAfter.length, 'favorites are localStorage-only: lost on a new device').toBeGreaterThan(0);
  });

  test('skills and academic CV come back from the API on a new device', async ({ browser, request }) => {
    await api(request, 'student2', 'PUT', '/users/me/profile', { bio: 'QA device bio', major: 'QA Major', course: 'Capstone 2', skills: 'Python, React' });
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await openAs(p, request, 'student2', '/cv', { lang: 'en' });
    const stored = await p.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([k]) => /user_skills_|student_academic_cv_/.test(k))));
    await p.screenshot({ path: shotName('storage', 'cv_new_device') });
    await ctx.close();
    writeResult('cv_device', stored);
    const cv = JSON.parse(Object.entries(stored).find(([k]) => k.startsWith('student_academic_cv_'))?.[1] || '{}');
    expect(cv.course, 'course from API is used').toBe('Capstone 2');
  });

  test('clearing skills on device A is reflected on device B', async ({ browser, request }) => {
    await api(request, 'student2', 'PUT', '/users/me/skills', { skills: 'Docker' });
    const b = await browser.newContext(); const pb = await b.newPage();
    await openAs(pb, request, 'student2', '/profile', { lang: 'en' }); // device B caches ["Docker"]
    await api(request, 'student2', 'PUT', '/users/me/skills', { skills: '' }); // device A clears them
    await pb.reload(); await settle(pb);
    const cached = await pb.evaluate(() => Object.entries(localStorage).find(([k]) => k.startsWith('user_skills_'))?.[1]);
    await b.close();
    writeResult('skills_clear_sync', { cachedOnB: cached });
    expect(cached, 'stale skills stay forever because empty server value is ignored').toBe('[]');
  });

  test('profile page does not save fake default values', async ({ page, request }) => {
    const reg = await request.post('http://127.0.0.1:8000/users/', { data: { full_name: 'QA Fresh Company', email: `qa_fresh_${Date.now()}@example.com`, password: 'QaTest#2026', role: 'partner' } });
    const email = (await reg.json()).email;
    const tok = (await (await request.post('http://127.0.0.1:8000/login', { form: { username: email, password: 'QaTest#2026' } })).json()).access_token;
    await page.goto('/about');
    await page.evaluate(({ tok, email }) => {
      localStorage.setItem('token', tok); localStorage.setItem('app_language', 'en');
      localStorage.setItem('app_user_role', JSON.stringify({ id: 0, name: 'QA Fresh Company', email, role: 'company', rawRole: 'partner' }));
    }, { tok, email });
    await page.goto('/profile'); await settle(page);
    const vals = await page.locator('input, textarea').evaluateAll((els) => els.map((e) => e.value).filter(Boolean));
    await page.screenshot({ path: shotName('profile_defaults_new_company'), fullPage: true });
    await page.getByRole('button', { name: /Save|حفظ/ }).first().click();
    await settle(page);
    const me = await (await request.get('http://127.0.0.1:8000/users/me/profile', { headers: { Authorization: `Bearer ${tok}` } })).json();
    writeResult('profile_defaults', { prefilled: vals, savedProfile: me });
    expect(me.phone, `fake phone saved: ${me.phone}`).not.toBe('+970 599 000 000');
    expect(me.bio || '', 'fake bio saved').not.toMatch(/شركة رائدة/);
  });
});

test.describe('meta, title, mobile header', () => {
  test('index.html has description and Open Graph tags', async ({ page }) => {
    await page.goto('/login');
    const meta = await page.evaluate(() => ({
      description: document.querySelector('meta[name="description"]')?.content || null,
      ogTitle: document.querySelector('meta[property="og:title"]')?.content || null,
      ogImage: document.querySelector('meta[property="og:image"]')?.content || null,
    }));
    writeResult('meta', meta);
    expect(meta.description).not.toBeNull();
    expect(meta.ogTitle).not.toBeNull();
  });

  test('document.title follows English', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.setItem('app_language', 'en'));
    await page.reload(); await settle(page);
    expect(await page.title()).not.toMatch(/[؀-ۿ]/);
  });

  test('login header back button stays on one line at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    for (const lang of ['ar', 'en']) {
      await page.goto('/login');
      await page.evaluate((l) => { localStorage.clear(); localStorage.setItem('app_language', l); }, lang);
      await page.reload(); await settle(page);
      const link = page.locator('header a[href="/"]').last();
      const m = await link.evaluate((el) => {
        const span = el.querySelector('span');
        const lh = parseFloat(getComputedStyle(span).lineHeight) || 16;
        return { height: el.getBoundingClientRect().height, lines: Math.round(span.getBoundingClientRect().height / lh), text: span.innerText };
      });
      await page.locator('header').first().screenshot({ path: shotName('login_header_375', lang) });
      writeResult(`login_header_375_${lang}`, m);
      expect.soft(m.lines, `"${m.text}" wraps onto ${m.lines} lines (${lang})`).toBeLessThanOrEqual(1);
    }
  });

  test('mobile: header stays visible while scrolling, drawer covers header', async ({ page, request }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await openAs(page, request, 'supervisor', '/supervisor', { lang: 'ar' });
    const scroller = await page.evaluate(() => {
      const main = document.querySelector('main');
      const docScrolls = document.documentElement.scrollHeight > innerHeight + 5;
      const mainScrolls = main.scrollHeight > main.clientHeight + 5;
      return { docScrolls, mainScrolls };
    });
    await page.mouse.wheel(0, 1500); await page.waitForTimeout(400);
    await page.evaluate(() => { window.scrollBy(0, 1500); document.querySelector('main').scrollBy(0, 1500); });
    await page.waitForTimeout(300);
    const headerTop = await page.locator('header').first().evaluate((h) => h.getBoundingClientRect().top);
    await page.screenshot({ path: shotName('mobile_scrolled_header', 'supervisor') });
    await page.getByRole('button', { name: /القائمة الجانبية|sidebar/i }).first().click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: shotName('mobile_drawer_open', 'supervisor') });
    const topEl = await page.evaluate(() => document.elementFromPoint(40, 20)?.closest('header, aside, [class*="fixed"]')?.tagName);
    writeResult('mobile_header', { scroller, headerTopAfterScroll: headerTop, elementAtTopLeftWithDrawer: topEl });
    expect.soft(headerTop, 'header scrolled off screen').toBeGreaterThanOrEqual(0);
  });
});

test.describe('i18n static analysis (no browser)', () => {
  test('ar.json and en.json have the same keys', async () => {
    const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, `${p}${k}.`) : [`${p}${k}`]));
    const ar = new Set(flat(JSON.parse(fs.readFileSync(path.join(SRC, 'locales', 'ar.json'), 'utf-8'))));
    const en = new Set(flat(JSON.parse(fs.readFileSync(path.join(SRC, 'locales', 'en.json'), 'utf-8'))));
    const onlyAr = [...ar].filter((k) => !en.has(k));
    const onlyEn = [...en].filter((k) => !ar.has(k));
    // keys used in code but missing from both files
    const used = new Set();
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
      const f = path.join(d, e.name);
      if (e.isDirectory()) walk(f);
      else if (/\.jsx?$/.test(e.name)) for (const m of fs.readFileSync(f, 'utf-8').matchAll(/\bt\(\s*['"]([\w.]+)['"]/g)) used.add(m[1]);
    });
    walk(SRC);
    const missingInEn = [...used].filter((k) => !en.has(k));
    const missingInAr = [...used].filter((k) => !ar.has(k));
    // hardcoded (non-i18n) strings: inline ternaries and Arabic literals outside t()
    const hard = {};
    const walk2 = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
      const f = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== 'locales') walk2(f); return; }
      if (!/\.jsx$/.test(e.name)) return;
      const src = fs.readFileSync(f, 'utf-8');
      const ternaries = (src.match(/isRtl\s*\?\s*['`"]/g) || []).length;
      const arabicOnly = src.split('\n').filter((l) => /[؀-ۿ]/.test(l) && !/isRtl|t\(|\/\/|\{\/\*|\*/.test(l)).length;
      hard[path.relative(SRC, f)] = { isRtlTernaries: ternaries, arabicOnlyLines: arabicOnly };
    });
    walk2(SRC);
    const totals = Object.values(hard).reduce((a, v) => ({ t: a.t + v.isRtlTernaries, a: a.a + v.arabicOnlyLines }), { t: 0, a: 0 });
    writeResult('i18n_keys', { arKeys: ar.size, enKeys: en.size, onlyAr, onlyEn, usedKeys: used.size, missingInEn, missingInAr, hardcoded: hard, totals });
    expect.soft(onlyAr, 'keys only in ar.json').toEqual([]);
    expect.soft(onlyEn, 'keys only in en.json').toEqual([]);
    expect.soft(missingInEn, 'keys used in code but missing from en.json').toEqual([]);
    expect.soft(totals.a, 'Arabic-only literal lines (always Arabic, even in English mode)').toBe(0);
  });
});
