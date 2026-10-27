/**
 * company posts -> supervisor approves -> student searches/filters/applies -> company accepts
 * -> supervisor academic sign-off -> chat both ways -> notifications -> student report -> supervisor review.
 * Every step is driven through the UI and verified through the API. Steps are soft so one broken
 * step does not hide the rest; each step's outcome is written to results/flow.json.
 */
import { test, expect } from '@playwright/test';
import { openAs, settle, shotName, writeResult, api, watch } from './helpers.js';

const RUN = Date.now().toString(36).slice(-5);
const TITLE = `QA E2E Inventory ${RUN}`;

test('full marketplace flow through the UI', async ({ page, request }) => {
  test.setTimeout(10 * 60 * 1000);
  const steps = [];
  const log = watch(page);
  const ctx = {};
  async function step(name, fn) {
    try {
      const note = await fn();
      steps.push({ step: name, ok: true, note: note || '' });
    } catch (e) {
      steps.push({ step: name, ok: false, note: String(e.message || e).split('\n')[0].slice(0, 300) });
      await page.screenshot({ path: shotName('flow_fail', name) }).catch(() => {});
    }
  }
  // nearest ancestor of the title text that contains a matching button = that item's card
  const card = (title, buttonName) => {
    const src = buttonName.source.split('|')[0].replace(/[\\^$.*+?()[\]{}]/g, '');
    return page.getByText(title, { exact: false }).first()
      .locator(`xpath=ancestor::*[.//button[contains(normalize-space(.), "${src}")]][1]`);
  };

  await step('1 company posts a project (Dashboard -> Post Opportunity modal)', async () => {
    await openAs(page, request, 'company', '/dashboard', { lang: 'en' });
    await page.getByRole('button', { name: /Post Opportunity|Post .*Project|Propose/i }).first().click();
    const form = page.locator('form').filter({ has: page.locator('textarea') }).first();
    await form.locator('input').first().fill(TITLE);
    await form.locator('textarea').fill('End-to-end QA project: warehouse inventory with barcode scanning.');
    await form.locator('input').nth(1).fill('python<spl, React');
    const num = form.locator('input[type="number"]');
    if (await num.count()) await num.fill('2');
    await form.locator('button[type="submit"]').click();
    await settle(page, 1200);
    const p = (await api(request, 'admin', 'GET', '/projects/')).body.find((x) => x.title === TITLE);
    if (!p) throw new Error('project not found via API after submit');
    ctx.pid = p.id;
    await page.screenshot({ path: shotName('flow', '1_company_posted') });
    return `id=${p.id} status=${p.status} skills="${p.required_skills}" max=${p.max_members}`;
  });

  await step('2 supervisor approves it (/supervisor -> Project Proposals)', async () => {
    await openAs(page, request, 'supervisor', '/supervisor', { lang: 'en' });
    await page.getByRole('button', { name: /Project Proposals/ }).click().catch(() => {});
    await settle(page, 500);
    await card(TITLE, /Approve Project/).getByRole('button', { name: /Approve Project/ }).click();
    await settle(page, 1200);
    const p = (await api(request, 'admin', 'GET', `/projects/${ctx.pid}`)).body;
    await page.screenshot({ path: shotName('flow', '2_supervisor_approved') });
    if (p.status !== 'approved') throw new Error(`status is ${p.status}`);
    return 'approved';
  });

  await step('3a student finds it by keyword search', async () => {
    await openAs(page, request, 'student', '/projects', { lang: 'en' });
    await page.locator('input[type="text"], input[type="search"]').first().fill(`Inventory ${RUN}`);
    await settle(page, 400);
    await expect(page.getByText(TITLE).first()).toBeVisible();
  });

  await step('3b student finds it by skill search "sql" (stored from "python<spl")', async () => {
    await page.locator('input[type="text"], input[type="search"]').first().fill(`sql ${RUN}`);
    await settle(page, 400);
    await expect(page.getByText(TITLE).first()).toBeVisible();
  });

  await step('3c category filter keeps a project that has no category', async () => {
    await page.locator('input[type="text"], input[type="search"]').first().fill(RUN);
    const select = page.locator('select').first();
    if (!(await select.count())) return 'no category <select> on page';
    const shown = await page.evaluate(({ RUN }) => document.body.innerText.includes(RUN), { RUN });
    const options = await select.locator('option').allInnerTexts();
    const hits = [];
    for (let i = 1; i < options.length; i++) {
      await select.selectOption({ index: i });
      await settle(page, 200);
      if (await page.getByText(TITLE).count()) hits.push(options[i]);
    }
    await select.selectOption({ index: 0 });
    if (hits.length) throw new Error(`project with NO category is listed under "${hits.join(', ')}" (fake category from index)`);
    return `shown=${shown}`;
  });

  await step('3d student applies (Apply -> modal -> submit)', async () => {
    await page.locator('input[type="text"], input[type="search"]').first().fill(`Inventory ${RUN}`);
    await settle(page, 300);
    await card(TITLE, /Apply/i).getByRole('button', { name: /Apply/i }).first().click();
    const form = page.locator('form').filter({ has: page.locator('textarea') }).last();
    await form.locator('input:not([disabled]):not([readonly])').last().fill('Backend Developer');
    await form.locator('textarea').fill('QA: I would like to join.');
    await form.locator('button[type="submit"]').click();
    await settle(page, 1200);
    const apps = (await api(request, 'student', 'GET', '/applications/')).body.filter((a) => a.project_id === ctx.pid);
    if (!apps.length) throw new Error('no application created');
    ctx.app = apps[0].id;
    await page.screenshot({ path: shotName('flow', '3_student_applied') });
    return `app=${ctx.app} status=${apps[0].status}`;
  });

  await step('4 company accepts (project card -> View Applications -> Accept)', async () => {
    await openAs(page, request, 'company', '/projects', { lang: 'en' });
    await page.locator('input[type="text"], input[type="search"]').first().fill(`Inventory ${RUN}`);
    await settle(page, 300);
    await card(TITLE, /View Applications|Applications/i).getByRole('button', { name: /Applications/i }).first().click();
    await settle(page, 600);
    const modalText = await page.locator('.fixed').last().innerText();
    ctx.modalShowsOtherProjects = (modalText.match(/QA-[0-9a-f]{6} project/g) || []).length;
    await page.screenshot({ path: shotName('flow', '4_company_applications_modal') });
    const row = page.locator('.fixed').last().getByText(TITLE).first()
      .locator('xpath=ancestor::*[.//button[normalize-space(.)="Accept" or @title="Accept"]][1]');
    await row.getByRole('button', { name: /^Accept$/ }).first().click();
    await settle(page, 1200);
    const a = (await api(request, 'student', 'GET', '/applications/')).body.find((x) => x.id === ctx.app);
    if (a.status !== 'company_accepted') throw new Error(`status ${a.status}`);
    return `company_accepted; modal also listed ${ctx.modalShowsOtherProjects} other QA projects' applications`;
  });

  await step('5 supervisor academic sign-off (/supervisor -> Company Nominations)', async () => {
    await openAs(page, request, 'supervisor', '/supervisor', { lang: 'en' });
    await page.getByRole('button', { name: /Company Nominations/ }).click().catch(() => {});
    await settle(page, 500);
    await card(TITLE, /Academic Sign-Off/).getByRole('button', { name: /Academic Sign-Off/ }).click();
    await settle(page, 1200);
    const a = (await api(request, 'student', 'GET', '/applications/')).body.find((x) => x.id === ctx.app);
    const p = (await api(request, 'admin', 'GET', `/projects/${ctx.pid}`)).body;
    await page.screenshot({ path: shotName('flow', '5_supervisor_signoff') });
    if (a.status !== 'academically_approved') throw new Error(`status ${a.status}`);
    return `seats ${p.current_members}/${p.max_members}`;
  });

  await step('6a student opens team chat from My Project and sends a message', async () => {
    await openAs(page, request, 'student', '/my-projects', { lang: 'en' });
    await expect(page.getByText(TITLE).first()).toBeVisible();
    await page.locator('button[title="Open project chat"]').first().click();
    const input = page.locator('form input').last();
    await input.fill(`hello from student ${RUN}`);
    await input.press('Enter');
    await settle(page, 1000);
    const msgs = (await api(request, 'company', 'GET', `/projects/${ctx.pid}/messages`)).body;
    if (!msgs.some((m) => m.text.includes(`hello from student ${RUN}`))) throw new Error('message not stored');
  });

  await step('6b company sees the message and replies', async () => {
    await openAs(page, request, 'company', '/projects', { lang: 'en' });
    await page.locator('input[type="text"], input[type="search"]').first().fill(`Inventory ${RUN}`);
    await settle(page, 300);
    await page.getByText(TITLE).first()
      .locator('xpath=ancestor::*[.//button[@aria-label="Project discussion and live chat"]][1]')
      .locator('button[aria-label="Project discussion and live chat"]').click();
    await settle(page, 1000);
    await expect(page.getByText(`hello from student ${RUN}`)).toBeVisible();
    const input = page.locator('form input').last();
    await input.fill(`reply from company ${RUN}`);
    await input.press('Enter');
    await settle(page, 800);
    await page.screenshot({ path: shotName('flow', '6_company_chat') });
  });

  await step('6c chat persists after refresh (student side)', async () => {
    await openAs(page, request, 'student', '/my-projects', { lang: 'en' });
    await page.locator('button[title="Open project chat"]').first().click();
    await settle(page, 1000);
    await expect(page.getByText(`reply from company ${RUN}`)).toBeVisible();
  });

  await step('7 notifications reached both sides and render in UI', async () => {
    const s = (await api(request, 'student', 'GET', '/notifications')).body;
    const c = (await api(request, 'company', 'GET', '/notifications')).body;
    const sNew = s.filter((n) => n.message.includes(TITLE));
    const cNew = c.filter((n) => n.message.includes(TITLE));
    const studentGotChat = s.some((n) => n.message.includes(`reply from company ${RUN}`));
    await openAs(page, request, 'student', '/notifications', { lang: 'en' });
    await page.screenshot({ path: shotName('flow', '7_student_notifications') });
    const shown = await page.getByText(TITLE).count();
    if (!shown) throw new Error('notifications page does not show project notifications');
    const note = `student:${sNew.length} company:${cNew.length} studentNotifiedOfChat=${studentGotChat}`;
    if (!studentGotChat) throw new Error(`student never notified of company chat reply (${note})`);
    return note;
  });

  await step('8 student submits a report from the UI', async () => {
    await openAs(page, request, 'student', '/my-projects', { lang: 'en' });
    const link = page.getByRole('link', { name: /Reports/i }).first();
    if (await link.count()) { await link.click(); await settle(page); }
    const landed = new URL(page.url()).pathname;
    const before = (await api(request, 'student', 'GET', '/reports/')).body.length;
    const form = page.locator('form').filter({ has: page.getByRole('button', { name: /Submit report/i }) });
    if (!(await form.count())) throw new Error(`no report form reachable (Reports link -> ${landed})`);
    await form.locator('input').first().fill(`QA E2E report ${RUN}`);
    await form.locator('textarea').fill('Milestone 1 deliverable');
    await form.locator('input[placeholder^="https://docs.google.com"]').fill('https://example.com/qa-report.pdf');
    await form.getByRole('button', { name: /Submit report/i }).click();
    await settle(page, 1200);
    await page.screenshot({ path: shotName('flow', '8_student_reports') });
    const after = (await api(request, 'student', 'GET', '/reports/')).body;
    if (after.length <= before) throw new Error('report not created');
    ctx.rep = after.find((r) => r.title === `QA E2E report ${RUN}`)?.id;
    return `report ${ctx.rep} via ${landed}`;
  });

  await step('9 supervisor reviews a report from the UI', async () => {
    if (!ctx.rep) {
      const rep = await api(request, 'student', 'POST', '/reports/', { project_id: ctx.pid, title: `QA E2E report ${RUN}` });
      ctx.rep = rep.body?.id;
    }
    await openAs(page, request, 'supervisor', '/supervisor/reports', { lang: 'en' });
    await expect(page.getByText(`QA E2E report ${RUN}`)).toBeVisible();
    const cardEl = page.getByText(`QA E2E report ${RUN}`).first()
      .locator('xpath=ancestor::*[.//button[normalize-space(.)="Approve"]][1]');
    const controls = cardEl.getByRole('button', { name: /^(Approve|Needs changes|Reject)$/ });
    if (!(await controls.count())) throw new Error('report is listed but there is no approve/grade/feedback control');
    await cardEl.getByLabel('Grade').fill('A');
    await cardEl.getByLabel('Feedback for the student').fill('Well done');
    await cardEl.getByRole('button', { name: /^Approve$/ }).click();
    await settle(page, 1200);
    await page.screenshot({ path: shotName('flow', '9_supervisor_reports') });
    const r = (await api(request, 'student', 'GET', '/reports/')).body.find((x) => x.id === ctx.rep);
    if (r?.status !== 'approved' || r?.grade !== 'A') throw new Error(`report status ${r?.status} grade ${r?.grade}`);
    return 'approved with grade A';
  });

  await step('10 data persists after full reload (company dashboard)', async () => {
    await openAs(page, request, 'company', '/company/opportunities', { lang: 'en' });
    await page.reload(); await settle(page);
    await expect(page.getByText(TITLE).first()).toBeVisible();
  });

  writeResult('flow', { title: TITLE, steps, console: [...new Set(log.console)].slice(0, 20), http: [...new Set(log.http)] });
  const failed = steps.filter((s) => !s.ok);
  expect.soft(failed.map((s) => `${s.step}: ${s.note}`)).toEqual([]);
});
