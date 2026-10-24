# منصة مشاريع التخرج - Capstone Market

مشروع تخرج يربط بين طلاب هندسة الحاسوب والبرمجيات والمشاريع البرمجية.

## هيكلية المشروع
- `backend/`: مبني باستخدام FastAPI و PostgreSQL و SQLAlchemy.
- `frontend/`: مبني باستخدام React 19 و Vite و TailwindCSS و Lucide Icons.

---

## تعليمات النشر (Deployment Guide)

### 1. نشر الباك إند على Render (Web Service)
1. قم بإنشاء خدمة جديدة من نوع **Web Service** واربط مستودع GitHub هذا.
2. الإعدادات المطلوبة:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. متغيرات البيئة (**Environment Variables**):
   - `DATABASE_URL`: رابط الاتصال بقاعدة بيانات PostgreSQL السحابية (من Render PostgreSQL أو Neon/Supabase).
   - `SECRET_KEY`: سلسلة نصية سرية قوية لحماية وتوقيع رموز JWT (مثل 64 رمزاً عشوائياً).
   - `ENVIRONMENT`: `production`
   - `ALLOWED_ORIGINS`: رابط موقع الفرونت إند على Vercel (مثال: `https://capstone-market.vercel.app`).

---

### 2. نشر الفرونت إند على Vercel
1. قم بإنشاء مشروع جديد في Vercel واربط المستودع.
2. الإعدادات المطلوبة:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. متغيرات البيئة (**Environment Variables**):
   - `VITE_API_URL`: رابط الباك إند الفعلي على Render (مثال: `https://capstone-market.onrender.com`).
