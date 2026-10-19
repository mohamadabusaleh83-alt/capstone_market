-- ==============================================================================
-- سكريبت التهيئة الأولية لقاعدة بيانات منصة مشاريع التخرج (Capstone Market)
-- يتضمن إدراج المشرف الأكاديمي الرسمي للمنصة وحسابات التجربة الأولية
-- ==============================================================================

-- 1. التأكد من وجود جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    skills TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. إدراج أو تحديث حساب المشرف الأكاديمي الرسمي للمشروع: د. أسامة أمين مرعي
-- البريد الإلكتروني الأساسي: osama.merhi@capstone.ps (كلمة المرور: password123)
-- البريد الإلكتروني الإضافي: omarie@qou.edu (كلمة المرور: Doctor@2025)
INSERT INTO users (full_name, email, password_hash, role, skills, created_at)
VALUES (
    'د. أسامة أمين مرعي',
    'osama.merhi@capstone.ps',
    '$2b$12$3DumjB2aG6J7wkh7XnN6/evLI6fGq72Slvj0zs8qnluc2vQbuIsWy',
    'supervisor',
    'نظم معلومات حاسوبية - كلية التكنولوجيا والعلوم التطبيقية',
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO UPDATE 
SET full_name = EXCLUDED.full_name,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    skills = EXCLUDED.skills;

INSERT INTO users (full_name, email, password_hash, role, skills, created_at)
VALUES (
    'د. أسامة أمين مرعي',
    'omarie@qou.edu',
    '$2b$12$RjvL/CyY3O4cl.PZdqJpSOVOCJrG9ej7KzggNX2hOVC749mmW3k7G',
    'supervisor',
    'نظم معلومات حاسوبية - كلية التكنولوجيا والعلوم التطبيقية',
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO UPDATE 
SET full_name = EXCLUDED.full_name,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    skills = EXCLUDED.skills;

-- 3. حساب الطالب التجريبي (أحمد منصور - pass1234)
INSERT INTO users (full_name, email, password_hash, role, skills, created_at)
VALUES (
    'أحمد منصور',
    'student@capstone.ps',
    '$2b$12$B1K2J2p3R6f9Y2x6Q1eL9e8x4J9p3R6f9Y2x6Q1eL9e8x4J9p3R6f',
    'student',
    'React, Python, FastAPI, Tailwind CSS',
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

-- 4. حساب الشريك الصناعي / الشركة التجريبية (شركة النور للحلول البرمجية - pass1234)
INSERT INTO users (full_name, email, password_hash, role, skills, created_at)
VALUES (
    'شركة النور للحلول البرمجية',
    'company@capstone.ps',
    '$2b$12$B1K2J2p3R6f9Y2x6Q1eL9e8x4J9p3R6f9Y2x6Q1eL9e8x4J9p3R6f',
    'partner',
    'Software Development, Cloud, AI Solutions',
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;
