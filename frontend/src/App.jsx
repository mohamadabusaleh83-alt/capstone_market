import React, { useState, useEffect } from 'react';
import { 
  Briefcase, CheckCircle, Clock, Search, PlusCircle, 
  Users, BarChart2, Bell, X, Check, Sparkles,
  Calendar, Award, TrendingUp, Download, Megaphone, ArrowUpRight,
  Star, MessageSquare, Layers, LogIn, LogOut, Store, UserCheck,
  Menu, ShieldCheck, GraduationCap, FileText, AlertTriangle, PieChart
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://capstone-market.onrender.com';

const ACADEMIC_MAJORS = [
  'أنظمة المعلومات الحاسوبية (CIS)',
  'علم الحاسوب (Computer Science)',
  'تقنية المعلومات والاتصالات (IT)',
  'أمن المعلومات والأدلة الرقمية (Cybersecurity)',
  'الوسائط الرقمية وتكنولوجيا الويب',
  'هندسة البرمجيات'
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('app_user_role');
    return saved ? JSON.parse(saved) : null;
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('match');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  // مهارات وسيرة الطالب
  const [userSkills, setUserSkills] = useState(['Python', 'FastAPI', 'Docker', 'React', 'TailwindCSS']);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [showSkillsModal, setShowSkillsModal] = useState(false);

  const [studentCv, setStudentCv] = useState(() => {
    const saved = localStorage.getItem('student_academic_cv');
    return saved ? JSON.parse(saved) : {
      major: 'أنظمة المعلومات الحاسوبية (CIS)',
      course: 'مشروع تخرج 1',
      portfolioUrl: 'https://github.com',
      bio: 'طالب في السنة النهائية، مهتم بتطوير الأنظمة السحابية وحلول الويب المتكاملة.'
    };
  });
  const [cvUpdateMessage, setCvUpdateMessage] = useState('');

  // سجل طلاب مساق مشروع التخرج للمشرف (Roster)
  const [studentRoster] = useState([
    { id: '12020412', name: 'أحمد منصور', major: 'أنظمة المعلومات الحاسوبية (CIS)', course: 'مشروع تخرج 2', status: 'مرتبط بمشروع', projectTitle: 'نظام إدارة مستودعات ذكي' },
    { id: '12020589', name: 'سارة خليل', major: 'علم الحاسوب (Computer Science)', course: 'مشروع تخرج 1', status: 'طالب حر (يبحث عن فريق)', projectTitle: '-' },
    { id: '12019844', name: 'عمر الرمحي', major: 'أمن المعلومات والأدلة الرقمية', course: 'مشروع تخرج 2', status: 'مرتبط بمشروع', projectTitle: 'بوابة رصد الثغرات' },
    { id: '12120031', name: 'ليلى قاسم', major: 'تقنية المعلومات والاتصالات (IT)', course: 'مشروع تخرج 1', status: 'طالب حر (يبحث عن فريق)', projectTitle: '-' },
    { id: '12022410', name: 'يزن النجار', major: 'هندسة البرمجيات', course: 'مشروع تخرج 1', status: 'طالب حر (يبحث عن فريق)', projectTitle: '-' }
  ]);

  // المفضلة
  const [favorites, setFavorites] = useState([]);

  // مصفوفة الطلاب بتخصصات وخبرات متنوعة
  const [availableStudents] = useState([
    {
      id: 'st-1',
      name: 'أحمد منصور',
      major: 'أنظمة المعلومات الحاسوبية (CIS)',
      role: 'محلل أعمال وقواعد بيانات',
      skills: ['SQL', 'Power BI', 'Python', 'ETL'],
      experienceLevel: 'متقدم',
      isFree: true,
      avatar: '👨‍💼'
    },
    {
      id: 'st-2',
      name: 'سارة خليل',
      major: 'علم الحاسوب (Computer Science)',
      role: 'مهندسة ذكاء اصطناعي وباك إند',
      skills: ['Python', 'FastAPI', 'Machine Learning', 'Docker'],
      experienceLevel: 'متوسط',
      isFree: false,
      avatar: '👩‍💻'
    },
    {
      id: 'st-3',
      name: 'يزن النجار',
      major: 'هندسة البرمجيات',
      role: 'مطور واجهات وسحابي',
      skills: ['React', 'TailwindCSS', 'Docker', 'TypeScript'],
      experienceLevel: 'متقدم',
      isFree: true,
      avatar: '👨‍💻'
    },
    {
      id: 'st-4',
      name: 'عمر الرمحي',
      major: 'أمن المعلومات والأدلة الرقمية',
      role: 'مهندس أمن سيبراني وبنية تحتية',
      skills: ['Cybersecurity', 'Linux', 'Network Security', 'Python'],
      experienceLevel: 'متوسط',
      isFree: true,
      avatar: '🛡️'
    },
    {
      id: 'st-5',
      name: 'ليلى قاسم',
      major: 'الوسائط الرقمية وتكنولوجيا الويب',
      role: 'مصممة واجهات ومطورة ويب',
      skills: ['React', 'Figma', 'UI/UX', 'CSS Architecture'],
      experienceLevel: 'متقدم',
      isFree: true,
      avatar: '🎨'
    },
    {
      id: 'st-6',
      name: 'كريم الشيخ',
      major: 'تقنية المعلومات والاتصالات (IT)',
      role: 'إدارة أنظمة وشبكات',
      skills: ['Linux', 'Docker', 'System Admin', 'Bash'],
      experienceLevel: 'متوسط',
      isFree: true,
      avatar: '⚙️'
    }
  ]);

  // المشاريع والطلبات
  const [matchedProjects, setMatchedProjects] = useState([
    {
      id: 1,
      title: 'نظام إدارة المستودعات ونقاط البيع السحابي (POS)',
      description: 'نظام متكامل لمتجر تجزئة لربط عمليات البيع بالمخزون وإصدار تنبيهات عند نفاد البضائع، مع تقارير أرباح يومية.',
      category: 'أنظمة المعلومات الحاسوبية (CIS)',
      difficulty: 'متوسط',
      hoursPerWeek: 12,
      maxMembers: 4,
      currentMembers: 2,
      skills: ['Python', 'SQL', 'FastAPI', 'React'],
      matchedSkills: ['Python', 'React', 'FastAPI'],
      missingSkills: ['SQL'],
      matchRate: 75,
      match: '75% تطابق'
    },
    {
      id: 2,
      title: 'لوحة مؤشرات تنبؤية للمبيعات وسلوك المستهلك',
      description: 'بناء داشبورد ذكاء أعمال (BI) لشركة توزيع لتحليل فواتير المبيعات السابقة والتنبؤ بالطلب للمواسم القادمة.',
      category: 'أنظمة المعلومات الحاسوبية (CIS)',
      difficulty: 'متقدم',
      hoursPerWeek: 14,
      maxMembers: 3,
      currentMembers: 1,
      skills: ['Python', 'Power BI', 'SQL', 'Machine Learning'],
      matchedSkills: ['Python'],
      missingSkills: ['Power BI', 'SQL', 'Machine Learning'],
      matchRate: 25,
      match: '25% تطابق'
    },
    {
      id: 3,
      title: 'بوابة تدقيق الثغرات واكتشاف الاختراقات للمتاجر الإلكترونية',
      description: 'أداة فحص أمني لتقييم حماية بوابات الدفع الإلكتروني وتشفير بيانات بطاقات العملاء في المتاجر المحلية.',
      category: 'أمن المعلومات والأدلة الرقمية (Cybersecurity)',
      difficulty: 'متقدم',
      hoursPerWeek: 15,
      maxMembers: 3,
      currentMembers: 3,
      skills: ['Cybersecurity', 'Python', 'Docker', 'Linux'],
      matchedSkills: ['Python', 'Docker'],
      missingSkills: ['Cybersecurity', 'Linux'],
      matchRate: 50,
      match: '50% تطابق'
    },
    {
      id: 4,
      title: 'تطبيق ويب لحجز المواعيد وإدارة الطلبات للمحلات الخدمية',
      description: 'منصة ويب متجاوبة تمكن الزبائن من حجز خدمات الصيانة ومتابعة حالة الطلب مع إشعارات فورية.',
      category: 'الوسائط الرقمية وتكنولوجيا الويب',
      difficulty: 'متوسط',
      hoursPerWeek: 10,
      maxMembers: 4,
      currentMembers: 2,
      skills: ['React', 'TailwindCSS', 'FastAPI', 'Docker'],
      matchedSkills: ['React', 'TailwindCSS', 'FastAPI', 'Docker'],
      missingSkills: [],
      matchRate: 100,
      match: '100% تطابق'
    },
    {
      id: 5,
      title: 'محرك توصيات ذكي لمنتجات المتجر بناءً على التفضيلات',
      description: 'نظام توصيات يعتمد على خوارزميات الذكاء الاصطناعي لاقتراح المنتجات التكميلية للعملاء أثناء الشراء.',
      category: 'علم الحاسوب (Computer Science)',
      difficulty: 'متقدم',
      hoursPerWeek: 16,
      maxMembers: 4,
      currentMembers: 1,
      skills: ['Python', 'Docker', 'Machine Learning', 'FastAPI'],
      matchedSkills: ['Python', 'FastAPI', 'Docker'],
      missingSkills: ['Machine Learning'],
      matchRate: 75,
      match: '75% تطابق'
    }
  ]);

  const [applications, setApplications] = useState([
    {
      id: 101,
      applicant_name: 'أحمد محمود منصور',
      applicant_role: 'مطور أنظمة وواجهات',
      message: '[التخصص: أنظمة المعلومات الحاسوبية (CIS) | المساق: مشروع تخرج 2 | المهارات: Python, React, SQL] - نرغب بتنفيذ نظام المستودعات ونمتلك خبرة في ربط قواعد البيانات.',
      status: 'pending'
    },
    {
      id: 102,
      applicant_name: 'سارة إبراهيم خليل',
      applicant_role: 'محللة بيانات وذكاء أعمال',
      message: '[التخصص: علم الحاسوب (Computer Science) | المساق: مشروع تخرج 1 | المهارات: Python, ML] | [نمط التقديم: فريق متكامل] أعضاء الفريق: سارة، ليلى، عمر.',
      status: 'pending'
    },
    {
      id: 103,
      applicant_name: 'يزن النجار',
      applicant_role: 'مهندس برمجيات سحابية',
      message: '[التخصص: هندسة البرمجيات | المساق: مشروع تخرج 2 | المهارات: Docker, React, FastAPI] - جاهز للبدء الفوري.',
      status: 'accepted'
    }
  ]);

  const [showApplicationsModal, setShowApplicationsModal] = useState(false);

  // المحادثة
  const [chatProject, setChatProject] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');

  // التقديم
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [applyAsTeam, setApplyAsTeam] = useState(false);
  const [teamMembersInput, setTeamMembersInput] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [applicantRole, setApplicantRole] = useState('مطور أنظمة وواجهات');
  const [applicantMessage, setApplicantMessage] = useState('');
  const [applySuccess, setApplySuccess] = useState('');

  // إضافة مشروع
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    required_skills: '',
    category: ACADEMIC_MAJORS[0],
    difficulty: 'متوسط',
    hours_per_week: '12'
  });
  const [createSuccess, setCreateSuccess] = useState('');

  // تسجيل الدخول
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authRole, setAuthRole] = useState('student');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authError, setAuthError] = useState('');

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (authMode === 'login') {
      try {
        const formData = new URLSearchParams();
        formData.append('username', authEmail);
        formData.append('password', authPassword);

        const res = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          if (data.access_token) {
            localStorage.setItem('token', data.access_token);
          }
        }
      } catch {
        // Fallback
      }

      const userObj = {
        role: authRole,
        name: authFullName || authEmail.split('@')[0] || 'مستخدم مسجل',
        title: authRole === 'student' ? 'طالب خريج' : authRole === 'business' ? 'صاحب عمل / متجر' : 'مشرف أكاديمي'
      };
      setCurrentUser(userObj);
      localStorage.setItem('app_user_role', JSON.stringify(userObj));
      setShowAuthModal(false);
      setActiveTab(authRole === 'business' ? 'business_projects' : authRole === 'supervisor' ? 'supervisor_review' : 'match');
    } else {
      alert('تم إنشاء الحساب بنجاح! تفضل بتسجيل الدخول.');
      setAuthMode('login');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('app_user_role');
    localStorage.removeItem('token');
    setActiveTab('browse');
    setIsSidebarOpen(false);
  };

  const calculateMatch = (projectsList, skillsList) => {
    if (!Array.isArray(projectsList)) return [];
    return projectsList.map((p) => {
      const projectSkills = typeof p.required_skills === 'string'
        ? p.required_skills.split(',').map((s) => s.trim())
        : (p.skills || ['Python', 'FastAPI']);

      const matchedSkills = projectSkills.filter((s) =>
        skillsList.map((u) => u.toLowerCase()).includes(s.toLowerCase())
      );

      const missingSkills = projectSkills.filter((s) =>
        !skillsList.map((u) => u.toLowerCase()).includes(s.toLowerCase())
      );

      const matchPercent = projectSkills.length > 0 
        ? Math.round((matchedSkills.length / projectSkills.length) * 100)
        : 60;

      return {
        ...p,
        matchRate: matchPercent,
        match: `${matchPercent}% تطابق`,
        matchedSkills,
        missingSkills,
        category: p.category || ACADEMIC_MAJORS[0],
        maxMembers: p.maxMembers || 4,
        currentMembers: p.currentMembers !== undefined ? p.currentMembers : 2,
        difficulty: p.difficulty || 'متوسط',
        hoursPerWeek: p.hours_per_week || p.hoursPerWeek || 10,
        skills: projectSkills,
      };
    });
  };

  const fetchProjects = () => {
    fetch(`${API_URL}/projects/`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setMatchedProjects(calculateMatch(data, userSkills));
        }
      })
      .catch(() => {});
  };

  const fetchApplications = () => {
    fetch(`${API_URL}/applications/`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setApplications(data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    // fetchProjects();
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

  const handleSaveCv = (e) => {
    e.preventDefault();
    localStorage.setItem('student_academic_cv', JSON.stringify(studentCv));
    setCvUpdateMessage('تم حفظ وتحديث السيرة الذاتية بنجاح!');
    setTimeout(() => setCvUpdateMessage(''), 2500);
  };

  const handleUpdateStatus = (appId, newStatus) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
    );
  };

  const triggerApply = (project) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setSelectedProject(project);
    setApplicantName(currentUser.name);
    setIsApplyModalOpen(true);
  };

  const triggerCreateProject = () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setIsCreateModalOpen(true);
  };

  const handleApplySubmit = (e) => {
    e.preventDefault();
    const teamDetails = applyAsTeam 
      ? ` | [فريق متكامل]: ${teamMembersInput || 'أحمد، سارة، محمد'}`
      : ' | [فردي]';

    const newApp = {
      id: Date.now(),
      applicant_name: applicantName,
      applicant_role: applicantRole,
      message: `[${studentCv.major} | ${studentCv.course}]${teamDetails} - ${applicantMessage}`,
      status: 'pending'
    };

    setApplications((prev) => [newApp, ...prev]);
    setApplySuccess('تم إرسال طلبك وسيرتك الذاتية للمشرف الأكاديمي للاعتماد!');
    setTimeout(() => {
      setIsApplyModalOpen(false);
      setApplySuccess('');
    }, 1300);
  };

  const handleCreateProject = (e) => {
    e.preventDefault();
    const skillsArr = newProject.required_skills.split(',').map((s) => s.trim());
    const projectToAdd = {
      id: Date.now(),
      title: newProject.title,
      description: newProject.description,
      category: newProject.category,
      difficulty: newProject.difficulty,
      hoursPerWeek: Number(newProject.hours_per_week) || 12,
      maxMembers: 4,
      currentMembers: 1,
      skills: skillsArr,
      matchedSkills: skillsArr.filter((s) => userSkills.map((u) => u.toLowerCase()).includes(s.toLowerCase())),
      missingSkills: skillsArr.filter((s) => !userSkills.map((u) => u.toLowerCase()).includes(s.toLowerCase())),
      matchRate: 70,
      match: '70% تطابق'
    };

    setMatchedProjects((prev) => [projectToAdd, ...prev]);
    setCreateSuccess('تم نشر المشروع بنجاح!');
    setTimeout(() => {
      setIsCreateModalOpen(false);
      setCreateSuccess('');
      setNewProject({ 
        title: '', 
        description: '', 
        required_skills: '', 
        category: ACADEMIC_MAJORS[0],
        difficulty: 'متوسط',
        hours_per_week: '12'
      });
    }, 1200);
  };

  const sendChatMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    setChatMessages((prev) => [...prev, { sender: 'user', text: inputMsg }]);
    setInputMsg('');
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'lead', text: 'أهلاً بك! تم استلام استفسارك وسيتم الرد قريباً.' }
      ]);
    }, 800);
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
  const categories = ['الكل', ...ACADEMIC_MAJORS];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" dir="rtl">
      
      {/* 1. الشريط العلوي العام */}
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

      {/* 2. رأس الصفحة */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="w-10 h-10 rounded-xl bg-blue-900 border border-amber-500/30 flex items-center justify-center font-black text-amber-400 shadow-md">
            {currentUser?.role === 'business' ? <Store className="w-5 h-5" /> : currentUser?.role === 'supervisor' ? <ShieldCheck className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
              منصة مشاريع التخرج وربط سوق العمل
            </h1>
            <p className="text-[11px] text-slate-400">
              ربط مشاريع الطلاب بسوق العمل والمصالح التجارية
            </p>
          </div>
        </div>

        {/* أزرار الهيدر */}
        <div className="flex items-center gap-2 md:gap-3">
          {currentUser && currentUser.role === 'student' && (
            <button
              onClick={() => setActiveTab('student_cv')}
              className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              سيرتي الذاتية (CV)
            </button>
          )}

          {currentUser?.role === 'business' && (
            <button
              onClick={triggerCreateProject}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 md:px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">طرح مشكلة لمتجرك</span>
              <span className="sm:hidden">إضافة</span>
            </button>
          )}

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
              onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
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
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-35 md:hidden"
          />
        )}

        {/* القائمة الجانبية (Sidebar) */}
        <aside className={`
          fixed md:static inset-y-0 right-0 z-40 w-64 bg-slate-900 border-l border-slate-800 p-4 
          flex flex-col justify-between transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
          <div className="space-y-3">
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
                {currentUser ? currentUser.title : 'سجل الدخول للاستفادة من كامل الميزات'}
              </span>
            </div>

            <p className="text-[11px] font-semibold text-slate-500 uppercase px-2">لوحة التحكم والتنقل</p>
            
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

                <button
                  onClick={() => {
                    fetchApplications();
                    setShowApplicationsModal(true);
                    setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium bg-slate-800/60 hover:bg-slate-800 text-slate-300 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    اعتماد وإسناد الطلبات
                  </div>
                  {pendingCount > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {pendingCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { setActiveTab('roster'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    activeTab === 'roster'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-blue-400" />
                  سجل طلاب مشروع التخرج
                </button>
              </>
            )}

            {currentUser?.role === 'student' && (
              <button
                onClick={() => { setActiveTab('student_cv'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  activeTab === 'student_cv'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4 text-blue-400" />
                سيرتي الذاتية (CV)
              </button>
            )}

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
              onClick={() => { setActiveTab('teams'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                activeTab === 'teams'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-emerald-400" />
                ملتقى تشكيل الفرق والطلاب
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                {availableStudents.filter(s => s.isFree).length} أحرار
              </span>
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
              الإحصائيات وفجوة السوق
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
                onClick={() => { setAuthMode('login'); setShowAuthModal(true); setIsSidebarOpen(false); }}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                تسجيل الدخول / حساب جديد
              </button>
            )}
            <div className="p-2.5 bg-blue-950/30 border border-blue-900/50 rounded-xl text-[10px] text-slate-400 text-center">
              منظومة مشاريع التخرج وسوق العمل
            </div>
          </div>
        </aside>

        {/* المساحة الرئيسية */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {activeTab === 'teams' ? (
            /* ملتقى تشكيل الفرق والطلاب المتاحين */
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    دليل الطلاب المتاحين وبناء الفرق الهندسية
                  </h2>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
                    استكشف زملاءك من مختلف تخصصات الكلية لتكوين فرق متعددة المهارات تغطي متطلبات مشاريع السوق.
                  </p>
                </div>
                <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs text-slate-300">
                  الطلاب الجاهزون للانضمام: <span className="font-bold text-emerald-400">{availableStudents.filter(s => s.isFree).length} طلاب</span>
                </div>
              </div>

              {/* بطاقات الطلاب */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableStudents.map((student) => (
                  <div
                    key={student.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl p-1.5 bg-slate-800 rounded-xl">{student.avatar}</span>
                          <div>
                            <h3 className="font-bold text-sm text-white">{student.name}</h3>
                            <span className="text-[11px] text-slate-400">{student.role}</span>
                          </div>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                          student.isFree 
                            ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {student.isFree ? 'طالب حر' : 'ضمن فريق'}
                        </span>
                      </div>

                      <div className="mb-3">
                        <span className="text-[10px] bg-blue-950/60 text-blue-300 border border-blue-800/40 px-2 py-0.5 rounded inline-block">
                          {student.major}
                        </span>
                      </div>

                      <div className="space-y-1 mb-4">
                        <span className="text-[10px] text-slate-400 block">المهارات:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {student.skills.map((sk, i) => (
                            <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      disabled={!student.isFree}
                      onClick={() => alert(`تم إرسال دعوة انضمام للطالب ${student.name}`)}
                      className={`w-full py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        student.isFree
                          ? 'bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white border border-slate-700'
                          : 'bg-slate-950 text-slate-600 cursor-not-allowed border border-slate-900'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      {student.isFree ? 'دعوة للانضمام للفريق' : 'مرتبط بمشروع تخرج'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'student_cv' ? (
            /* تبويب السيرة الذاتية */
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  السيرة الذاتية والملف الأكاديمي للطالب
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  تُرفق هذه السيرة تلقائياً عند تقديمك على أي مشكلة مطروحة ليتسنى للمشرف الأكاديمي مراجعة مهاراتك واعتماد إسناد المشروع لك.
                </p>
              </div>

              {cvUpdateMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl text-center">
                  {cvUpdateMessage}
                </div>
              )}

              <form onSubmit={handleSaveCv} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">التخصص الأكاديمي</label>
                    <select
                      value={studentCv.major}
                      onChange={(e) => setStudentCv({ ...studentCv, major: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      {ACADEMIC_MAJORS.map((m, idx) => (
                        <option key={idx} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">المساق المسجل</label>
                    <select
                      value={studentCv.course}
                      onChange={(e) => setStudentCv({ ...studentCv, course: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="مشروع تخرج 1">مشروع تخرج 1</option>
                      <option value="مشروع تخرج 2">مشروع تخرج 2</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">رابط المشاريع السابقة أو GitHub / Portfolio</label>
                  <input
                    type="url"
                    value={studentCv.portfolioUrl}
                    onChange={(e) => setStudentCv({ ...studentCv, portfolioUrl: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none text-left"
                    dir="ltr"
                    placeholder="https://github.com/username"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">نبذة عن مهاراتك وطموحك التقني</label>
                  <textarea
                    rows={3}
                    value={studentCv.bio}
                    onChange={(e) => setStudentCv({ ...studentCv, bio: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    placeholder="اكتب نبذة عن المجالات التي تتقنها..."
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[11px] text-slate-300">المهارات المضافة للمطابقة ({userSkills.length})</label>
                    <button
                      type="button"
                      onClick={() => setShowSkillsModal(true)}
                      className="text-xs text-blue-400 hover:underline"
                    >
                      تعديل المهارات
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950 rounded-xl border border-slate-800">
                    {userSkills.map((sk, idx) => (
                      <span key={idx} className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-md border border-slate-700">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                >
                  حفظ وتحديث بيانات السيرة الذاتية
                </button>
              </form>
            </div>
          ) : activeTab === 'roster' && currentUser?.role === 'supervisor' ? (
            /* سجل الطلاب للمشرف */
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-400" />
                    سجل طلاب مساق مشروع التخرج (Roster)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    كشف حصر ومتابعة الطلبة المسجلين للفصل الحالي، مع بيان الطلاب الأحرار الذين لم يلتحقوا بمشاريع بعد.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="p-3.5">الرقم الجامعي</th>
                      <th className="p-3.5">اسم الطالب</th>
                      <th className="p-3.5">التخصص الأكاديمي</th>
                      <th className="p-3.5">المساق</th>
                      <th className="p-3.5">حالة المشروع</th>
                      <th className="p-3.5">المشروع المسند</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {studentRoster.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-800/30 transition">
                        <td className="p-3.5 font-mono text-slate-400">{st.id}</td>
                        <td className="p-3.5 font-semibold text-white">{st.name}</td>
                        <td className="p-3.5 text-slate-300">{st.major}</td>
                        <td className="p-3.5">
                          <span className="bg-blue-950 text-blue-300 border border-blue-800/60 px-2 py-0.5 rounded text-[11px]">
                            {st.course}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border ${
                            st.status.includes('طالب حر')
                              ? 'bg-amber-950/40 text-amber-300 border-amber-800/50'
                              : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                          }`}>
                            {st.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-400">{st.projectTitle}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'business_projects' ? (
            /* لوحة تحكم أصحاب الأعمال */
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 border border-blue-800/50 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Store className="w-5 h-5 text-amber-400" />
                    مرحباً بك، {currentUser?.name}
                  </h2>
                  <p className="text-xs text-slate-300 mt-1.5 max-w-xl leading-relaxed">
                    من هنا يمكنك متابعة مشاريعك التي طرحتها للطلاب، واستعراض طلبات الانضمام لاختيار الفريق الأنسب.
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
            /* لوحة تحكم المشرف */
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  مراجعة واعتماد مشاريع التخرج الأكاديمية
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  بصفتك مشرفاً أكاديمياً، يمكنك تدقيق المشاكل المطروحة من المحلات والشركات واعتمادها كمشاريع تخرج صالحة للمناقشة.
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
                      <button 
                        onClick={() => alert(`تم اعتماد المشروع "${p.title}" رسمياً كمشروع تخرج معتمد.`)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> اعتماد كـ Capstone
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'stats' ? (
            /* الإحصائيات وفجوة السوق */
            <div className="space-y-6 max-w-5xl mx-auto">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-blue-400" />
                  لوحة مؤشرات سوق مشاريع التخرج وذكاء الأعمال (BI)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  تحليل مقارن بين متطلبات مشاريع سوق العمل المعروضة والمهارات المتوفرة لدى الطلاب
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <p className="text-xs text-slate-400">إجمالي المشاريع المطروحة</p>
                  <p className="text-2xl font-black mt-2 text-blue-400">{matchedProjects.length}</p>
                  <span className="text-[10px] text-emerald-400 mt-1 block">نشطة وقابلة للتطبيق</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <p className="text-xs text-slate-400">المهارات الأكثر طلباً</p>
                  <p className="text-2xl font-black mt-2 text-amber-400">Python & SQL</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">في طلبات المحلات والمتاجر</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <p className="text-xs text-slate-400">الطلبات المسجلة</p>
                  <p className="text-2xl font-black mt-2 text-emerald-400">{applications.length}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">طلبات انضمام للفرق</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-amber-400" />
                      تحليل فجوة المهارات (Market Skills Gap Analysis)
                    </h3>
                    <p className="text-[11px] text-slate-400">مقارنة نسبة طلب سوق العمل بنسبة مهارات الطلاب المتوفرة</p>
                  </div>
                  <span className="text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2.5 py-1 rounded-lg">
                    مؤشر موجه للجامعة وأصحاب القرار
                  </span>
                </div>

                <div className="space-y-4 pt-2">
                  {[
                    { skill: 'Python & FastAPI', demand: 78, supply: 55, status: 'توازن جيد' },
                    { skill: 'SQL & Database Architecture', demand: 72, supply: 68, status: 'تغطية ممتازة' },
                    { skill: 'Power BI & Data Analytics', demand: 65, supply: 28, status: '⚠️ فجوة حرجة (طلب عالٍ ونقص طلبة)' },
                    { skill: 'React & Frontend Frameworks', demand: 60, supply: 64, status: 'وفرة طلابية' },
                    { skill: 'Cybersecurity & Ethical Hacking', demand: 45, supply: 20, status: '⚠️ بحاجة لورشات تدريبية' }
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-white">{item.skill}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          item.status.includes('فجوة') 
                            ? 'bg-rose-950/60 text-rose-300 border border-rose-800/50' 
                            : 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/50'
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>طلب سوق العمل: <strong className="text-amber-400">{item.demand}%</strong></span>
                          <span>المتوفر لدى الطلبة: <strong className="text-blue-400">{item.supply}%</strong></span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
                          <div className="bg-amber-500 h-2" style={{ width: `${item.demand}%` }}></div>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden flex">
                          <div className="bg-blue-500 h-1.5" style={{ width: `${item.supply}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed text-amber-200/90">
                    <strong>توصية النظام لعمادة الكلية والمشرفين:</strong> توجد فجوة بنسبة <strong>37%</strong> في مهارات ذكاء الأعمال (Power BI) وتحليل البيانات، حيث تطلبها مشاريع المحلات والمتاجر بشكل متزايد بينما يركز معظم الطلاب على الواجهات الأمامية. يُوصى بتوجيه طلاب مشاريع تخرج 1 نحو أنظمة الـ BI والتحليل.
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'milestones' ? (
            /* مراحل التخرج */
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">خريطة طريق التخرج (Milestones Tracker)</h2>
                <p className="text-xs text-slate-400 mt-1">متابعة دقيقة للخطوات المعتمدة لدى كلية الهندسة والتكنولوجيا ومشاريع التخرج</p>
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
            /* بطاقات المشاريع والمطابقة */
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

                        <div className="mb-3 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
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

                        <div className="space-y-2 mb-4 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span className="flex items-center gap-1 font-medium text-slate-300">
                              <Sparkles className="w-3 h-3 text-blue-400" /> تحليل مطابقة المهارات:
                            </span>
                            <span className="text-emerald-400 font-bold">{project.matchedSkills?.length || 0} متوفرة</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-1.5">
                            {project.matchedSkills && project.matchedSkills.map((skill, idx) => (
                              <span
                                key={`m-${idx}`}
                                className="text-[10px] bg-emerald-950/50 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded-md flex items-center gap-1"
                              >
                                ✓ {skill}
                              </span>
                            ))}

                            {project.missingSkills && project.missingSkills.map((skill, idx) => (
                              <span
                                key={`mis-${idx}`}
                                className="text-[10px] bg-rose-950/40 text-rose-300 border border-rose-800/50 px-2 py-0.5 rounded-md flex items-center gap-1"
                              >
                                ⚠️ ناقص: {skill}
                              </span>
                            ))}
                          </div>
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
                          {isFull ? 'مكتمل' : 'تقديم طلب انضمام / فريق'}
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

      {/* نافذة تسجيل الدخول */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <button 
              onClick={() => { setShowAuthModal(false); setAuthError(''); }} 
              className="absolute left-4 top-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-blue-900/50 border border-blue-500/30 flex items-center justify-center text-amber-400">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white">
                {authMode === 'login' ? 'تسجيل الدخول إلى البوابة الأكاديمية' : 'إنشاء حساب جديد'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                منصة مشاريع التخرج وربط سوق العمل
              </p>
            </div>

            <div className="mb-4">
              <label className="text-[11px] text-slate-400 block mb-1.5 font-medium">نوع الحساب:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'student', label: 'طالب خريج', icon: '🎓' },
                  { id: 'business', label: 'متجر / شركة', icon: '🏢' },
                  { id: 'supervisor', label: 'مشرف أكاديمي', icon: '🏛️' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAuthRole(item.id)}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 border transition cursor-pointer ${
                      authRole === item.id
                        ? 'border-blue-500 bg-blue-600/20 text-blue-200'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="text-[10px]">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {authError && (
              <div className="p-2.5 mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl text-center">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {authMode === 'register' && (
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">الاسم الكامل / اسم المتجر</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحمد محمود أو شركة الأندلس"
                    value={authFullName}
                    onChange={(e) => setAuthFullName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">البريد الإلكتروني / اسم المستخدم</label>
                <input
                  type="email"
                  required
                  placeholder="user@edu.ps"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">كلمة المرور</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 text-left"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/20 cursor-pointer mt-2"
              >
                {authMode === 'login' ? 'دخول إلى الحساب' : 'تأكيد التسجيل وإنشاء الحساب'}
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-slate-800 text-center">
              {authMode === 'login' ? (
                <p className="text-xs text-slate-400">
                  ليس لديك حساب بعد؟{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('register'); setAuthError(''); }}
                    className="text-amber-400 hover:underline font-semibold cursor-pointer"
                  >
                    إنشاء حساب جديد
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  لديك حساب بالفعل؟{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setAuthError(''); }}
                    className="text-blue-400 hover:underline font-semibold cursor-pointer"
                  >
                    تسجيل الدخول
                  </button>
                </p>
              )}
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
            <h2 className="text-base font-bold mb-1 text-white">
              تقديم طلب لـ: <span className="text-blue-400">{selectedProject?.title}</span>
            </h2>
            <p className="text-[11px] text-slate-400 mb-4">يمكنك التقدم كطالب مستقل أو تشكيل فريق مع زملائك</p>

            {applySuccess ? (
              <p className="text-emerald-400 text-center font-bold py-6 text-sm">{applySuccess}</p>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-3.5">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-slate-200">التقدم كفريق متكامل (Team Formation)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={applyAsTeam}
                    onChange={(e) => setApplyAsTeam(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                  />
                </div>

                {applyAsTeam && (
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">أسماء وتخصصات أعضاء الفريق المقترح</label>
                    <input
                      type="text"
                      placeholder="مثال: أحمد (CIS - Data)، سارة (CS - ML)، محمد (SE - Frontend)"
                      value={teamMembersInput}
                      onChange={(e) => setTeamMembersInput(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                )}

                <input
                  type="text"
                  placeholder="اسمك الكامل (قائد الفريق)"
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

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div className="text-blue-400 font-semibold flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> سيتم إرفاق سيرتك الذاتية تلقائياً:
                  </div>
                  <div>• التخصص: {studentCv.major}</div>
                  <div>• المساق: {studentCv.course}</div>
                  <div>• المهارات: {userSkills.slice(0, 4).join(', ')}...</div>
                </div>

                <textarea
                  placeholder="رسالة تعريفية موجزة أو نبذة عن جاهزية الفريق..."
                  rows={2}
                  value={applicantMessage}
                  onChange={(e) => setApplicantMessage(e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl font-semibold text-xs text-white transition shadow-lg cursor-pointer"
                >
                  إرسال الطلب والسيرة الذاتية للمشرف الأكاديمي
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* نافذة إضافة مشروع */}
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
                    {ACADEMIC_MAJORS.map((m, idx) => (
                      <option key={idx} value={m}>{m}</option>
                    ))}
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
                  placeholder={currentUser?.role === 'business' ? 'اشرح ما تحتاجه ببساطة...' : 'وصف الفكرة وأهداف المشروع التقنية...'}
                  rows={3}
                  required
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="المهارات المقترحة (مثال: React, Python, SQL, Power BI)"
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

      {/* نافذة استعراض طلبات الطلاب */}
      {showApplicationsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 relative">
            <button onClick={() => setShowApplicationsModal(false)} className="absolute left-4 top-4 text-slate-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold mb-1 text-white">
              {currentUser?.role === 'supervisor' ? 'اعتماد وإسناد طلبات مشاريع التخرج' : 'طلبات الطلاب المتقدمين لمشاريع محلك'}
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              {currentUser?.role === 'supervisor' 
                ? 'بصفتك المشرف الأكاديمي، تملك الصلاحية الحصرية لاعتماد أو رفض إسناد المشروع للفرق الطلابية.'
                : 'قائمة الطلاب المتقدمين لمشاريعك.'}
            </p>

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
                      <p className="text-xs text-slate-400 leading-relaxed">{app.message}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {currentUser?.role === 'supervisor' ? (
                        app.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(app.id, 'accepted')}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg transition cursor-pointer"
                              title="اعتماد وإسناد المشروع للطالب"
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
                            {app.status === 'accepted' ? 'معتمد رسمياً' : 'مرفوض'}
                          </span>
                        )
                      ) : (
                        <span className="text-[11px] text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2.5 py-1 rounded-lg">
                          {app.status === 'accepted' ? 'تم الاعتماد' : 'بانتظار المشرف'}
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