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
  student: ['/dashboard', '/projects', '/my-projects', '/reports', '/collaboration-requests', '/opportunities', '/cv',
    '/notifications', '/profile', '/settings', '/about'],
  company: ['/dashboard', '/projects', '/company/opportunities', '/collaboration-requests', '/reports', '/saved-projects',
    '/company/partnerships', '/notifications', '/profile', '/settings'],
  supervisor: ['/dashboard', '/supervisor', '/supervisor/reviews', '/manage/projects', '/manage/students',
    '/manage/companies', '/manage/collaborations', '/teams', '/supervisor/reports', '/manage/logs', '/projects',
    '/notifications', '/profile', '/settings'],
  admin: ['/dashboard', '/admin/users', '/supervisor', '/manage/projects', '/manage/students', '/manage/companies',
    '/manage/collaborations', '/teams', '/supervisor/reports', '/manage/logs', '/projects', '/notifications', '/profile',
    '/settings'],
};

const ARABIC = /[؀-ۿ]/;
// the language toggle names the language it switches TO, so it is Arabic in English mode by design
const SWITCH_LABELS = new Set(['العربية', 'ع', 'عربي']);

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
  test.setTimeout(3 * 60 * 60 * 1000);
  // strings that legitimately stay Arabic in English mode: DB content (titles, names) + brand footer
  const dbText = new Set();
  for (const p of (await api(request, 'admin', 'GET', '/projects/')).body) {
    [p.title, p.description, p.company_name, p.supervisor_name, p.supervisor_feedback, p.category].forEach((s) => s && dbText.add(s));
  }
  for (const u of (await api(request, 'admin', 'GET', '/users/')).body) dbText.add(u.full_name);
  const isDbLine = (line) => [...dbText].some((s) => s && (line.includes(s) || s.includes(line)));

  // optional filters for partial re-runs: CRAWL_ROLE=admin CRAWL_SKIP=8 CRAWL_OUT=crawl_admin_rest
  const onlyRole = process.env.CRAWL_ROLE;
  const skip = Number(process.env.CRAWL_SKIP || 0);
  const outName = process.env.CRAWL_OUT || 'crawl';
  const results = [];
  for (const [role, allPages] of Object.entries(PAGES)) {
    if (onlyRole && role !== onlyRole) continue;
    const pages = onlyRole ? allPages.slice(skip) : allPages;
    for (const route of pages) {
      const rec = { role, route };
      const log = watch(page);

      // 8 variants per page covering every pair of {ar,en} x {light,dark} x {375,768,1280}
      const VARIANTS = [
        ['ar', 'light', 1280], ['ar', 'dark', 1280], ['en', 'light', 1280], ['en', 'dark', 1280],
        ['ar', 'light', 375], ['en', 'dark', 375], ['ar', 'dark', 768], ['en', 'light', 768],
      ];
      rec.variants = {};
      await page.setViewportSize({ width: 1280, height: 800 });
      await openAs(page, request, role === 'anon' ? null : role, route, { lang: 'ar', theme: 'light' });
      rec.landed = new URL(page.url()).pathname;
      for (const [lang, theme, width] of VARIANTS) {
        await page.setViewportSize({ width, height: width === 375 ? 812 : width === 768 ? 1024 : 800 });
        await page.evaluate(([l, th]) => { localStorage.setItem('app_language', l); localStorage.setItem('app_theme', th); }, [lang, theme]);
        await page.reload(); await settle(page, 500);
        const f = await pageFacts(page);
        const v = { dir: f.dir, lang: f.lang, title: f.title, dark: f.dark, hScroll: f.hScroll, offenders: f.offenders };
        if (lang === 'en') {
          const arabicLines = [...new Set(f.text.split(String.fromCharCode(10)).map((l) => l.trim()).filter((l) => ARABIC.test(l) && !isDbLine(l) && !SWITCH_LABELS.has(l)))];
          v.arabicLeft = arabicLines.length;
          v.samples = arabicLines.slice(0, 6);
        }
        rec.variants[`${lang}-${theme}-${width}`] = v;
        await shot(page, shotName(role, route, `${lang}-${theme}-${width}`), rec);
      }
      // keep the summary fields the report reads
      rec.ar = rec.variants['ar-light-1280'];
      rec.en = { ...rec.variants['en-light-1280'], lightAfterToggle: !rec.variants['en-light-1280'].dark };
      rec.darkClassApplied = rec.variants['ar-dark-1280'].dark && rec.variants['en-dark-1280'].dark;
      rec.responsive = { 375: rec.variants['ar-light-375'], 768: rec.variants['ar-dark-768'] };

      rec.console = [...new Set(log.console)];
      rec.pageErrors = log.pageErrors;
      rec.http = [...new Set(log.http)];
      rec.failed = [...new Set(log.failed)].filter((x) => !x.includes('ERR_ABORTED'));
      page.removeAllListeners('console'); page.removeAllListeners('pageerror');
      page.removeAllListeners('requestfailed'); page.removeAllListeners('response');
      results.push(rec);
      writeResult(outName, results);
    }
  }
  writeResult(outName, results);

  const problems = [];
  for (const r of results) {
    for (const [k, v] of Object.entries(r.variants)) {
      const [lang, theme] = k.split('-');
      if (v.dir !== (lang === 'ar' ? 'rtl' : 'ltr') || v.lang !== lang) problems.push(`${r.role} ${r.route} ${k}: dir/lang=${v.dir}/${v.lang}`);
      if (lang === 'en' && ARABIC.test(v.title)) problems.push(`${r.role} ${r.route} ${k}: English title "${v.title}"`);
      if (v.dark !== (theme === 'dark')) problems.push(`${r.role} ${r.route} ${k}: theme not applied`);
      if (v.hScroll > 0) problems.push(`${r.role} ${r.route} ${k}: horizontal scroll ${v.hScroll}px ${v.offenders.join(' ')}`);
      if (v.arabicLeft) problems.push(`${r.role} ${r.route} ${k}: ${v.arabicLeft} Arabic strings: ${v.samples.join(' | ')}`);
    }
    if (r.console.length || r.pageErrors.length) problems.push(`${r.role} ${r.route}: console ${[...r.console, ...r.pageErrors].join(' | ').slice(0, 200)}`);
    if (r.http.length) problems.push(`${r.role} ${r.route}: HTTP errors ${r.http.join(', ')}`);
  }
  writeResult(`${outName}_problems`, problems);
  expect.soft(problems, problems.join('\n')).toEqual([]);
});
