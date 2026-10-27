import { test, expect } from '@playwright/test';
import { USERS, PASSWORD, openAs, loginViaUI, settle, writeResult, shotName, watch } from './helpers.js';

const ROUTES = {
  shared: ['/', '/projects', '/dashboard', '/notifications', '/profile', '/settings', '/about'],
  student: ['/my-projects', '/collaboration-requests', '/opportunities', '/cv'],
  company: ['/saved-projects', '/company/opportunities', '/company/partnerships'],
  supervisor: ['/supervisor', '/supervisor/reviews', '/manage/projects', '/manage/students', '/manage/companies',
    '/manage/collaborations', '/reports', '/supervisor/reports', '/manage/logs', '/teams'],
};
const ALLOWED = {
  student: [...ROUTES.shared, ...ROUTES.student],
  company: [...ROUTES.shared, ...ROUTES.company],
  supervisor: [...ROUTES.shared, ...ROUTES.supervisor],
  admin: [...ROUTES.shared, ...ROUTES.student, ...ROUTES.company, ...ROUTES.supervisor],
};
const ALL = [...ROUTES.shared, ...ROUTES.student, ...ROUTES.company, ...ROUTES.supervisor];

test.describe('login per role', () => {
  for (const [role, landing] of [['student', '/dashboard'], ['company', '/dashboard'], ['supervisor', '/dashboard'], ['admin', '/dashboard']]) {
    test(`UI login: ${role}`, async ({ page }) => {
      const log = watch(page);
      await loginViaUI(page, role);
      expect(new URL(page.url()).pathname).toBe(landing);
      await expect(page.getByText(USERS[role] ? /QA / : /./).first()).toBeVisible();
      await page.screenshot({ path: shotName('login_landing', role) });
      expect(log.pageErrors, log.pageErrors.join('\n')).toEqual([]);
    });
  }

  test('wrong password shows an error and stays on /login', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(USERS.student);
    await page.locator('input[type="password"]').first().fill('wrong-password');
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1500);
    expect(new URL(page.url()).pathname).toBe('/login');
    await expect(page.locator('text=/غير صحيحة|incorrect|Invalid/i').first()).toBeVisible();
  });

  test('register form offers only student/company roles', async ({ page }) => {
    await page.goto('/login');
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/مشرف أكاديمي.*تسجيل|Register as supervisor/i);
  });

  test('admin has a usable sidebar', async ({ page, request }) => {
    await openAs(page, request, 'admin', '/dashboard', { lang: 'en' });
    const links = await page.locator('aside a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    await page.screenshot({ path: shotName('admin_dashboard_sidebar') });
    const roleLinks = links.filter((h) => !['/notifications', '/profile', '/settings', '/about', '/'].includes(h));
    expect(roleLinks.length, `admin sidebar links: ${JSON.stringify(links)}`).toBeGreaterThan(0);
  });
});

test.describe('known navigation issues', () => {
  test('login page "Back to main platform" does not loop back to /login', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    const link = page.locator('header a[href="/"]').last();
    await link.click();
    await settle(page);
    const finalPath = new URL(page.url()).pathname;
    writeResult('nav_back_loop', { clicked: 'header a[href="/"]', finalPath });
    expect(finalPath, 'anonymous "/" is a protected route -> redirected back to /login').not.toBe('/login');
  });

  test('About page "Browse Projects" works for a visitor', async ({ page }) => {
    await page.goto('/about');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole('link', { name: /تصفح المشاريع|Browse Projects/ }).click();
    await settle(page);
    expect(new URL(page.url()).pathname).not.toBe('/login');
  });
});

test.describe('frontend route protection', () => {
  test('role x route matrix (typing the URL directly)', async ({ page, request }) => {
    test.setTimeout(8 * 60 * 1000);
    const matrix = {};
    const violations = [];
    for (const role of ['anon', 'student', 'company', 'supervisor', 'admin']) {
      matrix[role] = {};
      await openAs(page, request, role === 'anon' ? null : role, '/about');
      for (const route of ALL) {
        await page.goto(route);
        await settle(page, 400);
        const landed = new URL(page.url()).pathname;
        const allowed = role === 'anon' ? route === '/about' : ALLOWED[role].includes(route);
        const got = landed === route;
        matrix[role][route] = landed;
        if (allowed !== got) violations.push(`${role} ${route} -> ${landed} (expected ${allowed ? 'allowed' : 'redirect'})`);
      }
    }
    writeResult('route_matrix', { matrix, violations });
    expect(violations, violations.join('\n')).toEqual([]);
  });

  test('sidebar never links to a route the role is redirected from', async ({ page, request }) => {
    const broken = [];
    for (const role of ['student', 'company', 'supervisor']) {
      await openAs(page, request, role, '/dashboard', { lang: 'en' });
      const hrefs = [...new Set(await page.locator('aside a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href'))))];
      for (const h of hrefs) {
        if (!h.startsWith('/')) continue;
        await page.goto(h);
        await settle(page, 300);
        const landed = new URL(page.url()).pathname;
        if (landed !== h) broken.push(`${role}: sidebar ${h} -> ${landed}`);
      }
    }
    writeResult('sidebar_broken_links', broken);
    expect(broken, broken.join('\n')).toEqual([]);
  });

  test('expired / invalid token sends the user to /login', async ({ page }) => {
    await page.goto('/about');
    await page.evaluate(() => {
      localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjF9.invalid');
      localStorage.setItem('app_user_role', JSON.stringify({ id: 1, name: 'QA Student One', role: 'student' }));
    });
    await page.goto('/dashboard');
    await settle(page, 2500);
    const landed = new URL(page.url()).pathname;
    const stored = await page.evaluate(() => localStorage.getItem('token'));
    writeResult('expired_token', { landed, tokenCleared: stored === null });
    expect(landed).toBe('/login');
    expect(stored).toBeNull();
  });

  test('tampering app_user_role in localStorage does not unlock another role UI', async ({ page, request }) => {
    const sess = await openAs(page, request, 'student', '/dashboard');
    await page.route('**/me', (route) => route.abort()); // simulate /me slow/unreachable (cold Render start)
    await page.evaluate((u) => localStorage.setItem('app_user_role', JSON.stringify({ ...u, role: 'supervisor' })), sess.user);
    await page.goto('/supervisor');
    await settle(page, 1500);
    const landed = new URL(page.url()).pathname;
    await page.screenshot({ path: shotName('tampered_role_supervisor_page') });
    writeResult('role_tamper', { landed });
    expect(landed, 'supervisor UI rendered for a student by editing localStorage').not.toBe('/supervisor');
  });

  test('logout clears session and blocks protected pages', async ({ page }) => {
    await loginViaUI(page, 'student');
    await page.getByRole('button', { name: /تسجيل الخروج|Logout|Log out|Sign out/i }).first().click();
    await settle(page);
    await page.goto('/dashboard');
    await settle(page);
    expect(new URL(page.url()).pathname).toBe('/login');
  });
});

test.describe('login form RTL layout', () => {
  for (const mode of ['login', 'register']) {
    test(`email icon does not overlap placeholder (ar, ${mode})`, async ({ page }) => {
      await page.goto('/login');
      await page.evaluate(() => { localStorage.clear(); localStorage.setItem('app_language', 'ar'); });
      await page.reload();
      if (mode === 'register') {
        await page.getByRole('button', { name: /إنشاء حساب|حساب جديد/ }).first().click().catch(() => {});
      }
      const input = page.locator('input[type="email"]');
      const icon = input.locator('xpath=following-sibling::*[1]');
      const geo = await input.evaluate((el, iconEl) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const ir = iconEl.getBoundingClientRect();
        return { inputLeft: r.left, inputRight: r.right, padL: parseFloat(cs.paddingLeft), padR: parseFloat(cs.paddingRight),
          iconLeft: ir.left, iconRight: ir.right, dir: cs.direction };
      }, await icon.elementHandle());
      await input.screenshot({ path: shotName('login_email_rtl', mode) });
      const textStart = geo.inputLeft + geo.padL; // LTR input: text starts at the left padding edge
      const overlap = geo.iconRight > textStart && geo.iconLeft < textStart + 40;
      writeResult(`email_icon_${mode}`, geo);
      expect(overlap, `icon ${geo.iconLeft}-${geo.iconRight}px covers text start ${textStart}px`).toBe(false);
    });
  }
});
