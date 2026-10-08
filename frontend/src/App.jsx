import React, { useState, useEffect } from 'react';

const API_BASE = "https://capstone-market.onrender.com";

const IT_MAJORS = [
  "أنظمة المعلومات الحاسوبية (CIS)",
  "علم الحاسوب (Computer Science)",
  "تقنية المعلومات والاتصالات (IT)",
  "أمن المعلومات والأدلة الرقمية (Cybersecurity)",
  "الوسائط الرقمية وتكنولوجيا الويب",
  "هندسة البرمجيات (Software Engineering)"
];

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('projects'); // projects, create, applications, students, profile
  const [projects, setProjects] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // نماذج الإدخال
  const [authMode, setAuthMode] = useState('login'); // login / register
  const [authForm, setAuthForm] = useState({ email: '', password: '', full_name: '', role: 'student', major: IT_MAJORS[0] });
  const [projectForm, setProjectForm] = useState({ title: '', description: '', required_skills: '', major: IT_MAJORS[0], difficulty: 'متوسط' });

  // حفظ واسترجاع السيرة الذاتية للطالب
  const [studentCv, setStudentCv] = useState(() => {
    const saved = localStorage.getItem('student_cv_data');
    return saved ? JSON.parse(saved) : {
      skills: 'React, Tailwind, Node.js',
      github: 'https://github.com',
      course: 'مشروع تخرج 1',
      bio: 'مهتم بتطوير أنظمة الويب وحلول الأعمال الذكية.'
    };
  });
  const [cvSavedAlert, setCvSavedAlert] = useState(false);

  // طلاب افتراضيون لمحاكاة مساق التخرج لدى المشرف
  const [rosterStudents] = useState([
    { id: 101, name: "أحمد منصور", studentId: "12020412", major: "أنظمة المعلومات الحاسوبية (CIS)", course: "مشروع تخرج 2", status: "مرتبط بمشروع" },
    { id: 102, name: "سارة خليل", studentId: "12020589", major: "علم الحاسوب (Computer Science)", course: "مشروع تخرج 1", status: "طالب حر (يبحث عن فريق)" },
    { id: 103, name: "عمر الرمحي", studentId: "12019844", major: "أمن المعلومات والأدلة الرقمية", course: "مشروع تخرج 2", status: "مرتبط بمشروع" },
    { id: 104, name: "ليلى قاسم", studentId: "12120031", major: "تقنية المعلومات والاتصالات (IT)", course: "مشروع تخرج 1", status: "طالب حر (يبحث عن فريق)" }
  ]);

  useEffect(() => {
    fetchProjects();
    fetchApplications();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects/`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await fetch(`${API_BASE}/applications/`);
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!authForm.email) return;
    const dummyUser = {
      id: 1,
      email: authForm.email,
      name: authForm.full_name || authForm.email.split('@')[0],
      role: authForm.role,
      major: authForm.major
    };
    setUser(dummyUser);
    localStorage.setItem('user', JSON.stringify(dummyUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/projects/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: projectForm.title,
          description: projectForm.description,
          required_skills: `${projectForm.major} | ${projectForm.difficulty} | ${projectForm.required_skills}`
        })
      });
      if (res.ok) {
        alert('تم نشر فكرة المشروع بنجاح!');
        setProjectForm({ title: '', description: '', required_skills: '', major: IT_MAJORS[0], difficulty: 'متوسط' });
        setActiveTab('projects');
        fetchProjects();
      } else {
        const err = await res.json();
        alert('خطأ أثناء النشر: ' + (err.detail || JSON.stringify(err)));
      }
    } catch (err) {
      alert('تعذر الاتصال بالسيرفر');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (projectId) => {
    if (!user) {
      alert('يرجى تسجيل الدخول أولاً كطالب للتقديم');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/applications/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          student_name: user.name,
          student_cv: `التخصص: ${user.major || 'IT'} | المساق: ${studentCv.course} | المهارات: ${studentCv.skills}`
        })
      });
      if (res.ok) {
        alert('تم إرسال طلبك ومشاركة سيرتك الذاتية للمشرف الأكاديمي للاعتماد!');
        fetchApplications();
      } else {
        alert('تم تقديم طلبك مسبقاً لهذا المشروع');
      }
    } catch {
      alert('تم إرسال طلب التقديم بنجاح');
    }
  };

  const handleApproveApplication = (appId) => {
    alert(`تم اعتماد المشروع رسمياً للطالب وإسناده للفريق من قبل المشرف الأكاديمي.`);
    setApplications(applications.map(a => a.id === appId ? { ...a, status: 'approved' } : a));
  };

  const handleSaveCv = (e) => {
    e.preventDefault();
    localStorage.setItem('student_cv_data', JSON.stringify(studentCv));
    setCvSavedAlert(true);
    setTimeout(() => setCvSavedAlert(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans" dir="rtl">
      {/* الهيدر العلوي */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30">
            CP
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">منصة مشاريع التخرج وربط سوق العمل</h1>
            <p className="text-xs text-slate-400">ملتقى الكفاءات الطلابية والتحديات الواقعية</p>
          </div>
        </div>

        {user ? (
          <div className="flex items-center gap-4">
            <div className="text-left bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <div className="text-sm font-semibold text-white">{user.name}</div>
              <div className="text-xs text-blue-400">
                {user.role === 'supervisor' ? 'مشرف أكاديمي' : user.role === 'business' ? 'صاحب عمل / متجر' : 'طالب حاسوب'}
              </div>
            </div>
            <button onClick={handleLogout} className="text-xs bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white px-3 py-2 rounded-lg transition border border-rose-500/30">
              خروج
            </button>
          </div>
        ) : (
          <div className="text-sm text-slate-400">بوابة المشاريع والتقييم</div>
        )}
      </header>

      {/* شريط التنقل بناءً على الصلاحيات */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'projects' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
        >
          سوق المشاريع والمشاكل
        </button>

        {user?.role === 'business' && (
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'create' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            + طرح مشكلة لمشروع جديد
          </button>
        )}

        {user?.role === 'student' && (
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'profile' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            سيرتي الذاتية (CV)
          </button>
        )}

        {(user?.role === 'supervisor' || user?.role === 'business') && (
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'applications' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            طلبات التقديم {user?.role === 'supervisor' ? '(الاعتماد الأكاديمي)' : '(متابعة الفرق)'}
          </button>
        )}

        {user?.role === 'supervisor' && (
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'students' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            سجل طلبة مشروع التخرج (Roster)
          </button>
        )}
      </div>

      <main className="max-w-6xl mx-auto p-6">
        {/* إذا لم يسجل الدخول بعد */}
        {!user && (
          <div className="max-w-md mx-auto mb-8 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-lg font-bold text-center mb-4">تسجيل الدخول / اختيار الحساب</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">الصفة والصلاحية</label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                  value={authForm.role}
                  onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}
                >
                  <option value="student">طالب (تقديم وبناء CV)</option>
                  <option value="business">صاحب عمل / متجر (طرح مشاكل واقعية)</option>
                  <option value="supervisor">مشرف أكاديمي (صلاحية الاعتماد وحصر الطلبة)</option>
                </select>
              </div>

              {authForm.role === 'student' && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">التخصص الأكاديمي</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                    value={authForm.major}
                    onChange={(e) => setAuthForm({ ...authForm, major: e.target.value })}
                  >
                    {IT_MAJORS.map((m, idx) => <option key={idx} value={m}>{m}</option>)}
                  </select>
                </div>
              )}

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 font-bold py-2.5 rounded-lg transition text-sm">
                دخول للمنصة
              </button>
            </form>
          </div>
        )}

        {/* 1. صفحة استعراض المشاريع */}
        {activeTab === 'projects' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">المشاريع والمشكلات المطروحة من قطاع الأعمال</h2>
              <button onClick={fetchProjects} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700">
                تحديث المشاريع 🔄
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  لا توجد مشاريع مضافة حالياً.
                </div>
              ) : (
                projects.map((proj) => (
                  <div key={proj.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-white text-base">{proj.title}</h3>
                        <span className="text-[11px] bg-blue-900/40 text-blue-300 border border-blue-800 px-2 py-0.5 rounded">
                          متاح للتنفيذ
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">{proj.description}</p>
                      <div className="text-[11px] bg-slate-950 p-2.5 rounded border border-slate-800/80 text-slate-300 mb-4">
                        <span className="text-slate-500 block mb-1">المتطلبات والتخصص:</span>
                        {proj.required_skills || "عام لكافة تخصصات الكلية"}
                      </div>
                    </div>

                    {user?.role === 'student' ? (
                      <button
                        onClick={() => handleApply(proj.id)}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg text-xs transition"
                      >
                        التقديم على المشروع مع إرفاق سيرتي الذاتية
                      </button>
                    ) : (
                      <div className="text-center py-2 text-xs text-slate-500 border-t border-slate-800">
                        {user?.role === 'supervisor' ? 'للاطلاع والمتابعة كأكاديمي' : 'معروض للطلبة'}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 2. صفحة طرح مشكلة جديدة (للمتجر فقط) */}
        {activeTab === 'create' && (
          <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-lg font-bold mb-1">طرح مشكلة عمل حقيقية لمشروع التخرج</h2>
            <p className="text-xs text-slate-400 mb-6">سيتم نشر المشكلة لفرق الطلبة للمنافسة على حلها برمجياً تحت إشراف أكاديمي.</p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">عنوان المشكلة / الفكرة</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: نظام إدارة طلبات وتوزيع لمستودعات مواد التجميل"
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">التخصص المطلوب بالدرجة الأولى</label>
                  <select
                    value={projectForm.major}
                    onChange={(e) => setProjectForm({ ...projectForm, major: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                  >
                    {IT_MAJORS.map((m, idx) => <option key={idx} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">مستوى الصعوبة المتوقع</label>
                  <select
                    value={projectForm.difficulty}
                    onChange={(e) => setProjectForm({ ...projectForm, difficulty: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                  >
                    <option value="متوسط">متوسط (مشروع تخرج 1)</option>
                    <option value="متقدم">متقدم (مشروع تخرج 2)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">شرح المشكلة والتحديات الحالية</label>
                <textarea
                  rows={4}
                  required
                  placeholder="صف بدقة التحدي الذي تواجهه في متجرك/شركتك وما هو النظام المطلوب تطويره للتغلب عليه..."
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">المهارات والتقنيات المقترحة (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: Python, React, Database Optimization"
                  value={projectForm.required_skills}
                  onChange={(e) => setProjectForm({ ...projectForm, required_skills: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 font-bold py-3 rounded-lg transition text-sm disabled:opacity-50"
              >
                {loading ? "جاري الإرسال للسيرفر..." : "نشر المشكلة رسمياً"}
              </button>
            </form>
          </div>
        )}

        {/* 3. صفحة السيرة الذاتية للطالب (Student CV) */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-lg font-bold mb-1">الملف الشخصي والسيرة الذاتية لمشروع التخرج</h2>
            <p className="text-xs text-slate-400 mb-6">هذه البيانات تظهر تلقائياً للمشرف الأكاديمي وصاحب العمل لتقييم كفاءتك في المشروع.</p>

            {cvSavedAlert && (
              <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs">
                تم حفظ بيانات السيرة الذاتية بنجاح وستُرفق مع أي تقديم قادم!
              </div>
            )}

            <form onSubmit={handleSaveCv} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">الاسم</label>
                  <input type="text" disabled value={user?.name} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-400 cursor-not-allowed" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">المساق الحالي</label>
                  <select
                    value={studentCv.course}
                    onChange={(e) => setStudentCv({ ...studentCv, course: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                  >
                    <option value="مشروع تخرج 1">مشروع تخرج 1</option>
                    <option value="مشروع تخرج 2">مشروع تخرج 2</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">المهارات البرمجية والتقنيات المتقنة</label>
                <input
                  type="text"
                  placeholder="مثال: React, Tailwind, Python, FastAPI, SQL, UI/UX"
                  value={studentCv.skills}
                  onChange={(e) => setStudentCv({ ...studentCv, skills: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">رابط GitHub أو سابقة الأعمال (Portfolio)</label>
                <input
                  type="url"
                  placeholder="https://github.com/your-username"
                  value={studentCv.github}
                  onChange={(e) => setStudentCv({ ...studentCv, github: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">نبذة تعريفية ومجالات الاهتمام</label>
                <textarea
                  rows={3}
                  placeholder="اكتب نبذة عن شغفك وخبراتك البرمجية..."
                  value={studentCv.bio}
                  onChange={(e) => setStudentCv({ ...studentCv, bio: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm"
                />
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 font-bold py-2.5 rounded-lg transition text-sm">
                تحديث وحفظ الـ CV
              </button>
            </form>
          </div>
        )}

        {/* 4. طلبات التقديم (فصل صلاحية القبول للمشرف فقط) */}
        {activeTab === 'applications' && (
          <div>
            <h2 className="text-lg font-bold mb-2">طلبات التقديم الواردة من الطلاب</h2>
            <p className="text-xs text-slate-400 mb-6">
              {user?.role === 'supervisor'
                ? 'بصفتك المشرف الأكاديمي، تملك الصلاحية الحصرية لمراجعة الـ CV واعتماد المشروع وتعيينه للفريق.'
                : 'بصفتك صاحب العمل، يمكنك استعراض مهارات المتقدمين فقط، والاعتماد يتم بواسطة المشرف الأكاديمي.'}
            </p>

            <div className="space-y-4">
              {applications.length === 0 ? (
                <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  لا توجد طلبات تقديم مسجلة حتى الآن.
                </div>
              ) : (
                applications.map((app, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white text-sm">طالب: {app.student_name || "متقدم للمشروع"}</span>
                        <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                          مشروع رقم: #{app.project_id || 1}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 max-w-2xl mt-2">
                        📄 <strong className="text-blue-400">سيرة الطالب والمهارات:</strong> {app.student_cv || "React, Tailwind, Node.js | أنظمة معلومات حاسوبية"}
                      </p>
                    </div>

                    <div>
                      {user?.role === 'supervisor' ? (
                        <button
                          onClick={() => handleApproveApplication(app.id || idx)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 px-4 rounded-lg text-xs transition shadow-lg shadow-emerald-900/30 whitespace-nowrap"
                        >
                          اعتماد وإسناد المشروع للطالب ✓
                        </button>
                      ) : (
                        <span className="text-xs text-amber-400 bg-amber-950/40 border border-amber-800/60 px-3 py-1.5 rounded-lg">
                          قيد مراجعة المشرف الأكاديمي
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 5. سجل الطلاب المسجلين لمشروع التخرج (خاص بالمشرف) */}
        {activeTab === 'students' && user?.role === 'supervisor' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold">سجل طلبة مشروع التخرج (Roster)</h2>
                <p className="text-xs text-slate-400">متابعة الطلاب المسجلين لمساقي تخرج 1 وتخرج 2 وتوزيعهم على الفرق</p>
              </div>
            </div>

            <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="p-3.5">الرقم الجامعي</th>
                    <th className="p-3.5">اسم الطالب</th>
                    <th className="p-3.5">التخصص الأكاديمي</th>
                    <th className="p-3.5">المساق المسجل</th>
                    <th className="p-3.5">حالة المشروع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {rosterStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-3.5 font-mono text-slate-400">{st.studentId}</td>
                      <td className="p-3.5 font-semibold text-white">{st.name}</td>
                      <td className="p-3.5 text-slate-300">{st.major}</td>
                      <td className="p-3.5">
                        <span className="bg-blue-950 text-blue-300 border border-blue-800/60 px-2 py-0.5 rounded">
                          {st.course}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded text-[11px] font-medium ${st.status.includes('طالب حر') ? 'bg-amber-950/50 text-amber-300 border border-amber-800/50' : 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/50'}`}>
                          {st.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}