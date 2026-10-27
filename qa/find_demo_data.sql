-- =============================================================================
-- find_demo_data.sql  -  READ-ONLY review queries (PostgreSQL)
--
-- Lists rows in the real database that LOOK like test / demo data so a human
-- can decide what to remove. Every statement is a SELECT (or a WITH ... SELECT).
-- Nothing here modifies data. Suggested use:
--     psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f qa/find_demo_data.sql
-- For extra safety run inside:  BEGIN READ ONLY;  \i qa/find_demo_data.sql  ROLLBACK;
--
-- Sources of demo data found in the code:
--   * backend/seed.py  - runs on EVERY API startup (backend/main.py:54-58) and
--     creates 4 accounts + 2 projects + 1 accepted application + 3 reports
--     (the projects only when the projects table is empty).
--   * backend/init_db.sql - inserts the same accounts (with fake bcrypt hashes).
--   * backend/test_integration.py / test_roles_e2e.py - create users such as
--     student_<unix-ts>@capstone.ps, company_<ts>@capstone.ps, hacker_admin_<ts>@...
--     If these tests were ever run with DATABASE_URL pointing at production,
--     their rows are there.
--   * frontend/src/pages/ProfilePage.jsx - pre-fills fake phone/bio/university;
--     clicking "Save" writes them to the DB (query 5).
-- =============================================================================

\echo '== 1. Hard-coded seed / demo accounts (backend/seed.py, init_db.sql)'
SELECT id, email, full_name, role, created_at
FROM users
WHERE lower(email) IN ('osama.merhi@capstone.ps', 'omarie@qou.edu',
                       'student@capstone.ps', 'company@capstone.ps')
ORDER BY id;

\echo '== 2. Test-looking e-mail addresses'
SELECT id, email, full_name, role, created_at
FROM users
WHERE lower(email) ~ '(^|[._-])(test|tester|testing|demo|fake|dummy|sample|qa|hacker|asdf|qwe|abc|xxx|aaa|user[0-9]*|admin[0-9]*)([._0-9-]|@)'
   OR lower(email) ~ '@(example\.(com|org|net)|test\.[a-z]+|.*\.test|.*\.local|.*\.invalid|localhost|mailinator\.com|yopmail\.com|tempmail\.[a-z]+)$'
   OR lower(email) ~ '^(student|company|student_role|company_role|supervisor_role|hacker_admin|hacker_sup)_[0-9]{9,}@'   -- backend/test_*.py pattern
   OR lower(email) ~ '^[a-z]{1,3}@[a-z]{1,3}\.[a-z]{2,3}$'                                                              -- a@b.cc
ORDER BY created_at;

\echo '== 3. Users with suspicious names (very short, no letters, keyboard mash, test words)'
SELECT id, email, full_name, role, created_at
FROM users
WHERE length(btrim(full_name)) < 3
   OR full_name !~ '[[:alpha:]]'
   OR full_name ~* '(test|demo|fake|dummy|asdf|qwer|zxcv|lorem|ipsum|تجربة|تجريبي|اختبار|طالب اختبار|محاولة)'
   OR full_name ~ '[\[\]{};<>\\|`~]'
ORDER BY id;

\echo '== 4. Users with an unexpected role value'
SELECT id, email, full_name, role
FROM users
WHERE role NOT IN ('student', 'partner', 'company', 'business', 'supervisor', 'admin');

\echo '== 5. Profiles still holding the fake defaults pre-filled by ProfilePage.jsx'
SELECT u.id, u.email, u.role, u.phone, p.university, left(p.bio, 60) AS bio
FROM users u
LEFT JOIN student_profiles p ON p.user_id = u.id
WHERE u.phone = '+970 599 000 000'
   OR p.bio LIKE 'شركة رائدة في تقديم الحلول البرمجية%'
   OR p.bio LIKE 'طالب خريج مهتم بتطوير الأنظمة السحابية%'
   OR p.bio LIKE 'أستاذ مشارك ومشرف أكاديمي لمشاريع التخرج%'
   OR p.bio LIKE 'طالب في السنة النهائية، مهتم بتطوير الأنظمة السحابية%';

\echo '== 6. Seeded demo projects (exact titles from backend/seed.py)'
SELECT id, title, status, company_name, created_by, created_at
FROM projects
WHERE title IN ('نظام إدارة المستودعات ونقاط البيع السحابي (POS)',
                'بوابة تدقيق الثغرات واكتشاف الاختراقات للمتاجر الإلكترونية');

\echo '== 7. Projects with short / random / test-like titles (e.g. "lj[")'
SELECT id, title, length(btrim(title)) AS len, status, company_name, created_by, created_at
FROM projects
WHERE length(btrim(title)) < 6
   OR title !~ '[[:alpha:]]'
   OR title ~ '[\[\]{};<>\\|`~]'
   OR title ~* '^(test|demo|fake|dummy|sample|asdf|qwer|lorem|abc|xyz|aaa+|new project|project ?[0-9]*)$'
   OR title ~* '(test|demo|dummy|lorem ipsum|تجربة|تجريبي|اختبار)'
   OR title ~ '^(.)\1{2,}$'                               -- "aaaa", "...."
   OR (title ~ '^[A-Za-z]+$' AND title !~* '[aeiou]' AND length(title) >= 3)   -- "lkjhg"
ORDER BY created_at;

\echo '== 8. Projects with empty / placeholder descriptions'
SELECT id, title, coalesce(length(btrim(description)), 0) AS desc_len, status, created_by
FROM projects
WHERE description IS NULL OR length(btrim(description)) < 15
ORDER BY id;

\echo '== 9. Projects without a real company behind them'
SELECT p.id, p.title, p.status, p.company_name, p.created_by,
       u.email AS creator_email, u.role AS creator_role,
       CASE
         WHEN p.created_by IS NULL THEN 'no creator (deleted user / SET NULL)'
         WHEN u.id IS NULL THEN 'creator id does not exist'
         WHEN u.role NOT IN ('partner', 'company', 'business') AND p.company_name IS NOT NULL
              THEN 'company_name set but creator is ' || u.role
         WHEN u.role IN ('partner', 'company', 'business') AND p.company_name <> u.full_name
              THEN 'company_name differs from creator company'
         ELSE 'no company_name'
       END AS reason
FROM projects p
LEFT JOIN users u ON u.id = p.created_by
WHERE p.created_by IS NULL
   OR u.id IS NULL
   OR p.company_name IS NULL
   OR (u.role NOT IN ('partner', 'company', 'business') AND p.company_name IS NOT NULL)
   OR (u.role IN ('partner', 'company', 'business') AND p.company_name <> u.full_name)
ORDER BY p.id;

\echo '== 10. Projects created by the accounts found in queries 1-3'
WITH suspect AS (
  SELECT id FROM users
  WHERE lower(email) IN ('osama.merhi@capstone.ps', 'omarie@qou.edu', 'student@capstone.ps', 'company@capstone.ps')
     OR lower(email) ~ '@(example\.(com|org|net)|.*\.test|.*\.local|mailinator\.com)$'
     OR lower(email) ~ '^(student|company|student_role|company_role|supervisor_role|hacker_admin|hacker_sup)_[0-9]{9,}@'
)
SELECT p.id, p.title, p.status, u.email AS creator
FROM projects p JOIN users u ON u.id = p.created_by
WHERE p.created_by IN (SELECT id FROM suspect)
ORDER BY p.id;

\echo '== 11. Duplicate project titles (same title posted several times)'
SELECT lower(btrim(title)) AS title, count(*) AS copies, array_agg(id ORDER BY id) AS ids
FROM projects
GROUP BY lower(btrim(title))
HAVING count(*) > 1
ORDER BY copies DESC;

\echo '== 12. Malformed skill strings (e.g. "python<spl")'
SELECT 'project' AS kind, id, required_skills AS skills FROM projects WHERE required_skills ~ '[<>"'']'
UNION ALL
SELECT 'user', id, skills FROM users WHERE skills ~ '[<>"'']'
UNION ALL
SELECT 'profile', user_id, skills FROM student_profiles WHERE skills ~ '[<>"'']'
ORDER BY kind, id;

\echo '== 13. Impossible capacity values'
SELECT id, title, max_members FROM projects WHERE max_members IS NULL OR max_members < 1 OR max_members > 20;

\echo '== 14. Projects with more occupied seats than max_members (possible via supervisor approval)'
SELECT p.id, p.title, p.max_members, count(a.id) AS occupied
FROM projects p
JOIN applications a ON a.project_id = p.id
 AND a.status IN ('accepted', 'academically_approved', 'company_accepted')
GROUP BY p.id, p.title, p.max_members
HAVING count(a.id) > coalesce(p.max_members, 4);

\echo '== 15. Applications that look synthetic'
SELECT a.id, a.project_id, a.student_id, u.email, u.role AS applicant_role, a.status, left(a.message, 60) AS message
FROM applications a
LEFT JOIN users u ON u.id = a.student_id
LEFT JOIN projects p ON p.id = a.project_id
WHERE u.role IS DISTINCT FROM 'student'                    -- admins can apply (require_role lets admin through)
   OR p.id IS NULL
   OR a.message ~* '(test|demo|qa application|تجربة|اختبار)'
   OR a.message = 'طالب شغوف بتطوير الواجهات والنظم السحابية، أود قيادة الفريق البرمجي للمشروع.'   -- seed.py
ORDER BY a.id;

\echo '== 16. Seeded / synthetic reports'
SELECT r.id, r.project_id, r.student_id, u.email, r.title, r.status, r.grade
FROM reports r
LEFT JOIN users u ON u.id = r.student_id
WHERE r.title IN ('وثيقة مقترح المشروع وتحليل المشكلة (Project Proposal)',
                  'وثيقة هندسة المتطلبات والنظام (SRS & Architecture Specification)',
                  'النموذج الأولي واختبار التوافق (Prototype & Deployment)')
   OR r.title ~* '(test|demo|dummy|تجربة|اختبار)'
   OR length(btrim(r.title)) < 4
   OR NOT EXISTS (SELECT 1 FROM applications a
                  WHERE a.project_id = r.project_id AND a.student_id = r.student_id
                    AND a.status IN ('accepted', 'academically_approved'))   -- report by a non-member
ORDER BY r.id;

\echo '== 17. Very short / test chat messages'
SELECT m.id, m.project_id, u.email AS sender, m.text, m.created_at
FROM messages m LEFT JOIN users u ON u.id = m.sender_id
WHERE length(btrim(m.text)) < 3
   OR m.text ~* '^(test|testing|hi|hello|asdf|ping|تجربة|اختبار|مرحبا)[.!? ]*$'
ORDER BY m.id;

\echo '== 18. Orphans left behind by deletes (projects.created_by ON DELETE SET NULL etc.)'
SELECT 'notification->user' AS kind, n.id FROM notifications n LEFT JOIN users u ON u.id = n.user_id WHERE u.id IS NULL
UNION ALL
SELECT 'profile->user', p.id FROM student_profiles p LEFT JOIN users u ON u.id = p.user_id WHERE u.id IS NULL
UNION ALL
SELECT 'project.supervisor->user', p.id FROM projects p LEFT JOIN users u ON u.id = p.supervisor_id
WHERE p.supervisor_id IS NOT NULL AND u.id IS NULL;

\echo '== 19. Supervisor assigned to a non-supervisor account (owner can set supervisor_id via PUT /projects/{id})'
SELECT p.id, p.title, p.supervisor_id, u.email, u.role
FROM projects p JOIN users u ON u.id = p.supervisor_id
WHERE u.role NOT IN ('supervisor', 'admin');

\echo '== 20. Summary'
SELECT
  (SELECT count(*) FROM users)                       AS users,
  (SELECT count(*) FROM users WHERE role = 'admin')  AS admins,
  (SELECT count(*) FROM projects)                    AS projects,
  (SELECT count(*) FROM projects WHERE status = 'rejected') AS rejected_projects,
  (SELECT count(*) FROM applications)                AS applications,
  (SELECT count(*) FROM reports)                     AS reports,
  (SELECT count(*) FROM messages)                    AS messages,
  (SELECT count(*) FROM notifications)               AS notifications;
