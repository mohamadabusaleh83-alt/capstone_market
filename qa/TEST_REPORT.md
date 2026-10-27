# Capstone Market: Full QA Test Report

**Date:** 2026-10-27  **Commit tested:** `8fe1f8b` (main, clean tree)  **Scope:** backend `backend/` (FastAPI) and frontend `frontend/` (React/Vite)
**Mode:** testing only. No project source file was changed; everything I wrote is under `qa/`.

---

## 0. Environment & how to re-run

| Item | Value |
|---|---|
| Database | Fresh **PostgreSQL 16.11** cluster created with `initdb` in a temp folder, port **54329**, DB `capstone_qa` (Docker daemon was not running; the system Postgres service was not touched). No SQLite, so no dialect differences. |
| Backend | `uvicorn main:app` on `127.0.0.1:8000`, Python **3.14.0**, `RENDER`, `ENVIRONMENT` and `SECRET_KEY` unset (dev mode), `DATABASE_URL=postgresql+psycopg2://postgres@127.0.0.1:54329/capstone_qa` |
| Frontend | `vite` dev server on `127.0.0.1:5173` with `VITE_API_URL=http://127.0.0.1:8000` passed as an **environment variable** (no `.env.local` needed, see I-46) |
| Browser | System Google Chrome via Playwright 1.56.1 (`channel: 'chrome'`) |
| Production | Never contacted. Every test script refuses to start if the API/web URL is not `localhost`/`127.0.0.1`. |

```
# 1. seed QA accounts (password for all: QaTest#2026)
set DATABASE_URL=postgresql+psycopg2://postgres@127.0.0.1:54329/capstone_qa
qa\.venv\Scripts\python qa\seed.py
# 2. API tests (backend must be running)
qa\.venv\Scripts\python -m pytest qa/api_tests -q
# 3. E2E (backend + vite must be running)
cd qa\e2e && npm install && npx playwright test
```

**Why `postgresql+psycopg2://`?** A clean `pip install -r backend/requirements.txt` now resolves **SQLAlchemy 2.1.6**, whose default PostgreSQL driver is `psycopg` (v3). It is not installed, so the backend crashes on import. See I-04.

### Seed accounts (`qa/seed.py`)
| Role | Email | How created |
|---|---|---|
| student | `qa_student@test.local`, `qa_student2@test.local` | direct DB insert (also possible via `POST /users/`) |
| company (`partner`) | `qa_company@test.local`, `qa_company2@test.local` | direct DB insert (also possible via `POST /users/`) |
| supervisor | `qa_supervisor@test.local` | **DB only**: `POST /users/` returns 403 for this role |
| admin | `qa_admin@test.local` | **DB only**: no endpoint, no CLI. `backend/seed.py` never creates an admin. |

Supervisors and admins can only be created by inserting a `users` row whose `password_hash` comes from `utils.hash_password()` (bcrypt). That is what `qa/seed.py` does. It refuses to run against a non-local host. Note: `.local` emails cannot self-register (`EmailStr` rejects special-use domains), so API tests that register users use `@example.com`.

---

## 1. Summary

| Suite | Tests | ✅ Passed | ❌ Failed |
|---|---|---|---|
| API: pytest + httpx (`qa/api_tests/`) | **230** | **148** | **82** |
| ↳ permission matrix (34 endpoints × 7 actors = 238 calls) | 34 | 26 | 8 (27 wrong cells) |
| ↳ auth / registration / tokens / password | 54 | 40 | 14 |
| ↳ projects | 40 | 21 | 19 |
| ↳ applications & seats | 25 | 17 | 8 |
| ↳ messages & notifications | 26 | 19 | 7 |
| ↳ reports, users, skills, CV upload | 32 | 20 | 12 |
| ↳ docs / errors / CORS / config | 19 | 5 | 14 |
| E2E: Playwright (`qa/e2e/`) | **27** | **11** | **16** |
| ↳ auth, navigation, route protection, RTL layout (01) | 16 | 9 | 7 |
| ↳ localStorage, meta, mobile header, i18n keys (04) | 9 | 2 | 7 |
| ↳ full business flow (1 test, 14 UI steps, see §3.1) | 1 (14 steps) | 0 (11 steps ok) | 1 (3 steps failed) |
| ↳ page crawl (1 test, 23 role×page combos × 5 variants, see §3.2) | 1 | 0 | 1 |

A failing test means a defect (or a policy gap). Every test asserts the *expected* secure/correct behaviour, and the failure message records what actually happened. Raw outputs: `qa/api_tests/results.xml`, `qa/api_tests/permission_matrix.{json,md}`, `qa/e2e/results/*.json`, screenshots in `qa/screenshots/` (147 files).

**Issue count:** 🔴 5 critical · 🟠 18 high · 🟡 26 medium · ⚪ 12 improvements (61 total).

**Headline:** the core marketplace flow works end to end in the UI up to the team chat. But:
1. Production auto-creates accounts, including **two supervisors**, whose passwords are in the public repo.
2. The approval workflow can be bypassed from the API: a company can mark its own students "academically approved", and a student can self-enrol.
3. The **next clean deploy will not boot** because of the dependency changes.
4. The **report workflow is unusable from the UI**: students can't reach the upload, and supervisors have no review controls.

---

## 2. Permission matrix (API)

Expected policy (least privilege) vs actual status code. Columns: `anon` = no token · `stu_member` = the student who owns or is an approved member of the resource · `stu_other` = an unrelated student · `co_owner` = the company that created the project · `co_other` = a different company. ✅ = matches expectation, ❌ = violation (expected value in brackets). Every cell used freshly created resources.

| Endpoint | anon | stu_member | stu_other | co_owner | co_other | supervisor | admin |
|---|---|---|---|---|---|---|---|
| `GET /` | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `POST /logout` | ✅ 401 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `GET /me` | ✅ 401 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `GET /users/me/profile` | ✅ 401 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `PUT /users/me/profile` | ✅ 401 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `PUT /users/me/skills` | ✅ 401 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `PUT /users/me/password (wrong current)` | ✅ 401 | ✅ 400 | ✅ 400 | ✅ 400 | ✅ 400 | ✅ 400 | ✅ 400 |
| `POST /users/me/cv-upload` | ✅ 401 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `GET /users/ (all users + emails/phones)` | ✅ 401 | ❌ 200 (exp deny) | ❌ 200 (exp deny) | ❌ 200 (exp deny) | ❌ 200 (exp deny) | ✅ 200 | ✅ 200 |
| `GET /users/?role=student` | ✅ 401 | ❌ 200 (exp deny) | ❌ 200 (exp deny) | ❌ 200 (exp deny) | ❌ 200 (exp deny) | ✅ 200 | ✅ 200 |
| `POST /projects/` | ✅ 401 | ✅ 201 | ✅ 201 | ✅ 201 | ✅ 201 | ✅ 201 | ✅ 201 |
| `GET /projects/my` | ✅ 401 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `GET /projects/` | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `GET /projects/{id} (approved)` | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `GET /projects/{id} (pending)` | ❌ 200 (exp deny) | ❌ 200 (exp deny) | ❌ 200 (exp deny) | ✅ 200 | ❌ 200 (exp deny) | ✅ 200 | ✅ 200 |
| `GET /projects/{id} (rejected)` | ❌ 200 (exp deny) | ❌ 200 (exp deny) | ❌ 200 (exp deny) | ✅ 200 | ❌ 200 (exp deny) | ✅ 200 | ✅ 200 |
| `PUT /projects/{id}` | ✅ 401 | ✅ 403 | ✅ 403 | ✅ 200 | ✅ 403 | ✅ 200 | ✅ 200 |
| `PUT /projects/{id}/status` | ✅ 401 | ✅ 403 | ✅ 403 | ✅ 403 | ✅ 403 | ✅ 200 | ✅ 200 |
| `PUT /projects/{id}/approve` | ✅ 401 | ✅ 403 | ✅ 403 | ✅ 403 | ✅ 403 | ✅ 200 | ✅ 200 |
| `DELETE /projects/{id}` | ✅ 401 | ✅ 403 | ✅ 403 | ✅ 204 | ✅ 403 | ✅ 204 | ✅ 204 |
| `POST /applications/` | ✅ 401 | ✅ 201 | ✅ 201 | ✅ 403 | ✅ 403 | ✅ 403 | ❌ 201 (exp deny) |
| `GET /applications/` | ✅ 401 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `GET /projects/{id}/applications` | ✅ 401 | ✅ 403 | ✅ 403 | ✅ 200 | ✅ 403 | ✅ 200 | ✅ 200 |
| `PUT /applications/{id}/status -> rejected` | ✅ 401 | ✅ 403 | ✅ 403 | ✅ 200 | ✅ 403 | ✅ 200 | ✅ 200 |
| `PUT /applications/{id}/status -> accepted` | ✅ 401 | ✅ 403 | ✅ 403 | ✅ 200 | ✅ 403 | ✅ 200 | ✅ 200 |
| `GET /projects/{id}/messages` | ✅ 401 | ✅ 200 | ✅ 403 | ✅ 200 | ✅ 403 | ✅ 200 | ✅ 200 |
| `POST /projects/{id}/messages` | ✅ 401 | ✅ 201 | ✅ 403 | ✅ 201 | ✅ 403 | ✅ 201 | ✅ 201 |
| `GET /notifications` | ✅ 401 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `PUT /notifications/{id}/read (student's)` | ✅ 401 | ✅ 200 | ✅ 404 | ✅ 404 | ✅ 404 | ✅ 404 | ✅ 404 |
| `PUT /notifications/read-all` | ✅ 401 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `GET /reports/` | ✅ 401 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `POST /reports/` | ✅ 401 | ✅ 201 | ❌ 201 (exp deny) | ✅ 403 | ✅ 403 | ✅ 403 | ❌ 201 (exp deny) |
| `PUT /reports/{id}/status` | ✅ 401 | ✅ 403 | ✅ 403 | ✅ 200 | ❌ 200 (exp deny) | ✅ 200 | ✅ 200 |
| `GET /analytics/overview` | ❌ 500 (exp allow) | ❌ 500 (exp allow) | ❌ 500 (exp allow) | ❌ 500 (exp allow) | ❌ 500 (exp allow) | ❌ 500 (exp allow) | ❌ 500 (exp allow) |

**Reading the ❌ cells:**
- **`GET /users/`**: every logged-in user downloads the whole user table (emails, phones, bios). See I-06.
- **`GET /projects/{id}`** for pending/rejected projects: public. See I-08.
- **`POST /applications/` (admin 201)**: `require_role()` always lets admin through, so an admin account can "apply" like a student. See I-32.
- **`POST /reports/` (stu_other 201)**: any student can file a report on any project. See I-07.
- **`PUT /reports/{id}/status` (co_other 200)**: any company can grade or reject reports on other companies' projects. See I-07.
- **`/analytics/overview`**: 500 for everyone. See I-10.

**Not visible in the matrix (status-dependent; covered in the functional tests):**
- Company setting `academically_approved` itself. See I-02.
- Student-owned project self-approval. See I-03.
- A rejected applicant reading the team chat. See I-09.
- The owner assigning `supervisor_id`. See I-13.

Policy notes (✅ but worth a decision): supervisors can edit or delete *any* project and read *any* chat, not only the ones assigned to them (`main.py:674`, `763`, `1107`); students may create projects.

---

## 3. Frontend E2E results

### 3.1 Full flow (UI-driven, verified via API): `qa/e2e/tests/03_full_flow.spec.js`

| # | Step | Result |
|---|---|---|
| 1 | Company posts project from Dashboard modal (`python<spl, React`, max 2) | ✅ stored `pending`, skills normalised to `Python, SQL, React` |
| 2 | Supervisor approves under *Project Proposals* | ✅ |
| 3a | Student finds it by keyword | ✅ |
| 3b | Student finds it by searching skill `sql` | ✅ |
| 3c | Category filter | ⚠️ projects without a category are given a **fake** category by list index (I-29) |
| 3d | Student applies through modal | ✅ status `applied` |
| 4 | Company *View Applications → Accept* | ✅ `company_accepted`. ⚠️ the modal lists **all** the company's applications, not the clicked project's (I-21) |
| 5 | Supervisor *Academic Sign-Off* | ✅ `academically_approved`, seats 1/2 |
| 6a–c | Student ↔ company chat, persists after reload | ✅ |
| 7 | Notifications | ❌ student is **never notified** of the company's chat reply (I-16) |
| 8 | Student submits a report | ❌ "Open Reports Page" → `/reports` is supervisor-only → redirected to `/` (I-05) |
| 9 | Supervisor reviews the report | ❌ report listed but **no approve/grade/feedback control exists** (I-05) |
| 10 | Data persists after full reload | ✅ |

### 3.2 Page crawl (every page × role, ar/en, light/dark, 375/768/1280)
Coverage: **23 of 39** role×page combos were crawled before the run was stopped. That covers all anonymous, student and company pages plus the first 2 supervisor pages. The remaining supervisor/admin pages were reached in the route-matrix and flow tests but not screenshotted in every variant. Each combo was captured as ar-light, ar-dark and en-light at 1280 px, plus ar-light at 375 px and 768 px.

| Role | Page | dir/lang ar → en | Title in EN | Theme toggle | Arabic strings left in EN | H-scroll px 375 / 768 / 1280 | Console errors | HTTP ≥400 |
|---|---|---|---|---|---|---|---|---|
| anon | /login | rtl/ar → ltr/en | ❌ Arabic | ✅ | 3 | 0 / 0 / 0 | 0 | 0 |
| anon | /about | rtl/ar → ltr/en | ❌ Arabic | ✅ | 8 | 0 / 0 / 0 | 0 | 0 |
| student | /dashboard | rtl/ar → ltr/en | ❌ Arabic | ✅ | 5 | 146 / 0 / 0 | 0 | 0 |
| student | /projects | rtl/ar → ltr/en | ❌ Arabic | ✅ | 5 | 146 / 0 / 0 | 0 | 0 |
| student | /my-projects | rtl/ar → ltr/en | ❌ Arabic | ✅ | 5 | 146 / 0 / 0 | 0 | 0 |
| student | /collaboration-requests | rtl/ar → ltr/en | ❌ Arabic | ✅ | 5 | 146 / 0 / 0 | 0 | 0 |
| student | /opportunities | rtl/ar → ltr/en | ❌ Arabic | ✅ | 5 | 146 / 0 / 0 | 0 | 0 |
| student | /cv | rtl/ar → ltr/en | ❌ Arabic | ✅ | 5 | 146 / 0 / 0 | 0 | 0 |
| student | /notifications | rtl/ar → ltr/en | ❌ Arabic | ✅ | 14 | 146 / 0 / 0 | 0 | 0 |
| student | /profile | rtl/ar → ltr/en | ❌ Arabic | ✅ | 5 | 146 / 0 / 0 | 0 | 0 |
| student | /settings | rtl/ar → ltr/en | ❌ Arabic | ✅ | 7 | 146 / 0 / 0 | 0 | 0 |
| student | /about | rtl/ar → ltr/en | ❌ Arabic | ✅ | 8 | 146 / 0 / 0 | 0 | 0 |
| company | /dashboard | rtl/ar → ltr/en | ❌ Arabic | ✅ | 5 | 156 / 0 / 0 | 0 | 0 |
| company | /projects | rtl/ar → ltr/en | ❌ Arabic | ✅ | 5 | 156 / 0 / 0 | 0 | 0 |
| company | /company/opportunities | rtl/ar → ltr/en | ❌ Arabic | ✅ | 5 | 156 / 0 / 0 | 0 | 0 |
| company | /saved-projects | rtl/ar → ltr/en | ❌ Arabic | ✅ | 5 | 156 / 0 / 0 | 0 | 0 |
| company | /company/partnerships | rtl/ar → ltr/en | ❌ Arabic | ✅ | 5 | 156 / 0 / 0 | 0 | 0 |
| company | /notifications | rtl/ar → ltr/en | ❌ Arabic | ✅ | 8 | 156 / 0 / 0 | 0 | 0 |
| company | /profile | rtl/ar → ltr/en | ❌ Arabic | ✅ | 5 | 156 / 0 / 0 | 0 | 0 |
| company | /settings | rtl/ar → ltr/en | ❌ Arabic | ✅ | 7 | 156 / 0 / 0 | 0 | 0 |
| supervisor | /dashboard | rtl/ar → ltr/en | ❌ Arabic | ✅ | 5 | 145 / 0 / 0 | 0 | 0 |
| supervisor | /supervisor | rtl/ar → ltr/en | ❌ Arabic | ✅ | 5 | 145 / 0 / 0 | 0 | 0 |
| supervisor | /supervisor/reviews | rtl/ar → ltr/en | ❌ Arabic | ✅ | 5 | 145 / 0 / 0 | 0 | 0 |

**Findings from the crawl:**
- ✅ `dir`/`lang` are correct on every page in both languages.
- ✅ Dark/light toggling works on every page.
- ✅ **0 console errors and 0 failed/4xx/5xx requests** on every crawled page.
- ✅ No horizontal overflow at 768 or 1280.
- ❌ **Every logged-in page has 145–156 px of horizontal scroll at 375 px** (Navbar overflow). See I-26b.
- ❌ `document.title` stays Arabic in English mode on every page (I-27).
- ❌ Every page leaves 3–14 Arabic strings in English mode (DB content excluded). Sources (I-28):
  - the footer (`سوق مشاريع التخرج…`, `جميع الحقوق محفوظة`, `تطوير وبرمجة:`);
  - the About page mission quote and developer title;
  - all notification titles and messages, which the backend sends in Arabic only.
- Screenshots are in `qa/screenshots/<role>__<route>__<lang>-<theme>-<width>.png`.

### 3.3 Route protection (typing URLs directly)
- The role × route matrix (5 actors × 24 routes = 120 navigations) **matches `App.jsx`**: anonymous users go to `/login`, and wrong roles go to `/`. ✅
- ❌ The company sidebar links to `/collaboration-requests`, which is a student-only route, so it redirects to `/` (I-34).
- ❌ Admin gets **no role menu** in the sidebar (only Notifications/Profile/Settings/About) (I-35).
- ✅ An expired or invalid token: `/me` returns 401, the token is cleared, and the user lands on `/login`.
- ❌ Editing `app_user_role` in localStorage while `/me` is slow or unreachable (Render cold start) renders the supervisor UI for a student (I-36). The API still refuses the actions, so this is a UI-only issue.

### 3.4 localStorage-only data (checked with two browser contexts = two devices)
| Key | Synced to backend? | Result on a 2nd device |
|---|---|---|
| `favorites_<id>` | **No** (no favorites table/endpoint) | ❌ lost |
| `user_skills_<id>` | Yes (`PUT /users/me/skills`), read back on login | ⚠️ restored, **but** if skills are cleared on device A, device B keeps its stale copy forever (`AppContext.jsx:538-546` ignores an empty server value) |
| `student_academic_cv_<id>` | Yes (`PUT /users/me/profile`) | ✅ restored (major, course, bio, portfolio) |
| Settings → notification preferences | **No**: `handleSavePreferences` only shows a toast | ❌ never saved anywhere (I-30) |
| `app_language`, `app_theme` | No (per-device preference) | fine as-is |

---

## 4. Issues

Format: **priority · title**, then Steps / Expected / Actual / Location / Fix. Line numbers refer to commit `8fe1f8b`.

### 🔴 Critical

#### I-01 🔴 Default accounts with public passwords are auto-created in production (incl. 2 supervisors)
- **Steps:** start the API on an empty DB, then `POST /login` with `osama.merhi@capstone.ps` / `password123` (also `omarie@qou.edu` / `Doctor@2025`, `student@capstone.ps` / `pass1234`, `company@capstone.ps` / `pass1234`).
- **Expected:** no well-known credentials exist in production.
- **Actual:** login succeeds with a **supervisor** token. `seed_default_users()` runs on *every* startup, so it re-creates the accounts if they are deleted. When the projects table is empty it also inserts 2 demo projects, an accepted application and 3 graded reports. The passwords are committed in the repo.
- **Location:** `backend/main.py:53-58`; `backend/seed.py:16-49`, `94-169`; `backend/init_db.sql:16-62`.
- **Fix:** remove the startup seed call and keep `seed.py` as a manual, dev-only script guarded by `ENVIRONMENT != production`. Then rotate or disable these four accounts in the production DB (`qa/find_demo_data.sql` §1 lists them).

#### I-02 🔴 A company can skip academic approval (and the capacity check) by sending a raw status
- **Steps:** company `PUT /applications/{id}/status {"status":"academically_approved"}` (or `pending_academic_approval`, `applied`, ...).
- **Expected:** a company may only nominate (`company_accepted`) or reject.
- **Actual:** the `else:` branch stores *any* valid status, so the application becomes `academically_approved` with no supervisor involved. The seat limit is skipped too: with `max_members=1`, the test project ended up with 2 occupied seats.
- **Location:** `backend/main.py:1017-1020` (owner branch fallback); valid list at `958-962`.
- **Fix:** whitelist owner transitions to `{company_accepted, rejected}` and return 403 for anything else. Run the capacity check for every seat-taking status.

#### I-03 🔴 A student can create a project and approve their own application
- **Steps:** student `POST /projects/` (stays `pending`), then the same student `POST /applications/` to it (pending projects accept applications), then `PUT /applications/{id}/status {"status":"academically_approved"}`.
- **Expected:** 403. Students never decide applications.
- **Actual:** 200. The student is "academically approved" on a project nobody reviewed, and `/projects/my` and the reports features unlock once the project is approved.
- **Location:** `main.py:558` (students allowed to create), `816-821` (only `rejected` blocked), `933-936` + `973-1020` (ownership = permission).
- **Fix:** only `partner/company/business` owners may act in the owner branch. Block applying to non-`approved` projects and to one's own project.

#### I-04 🔴 The next clean deploy will not start (unpinned and missing dependencies)
- **Steps:** a fresh venv with `pip install -r backend/requirements.txt` (what Render runs on every deploy), then `uvicorn main:app`.
- **Expected:** the API boots.
- **Actual:** pip now resolves **SQLAlchemy 2.1.6**. `postgresql://` maps to the `psycopg` (v3) driver, which is not installed, so you get `ModuleNotFoundError: No module named 'psycopg'`. Separately, `schemas.py` uses `EmailStr`, but **`email-validator` is not in requirements**: a dry-run resolve installs neither, so Pydantic raises `ImportError` at import. The running production instance survives only because of its existing build.
- **Location:** `backend/requirements.txt:1-9`; `backend/database.py:8-20`; `backend/schemas.py:3`.
- **Fix:** pin exact versions (`pip freeze` from a working env) and add `email-validator`. Either pin `sqlalchemy<2.1` or use the `postgresql+psycopg2://` scheme. Commit a lock file.

#### I-05 🔴 The report workflow cannot be used from the UI
- **Steps:** as an approved student open *My Project → Open Reports Page*. As a supervisor open *Reports & Analytics*.
- **Expected:** students upload deliverables, and supervisors grade them / request changes.
- **Actual:**
  1. `/reports` is wrapped in `allowedRoles={['supervisor','admin']}`, so students are bounced to `/`. The only upload button lives on that page.
  2. The upload modal only re-posts an *existing* report (`submitReport(rep.id, url)`), so a student with zero reports has nothing to click. The fallback `project_id` is `1`.
  3. `updateReportStatus` exists in context but **no component calls it**, so supervisors cannot approve, grade or comment. The API side works (tests pass).
- **Location:** `frontend/src/App.jsx:229-230`; `pages/MyProjectsPage.jsx:444`; `pages/ReportsPage.jsx:160-172`; `components/SubmitReportModal.jsx:16`; `context/AppContext.jsx:897-911` (fallback `|| 1` at 905), `936-959` (unused).
- **Fix:** add a student-accessible reports route with a "new report" form, and add approve / needs-changes / grade / feedback controls on the supervisor reports page.

### 🟠 High

#### I-06 🟠 Every logged-in user can download all users' personal data
- **Steps:** student token, `GET /users/` (or `/users/?role=student`).
- **Expected:** 403 for students and companies (or a minimal public profile).
- **Actual:** 200 with the full user list: emails, phone numbers, bios, portfolio/CV URLs, majors, roles.
- **Location:** `backend/main.py:491-507`.
- **Fix:** restrict to `supervisor`/`admin`. If companies need applicant details, expose them only through `/projects/{id}/applications`.

#### I-07 🟠 Report authorization: any student can file, any company can grade
- **Steps:**
  - (a) `qa_student2`, who is not on the project: `POST /reports/ {project_id}` returns **201**.
  - (b) `qa_company2`: `PUT /reports/{id}/status {"status":"rejected","grade":"0"}` on company A's report returns **200**.
- **Expected:** (a) 403 unless the student is an approved member. (b) 403 unless the caller is the project's company/supervisor or an admin.
- **Actual:** both succeed. (b) also sends the student a "rejected" notification.
- **Location:** `backend/main.py:1327-1365` (no membership check), `1368-1383` (role check only, no ownership).
- **Fix:** check `Application(status in accepted/academically_approved)` on submit. On review, require `project.created_by == user`, `project.supervisor_id == user`, or admin.

#### I-08 🟠 Rejected and pending projects are public
- **Steps:** anonymous `GET /projects/` or `GET /projects/?status=rejected` or `GET /projects/{rejected_id}`.
- **Expected:**
  - **anon / student:** `approved` only.
  - **company:** `approved`, plus its own projects in any status.
  - **supervisor / admin:** everything.
- **Actual:** everyone gets every project in every status, including the supervisor's rejection feedback. The student UI lists them too (no client-side status filter), so students can open and apply to pending projects.
- **Location:** `backend/main.py:627-642`, `645-655`; `frontend/src/context/AppContext.jsx:356`; `pages/ProjectsPage.jsx:52-89`.
- **Fix:** make the endpoint accept an optional token and filter by role as above. Also filter `status === 'approved'` in the student views.

#### I-09 🟠 Rejected applicants (and anyone who merely applied) can read and post in the team chat
- **Steps:** student2 applies, company rejects, student2 `GET /projects/{id}/messages`.
- **Expected:** 403 (only approved members, the owner and the assigned supervisor).
- **Actual:** 200. `check_project_access` accepts *any* application row, whatever its status.
- **Location:** `backend/main.py:1104-1117`.
- **Fix:** require `Application.status in ('academically_approved','accepted')` (or `company_accepted` if pre-approval chat is desired). Limit supervisors to `project.supervisor_id`.

#### I-10 🟠 `/openapi.json` and `/analytics/overview` return 500; `/docs` is blank
- **Steps:** `GET /openapi.json`.
- **Actual:** 500. Response body: `` `TypeAdapter[...AnalyticsOverviewResponse...]` is not fully defined; you should define `List` ``.
- **Root cause:** `backend/schemas.py:2` imports only `Optional`, but **`schemas.py:214`** declares `top_skills: List[TopSkillItem]`. On Python **3.14** annotations are evaluated lazily (PEP 649/749), so the module imports and Pydantic can't resolve `List` when it builds the model. `GET /analytics/overview` fails the same way (`main.py:1420-1463`). On Python ≤ 3.13 (render.yaml pins `3.11.9`) the same line is a `NameError` at import, so **the whole API would not start**. The live site is therefore running 3.14, not the version in render.yaml.
- **Fix:** `from typing import List, Optional` (or use `list[TopSkillItem]`), and align `PYTHON_VERSION` with what Render actually uses.

#### I-11 🟠 Error responses leak SQL, parameters and password hashes
- **Steps:**
  - `POST /projects/ {"title": "T"*400}` returns **500**.
  - `POST /users/ {"full_name": "x"*300, ...}` returns **400**.
- **Actual:** `detail` contains `(psycopg2.errors.StringDataRightTruncation) ... [SQL: INSERT INTO users (...)] [parameters: {... 'password_hash': '$2b$12$...'}]`. The global handler also returns `str(exc)` for any crash (e.g. the Pydantic internals in I-10).
- **Location:** `backend/main.py:98-112` (global handler), `237-242` (login), `311-317` (register).
- **Fix:** log the exception server-side and return a generic message with a correlation id. Add `max_length` to the schemas so these become 422s.

#### I-12 🟠 Supervisor actions ignore capacity and overwrite project status
- **Steps:**
  - (a) Project `max_members=1`, two applicants, supervisor signs off both: **2/1 seats**.
  - (b) Supervisor rejects a project, then signs off an application on it: the project flips back to **approved**.
  - (c) Supervisor rejects a nomination, then the company `PUT ... accepted` again: accepted.
- **Expected:** 400 when full; project status unchanged; a supervisor rejection is final for the company.
- **Location:** `backend/main.py:1022-1035` (no capacity check; `project.status = "approved"`), `975-983` (no check of the current status).
- **Fix:** run the same capacity check in the supervisor branch, drop the `project.status = "approved"` side effect, and add a state machine (allowed from → to transitions).

#### I-13 🟠 Project owners can set supervisor, supervisor feedback, and company name; edits skip re-review
- **Steps:**
  - Company `PUT /projects/{id} {"supervisor_id": <any user>, "supervisor_feedback": "approved by me"}`: stored.
  - Company `POST /projects/ {"company_name": "Google"}`: published under that name.
  - Editing the description of an *approved* project leaves it approved.
- **Expected:** these fields are supervisor-only or derived; material edits return the project to `pending`.
- **Location:** `backend/schemas.py:85-94` (`ProjectUpdate` exposes `supervisor_id`, `supervisor_feedback`, `company_name`); `main.py:682-685` (blind `setattr`), `565-567`.
- **Fix:** split owner and supervisor update schemas. Always derive `company_name` from the creator. Reset status to `pending` on content edits.

#### I-14 🟠 CV upload: no content or size check, public URLs, ephemeral storage
- **Steps:**
  - Upload `evil.pdf` containing HTML: **200**.
  - Upload a 12 MB file: **200**.
  - Anonymous `GET /uploads/cvs/cv_<id>_<ts>.pdf`: **200**.
  - Upload twice: the old file is left behind.
- **Expected:** PDF magic bytes / content type checked, a server-side size limit, authenticated download, cleanup.
- **Actual:** extension check only (`.pdf`). Files go to `backend/uploads/cvs` on local disk, which **Render wipes on every deploy**, and are served publicly by `StaticFiles`. Filenames are guessable (user id + timestamp). Companies and supervisors can upload too (a `StudentProfile` gets created for them). The 10 MB limit exists only in the browser (`StudentOnboardingModal.jsx:102`).
- **Location:** `backend/main.py:92-95`, `413-448`; `backend/.gitignore` (no `uploads/`).
- **Fix:** validate `%PDF-` and the size server-side, store in object storage (S3/R2/Supabase) with signed URLs, delete the previous file, and restrict to students.

#### I-15 🟠 CORS trusts every `*.vercel.app` site, and the 500 handler reflects any Origin
- **Steps:**
  - Preflight from `https://attacker-demo.vercel.app`: `Access-Control-Allow-Origin: https://attacker-demo.vercel.app` with `Allow-Credentials: true`.
  - Any 500 with `Origin: https://evil.example`: the same origin is echoed with credentials.
- **Impact:** limited today because the token is sent in the `Authorization` header from localStorage, not a cookie. It becomes exploitable the moment cookies are used, and anyone can host a page on vercel.app.
- **Location:** `backend/main.py:85` (`allow_origin_regex`), `100-106`.
- **Fix:** remove the regex (list preview domains explicitly if needed) and let `CORSMiddleware` handle error responses instead of hand-written headers.

#### I-16 🟠 Missing notifications
Covered by tests: `test_notif_on_*` and flow step 7.

| Event | Notified? |
|---|---|
| application → owner | ✅ |
| company nomination → student + supervisors | ✅ |
| rejection → student | ✅ |
| academic approval → student + company | ✅ |
| message → **owner only** | ⚠️ |
| report submitted → supervisor/owner | ✅ |
| report reviewed → student | ✅ |
| **company or supervisor message → students** | ❌ |
| **project approved/rejected → company** | ❌ |
| **new pending project → supervisors** | ❌ |

- **Location:** `backend/main.py:1157-1165` (only `project.created_by`), `694-745` (no notification), `553-587`.
- **Fix:** notify all approved members plus the assigned supervisor except the sender; notify the owner on status change; notify supervisors on new pending projects.

#### I-17 🟠 No brute-force protection on login
- **Steps:** 25 wrong passwords in a row for one account.
- **Actual:** 25 × 401, never 429, no lockout. Combined with I-01 and I-20 (no minimum password length), this makes credential stuffing easy.
- **Location:** `backend/main.py:213-242`.
- **Fix:** add rate limiting per IP and per account (e.g. `slowapi`, 5 per minute) with exponential back-off.

#### I-18 🟠 `PUT /projects/{id}/status` with no body approves the project
- **Steps:** supervisor `PUT /projects/{id}/status` with an empty body: status becomes `approved`.
- **Expected:** 422/400.
- **Location:** `backend/main.py:719-725` (`else: new_status = "approved"`).
- **Fix:** require an explicit status.

#### I-19 🟠 Tokens are never revoked
- **Steps:** `POST /logout`, then `GET /me` with the same token: 200. Change the password: the old token still works for up to 24 h.
- **Location:** `backend/main.py:245-248`, `451-470`; `utils.py:76`.
- **Fix:** add a `token_version`/`password_changed_at` column checked in `get_current_user`, or a short-lived access token plus refresh token. Make `/logout` invalidate the token.

#### I-20 🟠 Registration accepts any password (including 1 character); blank names
- **Steps:** `POST /users/` with `password: ""`, `"1"` or `"123"`: **201**. `full_name: "   "`: 201. (An empty password creates an account nobody can log into.)
- **Expected:** 422. The UI enforces ≥ 6 characters, but the API does not.
- **Location:** `backend/schemas.py:10-14`; `main.py:257-317`.
- **Fix:** `Field(min_length=8, max_length=128)` for the password and `min_length=2, max_length=100` for `full_name` (strip first).

#### I-21 🟠 The company sees every application in the "View Applications" modal, with a wrong status
- **Steps:** company → any project card → *View Applications*.
- **Actual:** the modal renders `applications` (all of the company's applications across projects), not the clicked project's. It shows "accepted" only for `status === 'accepted'`, but company acceptance stores `company_accepted`, so a nominated student still shows as pending and *Accept* stays enabled.
- **Location:** `frontend/src/components/ApplicationsModal.jsx:60-125` (no `selectedProject` filter; status checks at 90-111); `components/ProjectCard.jsx:222-228`.
- **Fix:** filter by `selectedProject.id` (or call `/projects/{id}/applications`) and map `company_accepted`/`academically_approved` to labels.

#### I-22 🟠 Profile page saves invented data to the database
- **Steps:** a brand-new company opens `/profile` and clicks *Save*.
- **Actual:** stored in the DB: phone `+970 599 000 000`, university `جامعة القدس المفتوحة`, major `تكنولوجيا المعلومات وهندسة البرمجيات`, bio `شركة رائدة في تقديم الحلول البرمجية...`. *Website* (`https://alnoor-tech.ps`) and *Industry* are UI-only and never saved. On API failure the page still says "saved successfully (locally)".
- **Location:** `frontend/src/pages/ProfilePage.jsx:23-38`, `105-125`.
- **Fix:** initialise every field empty and load it from `/users/me/profile`. Add website/industry to the API or remove them. Show an error on failure.

### 🟡 Medium

#### I-23 🟡 Login "Back to Main Platform" loops to `/login` (known issue, confirmed)
- **Steps:** log out, open `/login`, click the header button (or the logo / the button at the bottom of the card).
- **Actual:** goes to `/`, which is a protected route for anonymous users, so it redirects to `/login`. Verified by `nav_back_loop.json`.
- **Location:** `frontend/src/pages/LoginPage.jsx:100-127` and `222-224` (`to="/"`); `App.jsx:177`.
- **Fix:** point it at `/about` (public), or make a public landing route.

#### I-24 🟡 About page "Browse Projects" also loops (confirmed)
- **Location:** `frontend/src/pages/AboutPage.jsx:459-464` (`to="/projects"`, protected at `App.jsx:178`).
- **Fix:** for anonymous visitors, send them to `/login` with intent or expose a public read-only project list (approved only, see I-08).

#### I-25 🟡 Email icon covers the placeholder in RTL (confirmed)
- **Measured:** at 1280 px in Arabic, the input is `dir="ltr"` with `ps-3 pe-10`. Logical padding resolves against the *input's* LTR direction (left 12 px, right 40 px), while the icon uses `end-3`, which resolves against the *RTL parent* and lands on the left. Result: the icon spans x = 149–165 px exactly where the text starts (149 px). Same in the register form. Screenshots: `qa/screenshots/login_email_rtl__*.png`.
- **Location:** `frontend/src/pages/LoginPage.jsx:416-419`.
- **Fix:** use physical classes for this LTR input (`pl-10` + icon `left-3`), or put `dir="ltr"` on the wrapper too.

#### I-26 🟡 Header back button wraps to 3 lines on mobile (confirmed)
- **Measured at 375 px:** "العودة للمنصة الرئيسية" and "Back to Main Platform" each take 3 lines (62 px tall). See `login_header_375__*.png`.
- **Location:** `frontend/src/pages/LoginPage.jsx:114-127`.
- **Fix:** `whitespace-nowrap` and hide the label below `sm` (icon only), or use a shorter label.

#### I-26b 🟠 Every logged-in page scrolls horizontally on phones (Navbar overflow)
- **Steps:** any logged-in page at 375 px width (Arabic or English).
- **Expected:** no horizontal scroll.
- **Actual:** `scrollWidth - clientWidth = 146 px` on **every** authenticated page. The right-hand Navbar group (theme toggle + language button + bell + name/role capsule) doesn't fit. In RTL it spills off the left edge (`div.flex.items-center.gap-2` spans x = −146…225), cutting off the user name and role badge and letting the whole layout slide sideways. Fine at 768 and 1280.
- **Location:** `frontend/src/components/Navbar.jsx:67-185` (capsule at `175-185` has no `hidden sm:flex`; language button shows the full label).
- **Fix:** hide the name capsule below `sm` (or show only the icon), use icon-only language/theme buttons on mobile, and add `min-w-0` + `overflow-hidden` on the header group.

#### I-27 🟡 No meta description or Open Graph tags; title always Arabic (confirmed)
- `meta[name=description]`, `og:title` and `og:image` are all `null`.
- `document.title` stays `منصة مشاريع التخرج | Capstone Market` in English mode on every page.
- **Location:** `frontend/index.html:1-12` (also: the HTML comment sits *before* `<!doctype html>`, which can trigger quirks mode in some browsers); nothing calls `document.title`.
- **Fix:** add description/OG/Twitter tags, update the title in the `languageChanged` handler (`i18n.js:44-48`), and move the comment after the doctype.

#### I-28 🟡 Missing translation key and hardcoded Arabic UI text
- **Key files:** `ar.json` and `en.json` both have 298 keys and match each other. But **`create_project.btn_add`** is used at `pages/ProjectsPage.jsx:149` and exists in neither file, so the raw key text is rendered as the "add project" button label.
- **Hardcoded text:** **153** source lines contain Arabic literals outside `t()` or an `isRtl` ternary, so they stay Arabic in English mode. Top files: `AppContext.jsx` 23, `AuthContext.jsx` 19, `ManageProjectsPage.jsx` 15, `NotificationsPage.jsx` 12, `AboutPage.jsx` 11. Examples: footer `MainLayout.jsx:33,43,46,57`; `ProtectedRoute.jsx:40`; role titles `AuthContext.jsx:101-106`; default majors in `api/client.js:9-16`.
- **Translation pattern:** another **688** strings are translated through inline `isRtl ? '…' : '…'` ternaries instead of the locale files.
- **Backend messages:** API errors and notification texts are Arabic-only, so English users see Arabic toasts and notifications. `translateErrorMessage` covers only 5 patterns.
- **Fix:** add the key, move literals into `ar.json`/`en.json`, and have the backend return error codes so the client translates them.

#### I-29 🟡 Fabricated data shown as real (frontend)
- **AppContext.jsx:**
  - Projects with no skills get `['Python','SQL','FastAPI','React']` (`:364`).
  - A category is invented from list position (`:376`).
  - Difficulty and hours/week are invented (`:382-383`).
  - Every student is `isFree: true` (`:480`).
  - Report fallback `project_id: 1` (`:905`).
- **Other pages:**
  - Opportunities: every deadline is `2026-11-25`, apply falls back to project id `1` (`OpportunitiesPage.jsx:38,48`).
  - Activity log: IP `127.0.0.1` for every row, and the "refresh" button is a fake timeout (`ActivityLogsPage.jsx:39,52,65,76-79`).
  - Reports page chat falls back to `rawProjects[0]`, an unrelated project (`ReportsPage.jsx:56`).
- **Backend:** unassigned projects report `supervisor_name = "د. أسامة أمين مرعي"` (`main.py:546-547`).
- **Fix:** show "—"/empty states instead, and never fall back to id 1 or a random project.

#### I-30 🟡 Favorites and notification preferences are never persisted server-side
- See §3.4. **Location:** `context/AppContext.jsx:125-158`; `pages/SettingsPage.jsx:31-33,73-75`.
- **Fix:** add a `favorites` table with endpoints and a `user_settings` JSON column, or remove the preference toggles.

#### I-31 🟡 Stale skills: clearing them on one device is ignored by the others
- **Location:** `context/AppContext.jsx:538-546` (only applies non-empty server skills), `160-195`.
- **Fix:** treat the server as the source of truth; always overwrite the local copy, even with an empty value.

#### I-32 🟡 Students can apply to pending projects; admin can apply
- **Location:** `backend/main.py:816-821` (checks only `rejected`); `148-150` (admin passes every `require_role`).
- **Fix:** require `status == 'approved'`; make `apply_to_project` check `role == 'student'` explicitly.

#### I-33 🟡 Notification links point to routes that don't exist in the SPA
- **Details:** links `/projects/{id}`, `/browse`, `/workspace` go to the 404 page. `/reports` is supervisor-only for students. Also, notification items are not clickable at all (the Navbar only marks them read).
- **Location:** `backend/main.py:860,993,1015,1043,1053,1068,1077,1164,1362,1410`; `components/Navbar.jsx:138-147`.
- **Fix:** use existing routes (`/my-projects`, `/projects?id=`, `/supervisor`) and navigate on click.

#### I-34 🟡 Company sidebar links to a student-only page
- **Details:** *Collaboration Requests* (`/collaboration-requests`) redirects a company to `/`.
- **Location:** `frontend/src/components/Sidebar.jsx:209` vs `App.jsx:195`.
- **Fix:** add `company` to that route's roles or remove the link.

#### I-35 🟡 Admin has no navigation
- **Details:** the sidebar renders role sections only for `student`/`company`/`supervisor`.
- **Location:** `Sidebar.jsx:119-305`.
- **Fix:** add an admin section (supervisor menu + user management).

#### I-36 🟡 The UI trusts the `app_user_role` cached in localStorage
- **Details:** `ProtectedRoute` and `AuthProvider` initialise from localStorage. If `/me` fails (cold start/offline), the edited role stays in effect.
- **Location:** `components/ProtectedRoute.jsx:16-30`; `context/AuthContext.jsx:35-40`, `123`.
- **Fix:** block role-gated routes until `/me` confirms the role; never use the cached role for authorization.

#### I-37 🟡 Teammates can't see each other's reports; applicant profile fields always null
- **Reports:** student visibility uses `Application.status == "accepted"`, but the official flow produces `academically_approved` (`main.py:1300-1310`).
- **Applicant fields:** `student_major`, `student_bio` and `student_portfolio_url` are read with `getattr(User, ...)`. Those live on `StudentProfile`, so they are always null and companies never see the applicant's profile (`main.py:791-794`).
- **Fix:** use `in_(["accepted","academically_approved"])` and read from `student.profile`.

#### I-38 🟡 Input validation gaps
- Blank project titles and report titles are accepted.
- `max_members` 0 / −3 / 10000 are accepted.
- `max_members` can be edited below the current member count.
- Chat messages have no length limit (200 KB accepted).
- `javascript:` is accepted as `file_url`/`portfolio_url`, and `ReportsPage.jsx:131` renders it as an `<a href>`, a stored-XSS vector on click.
- Title > 150 characters gives a 500.
- **Location:** `backend/schemas.py:75-94,127-134,161-166,221-222`.
- **Fix:** add Pydantic `Field` constraints, `HttpUrl` for URLs, and a range of 1–10 for `max_members`.

#### I-39 🟡 Skill normalisation is a special-case hack
- **Details:** `"<spl"` is hard-coded to mean `", SQL"`, so `Python<Splunk` becomes `Python, SQLunk`. Normalisation runs on create and on `PUT /users/me/skills`, but **not** on `PUT /projects/{id}`, so `python<spl` can be stored raw again. The front end duplicates the hack.
- **Search:** works for `sql` because the client re-normalises.
- **Location:** `backend/main.py:514-537` (regex at 519), `682-685`; `frontend/src/context/AppContext.jsx:17-23,363`.
- **Fix:** clean the existing data once (find it with `find_demo_data.sql` §12), drop the `<spl` rule, split only on commas, and apply the same sanitiser on update.

#### I-40 🟡 Password whitespace is silently stripped on change
- **Details:** `"  Spaced#123  "` is saved as `Spaced#123`, so the exact password the user chose fails at login.
- **Location:** `backend/main.py:463-468`.
- **Fix:** don't strip passwords (or strip consistently everywhere).

#### I-41 🟡 Hardcoded fallback SECRET_KEY outside production
- **Details:** if neither `RENDER=true` nor `ENVIRONMENT=production` is set, tokens are signed with `your-super-secret-key-change-this-in-production`, which is in the repo. The test forged an **admin** token against the local dev server. Production is protected by the guard (verified: it refuses to boot with no key or the example key), but a staging or preview deploy would be exposed.
- **Location:** `backend/utils.py:11,73`.
- **Fix:** fail closed when `SECRET_KEY` is missing, whatever the environment (allow an explicit `DEV_INSECURE_KEY=1` opt-in).

#### I-42 🟡 No pagination anywhere
- `GET /projects/` returns every row with N+1 queries per project (`format_project_item`).
- `/projects` renders all cards; with ~530 test projects, full-page screenshots timed out.
- Notifications are capped at 50 with no paging.
- **Location:** `backend/main.py:540-550`, `627-642`, `1231`; `pages/ProjectsPage.jsx`.
- **Fix:** `limit/offset` (or cursor) plus a joined query for seat counts.

#### I-43 🟡 Supervisor login landing page is dead code
- **Details:** `from` defaults to `'/dashboard'`, so `dest` is never `/supervisor`.
- **Location:** `frontend/src/pages/LoginPage.jsx:36,84`.
- **Fix:** default `from` to `null`.

#### I-44 🟡 Every project card shows a chat button for every role
- **Details:** an unrelated student or company opens a chat that then fails with a 403 toast.
- **Location:** `components/ProjectCard.jsx:236-243`.
- **Fix:** render it only for members, the owner and the supervisor.

#### I-45 🟡 `/projects` is cached in `sessionStorage`
- **Details:** after logout the next user of the same tab briefly sees the previous list (including non-approved projects).
- **Location:** `context/AppContext.jsx:99-116`, `390-397`.
- **Fix:** clear the cache on logout and key it by user id.

#### I-46 🟡 API URL falls back to production for any non-localhost host
- **Details:** `VITE_API_URL` works (used for this test), but a preview or staging build without it silently talks to `capstone-market.onrender.com`.
- **Location:** `frontend/src/api/client.js:2-6`.
- **Fix:** fail the build if `VITE_API_URL` is missing in non-dev mode.

#### I-47 🟡 Admin-only operations missing
- **Details:** there is no endpoint to create a supervisor or admin, delete or disable users, or reset a password. The only path is direct SQL (see the Setup section).
- **Fix:** add admin user management.

#### I-48 🟡 Delete project doesn't clean up notifications
- **Details:** messages, applications and reports are removed (✅ tested), but notifications keep linking to the deleted project.
- **Location:** `backend/main.py:771-775`.

### ⚪ Improvements
- **I-49:** No security headers (`X-Content-Type-Options`, `X-Frame-Options`/CSP, HSTS) on API responses. Add a small middleware.
- **I-50:** `backend/uploads/` (user CVs) is not in `.gitignore`. Running the API locally creates it, so it can be committed by mistake.
- **I-51:** Inconsistent `/api/...` aliases. `PUT`/`DELETE /api/projects/{id}` return 405, and messages and notifications have no `/api` alias.
- **I-52:** Dead code:
  - Duplicate route `update_application_status_alias` (`main.py:1089-1097`, shadowed by the first registration).
  - `loginAsDemo` / `DEMO_FALLBACK_USERS` (`AuthContext.jsx:5-67`, never called).
  - `demo-token-` handling (`client.js:82-84,99-101`).
- **I-53:** JWT stored in `localStorage` (XSS-readable). Consider an httpOnly cookie once CORS is tightened (I-15).
- **I-54:** `verify_password` uses `print()` instead of the logger (`backend/utils.py:100`).
- **I-55:** `GET /users/me/profile` is registered under 5 aliases (`main.py:339-343`, `352-356`). Pick one.
- **I-56:** `models.Base.metadata.create_all` plus ad-hoc `ALTER TABLE` statements run at import time (`main.py:23-51`). Move them to Alembic migrations.
- **I-57:** `render.yaml` pins Python 3.11.9, but the code only boots on 3.14 (I-10). Pin the version actually used.
- **I-58:** Supervisors can edit, delete and chat on *any* project, not only the ones they supervise. Decide whether this is intended.
- **I-59:** A notification poll every 30 s for every open tab. Consider back-off when the tab is hidden.
- **I-60:** A stray file named `tatusgit status` (output of a mistyped `git status` redirect) is committed at the repo root.

---

## 5. What works correctly ✅

**Auth**
- Self-registration as `admin`/`supervisor` is blocked, case- and whitespace-insensitive (`ADMIN`, ` Supervisor `).
- Unknown roles fall back to `student`; `company`/`business` map to `partner`.
- Duplicate email is rejected, case-insensitively.
- Login is email-case-insensitive; a wrong password gives a 401 with the **same** message as an unknown email (no user enumeration).
- Malformed, tampered, `alg:none`, expired and unknown-user tokens are rejected with 401.
- The role is always read from the DB, never from the token claim.
- Password change: checks the current password, enforces ≥ 6 characters, and the old password stops working.

**Production secret guard:** refuses to boot without `SECRET_KEY`, with an example key, or with a key shorter than 32 characters.

**Projects**
- A company project starts `pending`; a supervisor project is auto-approved and self-assigned.
- Other companies and students cannot edit, delete or approve (403).
- The owner cannot change status via `PUT /projects/{id}`.
- Invalid status gives 400; missing project gives 404.
- Delete cascades messages, applications and reports.
- `/projects/my` works per role.

**Applications**
- Duplicate application gives 400; rejected project gives 400; full project gives 400; non-students get 403.
- `current_members`/`available_seats` update correctly on nominate/reject.
- The company cannot nominate beyond capacity.
- The student cannot change their own application on someone else's project.
- List isolation per role is correct.

**Messages & notifications**
- An unrelated student or company gets 403 on chat.
- Empty or missing text gives 400/422.
- Notifications are created for applications, nominations, rejections, approvals, reports and reviews.
- Mark-read works only on your own notifications (others get 404); read-all affects only the caller.

**Reports**
- Supervisor review with status, feedback and grade works via the API.
- Students and companies only see their own scope; a student cannot grade.

**Security**
- No SQL injection: all filters are parameterised (`' OR '1'='1` returns `[]`).
- CORS rejects non-Vercel foreign origins.
- 404/422 bodies are generic.

**Frontend**
- The complete flow up to chat works with real API data (no mocks) and survives reloads.
- Route guards match `App.jsx` for all 120 role × route navigations.
- An expired token logs the user out cleanly.
- `dir`/`lang` switch correctly between `rtl/ar` and `ltr/en`; theme toggling adds or removes `html.dark`.
- Mobile: the header stays fixed while scrolling, and the drawer overlays it correctly.
- Skills and the academic CV are re-hydrated from the API on a new device.

---

## 6. Suggested fix order

1. **Today (security / outage):**
   - I-01: remove the startup seed, rotate the 4 accounts.
   - I-04: pin requirements and add `email-validator`.
   - I-10: one-line `List` import.
   - I-11: generic errors.
2. **Authorization:**
   - I-02, I-03, I-12: application state machine plus capacity checks.
   - I-07: reports.
   - I-06: `/users/`.
   - I-08: project visibility.
   - I-09: chat access.
   - I-13: owner-editable fields.
   - I-18: `/status` without body.
3. **Account security:**
   - I-17: rate limit.
   - I-20: password rules.
   - I-19: token revocation.
   - I-15: CORS.
   - I-14: CV storage.
   - I-41: fail-closed secret.
4. **Restore broken features:**
   - I-05: report UI.
   - I-16: notifications.
   - I-21: applications modal.
   - I-33: notification links.
   - I-34 / I-35: navigation.
   - I-37: teammate reports and applicant profile.
5. **Data quality:**
   - Run `qa/find_demo_data.sql` on production and decide on deletions.
   - Then I-22 (profile defaults), I-29 (fabricated values), I-39 (skills), I-38 (validation).
6. **UX / i18n:**
   - I-23–I-28 (known UI issues, meta, translations).
   - I-30 / I-31 (favorites, preferences).
   - I-42 (pagination), I-44, I-45.
7. **Hygiene:** ⚪ items.

---

## 7. Demo / test data in code (Part 4)

| Where | What | Runs in production? |
|---|---|---|
| `backend/seed.py` via `main.py:53-58` | 4 accounts with known passwords; 2 projects, 1 accepted application, 3 graded reports (if the projects table is empty) | **Yes, on every boot** |
| `backend/init_db.sql` | the same 4 accounts with *fake* bcrypt hashes (`...p3R6f9Y2x6Q1eL9e8x4J9...` repeated, not valid) | only if run manually |
| `backend/main.py:301`, `547`, `796` | default major `أنظمة المعلومات الحاسوبية (CIS)`; fake supervisor name; `"شركة شريكة"` placeholder company | yes |
| `backend/test_integration.py`, `test_roles_e2e.py` | create `student_<ts>@capstone.ps`, `company_<ts>@...`, `hacker_admin_<ts>@...` and projects **in whatever DB `DATABASE_URL` points to** (no guard) | if ever run against prod |
| `frontend/src/context/AuthContext.jsx:5-30` | `DEMO_FALLBACK_USERS` (unused) | bundled |
| `frontend/src/context/AppContext.jsx:169-170,238-244,263-269` | demo skills/CV for user id `student-1` | bundled (inert) |
| `frontend/src/pages/ProfilePage.jsx:23-38` | fake phone/website/bio/university pre-filled **and saved** | yes (I-22) |
| `frontend/src/pages/OpportunitiesPage.jsx:38`, `ActivityLogsPage.jsx:39-65`, `ManageCollaborationsPage.jsx:35`, `CompanyOpportunitiesPage.jsx:48`, `CollaborationRequestsPage.jsx:43`, `ManageCompaniesPage.jsx:44` | fixed dates (`2026-10-xx`), fake IPs | yes (display only) |

No hard-coded *statistics* were found: dashboard counters are computed from API data. `/analytics/overview` computes real counts, but it 500s (I-10) and the frontend doesn't use it.

`qa/find_demo_data.sql` contains **20 SELECT-only queries** (validated against the local DB inside `BEGIN READ ONLY … ROLLBACK`). They cover:
- seed accounts;
- test-looking emails and names;
- profiles with the fake defaults;
- seeded projects and reports;
- short or random titles such as `lj[`;
- projects without a real company;
- duplicates;
- malformed skills (`<spl`);
- over-capacity projects;
- reports by non-members;
- non-supervisors assigned as supervisor;
- orphans;
- a summary.

---

## 8. Artifacts in `qa/`
```
qa/
├── TEST_REPORT.md               this file
├── seed.py                      QA accounts (one per role, +1 extra student/company)
├── find_demo_data.sql           SELECT-only demo-data finder
├── api_tests/                   pytest + httpx (230 tests)
│   ├── conftest.py              fixtures, role-aware client, resource factories
│   ├── test_permission_matrix.py, test_auth.py, test_projects.py, test_applications.py,
│   ├── test_messages_notifications.py, test_reports_users_cv.py, test_security_docs.py
│   ├── results.xml, last_run.txt, permission_matrix.json/.md
├── e2e/                         Playwright (system Chrome)
│   ├── playwright.config.js, package.json, tests/0*.spec.js, tests/helpers.js
│   └── results/*.json           per-check raw data (flow, crawl, route matrix, i18n, storage...)
├── screenshots/                 147 PNGs (role__route__lang-theme-width)
├── backend_server.log, frontend_server.log
└── .venv/                       local Python env (gitignore it)
```


---

## 9. Fixes (phases 1-3)

All work was done locally against throw-away PostgreSQL 16 databases (never production or Render), on the branches `fix/phase1-security` → `fix/phase2` → `fix/phase3`, each merged into local `main` after the pre-push gate passed. **Pushing failed (HTTP 403):** the git credentials on this machine (`jo04saleh`) have no write access to `mohamadabusaleh83-alt/capstone_market`, so `main` is merged locally but not on GitHub yet.

### 9.1 Before / after

| Check | Before (commit `8fe1f8b`) | After |
|---|---|---|
| API suite (pytest + httpx) | 148 passed / 82 failed (230 tests) | **258 passed / 0 failed (258 tests)** |
| Permission matrix | 26/34 endpoints, 27 wrong cells | **34/34 endpoints, 0 wrong cells (238 calls)** |
| E2E full business flow | 11/14 UI steps (report UI missing, students not notified) | **15/15 UI steps, 0 console errors, 0 HTTP errors** |
| Other E2E specs (auth/routes, storage/meta/i18n, admin) | 11 passed / 16 failed (27) | **27 passed / 0 failed (27)** |
| Page crawl | 21 of 39 combos, 5 variants: 146-156 px horizontal scroll on every logged-in page at 375 px, Arabic title/footer/notifications in English | **51 role×page combos × 8 variants (408): no horizontal scroll, no theme/dir errors, no console/HTTP errors, no untranslated text** (after one Settings fix) |
| Fresh `pip install -r requirements.txt` + boot | fails (SQLAlchemy 2.1/psycopg, missing email-validator); 3.11 crashes on import | boots on **Python 3.14.0 and 3.11.18**, `/openapi.json` 200 |
| ESLint (`frontend/src`) | 61 problems (3 errors) | **18 problems (1 React-Compiler advisory, 17 warnings)** |
| `vite build` | passes | passes |

The test suite grew from 230 to 258 API tests and 27 to 28 E2E tests. Test changes are described in each commit message and listed in 9.6.

### 9.2 Issue status

| Issue | Prio | Status | What changed | Commits |
|---|---|---|---|---|
| I-01 | 🔴 | ✅ fixed | No seeding on startup; `seed.py` refuses to run in production; demo inserts removed from `init_db.sql`. | `bb607c0`, `d66f025` |
| I-02 | 🔴 | ✅ fixed | Explicit application state machine; companies only nominate/reject; company projects need a nomination before academic approval. | `023792c`, `51a524c` |
| I-03 | 🔴 | ✅ fixed | Students can never decide applications; cannot apply to their own project. | `023792c` |
| I-04 | 🔴 | ✅ fixed | Exact pins + `email-validator`, SQLAlchemy 2.0.55, psycopg2 forced in the URL; boots on 3.11 and 3.14. | `784f047` |
| I-05 | 🔴 | ✅ fixed | Reports page for every role: students submit (link and/or private file), owners/assigned supervisors grade, approve, request changes, reject. | `f51409c` |
| I-06 | 🟠 | ✅ fixed | `GET /users/` is supervisor/admin only. | `0053e1d` |
| I-07 | 🟠 | ✅ fixed | Only approved members submit reports; only owner/assigned supervisor/admin review. | `ce58777` |
| I-08 | 🟠 | ✅ fixed | Role-based project visibility with an optional token (anon: approved; student/company: approved + own; supervisor/admin: all). | `77be023`, `51a524c` |
| I-09 | 🟠 | ✅ fixed | Chat restricted to approved members, owner, assigned supervisor, admin. | `7df3567` |
| I-10 | 🟠 | ✅ fixed | `List` imported; `/openapi.json`, `/docs`, `/analytics/overview` return 200. | `d04131c` |
| I-11 | 🟠 | ✅ fixed | Generic 500 with request id; no SQL/params/`str(exc)` in responses; `max_length` on inputs. | `c8e9022` |
| I-12 | 🟠 | ✅ fixed | Capacity check for supervisors; approving an application no longer changes `project.status`. | `023792c` |
| I-13 | 🟠 | ✅ fixed | Separate owner/supervisor update schemas; company name derived from creator; content edits send approved projects back to pending. | `31cdd69` |
| I-14 | 🟠 | ✅ fixed | PDF magic bytes, 5 MB limit, students only, old file deleted, private Supabase storage with local fallback, signed short-lived links. | `7e8a085`, `a1366dd` |
| I-15 | 🟠 | ✅ fixed | No `*.vercel.app` regex; production origin + localhost (+ `ALLOWED_ORIGINS`). | `e24c62b` |
| I-16 | 🟠 | ✅ fixed | Chat notifies all participants except the sender; project status → owner; new pending project → supervisors. | `bff14a8` |
| I-17 | 🟠 | ✅ fixed | Login rate-limited per IP and per account, registration per IP (429 + Retry-After). | `ba992e0` |
| I-18 | 🟠 | ✅ fixed | Status update requires an explicit status. | `30093fd` |
| I-19 | 🟠 | ✅ fixed | `token_version` revokes tokens on logout and password change. | `f55018c` |
| I-20 | 🟠 | ✅ fixed | Password 8-128, full name 2-100 (stripped); frontend messages match. | `2c4ff31`, `8ce7b0a` |
| I-21 | 🟠 | ✅ fixed | Applications modal per project, correct labels, Accept/Reject only when allowed, CV download. | `4d7fc18` |
| I-22 | 🟠 | ✅ fixed | Profile loads/saves only real data; website/industry saved; errors shown. | `d25cc83` |
| I-23 | 🟡 | ✅ fixed | Login back links go to `/about` (public). | `df6b702` |
| I-24 | 🟡 | ✅ fixed | About 'Browse Projects' → sign-in, then `/projects`. | `4eb062d`, `cc84307` |
| I-25 | 🟡 | ✅ fixed | Physical left/right classes for LTR inputs in RTL. | `9378ab8` |
| I-26 | 🟡 | ✅ fixed | Back button icon-only on phones, no wrapping. | `98b8db4`, `cc84307` |
| I-26b | 🟠 | ✅ fixed | Navbar fits at 375 px (no horizontal scroll on any page). | `9635f57` |
| I-27 | 🟡 | ✅ fixed | Meta description, Open Graph/Twitter tags; title follows the language; doctype first. | `e5a0113` |
| I-28 | 🟡 | ✅ fixed | Accept-Language on every call; bilingual API errors/notifications; Arabic-only UI strings moved to locale files. | `f27d7c1`, `10a0094`, `73478c5`, `f5411df` |
| I-29 | 🟡 | ✅ fixed | No invented skills/category/difficulty/hours/free-status/supervisor/dates/IPs/fake projects/notifications; real CSV export. | `92e3719` |
| I-30 | 🟡 | ✅ fixed | Favorites table + settings column with API; one-time migration of local favorites. | `2baa5ce`, `c143f28` |
| I-31 | 🟡 | ✅ fixed | Server skills list always wins, even when empty. | `1e984b6` |
| I-32 | 🟡 | ✅ fixed | Only students apply, only to approved projects, never their own. | `3cb04c9` |
| I-33 | 🟡 | ✅ fixed | Notification links are real SPA routes; notifications are clickable. | `f27d7c1`, `45262b4` |
| I-34 | 🟡 | ✅ fixed | Companies can open Collaboration Requests. | `336af47` |
| I-35 | 🟡 | ✅ fixed | Admin has the full management menu + Users & Accounts. | `be843bd` |
| I-36 | 🟡 | ✅ fixed | Role-gated pages wait for `/me` to confirm the role (retries on network errors). | `7659268` |
| I-37 | 🟡 | ✅ fixed | Applicant profile fields from `student.profile`; teammates see team reports. | `b2c75cc` |
| I-38 | 🟡 | ✅ fixed | Non-blank titles, `max_members` 1-10, http(s)-only URLs. | `32a308f` |
| I-39 | 🟡 | ✅ fixed | Skills split on `,` and `<` (legacy data) without the `<spl` hack. | `7fec580` |
| I-40 | 🟡 | ✅ fixed | New password kept exactly as typed. | `e9627ee` |
| I-41 | 🟡 | ✅ fixed | API refuses to start without `SECRET_KEY` unless `DEV_INSECURE_KEY=1`. | `b9146cf` |
| I-42 | 🟡 | ✅ fixed | `limit/offset` + `X-Total-Count` on projects and notifications; batched seat counts; incremental rendering / load more in the UI. | `af95664` |
| I-43 | 🟡 | ✅ fixed | Supervisors land on `/supervisor`. | `dc4848f` |
| I-44 | 🟡 | ✅ fixed | Chat button only for chat participants. | `3ac4ad4` |
| I-45 | 🟡 | ✅ fixed | Projects cache cleared on logout. | `1949cbf` |
| I-46 | 🟡 | ✅ fixed | Production API fallback only for the production domain; build warns without `VITE_API_URL`. | `a58d469`, `305465c` |
| I-47 | 🟡 | ✅ fixed | Admin users API + page (list/search, create supervisor/admin, enable/disable, reset password, delete); `users.is_active`. | `500edf0` |
| I-48 | 🟡 | ✅ fixed | `notifications.project_id`; deleting a project deletes its notifications. | `f27d7c1` |
| I-49 | ⚪ | ✅ fixed | nosniff, X-Frame-Options, Referrer-Policy, HSTS, CSP (except Swagger pages). | `211d444` |
| I-50 | ⚪ | ✅ fixed | `backend/uploads/` and QA artifacts in `.gitignore`. | `f4f9927` |
| I-51 | ⚪ | ✅ fixed | Missing `/api` aliases added. | `340be6f` |
| I-52 | ⚪ | ✅ fixed | Shadowed duplicate route and all demo-login code removed. | `c28ffb9` |
| I-53 | ⚪ | ⏭️ skipped | Skipped as requested (httpOnly cookie for the JWT). | — |
| I-54 | ⚪ | ✅ fixed | `verify_password` logs instead of printing. | `072ee7c` |
| I-55 | ⚪ | ✅ fixed | `/users/me/profile` documented; aliases kept but hidden from OpenAPI. | `8ed0cf1` |
| I-56 | ⚪ | ⏭️ skipped | Skipped as requested (Alembic). Startup migrations stay additive: only `ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS` and new tables. | — |
| I-57 | ⚪ | ✅ fixed | render.yaml / `.python-version` = 3.14.0, code boots on 3.11 too. | `784f047` |
| I-58 | ⚪ | ✅ fixed | Supervisors manage unassigned or own projects only (admin: all); UI hides actions elsewhere. | `51a524c` |
| I-59 | ⚪ | ✅ fixed | Notification polling paused while the tab is hidden. | `86045a6` |
| I-60 | ⚪ | ✅ fixed | Stray `tatusgit status` file deleted. | `642b760` |
| NEW-1 | 🟡 | ✅ fixed | Sidebar hook order fixed (useEffect after an early return). | `e8f3c6a` |

### 9.3 Environment variables to set

**Render (backend service):**

| Variable | Value | Status |
|---|---|---|
| `SECRET_KEY` | random, at least 32 characters | already generated by render.yaml (`generateValue`). **Now required in every environment**: the API refuses to start without it (I-41). Never set `DEV_INSECURE_KEY` in a deployment. |
| `ENVIRONMENT` | `production` | already in render.yaml |
| `DATABASE_URL` | from the Render database | unchanged (the code now forces the psycopg2 driver) |
| `ALLOWED_ORIGINS` | `https://capstone-market.vercel.app` (comma-separate any other frontend domains, e.g. a custom domain) | already set. **Vercel preview URLs are no longer allowed automatically** (I-15). |
| `SUPABASE_URL` | `https://<project>.supabase.co` | **new**: CV/report file storage (I-14). Without it files go to the Render disk, which is wiped on every deploy. |
| `SUPABASE_SERVICE_KEY` | the project's `service_role` key | **new**, secret |
| `SUPABASE_STORAGE_BUCKET` | `capstone-files` | **new** (default). Create it as a **private** bucket. |
| `PYTHON_VERSION` | `3.14.0` | set in render.yaml and `backend/.python-version`. If the dashboard has its own `PYTHON_VERSION`, it overrides both; check it. |
| `LOGIN_IP_RATE_LIMIT`, `LOGIN_IP_RATE_WINDOW`, `LOGIN_ACCOUNT_FAILURE_LIMIT`, `LOGIN_ACCOUNT_FAILURE_WINDOW`, `REGISTER_RATE_LIMIT`, `REGISTER_RATE_WINDOW` | optional (defaults 30/300 s, 5/900 s, 10/3600 s) | new, optional |

**Vercel (frontend):**

| Variable | Value | Status |
|---|---|---|
| `VITE_API_URL` | `https://capstone-market.onrender.com` | **set it for Production and Preview.** Without it only `capstone-market.vercel.app` falls back to the production API; any other host makes no API calls (I-46). |

### 9.4 Manual steps in production

1. **Push**: give `jo04saleh` write access (or push from the owner account): `git push origin main`.
2. **Create the first admin.** There is no admin in production and the API never creates one. With `DATABASE_URL` pointing at production, run `python -c "import utils;print(utils.hash_password('<strong password>'))"` from `backend/` with `DEV_INSECURE_KEY=1` (it only hashes). Then `INSERT INTO users (full_name,email,password_hash,role) VALUES ('<name>','<email>','<hash>','admin');`. After that, create supervisors from **Admin → Users & Accounts**.
3. **Disable or delete the four public demo accounts** (`osama.merhi@capstone.ps`, `omarie@qou.edu`, `student@capstone.ps`, `company@capstone.ps`; see `qa/find_demo_data.sql` §1) from the Users page. The code no longer recreates them, but it does not delete existing rows.
4. **Create the Supabase project and private bucket `capstone-files`**, and set the three `SUPABASE_*` variables before deploying.
5. **CVs uploaded before this release are gone** (they lived on Render's disk). Old `/uploads/...` links are hidden from the API; students need to re-upload. Ask them to.
6. Optionally run `qa/find_demo_data.sql` (read-only) and decide what test data to remove.
7. Check the Render build log line "Using Python version …".
8. No manual migration is needed. On startup the API adds columns `users.token_version/website/industry/is_active/settings`, `student_profiles.cv_key`, `reports.file_key` and `notifications.title_en/message_en/project_id` (+ index), and creates the `favorites` table, all with `IF NOT EXISTS` and defaults. Existing tokens keep working (`token_version` defaults to 0).

### 9.5 Behaviour changes users will notice

- **Logging out signs the account out on every device**, and so does changing the password (the current tab gets a new token).
- **A company's Accept is a nomination**; a supervisor must still give academic approval.
  - On company projects, the supervisor can approve only after the nomination.
  - On supervisor or student projects, the supervisor approves directly.
- **Supervisors act only on unassigned projects or their own.** The first supervisor to approve a project (or its first applicant) becomes its assigned supervisor. Admin can act on everything.
- **Students now see their own pending and rejected proposals.**
- **An invalid or expired token on the public project list is treated as an anonymous visitor.**
- **Repeating an application's current status is a no-op (200).**
- **Legacy `accepted` applications are treated as academically approved.**
- **Preview deployments need `VITE_API_URL` and an `ALLOWED_ORIGINS` entry.**

### 9.6 QA test changes (why)

Every change is explained in its commit. In short:
- **Wrong assumptions in my own tests:** `#` comments counted as unpinned requirements; settings, CV-cleanup and report-visibility tests assumed a pristine database.
- **Expectations that changed by design:**
  - the anonymous "deny" for hidden projects is now 404;
  - supervisor approval of an un-nominated company application is now 4xx;
  - CV upload is students-only and uses private storage;
  - the login rate-limit test uses a throwaway account;
  - token-minting tests sign with the QA key;
  - `/reports` is a shared route, and `/collaboration-requests` is open to companies;
  - the login back link targets `/about`, and visitors go through sign-in;
  - supervisors land on `/supervisor`;
  - the tamper test checks that no supervisor content renders;
  - favorites are checked on the server.
- **New tests:**
  - admin users;
  - favorites and settings;
  - report files;
  - rate limits (in-process);
  - Supabase storage (mocked);
  - English errors and notifications, and deleting a project removes its notifications;
  - academic-approval paths and supervisor scope;
  - E2E admin page.

### 9.7 Known limitations

- The rate limiter is in-memory, so it is per API instance.
- Supabase was tested against a mocked API, not a real project.
- Pagination: the dashboards still load the full (paged) project list for their statistics.
- One React Compiler advisory remains in `MyProjectsPage.jsx` ("existing memoization could not be preserved"). It is not a runtime error.
