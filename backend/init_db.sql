-- ==============================================================================
-- سكريبت التهيئة الأولية لقاعدة بيانات منصة مشاريع التخرج (Capstone Market)
-- يتضمن إنشاء الجداول الأساسية فقط (بدون أي حسابات تجريبية)
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

-- ملاحظة أمنية: لا يتم إدراج أي حسابات تجريبية هنا. حسابات المشرف/الأدمن تُنشأ يدوياً بكلمات مرور خاصة.
