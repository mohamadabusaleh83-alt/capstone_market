import { test, expect } from '@playwright/test';
import { openAs, settle, shotName, api } from './helpers.js';

test('admin manages accounts from the UI (I-47, I-35)', async ({ page, request }) => {
  page.on('dialog', (d) => d.accept());
  await openAs(page, request, 'admin', '/dashboard', { lang: 'en' });
  const links = await page.locator('aside a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(links).toEqual(expect.arrayContaining(['/supervisor/reviews', '/manage/projects', '/supervisor/reports', '/admin/users']));

  await page.getByRole('link', { name: 'Users & Accounts' }).first().click();
  await settle(page);
  const email = `qa_ui_admin_${Date.now()}@example.com`;
  await page.getByLabel('Full name').first().fill('QA UI Supervisor');
  await page.getByLabel('Email').first().fill(email);
  await page.getByLabel('Password (8+ characters)').fill('Strong#123');
  await page.getByRole('button', { name: 'Create account' }).click();
  await settle(page, 800);
  await page.getByLabel('Search by name or email').fill(email);
  await settle(page, 800);
  const row = page.locator('tr').filter({ hasText: email });
  await expect(row).toBeVisible();
  await page.screenshot({ path: shotName('admin_users_page') });

  await row.getByRole('button', { name: 'Disable' }).click();
  await settle(page, 800);
  await expect(page.locator('tr').filter({ hasText: email }).getByText('Disabled')).toBeVisible();
  const users = (await api(request, 'admin', 'GET', `/admin/users?q=${encodeURIComponent(email)}`)).body;
  expect(users[0].is_active).toBe(false);

  await page.locator('tr').filter({ hasText: email }).getByRole('button', { name: 'Delete' }).click();
  await settle(page, 800);
  expect((await api(request, 'admin', 'GET', `/admin/users?q=${encodeURIComponent(email)}`)).body).toEqual([]);
});

test('non-admins cannot open the users page', async ({ page, request }) => {
  await openAs(page, request, 'supervisor', '/admin/users', { lang: 'en' });
  expect(new URL(page.url()).pathname).not.toBe('/admin/users');
});
