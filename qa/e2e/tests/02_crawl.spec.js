/**
 * Visits every page each role can reach and records, per page:
 *  - console errors / page errors / failed or >=400 requests
 *  - <html dir/lang> and document.title in Arabic and English
 *  - Arabic text left on screen in English mode (excluding DB content)
 *  - light vs dark theme class + screenshots
 *  - horizontal overflow at 375 / 768 / 1280 + screenshots
 */
import { test, expect } from '@playwright/test';
import { openAs, settle, watch, shotName, writeResult, api } from './helpers.js';

const PAGES = {
  anon: ['/login', '/about'],
  student: ['/dashboard', '/projects', '/my-projects', '/collaboration-requests', '/opportunities', '/cv',
    '/notifications', '/profile', '/settings', '/about'],
  company: ['/dashboard', '/projects', '/company/opportunities', '/saved-projects', '/company/partnerships',
    '/notifications', '/profile', '/settings'],
  supervisor: ['/dashboard', '/supervisor', '/supervisor/reviews', '/manage/projects', '/manage/students',
    '/manage/companies', '/manage/collaborations', '/teams', '/supervisor/reports', '/manage/logs', '/projects',
    '/notifications', '/profile', '/settings'],
  admin: ['/dashboard', '/projects', '/supervisor', '/manage/projects', '/settings'],
};

const ARABIC = /[؀-ۿ]/;

// very long pages (e.g. /projects renders every project, no pagination) can exceed the screenshot budget
async function shot(page, file, rec) {
  try { await page.screenshot({ path: file, fullPage: true, timeout: 20000 }); }
  catch { rec.screenshotFallback = true; await page.screenshot({ path: file, timeout: 20000 }); }
}

async function pageFacts(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const offenders = [];
    if (doc.scrollWidth > doc.clientWidth + 1) {
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width && (r.right > doc.clientWidth + 1 || r.left < -1) && getComputedStyle(el).position !== 'fixed') {
          offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ').slice(0, 3).join('.')} (${Math.round(r.left)}..${Math.round(r.right)})`);
          if (offenders.length >= 4) break;
        }
      }
    }
    return {
      dir: doc.getAttribute('dir'), lang: doc.getAttribute('lang'), title: document.title,
      dark: doc.classList.contains('dark'),
      bodyBg: getComputedStyle(document.querySelector('#root > div') || document.body).backgroundColor,
      hScroll: doc.scrollWidth - doc.clientWidth, offenders,
      text: document.body.innerText,
    };
  });
}

test('crawl every page per role', async ({ page, request }) => {
  test.setTimeout(30 * 60 * 1000);
  // strings that legitimately stay Arabic in English mode: DB content (titles, names) + brand footer
  const dbText = new Set();
  for (const p of (await api(request, 'admin', 'GET', '/projects/')).body) {
    [p.title, p.description, p.company_name, p.supervisor_name, p.supervisor_feedback, p.category].forEach((s) => s && dbText.add(s));
  }
  for (const u of (await api(request, 'admin', 'GET', '/users/')).body) dbText.add(u.full_name);
  const isDbLine = (line) => [...dbText].some((s) => s && (line.includes(s) || s.includes(line)));

  const results = [];
  for (const [role, pages] of Object.entries(PAGES)) {
    for (const route of pages) {
      const rec = { role, route };
      const log = watch(page);

      // Arabic / light / desktop
      await page.setViewportSize({ width: 1280, height: 800 });
      await openAs(page, request, role === 'anon' ? null : role, route, { lang: 'ar', theme: 'light' });
      rec.landed = new URL(page.url()).pathname;
      let f = await pageFacts(page);
      rec.ar = { dir: f.dir, lang: f.lang, title: f.title, dark: f.dark, hScroll1280: f.hScroll };
      await shot(page, shotName(role, route, 'ar-light-1280'), rec);

      // Dark theme
      await page.evaluate(() => localStorage.setItem('app_theme', 'dark'));
      await page.reload(); await settle(page, 600);
      f = await pageFacts(page);
      rec.darkClassApplied = f.dark;
      await shot(page, shotName(role, route, 'ar-dark-1280'), rec);

      // English (light)
      await page.evaluate(() => { localStorage.setItem('app_language', 'en'); localStorage.setItem('app_theme', 'light'); });
      await page.reload(); await settle(page, 600);
      f = await pageFacts(page);
      const arabicLines = [...new Set(f.text.split('\n').map((l) => l.trim()).filter((l) => ARABIC.test(l) && !isDbLine(l)))];
      rec.en = { dir: f.dir, lang: f.lang, title: f.title, lightAfterToggle: !f.dark, arabicLeft: arabicLines.length,
        samples: arabicLines.slice(0, 6) };
      await shot(page, shotName(role, route, 'en-light-1280'), rec);

      // Responsive (Arabic, light)
      await page.evaluate(() => { localStorage.setItem('app_language', 'ar'); });
      rec.responsive = {};
      for (const w of [375, 768]) {
        await page.setViewportSize({ width: w, height: w === 375 ? 812 : 1024 });
        await page.reload(); await settle(page, 600);
        f = await pageFacts(page);
        rec.responsive[w] = { hScroll: f.hScroll, offenders: f.offenders };
        await shot(page, shotName(role, route, `ar-light-${w}`), rec);
      }

      rec.console = [...new Set(log.console)];
      rec.pageErrors = log.pageErrors;
      rec.http = [...new Set(log.http)];
      rec.failed = [...new Set(log.failed)].filter((x) => !x.includes('ERR_ABORTED'));
      page.removeAllListeners('console'); page.removeAllListeners('pageerror');
      page.removeAllListeners('requestfailed'); page.removeAllListeners('response');
      results.push(rec);
      writeResult('crawl', results);
    }
  }
  writeResult('crawl', results);

  const problems = [];
  for (const r of results) {
    if (r.ar.dir !== 'rtl' || r.ar.lang !== 'ar') problems.push(`${r.role} ${r.route}: ar dir/lang=${r.ar.dir}/${r.ar.lang}`);
    if (r.en.dir !== 'ltr' || r.en.lang !== 'en') problems.push(`${r.role} ${r.route}: en dir/lang=${r.en.dir}/${r.en.lang}`);
    if (ARABIC.test(r.en.title)) problems.push(`${r.role} ${r.route}: English mode title "${r.en.title}"`);
    if (!r.darkClassApplied || !r.en.lightAfterToggle) problems.push(`${r.role} ${r.route}: theme toggle not applied`);
    if (r.en.arabicLeft) problems.push(`${r.role} ${r.route}: ${r.en.arabicLeft} untranslated Arabic strings`);
    for (const w of [375, 768]) if (r.responsive[w].hScroll > 0) problems.push(`${r.role} ${r.route}: horizontal scroll ${r.responsive[w].hScroll}px @${w}`);
    if (r.console.length || r.pageErrors.length) problems.push(`${r.role} ${r.route}: ${r.console.length} console errors`);
    if (r.http.length) problems.push(`${r.role} ${r.route}: HTTP errors ${r.http.join(', ')}`);
  }
  expect.soft(problems, problems.join('\n')).toEqual([]);
});
