import React, { useState, useEffect } from 'react';
import { 
  Briefcase, CheckCircle, Clock, Search, PlusCircle, 
  Users, BarChart2, Bell, X, Check, Sparkles,
  Calendar, Award, TrendingUp, Download, Megaphone, ArrowUpRight,
  Star, MessageSquare, Layers, LogIn, LogOut, Store, UserCheck
} from 'lucide-react';
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function App() {
  // إدارة حالة المستخدم الحالي (student أو business)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('app_user_role');
    return saved ? JSON.parse(saved) : {
      role: 'student',
      name: 'أحمد محمود',
      title: 'طالب هندسة حاسوب'
    };
  });

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
  const [applicantName, setApplicantName] = useState(currentUser.name || '');
  const [applicantRole, setApplicantRole] = useState('مطور واجهات ومساعد برمجي');
  const [applicantMessage, setApplicantMessage] = useState('');
  const [applySuccess, setApplySuccess] = useState('');

  // نافذة إضافة مشروع (مخصصة للمحلات والطلاب)
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

  // حفظ المستخدم عند تغييره
  const switchRole = (roleType) => {
    const newUser = roleType === 'student' 
      ? { role: 'student', name: 'أحمد محمود', title: 'طالب سنة رابعة - هندسة برمجيات' }
      : { role: 'business', name: 'شركة النور للمواد الغذائية', title: 'متجر ومستودع تجاري - نابلس' };
    setCurrentUser(newUser);
    localStorage.setItem('app_user_role', JSON.stringify(newUser));
    setShowAuthModal(false);
    setActiveTab(roleType === 'student' ? 'match' : 'business_projects');
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
      .catch(() => {
        // حماية من الأخطاء في حال عدم التوفر
      });
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
        { sender: 'lead', text: 'أهلاً بك! تم استلام رسالتك وسيتم التواصل والتنسيق معك قريباً.' }
      ]);
    }, 900);
  };

  // فلترة المشاريع
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
      {/* 1. شريط الإعلانات التفاعلي */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-xs py-2 px-6 shadow-md flex items-center justify-between border-b border-indigo-500/30">
        <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <span className="flex items-center gap-1.5 bg-rose-500 text-white font-bold px-2 py-0.5 rounded-full text-[10px] animate-pulse">
            <Megaphone className="w-3 h-3" /> هام
          </span>
          <span className="text-blue-100 font-medium tracking-wide">
            {currentUser.role === 'business'
              ? '🏢 إعلان لأصحاب الأعمال: يمكنكم الآن طرح مشاكل مشاريعكم ليقوم طلاب التخرج بحلها مجاناً كمشاريع هندسية.'
              : '🎓 تنبيه للطلاب: آخر موعد لتثبيت الفرق والمقترحات مع المشرفين نهاية الأسبوع الجاري.'}
          </span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-indigo-200">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> الفصل الدراسي الحالي
          </span>
        </div>
      </div>

      {/* 2. رأس الصفحة (الهيدر) */}
      <header className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20">
            {currentUser.role === 'business' ? <Store className="w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5 text-white" />}
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              منصة مشاريع التخرج وسوق العمل
            </h1>
            <p className="text-xs text-slate-400">
              {currentUser.role === 'business' ? 'بوابة الشركات والمحلات لطرح المشاريع' : 'ملتقى العقول وبناء الفرق الهندسية'}
            </p>
          </div>
        </div>

        {/* أزرار الهيدر والتحكم بالحساب */}
        <div className="flex items-center gap-3">
          {currentUser.role === 'student' && (
            <button
              onClick={() => setShowSkillsModal(true)}
              className="hidden sm:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <Award className="w-4 h-4 text-amber-400" />
              مهاراتي ({userSkills.length})
            </button>
          )}

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            {currentUser.role === 'business' ? 'طرح مشروع للمحل / الشركة' : 'إضافة مشروع'}
          </button>

          {/* زر تبديل الحساب السريع */}
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-indigo-500/40 text-indigo-300 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            {currentUser.role === 'business' ? 'حساب تجاري' : 'حساب طالب'}
          </button>
        </div>
      </header>

      {/* 3. جسم المنصة الرئيسي */}
      <div className="flex-1 flex overflow-hidden">
        {/* القائمة الجانبية المخصصة حسب نوع الحساب */}
        <aside className="w-64 border-l border-slate-800/80 bg-slate-900/40 p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl mb-4">
              <span className="text-[10px] text-slate-400 block mb-0.5">أنت مسجل كـ:</span>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                {currentUser.role === 'business' ? <Store className="w-3.5 h-3.5 text-blue-400" /> : <Award className="w-3.5 h-3.5 text-amber-400" />}
                {currentUser.name}
              </p>
              <span className="text-[10px] text-slate-400 block mt-1">{currentUser.title}</span>
            </div>

            <p className="text-[11px] font-semibold text-slate-500 uppercase px-3 mb-1">لوحة التحكم</p>
            
            {currentUser.role === 'business' ? (
              /* روابط خاصة بأصحاب الأعمال */
              <>
                <button
                  onClick={() => setActiveTab('business_projects')}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    activeTab === 'business_projects'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
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
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium bg-slate-800/60 hover:bg-slate-800 text-slate-300 transition cursor-pointer"
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

                <button
                  onClick={() => setActiveTab('stats')}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    activeTab === 'stats'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <BarChart2 className="w-4 h-4" />
                  إحصائيات الكفاءات والطلاب
                </button>
              </>
            ) : (
              /* روابط خاصة بالطلاب */
              <>
                <button
                  onClick={() => setActiveTab('match')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    activeTab === 'match'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
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
                  onClick={() => setActiveTab('browse')}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    activeTab === 'browse'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  تصفح كل المشاريع
                </button>

                <button
                  onClick={() => setActiveTab('favorites')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    activeTab === 'favorites'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
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
                  onClick={() => setActiveTab('milestones')}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    activeTab === 'milestones'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  مراحل التخرج
                </button>

                <button
                  onClick={() => setActiveTab('stats')}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    activeTab === 'stats'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <BarChart2 className="w-4 h-4" />
                  الإحصائيات والتحليلات
                </button>
              </>
            )}
          </div>

          <div className="p-3 bg-gradient-to-br from-indigo-900/30 to-blue-900/20 border border-indigo-500/20 rounded-xl text-[11px] text-indigo-300">
            {currentUser.role === 'business'
              ? '💼 نصيحة لصاحب العمل: وضح المشكلة التي تواجهها وسيتكفل فريق الطلاب بهندسة الحل المناسب.'
              : '💡 نصيحة للطالب: تواصل مع صاحب الفكرة عبر المحادثة الفورية لمعرفة المتطلبات قبل التقديم.'}
          </div>
        </aside>

        {/* المساحة الرئيسية */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'business_projects' ? (
            /* واجهة أصحاب الأعمال الحصرية */
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-indigo-500/30 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Store className="w-5 h-5 text-blue-400" />
                    مرحباً بك، {currentUser.name}
                  </h2>
                  <p className="text-xs text-slate-300 mt-1.5 max-w-xl leading-relaxed">
                    من هنا يمكنك متابعة مشاريعك التي طرحتها للطلاب، واستعراض طلبات الانضمام لاختيار الفريق الهندسي المناسب لمتجرك أو شركتك.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/25 flex items-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  طرح فكرة مشروع جديدة
                </button>
              </div>

              {/* قائمة المشاريع الخاصة بالجهة */}
              <div>
                <h3 className="font-bold text-base text-white mb-4">المشاريع التي طرحتها على الطلاب</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {matchedProjects.slice(0, 2).map((p) => (
                    <div key={p.id} className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
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

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
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
          ) : activeTab === 'stats' ? (
            /* قسم الإحصائيات */
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">لوحة الإحصائيات وسوق العمل</h2>
                  <p className="text-xs text-slate-400 mt-1">نظرة شاملة على العرض والطلب والمهارات التقنية المطلوبة</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
                  <p className="text-xs text-slate-400">إجمالي المشاريع</p>
                  <p className="text-2xl font-black mt-2 text-blue-400">{matchedProjects.length}</p>
                  <span className="text-[10px] text-emerald-400 mt-1 block">نشطة ومتاحة</span>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
                  <p className="text-xs text-slate-400">المهارة الأكثر طلباً</p>
                  <p className="text-2xl font-black mt-2 text-emerald-400">Python & React</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">في سوق المنصة</span>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
                  <p className="text-xs text-slate-400">الطلبات المسجلة</p>
                  <p className="text-2xl font-black mt-2 text-amber-400">{applications.length}</p>
                  <span className="text-[10px] text-amber-400/80 mt-1 block">قيد المعالجة</span>
                </div>
              </div>
            </div>
          ) : activeTab === 'milestones' ? (
            /* تتبع مراحل التخرج */
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">خريطة طريق التخرج (Milestones Tracker)</h2>
                <p className="text-xs text-slate-400 mt-1">متابعة دقيقة للخطوات الرسمية وصولاً إلى المناقشة والتسليم النهائي</p>
              </div>

              <div className="space-y-4">
                {[
                  { stage: 'المرحلة 1: تشكيل الفريق وتثبيت الفكرة مع المشرف أو المحل', status: 'مكتمل', desc: 'الاتفاق على متطلبات النظام وتوقيع المقترح.', progress: 100, color: 'bg-emerald-500' },
                  { stage: 'المرحلة 2: وثيقة المتطلبات والتصميم (SRS)', status: 'قيد التنفيذ', desc: 'كتابة حالات الاستخدام ومخطط قواعد البيانات والمعمارية.', progress: 65, color: 'bg-blue-500' },
                  { stage: 'المرحلة 3: تطوير النموذج الأولي (Prototype)', status: 'قريباً', desc: 'بناء واجهات المستخدم والـ API الأساسي للربط.', progress: 20, color: 'bg-amber-500' },
                  { stage: 'المرحلة 4: الفحص والتحسين والاختبار', status: 'معلق', desc: 'فحص الأداء والتوافق مع متطلبات المتجر الفعلي.', progress: 0, color: 'bg-slate-700' },
                  { stage: 'المرحلة 5: المناقشة وتسليم التقرير النهائي', status: 'معلق', desc: 'العرض التقديمي أمام لجنة التحكيم والمشرفين.', progress: 0, color: 'bg-slate-700' }
                ].map((m, idx) => (
                  <div key={idx} className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
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
            /* كروت المشاريع (تصفح / ذكي / مفضلة) */
            <div className="space-y-6">
              {/* شريط البحث والفلاتر */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ابحث بالعنوان، المهارة أو التخصص..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800/70 border border-slate-700/80 rounded-xl pr-10 pl-4 py-2 text-xs focus:outline-none focus:border-blue-500 text-white placeholder-slate-400"
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
                          : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* عرض البطاقات */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProjects.map((project) => {
                  const isFull = project.currentMembers >= project.maxMembers;
                  const isFav = favorites.includes(project.id);

                  return (
                    <div
                      key={project.id}
                      className="bg-slate-900/50 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-blue-900/5 group relative"
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

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-3 bg-slate-800/30 p-2 rounded-lg">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-blue-400" /> {project.difficulty}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-400" /> {project.hoursPerWeek} س/أسبوع
                          </span>
                        </div>

                        <div className="mb-4 bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> مقاعد الفريق</span>
                            <span className={`font-semibold ${isFull ? 'text-rose-400' : 'text-slate-300'}`}>
                              {isFull ? 'الفريق مكتمل' : `${project.currentMembers} من ${project.maxMembers} طلاب`}
                            </span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
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
                              className="text-[11px] bg-slate-800/80 hover:bg-blue-600/30 border border-slate-700/60 hover:border-blue-500/40 text-slate-300 hover:text-blue-200 px-2.5 py-0.5 rounded-md transition cursor-pointer"
                            >
                              #{skill}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          disabled={isFull}
                          onClick={() => {
                            setSelectedProject(project);
                            setIsApplyModalOpen(true);
                          }}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold shadow-md transition flex items-center justify-center gap-1.5 ${
                            isFull
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
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

      {/* نافذة تبديل الحساب السريع (طالب أم متجر) */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowAuthModal(false)} className="absolute left-4 top-4 text-slate-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold mb-2 text-white">اختر نوع الحساب للتجربة والعرض</h2>
            <p className="text-xs text-slate-400 mb-6">تبديل الواجهة بنقرة واحدة لتناسب احتياجات كل مستخدم:</p>

            <div className="space-y-3">
              <button
                onClick={() => switchRole('student')}
                className={`w-full p-4 rounded-xl border text-right transition flex items-center gap-3.5 cursor-pointer ${
                  currentUser.role === 'student' ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                  🎓
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">حساب طالب خريج</h4>
                  <p className="text-xs text-slate-400 mt-0.5">البحث عن مشاريع، فحص المهارات، وتقديم طلبات الانضمام</p>
                </div>
              </button>

              <button
                onClick={() => switchRole('business')}
                className={`w-full p-4 rounded-xl border text-right transition flex items-center gap-3.5 cursor-pointer ${
                  currentUser.role === 'business' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                  🏢
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">حساب متجر أو شركة تجارية</h4>
                  <p className="text-xs text-slate-400 mt-0.5">طرح مشاكل وأفكار مشاريع، واستعراض وقبول الطلاب المتقدمين</p>
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
                  className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl font-semibold text-xs text-white transition shadow-lg shadow-blue-600/20 cursor-pointer"
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
              {currentUser.role === 'business' ? 'طرح مشكلة أو فكرة مشروع لمتجرك' : 'إضافة فكرة مشروع تخرج'}
            </h2>
            {createSuccess ? (
              <p className="text-emerald-400 text-center font-bold py-6 text-sm">{createSuccess}</p>
            ) : (
              <form onSubmit={handleCreateProject} className="space-y-3.5">
                <input
                  type="text"
                  placeholder={currentUser.role === 'business' ? 'عنوان المشكلة (مثال: نظام جرد مستودع ومبيعات للمحل)' : 'عنوان المشروع'}
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
                  placeholder={currentUser.role === 'business' ? 'اشرح ما تحتاجه ببساطة (مثال: نريد برنامجاً يربط الكاشير بالمستودع ويسهل طباعة الفواتير)...' : 'وصف الفكرة وأهداف المشروع التقنية...'}
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
                  className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl font-semibold text-xs text-white transition shadow-lg shadow-blue-600/20 cursor-pointer"
                >
                  {currentUser.role === 'business' ? 'نشر المشكلة للطلاب' : 'حفظ ونشر المشروع'}
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
              {currentUser.role === 'business' ? 'طلبات الطلاب المتقدمين لمشاريع محلك' : 'الطلبات المستلمة للفرق'}
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