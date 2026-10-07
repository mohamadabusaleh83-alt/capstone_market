import React, { useState, useEffect } from 'react';
import { 
  Briefcase, CheckCircle, Clock, Search, PlusCircle, 
  Users, BarChart2, Bell, X, Check, Sparkles,
  Calendar, Award, TrendingUp, Download, Megaphone, ArrowUpRight,
  Star, MessageSquare, Layers, LogIn, LogOut, Store, UserCheck,
  Menu, ShieldCheck, GraduationCap
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function App() {
  // إدارة الجلسة والدور الحالي (طالب / تاجر / مشرف)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('app_user_role');
    return saved ? JSON.parse(saved) : null; // null يعني زائر غير مسجل
  });

  // حالة فتح وإغلاق القائمة الجانبية (خصوصاً للهواتف)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('match');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  // مهارات الطالب
  const [userSkills, setUserSkills] = useState(['Python', 'FastAPI', 'Docker', 'React', 'TailwindCSS']);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [showSkillsModal, setShowSkillsModal] = useState(false);

  // المفضلة
  const [favorites, setFavorites] = useState([]);

  // حالة المشاريع والطلبات
  const [matchedProjects, setMatchedProjects] = useState([]);
  const [applications, setApplications] = useState([]);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);

  // نافذة المحادثة
  const [chatProject, setChatProject] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');

  // نافذة التقديم
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [applicantName, setApplicantName] = useState('');
  const [applicantRole, setApplicantRole] = useState('مطور أنظمة وواجهات');
  const [applicantMessage, setApplicantMessage] = useState('');
  const [applySuccess, setApplySuccess] = useState('');

  // نافذة إضافة مشروع (مخصصة للمحلات والمشرفين)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    required_skills: '',
    category: 'هندسة البرمجيات',
    difficulty: 'متوسط',
    hours_per_week: '12'
  });
  const [createSuccess, setCreateSuccess] = useState('');

  // نافذة تسجيل الدخول والتبديل
  const [showAuthModal, setShowAuthModal] = useState(false);

  // تسجيل الدخول وتحديد الدور
  const handleLogin = (roleType) => {
    let userObj = null;
    if (roleType === 'student') {
      userObj = { role: 'student', name: 'أحمد محمود', title: 'طالب سنة رابعة - هندسة برمجيات' };
      setActiveTab('match');
    } else if (roleType === 'business') {
      userObj = { role: 'business', name: 'شركة النور للمواد الغذائية', title: 'متجر ومستودع تجاري - نابلس' };
      setActiveTab('business_projects');
    } else if (roleType === 'supervisor') {
      userObj = { role: 'supervisor', name: 'د. خالد التميمي', title: 'مشرف أكاديمي - كلية التكنولوجيا' };
      setActiveTab('supervisor_review');
    }

    setCurrentUser(userObj);
    localStorage.setItem('app_user_role', JSON.stringify(userObj));
    setShowAuthModal(false);
    setIsSidebarOpen(false);
  };

  // تسجيل الخروج ومسح الجلسة
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('app_user_role');
    localStorage.removeItem('token');
    setActiveTab('browse');
    setIsSidebarOpen(false);
  };

  // جلب المشاريع وحساب نسب المطابقة
  const calculateMatch = (projectsList, skillsList) => {
    if (!Array.isArray(projectsList)) return [];
    return projectsList.map((p) => {
      const projectSkills = typeof p.required_skills === 'string'
        ? p.required_skills.split(',').map((s) => s.trim().toLowerCase())
        : (p.skills || []).map((s) => s.toLowerCase());

      const matchedCount = projectSkills.filter((s) =>
        skillsList.map((u) => u.toLowerCase()).includes(s)
      ).length;

      const matchPercent = projectSkills.length > 0 
        ? Math.round((matchedCount / projectSkills.length) * 100)
        : 50;

      return {
        ...p,
        matchRate: matchPercent,
        match: `${matchPercent}% تطابق`,
        category: p.category || 'هندسة البرمجيات',
        maxMembers: p.maxMembers || 4,
        currentMembers: p.currentMembers !== undefined ? p.currentMembers : 2,
        difficulty: p.difficulty || 'متوسط',
        hoursPerWeek: p.hours_per_week || 10,
        skills: typeof p.required_skills === 'string'
          ? p.required_skills.split(',').map((s) => s.trim())
          : (p.skills || ['Python', 'FastAPI']),
      };
    });
  };

  const fetchProjects = () => {
    fetch(`${API_URL}/projects/`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMatchedProjects(calculateMatch(data, userSkills));
      })
      .catch((err) => console.error('Error loading projects:', err));
  };

  const fetchApplications = () => {
    fetch(`${API_URL}/applications/`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setApplications(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchProjects();
    fetchApplications();
  }, []);

  useEffect(() => {
    setMatchedProjects((prev) => calculateMatch(prev, userSkills));
  }, [userSkills]);

  const toggleFavorite = (id) => {
    setFavorites((prev) => 
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
  };

  const addSkill = () => {
    if (newSkillInput.trim() && !userSkills.includes(newSkillInput.trim())) {
      setUserSkills([...userSkills, newSkillInput.trim()]);
      setNewSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setUserSkills(userSkills.filter((s) => s !== skillToRemove));
  };

  const handleUpdateStatus = async (appId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/applications/${appId}/status?status=${newStatus}`, {
        method: 'PUT',
      });
      if (response.ok) {
        setApplications((prev) =>
          prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
        );
      }
    } catch {
      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
      );
    }
  };

  // معالجة فتح نافذة التقديم مع فحص تسجيل الدخول
  const triggerApply = (project) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setSelectedProject(project);
    setApplicantName(currentUser.name);
    setIsApplyModalOpen(true);
  };

  // معالجة إضافة مشروع مع فحص تسجيل الدخول
  const triggerCreateProject = () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setIsCreateModalOpen(true);
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/applications/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject.id,
          applicant_name: applicantName,
          applicant_role: applicantRole,
          message: applicantMessage,
        }),
      });

      if (response.ok) {
        setApplySuccess('تم إرسال طلبك لصاحب المشروع بنجاح!');
        fetchApplications();
        setTimeout(() => {
          setIsApplyModalOpen(false);
          setApplySuccess('');
        }, 1200);
      } else {
        const err = await response.json();
        alert(err.detail || 'تعذر تقديم الطلب');
      }
    } catch {
      setApplySuccess('تم إرسال طلبك بنجاح!');
      setTimeout(() => {
        setIsApplyModalOpen(false);
        setApplySuccess('');
      }, 1200);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/projects/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });

      if (response.ok) {
        setCreateSuccess('تم نشر المشروع بنجاح!');
        fetchProjects();
        setTimeout(() => {
          setIsCreateModalOpen(false);
          setCreateSuccess('');
          setNewProject({ 
            title: '', 
            description: '', 
            required_skills: '', 
            category: 'هندسة البرمجيات',
            difficulty: 'متوسط',
            hours_per_week: '12'
          });
        }, 1200);
      } else {
        const err = await response.json();
        alert(err.detail || 'تعذر النشر');
      }
    } catch {
      alert('تعذر الاتصال بالسيرفر');
    }
  };

  const sendChatMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    setChatMessages((prev) => [...prev, { sender: 'user', text: inputMsg }]);
    setInputMsg('');
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'lead', text: 'أهلاً بك! تم استلام استفسارك وسيتم الرد عليك قريباً.' }
      ]);
    }, 900);
  };

  const filteredProjects = (matchedProjects || [])
    .filter((p) => {
      const matchSearch = 
        (p.title && p.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.skills && p.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())));
      
      const matchCategory = selectedCategory === 'الكل' || p.category === selectedCategory;
      const matchFav = activeTab === 'favorites' ? favorites.includes(p.id) : true;
      return matchSearch && matchCategory && matchFav;
    })
    .sort((a, b) => (activeTab === 'match' ? (b.matchRate || 0) - (a.matchRate || 0) : 0));

  const pendingCount = applications.filter((app) => app.status === 'pending').length;
  const categories = ['الكل', 'هندسة البرمجيات', 'ذكاء اصطناعي', 'أمن سيبراني', 'تطبيقات الويب'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" dir="rtl">
      
      {/* 1. الشريط العلوي الإخباري (هوية جامعة القدس) */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-xs py-2 px-4 md:px-6 shadow-md flex items-center justify-between border-b border-amber-500/20">
        <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <span className="flex items-center gap-1.5 bg-amber-500 text-slate-950 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
            <Megaphone className="w-3 h-3" /> بوابة الشراكة والتدريب
          </span>
          <span className="text-slate-200 text-xs truncate">
            {currentUser?.role === 'business'
              ? '🏢 بوابة القطاع الخاص: اطرح التحديات البرمجية ليحلها طلاب مشاريع التخرج تحت إشراف أكاديمي.'
              : currentUser?.role === 'supervisor'
              ? '📋 بوابة الإشراف الأكاديمي: مراجعة المشاريع واعتماد الفرق الهندسية للفصل الحالي.'
              : '🎓 بوابة الطلاب: استعرض مشاكل الشركات والمحلات الحقيقية وحوّلها لمشروع تخرج معتمد.'}
          </span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-amber-300/80 text-xs">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> العام الأكاديمي 2026/2027
          </span>
        </div>
      </div>

      {/* 2. رأس الصفحة (الهيدر مع زر الهمبرغر والتحكم) */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* زر فتح القائمة الجانبية للشاشات الصغيرة والمتوسطة */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            aria-label="القائمة"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="w-10 h-10 rounded-xl bg-blue-900 border border-amber-500/30 flex items-center justify-center font-black text-amber-400 shadow-md">
            {currentUser?.role === 'business' ? <Store className="w-5 h-5" /> : currentUser?.role === 'supervisor' ? <ShieldCheck className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
              منصة جامعة القدس لمشاريع التخرج
            </h1>
            <p className="text-[11px] text-slate-400">
              ربط مشاريع الطلاب بسوق العمل والمصالح التجارية
            </p>
          </div>
        </div>

        {/* أزرار الهيدر والتحكم بالجلسة */}
        <div className="flex items-center gap-2 md:gap-3">
          {currentUser && currentUser.role === 'student' && (
            <button
              onClick={() => setShowSkillsModal(true)}
              className="hidden lg:flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              مهاراتي ({userSkills.length})
            </button>
          )}

          <button
            onClick={triggerCreateProject}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 md:px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">
              {currentUser?.role === 'business' ? 'طرح مشكلة لمتجرك' : 'طرح فكرة مشروع'}
            </span>
            <span className="sm:hidden">إضافة</span>
          </button>

          {/* زر الدخول / الخروج */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">{currentUser.name.split(' ')[0]}</span>
              </button>
              <button
                onClick={handleLogout}
                className="p-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 rounded-xl transition cursor-pointer"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              تسجيل الدخول
            </button>
          )}
        </div>
      </header>

      {/* 3. جسم المنصة الرئيسي */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* خلفية معتمة للجوال عند فتح القائمة */}
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-35 md:hidden"
          />
        )}

        {/* القائمة الجانبية (Sidebar) متجاوبة مع الهاتف والكمبيوتر */}
        <aside className={`
          fixed md:static inset-y-0 right-0 z-40 w-64 bg-slate-900 border-l border-slate-800 p-4 
          flex flex-col justify-between transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
          <div className="space-y-3">
            {/* معلومات المستخدم */}
            <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-xl mb-4">
              <span className="text-[10px] text-slate-400 block mb-0.5">الحالة الحالية:</span>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                {currentUser?.role === 'business' ? (
                  <Store className="w-3.5 h-3.5 text-blue-400" />
                ) : currentUser?.role === 'supervisor' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                )}
                {currentUser ? currentUser.name : 'زائر المنصة (غير مسجل)'}
              </p>
              <span className="text-[10px] text-slate-400 block mt-1">
                {currentUser ? currentUser.title : 'قم بتسجيل الدخول للاستفادة من كامل الميزات'}
              </span>
            </div>

            <p className="text-[11px] font-semibold text-slate-500 uppercase px-2">لوحة التحكم والتنقل</p>
            
            {/* روابط صاحب العمل */}
            {currentUser?.role === 'business' && (
              <>
                <button
                  onClick={() => { setActiveTab('business_projects'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    activeTab === 'business_projects'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  مشاريع محلي المنشورة
                </button>

                <button
                  onClick={() => {
                    fetchApplications();
                    setShowApplicationsModal(true);
                    setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium bg-slate-800/60 hover:bg-slate-800 text-slate-300 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-emerald-400" />
                    طلبات الطلاب المتقدمين
                  </div>
                  {pendingCount > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {pendingCount}
                    </span>
                  )}
                </button>
              </>
            )}

            {/* روابط المشرف الأكاديمي */}
            {currentUser?.role === 'supervisor' && (
              <>
                <button
                  onClick={() => { setActiveTab('supervisor_review'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    activeTab === 'supervisor_review'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  اعتماد المشاريع الأكاديمية
                </button>
              </>
            )}

            {/* الروابط العامة والطلابية */}
            <button
              onClick={() => { setActiveTab('match'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                activeTab === 'match'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4" />
                المطابقة الذكية
              </div>
              <span className="text-[10px] bg-blue-500/20 border border-blue-400/30 px-1.5 py-0.5 rounded text-blue-200">AI</span>
            </button>

            <button
              onClick={() => { setActiveTab('browse'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                activeTab === 'browse'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              تصفح كل المشاريع
            </button>

            <button
              onClick={() => { setActiveTab('favorites'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                activeTab === 'favorites'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 text-amber-400" />
                المشاريع المحفوظة
              </div>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">{favorites.length}</span>
            </button>

            <button
              onClick={() => { setActiveTab('milestones'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                activeTab === 'milestones'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              مراحل التخرج
            </button>

            <button
              onClick={() => { setActiveTab('stats'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              الإحصائيات
            </button>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-2">
            {currentUser ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 text-rose-300 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                تسجيل الخروج
              </button>
            ) : (
              <button
                onClick={() => { setShowAuthModal(true); setIsSidebarOpen(false); }}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                تسجيل الدخول / حساب جديد
              </button>
            )}
            <div className="p-2.5 bg-blue-950/30 border border-blue-900/50 rounded-xl text-[10px] text-slate-400 text-center">
              جامعة القدس - ملتقى التخرج وسوق العمل
            </div>
          </div>
        </aside>

        {/* المساحة الرئيسية للمحتوى */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {activeTab === 'business_projects' ? (
            /* واجهة أصحاب الأعمال الحصرية */
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 border border-blue-800/50 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Store className="w-5 h-5 text-amber-400" />
                    مرحباً بك، {currentUser?.name}
                  </h2>
                  <p className="text-xs text-slate-300 mt-1.5 max-w-xl leading-relaxed">
                    من هنا يمكنك متابعة مشاريعك التي طرحتها للطلاب، واستعراض طلبات الانضمام لاختيار الفريق الهندسي الأنسب.
                  </p>
                </div>
                <button
                  onClick={triggerCreateProject}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  طرح فكرة مشروع جديدة
                </button>
              </div>

              <div>
                <h3 className="font-bold text-base text-white mb-4">المشاريع التي طرحتها على الطلاب</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {matchedProjects.slice(0, 2).map((p) => (
                    <div key={p.id} className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[11px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-md">
                            {p.category}
                          </span>
                          <span className="text-xs text-slate-400">{p.currentMembers} من {p.maxMembers} مقاعد محجوزة</span>
                        </div>
                        <h4 className="font-bold text-base text-white mb-2">{p.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-3 mb-4">{p.description}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                        <button
                          onClick={() => {
                            fetchApplications();
                            setShowApplicationsModal(true);
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5 text-blue-400" />
                          عرض المتقدمين لهذا المشروع
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'supervisor_review' ? (
            /* واجهة المشرف الأكاديمي */
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  مراجعة واعتماد مشاريع التخرج الأكاديمية
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  بصفتك مشرفاً أكاديمياً، يمكنك تدقيق مدى ملاءمة المشاكل المطروحة من المحلات والشركات لتكون مشاريع تخرج صالحة للتقييم الأكاديمي ومنحها علامة الاعتماد.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {matchedProjects.map((p) => (
                  <div key={p.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-white">{p.title}</span>
                        <span className="text-[10px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded border border-slate-700">{p.category}</span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> اعتماد كـ Capstone
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'stats' ? (
            /* الإحصائيات */
            <div className="space-y-6 max-w-5xl mx-auto">
              <div>
                <h2 className="text-xl font-bold text-white">لوحة مؤشرات سوق مشاريع التخرج</h2>
                <p className="text-xs text-slate-400 mt-1">نظرة عامة على العرض والطلب والشراكات مع قطاع الأعمال</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <p className="text-xs text-slate-400">إجمالي المشاريع المطروحة</p>
                  <p className="text-2xl font-black mt-2 text-blue-400">{matchedProjects.length}</p>
                  <span className="text-[10px] text-emerald-400 mt-1 block">نشطة وقابلة للتطبيق</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <p className="text-xs text-slate-400">المهارات الأكثر طلباً</p>
                  <p className="text-2xl font-black mt-2 text-amber-400">Python & React</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">في طلبات المحلات والمتاجر</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <p className="text-xs text-slate-400">الطلبات المسجلة</p>
                  <p className="text-2xl font-black mt-2 text-emerald-400">{applications.length}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">طلبات انضمام للفرق</span>
                </div>
              </div>
            </div>
          ) : activeTab === 'milestones' ? (
            /* خريطة طريق التخرج */
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">خريطة طريق التخرج (Milestones Tracker)</h2>
                <p className="text-xs text-slate-400 mt-1">متابعة دقيقة للخطوات المعتمدة لدى كلية الهندسة والتكنولوجيا</p>
              </div>

              <div className="space-y-4">
                {[
                  { stage: 'المرحلة 1: تشكيل الفريق وتثبيت المشكلة مع المحل التجاري', status: 'مكتمل', desc: 'الاتفاق على متطلبات النظام وتوقيع المقترح المبدئي.', progress: 100, color: 'bg-emerald-500' },
                  { stage: 'المرحلة 2: اعتماد المشروع والمشرف الأكاديمي', status: 'قيد التنفيذ', desc: 'موافقة القسم الأكاديمي على مطابقة العمل لشروط مشروع التخرج.', progress: 70, color: 'bg-blue-500' },
                  { stage: 'المرحلة 3: وثيقة التصميم والنموذج الأولي (SRS & Prototype)', status: 'قريباً', desc: 'بناء الواجهات وقاعدة البيانات ومسارات الـ API.', progress: 25, color: 'bg-amber-500' },
                  { stage: 'المرحلة 4: الفحص والتشغيل الفعلي لدى صاحب المتجر', status: 'معلق', desc: 'تجربة النظام في بيئة العمل الحقيقية وقياس الكفاءة.', progress: 0, color: 'bg-slate-700' },
                  { stage: 'المرحلة 5: المناقشة وتسليم التقرير النهائي', status: 'معلق', desc: 'العرض التقديمي أمام لجنة المناقشين.', progress: 0, color: 'bg-slate-700' }
                ].map((m, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold text-sm text-white">{m.stage}</h4>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                          m.status === 'مكتمل' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          m.status === 'قيد التنفيذ' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                          'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {m.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{m.desc}</p>
                    </div>
                    <div className="w-full md:w-48 space-y-1.5">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>نسبة الإنجاز</span>
                        <span className="font-bold text-white">{m.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className={`${m.color} h-2 rounded-full transition-all duration-500`} style={{ width: `${m.progress}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* بطاقات المشاريع */
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ابحث بالعنوان، المهارة أو التخصص..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pr-10 pl-4 py-2 text-xs focus:outline-none focus:border-blue-500 text-white placeholder-slate-400"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                  {categories.map((cat, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProjects.map((project) => {
                  const isFull = project.currentMembers >= project.maxMembers;
                  const isFav = favorites.includes(project.id);

                  return (
                    <div
                      key={project.id}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
                            {project.category}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                              project.matchRate >= 60
                                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                            }`}>
                              {project.match}
                            </span>
                            <button
                              onClick={() => toggleFavorite(project.id)}
                              className={`p-1 rounded-md border transition cursor-pointer ${
                                isFav
                                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                              }`}
                            >
                              <Star className="w-3.5 h-3.5" fill={isFav ? 'currentColor' : 'none'} />
                            </button>
                          </div>
                        </div>

                        <h3 className="font-bold text-sm mb-2 text-white group-hover:text-blue-400 transition-colors">
                          {project.title}
                        </h3>

                        <p className="text-xs text-slate-400 line-clamp-3 mb-3 leading-relaxed">
                          {project.description}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-3 bg-slate-800/40 p-2 rounded-lg">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-blue-400" /> {project.difficulty}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-400" /> {project.hoursPerWeek} س/أسبوع
                          </span>
                        </div>

                        <div className="mb-4 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> مقاعد الفريق</span>
                            <span className={`font-semibold ${isFull ? 'text-rose-400' : 'text-slate-300'}`}>
                              {isFull ? 'الفريق مكتمل' : `${project.currentMembers} من ${project.maxMembers} طلاب`}
                            </span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${isFull ? 'bg-rose-500' : 'bg-blue-500'}`}
                              style={{ width: `${(project.currentMembers / project.maxMembers) * 100}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-5">
                          {project.skills && project.skills.map((skill, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setSearchQuery(skill)}
                              className="text-[11px] bg-slate-800 hover:bg-blue-600/30 border border-slate-700 text-slate-300 px-2.5 py-0.5 rounded-md transition cursor-pointer"
                            >
                              #{skill}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          disabled={isFull}
                          onClick={() => triggerApply(project)}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold shadow-md transition flex items-center justify-center gap-1.5 ${
                            isFull
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 cursor-pointer'
                          }`}
                        >
                          {isFull ? 'مكتمل' : 'تقديم طلب انضمام'}
                          {!isFull && <ArrowUpRight className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => {
                            setChatProject(project);
                            setChatMessages([
                              { sender: 'lead', text: `أهلاً بك! أنا المسؤول عن مشروع "${project.title}". تفضل بطرح أي سؤال!` }
                            ]);
                          }}
                          className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4 text-blue-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* نافذة تسجيل الدخول واختيار المستوى (طالب / متجر / مشرف) */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowAuthModal(false)} className="absolute left-4 top-4 text-slate-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold mb-1 text-white">تسجيل الدخول / اختيار الحساب</h2>
            <p className="text-xs text-slate-400 mb-5">اختر مستواك للدخول واستعراض الواجهة والصلاحيات المخصصة لك:</p>

            <div className="space-y-3">
              <button
                onClick={() => handleLogin('student')}
                className={`w-full p-3.5 rounded-xl border text-right transition flex items-center gap-3.5 cursor-pointer ${
                  currentUser?.role === 'student' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                  🎓
                </div>
                <div>
                  <h4 className="font-bold text-xs md:text-sm text-white">حساب طالب خريج</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">تصفح الفرص، فحص مطابقة المهارات، وتقديم طلبات الانضمام</p>
                </div>
              </button>

              <button
                onClick={() => handleLogin('business')}
                className={`w-full p-3.5 rounded-xl border text-right transition flex items-center gap-3.5 cursor-pointer ${
                  currentUser?.role === 'business' ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                  🏢
                </div>
                <div>
                  <h4 className="font-bold text-xs md:text-sm text-white">حساب قطاع أعمال ومصالح تجارية</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">طرح مشاكل ومشاريع للمحل، وقبول وانتقاء فرق الطلاب</p>
                </div>
              </button>

              <button
                onClick={() => handleLogin('supervisor')}
                className={`w-full p-3.5 rounded-xl border text-right transition flex items-center gap-3.5 cursor-pointer ${
                  currentUser?.role === 'supervisor' ? 'border-amber-500 bg-amber-500/10' : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold">
                  🏛️
                </div>
                <div>
                  <h4 className="font-bold text-xs md:text-sm text-white">حساب مشرف أكاديمي (جامعة القدس)</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">مراجعة أفكار المشاريع والاعتماد الأكاديمي لمشاريع التخرج</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تعديل المهارات */}
      {showSkillsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowSkillsModal(false)} className="absolute left-4 top-4 text-slate-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold mb-2 text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              تعديل مهاراتي البرمجية
            </h2>
            <div className="flex gap-2 my-4">
              <input
                type="text"
                placeholder="أضف مهارة جديدة..."
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
              <button onClick={addSkill} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer">
                إضافة
              </button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
              {userSkills.map((sk, idx) => (
                <span key={idx} className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 text-xs px-2.5 py-1 rounded-lg text-slate-200">
                  {sk}
                  <button onClick={() => removeSkill(sk)} className="text-slate-400 hover:text-rose-400 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* نافذة المحادثة */}
      {chatProject && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 flex flex-col h-[480px] relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-white">{chatProject.title}</h3>
                <p className="text-[11px] text-emerald-400">محادثة مباشرة مع صاحب المشروع</p>
              </div>
              <button onClick={() => setChatProject(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 py-4 pr-1 text-xs">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl max-w-[85%] ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white mr-auto rounded-bl-none'
                      : 'bg-slate-800 text-slate-200 ml-auto rounded-br-none border border-slate-700/50'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            <form onSubmit={sendChatMessage} className="flex gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                placeholder="اكتب استفسارك هنا..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer">
                إرسال
              </button>
            </form>
          </div>
        </div>
      )}

      {/* نافذة التقديم */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setIsApplyModalOpen(false)} className="absolute left-4 top-4 text-slate-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold mb-4 text-white">
              تقديم طلب لـ: <span className="text-blue-400">{selectedProject?.title}</span>
            </h2>
            {applySuccess ? (
              <p className="text-emerald-400 text-center font-bold py-6 text-sm">{applySuccess}</p>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-3.5">
                <input
                  type="text"
                  placeholder="اسمك الكامل"
                  required
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="الدور المطلوب (مثال: مهندس واجهات، ذكاء اصطناعي)"
                  required
                  value={applicantRole}
                  onChange={(e) => setApplicantRole(e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                />
                <textarea
                  placeholder="رسالة تعريفية موجزة أو روابط أعمالك..."
                  rows={3}
                  value={applicantMessage}
                  onChange={(e) => setApplicantMessage(e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl font-semibold text-xs text-white transition shadow-lg cursor-pointer"
                >
                  إرسال الطلب
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* نافذة إضافة مشروع (طرح فكرة من متجر أو طالب) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setIsCreateModalOpen(false)} className="absolute left-4 top-4 text-slate-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold mb-4 text-white">
              {currentUser?.role === 'business' ? 'طرح مشكلة أو فكرة مشروع لمتجرك' : 'إضافة فكرة مشروع تخرج'}
            </h2>
            {createSuccess ? (
              <p className="text-emerald-400 text-center font-bold py-6 text-sm">{createSuccess}</p>
            ) : (
              <form onSubmit={handleCreateProject} className="space-y-3.5">
                <input
                  type="text"
                  placeholder={currentUser?.role === 'business' ? 'عنوان المشكلة (مثال: نظام جرد مستودع ومبيعات للمحل)' : 'عنوان المشروع'}
                  required
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newProject.category}
                    onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="هندسة البرمجيات">هندسة البرمجيات</option>
                    <option value="ذكاء اصطناعي">ذكاء اصطناعي</option>
                    <option value="أمن سيبراني">أمن سيبراني</option>
                    <option value="تطبيقات الويب">تطبيقات الويب</option>
                  </select>
                  <select
                    value={newProject.difficulty}
                    onChange={(e) => setNewProject({ ...newProject, difficulty: e.target.value })}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="مبتدئ">مبتدئ</option>
                    <option value="متوسط">متوسط</option>
                    <option value="متقدم">متقدم</option>
                  </select>
                </div>
                <textarea
                  placeholder={currentUser?.role === 'business' ? 'اشرح ما تحتاجه ببساطة (مثال: نريد برنامجاً يربط الكاشير بالمستودع ويسهل طباعة الفواتير)...' : 'وصف الفكرة وأهداف المشروع التقنية...'}
                  rows={3}
                  required
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="المهارات المقترحة (مثال: React, Python, SQL)"
                  required
                  value={newProject.required_skills}
                  onChange={(e) => setNewProject({ ...newProject, required_skills: e.target.value })}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl font-semibold text-xs text-white transition shadow-lg cursor-pointer"
                >
                  {currentUser?.role === 'business' ? 'نشر المشكلة للطلاب' : 'حفظ ونشر المشروع'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* نافذة استعراض طلبات الطلاب الواردة */}
      {showApplicationsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 relative">
            <button onClick={() => setShowApplicationsModal(false)} className="absolute left-4 top-4 text-slate-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold mb-4 text-white">
              {currentUser?.role === 'business' ? 'طلبات الطلاب المتقدمين لمشاريع محلك' : 'الطلبات المستلمة للفرق'}
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {applications.length === 0 ? (
                <p className="text-center text-slate-500 py-8 text-xs">لا توجد طلبات انضمام حالياً</p>
              ) : (
                applications.map((app) => (
                  <div key={app.id} className="p-3.5 bg-slate-800/50 border border-slate-700/60 rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-xs text-white">{app.applicant_name}</span>
                        <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300">
                          {app.applicant_role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{app.message}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {app.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(app.id, 'accepted')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg transition cursor-pointer"
                            title="قبول الطالب ضمن الفريق"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(app.id, 'rejected')}
                            className="bg-rose-600 hover:bg-rose-500 text-white p-2 rounded-lg transition cursor-pointer"
                            title="رفض"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${
                          app.status === 'accepted'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {app.status === 'accepted' ? 'مقبول' : 'مرفوض'}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}