import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Briefcase, CheckCircle, Clock, Search, PlusCircle, 
  Users, BarChart2, Bell, X, Check, Sparkles,
  Calendar, Award, TrendingUp, Download, Megaphone, ArrowUpRight,
  Star, MessageSquare, Layers, LogIn, LogOut, Store, UserCheck,
  Menu, ShieldCheck, GraduationCap, FileText, AlertTriangle, PieChart,
  Edit2, Trash2, MessageSquarePlus, Save, UploadCloud, Send, ExternalLink,
  Lock, KeyRound, Mail, AlertCircle, RefreshCw, UserPlus, CheckCircle2, XCircle
} from 'lucide-react';

// عنوان الباك إند API: يدعم السيرفر المحلي تلقائياً عند التشغيل على localhost
const API_URL = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8000'
    : 'https://capstone-market.onrender.com'
);

const ACADEMIC_MAJORS = [
  'أنظمة المعلومات الحاسوبية (CIS)',
  'علم الحاسوب (Computer Science)',
  'تقنية المعلومات والاتصالات (IT)',
  'أمن المعلومات والأدلة الرقمية (Cybersecurity)',
  'الوسائط الرقمية وتكنولوجيا الويب',
  'هندسة البرمجيات'
];

// بيانات مشاريع افتراضية احتياطية في حال كانت قاعدة البيانات فارغة تماماً
const INITIAL_FALLBACK_PROJECTS = [
  {
    id: 1,
    title: 'نظام إدارة المستودعات ونقاط البيع السحابي (POS)',
    description: 'نظام متكامل لمتجر تجزئة لربط عمليات البيع بالمخزون وإصدار تنبيهات عند نفاد البضائع، مع تقارير أرباح يومية.',
    category: 'أنظمة المعلومات الحاسوبية (CIS)',
    difficulty: 'متوسط',
    hoursPerWeek: 12,
    maxMembers: 4,
    currentMembers: 2,
    required_skills: 'Python, SQL, FastAPI, React',
    skills: ['Python', 'SQL', 'FastAPI', 'React'],
    created_by: 1
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
    required_skills: 'Python, Power BI, SQL, Machine Learning',
    skills: ['Python', 'Power BI', 'SQL', 'Machine Learning'],
    created_by: 1
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
    required_skills: 'Cybersecurity, Python, Docker, Linux',
    skills: ['Cybersecurity', 'Python', 'Docker', 'Linux'],
    created_by: 2
  },
  {
    id: 4,
    title: 'تطبيق ويب لحجز المواعيد وإدارة الطلبات للشركات الخدمية',
    description: 'منصة ويب متجاوبة تمكن الزبائن من حجز خدمات الصيانة ومتابعة حالة الطلب مع إشعارات فورية.',
    category: 'الوسائط الرقمية وتكنولوجيا الويب',
    difficulty: 'متوسط',
    hoursPerWeek: 10,
    maxMembers: 4,
    currentMembers: 2,
    required_skills: 'React, TailwindCSS, FastAPI, Docker',
    skills: ['React', 'TailwindCSS', 'FastAPI', 'Docker'],
    created_by: 2
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
    required_skills: 'Python, Docker, Machine Learning, FastAPI',
    skills: ['Python', 'Docker', 'Machine Learning', 'FastAPI'],
    created_by: 1
  }
];

export default function App() {
  // ==========================================
  // حالات المستخدم والجلسة (Auth & User State)
  // ==========================================
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('app_user_role');
    const token = localStorage.getItem('token');
    return (saved && token) ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('app_user_role');
    const token = localStorage.getItem('token');
    if (saved && token) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.role === 'supervisor') return 'supervisor_teams';
        if (parsed.role === 'company' || parsed.role === 'partner') return 'company_projects';
        return 'match';
      } catch {
        return 'login';
      }
    }
    return 'login';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  // فورم التوثيق الحقيقي (تسجيل الدخول / إنشاء حساب)
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authRole, setAuthRole] = useState('student');
  const [authFullName, setAuthFullName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // مهارات الطالب
  const [userSkills, setUserSkills] = useState(['Python', 'FastAPI', 'Docker', 'React', 'TailwindCSS']);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [showSkillsModal, setShowSkillsModal] = useState(false);

  // السيرة الذاتية للطالب
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

  // ==========================================
  // حالات المشاريع والطلبات الحية (Live Projects & Applications)
  // ==========================================
  const [rawProjects, setRawProjects] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  const [applications, setApplications] = useState([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);

  // فورم طرح مشروع جديد
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectSkills, setNewProjectSkills] = useState('');
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);

  // فورم التقديم على مشروع
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [applicantRole, setApplicantRole] = useState('مطور أنظمة وواجهات');
  const [applyMessage, setApplyMessage] = useState('');
  const [isSubmittingApply, setIsSubmittingApply] = useState(false);

  // المفضلة
  const [favorites, setFavorites] = useState([]);

  // التقارير والمتابعة الأكاديمية
  const [reportsTimeline, setReportsTimeline] = useState([
    {
      id: 1,
      title: 'وثيقة مقترح المشروع وتحليل المشكلة (Project Proposal & Problem Statement)',
      deadlineDay: 'الثلاثاء القادم',
      deadlineDate: '2026-10-13',
      status: 'submitted',
      submissionLink: 'https://docs.google.com/document/d/demo_proposal',
      submittedAt: 'الأحد، 11 أكتوبر 2026',
      supervisorFeedback: 'تم استلام المقترح المبدئي. يرجى التركيز أكثر على جزئية قاعدة بيانات المتجر وتوضيح الـ Schema.',
      grade: '88/100'
    },
    {
      id: 2,
      title: 'وثيقة هندسة المتطلبات والنظام (SRS & Architecture Specification)',
      deadlineDay: 'الثلاثاء 27 أكتوبر',
      deadlineDate: '2026-10-27',
      status: 'pending',
      submissionLink: '',
      submittedAt: '',
      supervisorFeedback: 'بانتظار تسليم المخططات الـ UML ومسارات الـ REST API.',
      grade: 'قيد الانتظار'
    },
    {
      id: 3,
      title: 'النموذج الأولي واختبار التوافق مع الشركة (Prototype & User Testing)',
      deadlineDay: 'الثلاثاء 17 نوفمبر',
      deadlineDate: '2026-11-17',
      status: 'pending',
      submissionLink: '',
      submittedAt: '',
      supervisorFeedback: 'سيتم فحص الكود المشترك على GitHub.',
      grade: 'قيد الانتظار'
    }
  ]);

  const [editingReportId, setEditingReportId] = useState(null);
  const [editDeadlineInput, setEditDeadlineInput] = useState('');
  const [editFeedbackInput, setEditFeedbackInput] = useState('');
  const [submitReportModal, setSubmitReportModal] = useState(null);
  const [reportUrlInput, setReportUrlInput] = useState('');

  // المحادثة الأكاديمية
  const [supervisionChat, setSupervisionChat] = useState([
    { sender: 'supervisor', name: 'د. إياد الأحمد (المشرف الأكاديمي)', text: 'مرحباً بالجميع، تذكير بأن موعد تسليم تقرير المقترح SRS محدد يوم الثلاثاء القادم دون تأخير.', time: '10:30 ص' },
    { sender: 'student', name: 'أحمد منصور (قائد الفريق)', text: 'أهلاً دكتور، قمنا بإنهاء المخططات المبدئية ورفعنا رابط المسودة في خانة التسليم.', time: '11:15 ص' }
  ]);
  const [chatInputText, setChatInputText] = useState('');

  // قائمة الطلاب المتاحين
  const [studentsList, setStudentsList] = useState([
    {
      id: 'st-1',
      academicId: '12020412',
      name: 'أحمد منصور',
      major: 'أنظمة المعلومات الحاسوبية (CIS)',
      course: 'مشروع تخرج 2',
      role: 'محلل أعمال وقواعد بيانات',
      skills: ['SQL', 'Power BI', 'Python', 'ETL'],
      isFree: false,
      projectTitle: 'نظام إدارة المستودعات ونقاط البيع السحابي (POS)',
      supervisorNote: 'فريق ملتزم، تم تسليم مقترح المتطلبات بنجاح.',
      avatar: '👨‍💼'
    },
    {
      id: 'st-2',
      academicId: '12020589',
      name: 'سارة خليل',
      major: 'علم الحاسوب (Computer Science)',
      course: 'مشروع تخرج 1',
      role: 'مهندسة ذكاء اصطناعي وباك إند',
      skills: ['Python', 'FastAPI', 'Machine Learning', 'Docker'],
      isFree: true,
      projectTitle: 'غير مرتبط بمشروع',
      supervisorNote: 'طالبة متميزة تبحث عن فريق يركز على الـ AI.',
      avatar: '👩‍💻'
    },
    {
      id: 'st-3',
      academicId: '12022410',
      name: 'يزن النجار',
      major: 'هندسة البرمجيات',
      course: 'مشروع تخرج 2',
      role: 'مطور واجهات وسحابي',
      skills: ['React', 'TailwindCSS', 'Docker', 'TypeScript'],
      isFree: false,
      projectTitle: 'تطبيق ويب لحجز المواعيد وإدارة الطلبات',
      supervisorNote: 'بحاجة لمتابعة تقرير فحص الأمان.',
      avatar: '👨‍💻'
    },
    {
      id: 'st-4',
      academicId: '12019844',
      name: 'عمر الرمحي',
      major: 'أمن المعلومات والأدلة الرقمية',
      course: 'مشروع تخرج 2',
      role: 'مهندس أمن سيبراني وبنية تحتية',
      skills: ['Cybersecurity', 'Linux', 'Network Security', 'Python'],
      isFree: false,
      projectTitle: 'بوابة تدقيق الثغرات واكتشاف الاختراقات',
      supervisorNote: 'تم اعتماد المرحلة الأولى من التقرير SRS.',
      avatar: '🛡️'
    },
    {
      id: 'st-5',
      academicId: '12120031',
      name: 'ليلى قاسم',
      major: 'الوسائط الرقمية وتكنولوجيا الويب',
      course: 'مشروع تخرج 1',
      role: 'مصممة واجهات ومطورة ويب',
      skills: ['React', 'Figma', 'UI/UX', 'CSS Architecture'],
      isFree: true,
      projectTitle: 'غير مرتبط بمشروع',
      supervisorNote: 'تنتظر التسكين مع فريق يحتاج مصمم واجهات.',
      avatar: '🎨'
    },
    {
      id: 'st-6',
      academicId: '12021155',
      name: 'كريم الشيخ',
      major: 'تقنية المعلومات والاتصالات (IT)',
      course: 'مشروع تخرج 1',
      role: 'إدارة أنظمة وشبكات',
      skills: ['Linux', 'Docker', 'System Admin', 'Bash'],
      isFree: true,
      projectTitle: 'غير مرتبط بمشروع',
      supervisorNote: '',
      avatar: '⚙️'
    }
  ]);

  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [editStatusValue, setEditStatusValue] = useState(false);
  const [editProjectTitle, setEditProjectTitle] = useState('');

  // ==========================================
  // مساعد استدعاء الـ API مع معالجة انتهاء الجلسة (401 Logout)
  // ==========================================
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('app_user_role');
    setCurrentUser(null);
    setIsSidebarOpen(false);
    setShowApplicationsModal(false);
    setIsApplyModalOpen(false);
    setIsCreateModalOpen(false);
    setActiveTab('login');
  }, []);

  const apiFetch = useCallback(async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    // الشرط 1: إذا كانت استجابة أي استدعاء 401 يتم عمل Logout تلقائي ومسح الجلسة
    if (response.status === 401) {
      handleLogout();
      throw new Error('انتهت صلاحية جلسة الدخول، يرجى تسجيل الدخول مجدداً.');
    }

    return response;
  }, [handleLogout]);

  // ==========================================
  // جلب المشاريع الحية من الباك إند
  // ==========================================
  const fetchProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    try {
      const res = await fetch(`${API_URL}/projects/`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((p, idx) => {
            const projectSkills = p.required_skills
              ? p.required_skills.split(',').map((s) => s.trim()).filter(Boolean)
              : ['Python', 'FastAPI'];

            return {
              id: p.id,
              title: p.title || 'مشروع تخرج',
              description: p.description || 'لا يوجد وصف متوفر حالياً.',
              required_skills: p.required_skills || '',
              skills: projectSkills,
              created_by: p.created_by,
              created_at: p.created_at,
              category: ACADEMIC_MAJORS[idx % ACADEMIC_MAJORS.length],
              difficulty: idx % 2 === 0 ? 'متوسط' : 'متقدم',
              hoursPerWeek: 10 + (idx % 3) * 2,
              maxMembers: 4,
              currentMembers: 1
            };
          });
          setRawProjects(formatted);
          return;
        }
      }
      // في حال عدم وجود مشاريع بالخادم نستخدم المشاريع الأولية لضمان استقرار العرض
      setRawProjects(INITIAL_FALLBACK_PROJECTS);
    } catch (err) {
      console.warn('تعذر الاتصال بـ API المشاريع، استخدام البيانات الاحتياطية:', err);
      setRawProjects(INITIAL_FALLBACK_PROJECTS);
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  // ==========================================
  // جلب طلبات الانضمام الحية من الباك إند
  // ==========================================
  const fetchApplications = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsLoadingApplications(true);
    try {
      const res = await apiFetch('/applications/');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setApplications(data);
        }
      }
    } catch (err) {
      console.warn('خطأ في جلب طلبات الانضمام:', err.message);
    } finally {
      setIsLoadingApplications(false);
    }
  }, [apiFetch]);

  // ==========================================
  // التحقق من صحة التوكن وجلب بيانات /me عند تحميل الصفحة
  // ==========================================
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_URL}/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            const normalizedRole = (data.role === 'partner' || data.role === 'business') ? 'company' : data.role;
            const titleByRole = {
              student: 'طالب خريج',
              supervisor: 'مشرف أكاديمي',
              company: 'شريك تجاري / شركة',
              admin: 'مسؤول النظام'
            };

            const userObj = {
              id: data.id,
              name: data.full_name,
              email: data.email,
              role: normalizedRole,
              rawRole: data.role,
              title: titleByRole[normalizedRole] || data.role
            };

            setCurrentUser(userObj);
            localStorage.setItem('app_user_role', JSON.stringify(userObj));
          } else if (res.status === 401) {
            handleLogout();
          }
        })
        .catch(() => {
          // في حال عدم عمل السيرفر نعتمد الكاش المحلي
        });
    }

    fetchProjects();
  }, [fetchProjects, handleLogout]);

  // تحديث الطلبات كلما تغير المستخدم المسجل
  useEffect(() => {
    if (currentUser) {
      fetchApplications();
    }
  }, [currentUser, fetchApplications]);

  // ==========================================
  // حساب نسبة المطابقة الذكية للمشاريع
  // ==========================================
  const matchedProjects = useMemo(() => {
    const list = rawProjects.length > 0 ? rawProjects : INITIAL_FALLBACK_PROJECTS;
    return list.map((p) => {
      const projectSkills = Array.isArray(p.skills) && p.skills.length > 0
        ? p.skills
        : (typeof p.required_skills === 'string' && p.required_skills
            ? p.required_skills.split(',').map((s) => s.trim()).filter(Boolean)
            : ['Python', 'FastAPI']);

      const matchedSkills = projectSkills.filter((s) =>
        userSkills.map((u) => u.toLowerCase()).includes(s.toLowerCase())
      );

      const missingSkills = projectSkills.filter((s) =>
        !userSkills.map((u) => u.toLowerCase()).includes(s.toLowerCase())
      );

      const matchPercent = projectSkills.length > 0 
        ? Math.round((matchedSkills.length / projectSkills.length) * 100)
        : 60;

      return {
        ...p,
        skills: projectSkills,
        matchRate: matchPercent,
        match: `${matchPercent}% تطابق`,
        matchedSkills,
        missingSkills
      };
    });
  }, [rawProjects, userSkills]);

  // ==========================================
  // عمليات تسجيل الدخول والتسجيل الحقيقي
  // ==========================================
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setIsLoadingAuth(true);

    try {
      if (authMode === 'register') {
        // إنشاء مستخدم جديد عبر POST /users/
        const regRes = await fetch(`${API_URL}/users/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: authFullName || authEmail.split('@')[0],
            email: authEmail,
            password: authPassword,
            role: authRole
          })
        });

        if (!regRes.ok) {
          const errData = await regRes.json().catch(() => ({}));
          throw new Error(errData.detail || 'تعذر إنشاء الحساب، يرجى التأكد من البيانات.');
        }

        setAuthSuccess('تم إنشاء الحساب بنجاح! جاري تسجيل الدخول...');
      }

      // تسجيل الدخول الحقيقي عبر POST /login (OAuth2 Password Request Form)
      const loginParams = new URLSearchParams();
      loginParams.append('username', authEmail);
      loginParams.append('password', authPassword);

      const loginRes = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginParams.toString()
      });

      if (!loginRes.ok) {
        const errData = await loginRes.json().catch(() => ({}));
        throw new Error(errData.detail || 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      }

      const tokenData = await loginRes.json();
      const token = tokenData.access_token;
      localStorage.setItem('token', token);

      // جلب بيانات المستخدم الحالية وصلاحياته من GET /me
      const meRes = await fetch(`${API_URL}/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!meRes.ok) {
        throw new Error('فشل جلب بيانات وصلاحيات المستخدم.');
      }

      const userData = await meRes.json();
      const normalizedRole = (userData.role === 'partner' || userData.role === 'business') ? 'company' : userData.role;
      const titleByRole = {
        student: 'طالب خريج',
        supervisor: 'مشرف أكاديمي',
        company: 'شريك تجاري / شركة',
        admin: 'مسؤول النظام'
      };

      const userObj = {
        id: userData.id,
        name: userData.full_name,
        email: userData.email,
        role: normalizedRole,
        rawRole: userData.role,
        title: titleByRole[normalizedRole] || userData.role
      };

      localStorage.setItem('app_user_role', JSON.stringify(userObj));
      setCurrentUser(userObj);

      // التوجيه للتبويب المناسب حسب الدور القادم من الباك إند
      if (normalizedRole === 'supervisor') {
        setActiveTab('supervisor_teams');
      } else if (normalizedRole === 'company') {
        setActiveTab('company_projects');
      } else {
        setActiveTab('match');
      }

      fetchProjects();
      fetchApplications();
    } catch (err) {
      setAuthError(err.message || 'حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // تعبئة سريعة لبيانات التجربة للمشرف / الشركة / الطالب
  const fillDemoCredentials = (role) => {
    setAuthRole(role);
    setAuthError('');
    if (role === 'student') {
      setAuthFullName('أحمد منصور');
      setAuthEmail('student@capstone.ps');
      setAuthPassword('pass1234');
    } else if (role === 'company') {
      setAuthFullName('شركة النور للحلول البرمجية');
      setAuthEmail('company@capstone.ps');
      setAuthPassword('pass1234');
    } else {
      setAuthFullName('د. إياد الأحمد');
      setAuthEmail('supervisor@capstone.ps');
      setAuthPassword('pass1234');
    }
  };

  // ==========================================
  // إضافة مشروع جديد للشركة (POST /projects/)
  // ==========================================
  const handleCreateProjectSubmit = async (e) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;

    setIsSubmittingProject(true);
    try {
      const res = await apiFetch('/projects/', {
        method: 'POST',
        body: JSON.stringify({
          title: newProjectTitle.trim(),
          description: newProjectDesc.trim(),
          required_skills: newProjectSkills.trim()
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'تعذر إضافة المشروع.');
      }

      await fetchProjects();
      setIsCreateModalOpen(false);
      setNewProjectTitle('');
      setNewProjectDesc('');
      setNewProjectSkills('');
      alert('تم طرح المشروع بنجاح وحفظه في قاعدة البيانات!');
    } catch (err) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setIsSubmittingProject(false);
    }
  };

  // ==========================================
  // تقديم طلب انضمام لمشروع (POST /applications/)
  // ==========================================
  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;

    setIsSubmittingApply(true);
    try {
      const fullMsg = `[الدور: ${applicantRole}] [التخصص: ${studentCv.major}] - ${applyMessage || 'أرغب بالانضمام لتنفيذ هذا المشروع ومتحمس لتقديم أفضل نتائج.'}`;

      const res = await apiFetch('/applications/', {
        method: 'POST',
        body: JSON.stringify({
          project_id: selectedProject.id,
          message: fullMsg
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'تعذر تقديم الطلب.');
      }

      await fetchApplications();
      setIsApplyModalOpen(false);
      setApplyMessage('');
      alert('تم إرسال طلب انضمامك بنجاح وحفظه في قاعدة البيانات!');
    } catch (err) {
      alert(`تنبيه: ${err.message}`);
    } finally {
      setIsSubmittingApply(false);
    }
  };

  // ==========================================
  // تحديث حالة الطلب من الشركة أو المشرف (PUT /applications/{id}/status)
  // ==========================================
  const handleUpdateApplicationStatus = async (applicationId, targetStatus) => {
    try {
      const res = await apiFetch(`/applications/${applicationId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: targetStatus })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'تعذر تحديث حالة الطلب.');
      }

      setApplications((prev) =>
        prev.map((app) => app.id === applicationId ? { ...app, status: targetStatus } : app)
      );
      alert(`تم ${targetStatus === 'accepted' ? 'قبول' : 'رفض'} الطلب بنجاح!`);
    } catch (err) {
      alert(`خطأ: ${err.message}`);
    }
  };

  // المهارات
  const addSkill = () => {
    if (newSkillInput.trim() && !userSkills.includes(newSkillInput.trim())) {
      setUserSkills([...userSkills, newSkillInput.trim()]);
      setNewSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setUserSkills(userSkills.filter((s) => s !== skillToRemove));
  };

  // السيرة الذاتية
  const handleSaveCv = (e) => {
    e.preventDefault();
    localStorage.setItem('student_academic_cv', JSON.stringify(studentCv));
    setCvUpdateMessage('تم حفظ وتحديث السيرة الذاتية بنجاح!');
    setTimeout(() => setCvUpdateMessage(''), 2500);
  };

  // المفضلة
  const toggleFavorite = (id) => {
    setFavorites((prev) => 
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
  };

  // الشات الأكاديمي
  const sendSupervisionMsg = (e) => {
    e.preventDefault();
    if (!chatInputText.trim()) return;
    const newMsg = {
      sender: currentUser?.role === 'supervisor' ? 'supervisor' : 'student',
      name: currentUser?.name || 'مستخدم',
      text: chatInputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setSupervisionChat((prev) => [...prev, newMsg]);
    setChatInputText('');
  };

  // تسليم تقرير الطالب
  const handleStudentSubmitReport = (e) => {
    e.preventDefault();
    if (!reportUrlInput.trim()) return;

    setReportsTimeline((prev) =>
      prev.map((r) =>
        r.id === submitReportModal.id
          ? {
              ...r,
              status: 'submitted',
              submissionLink: reportUrlInput,
              submittedAt: 'اليوم، تم التسليم بنجاح'
            }
          : r
      )
    );
    setSubmitReportModal(null);
    setReportUrlInput('');
    alert('تم رفع التقرير بنجاح للمشرف الأكاديمي!');
  };

  // تحديث موعد تقرير من المشرف
  const handleUpdateReportDeadline = (reportId) => {
    setReportsTimeline((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? { ...r, deadlineDay: editDeadlineInput || r.deadlineDay, supervisorFeedback: editFeedbackInput || r.supervisorFeedback }
          : r
      )
    );
    setEditingReportId(null);
  };

  // تصفية المشاريع
  const filteredProjects = matchedProjects
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

  // تصفية مشاريع الشركة الحالية
  const myCompanyProjects = useMemo(() => {
    if (!currentUser || currentUser.role !== 'company') return [];
    const created = matchedProjects.filter((p) => p.created_by === currentUser.id);
    return created.length > 0 ? created : matchedProjects.slice(0, 2);
  }, [currentUser, matchedProjects]);

  const pendingCount = applications.filter((app) => app.status === 'pending').length;
  const categories = ['الكل', ...ACADEMIC_MAJORS];

  // ==========================================
  // شاشة تسجيل الدخول وإنشاء الحساب
  // ==========================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans" dir="rtl">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-xs py-2.5 px-6 border-b border-amber-500/20 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-2 text-amber-300 font-semibold">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            بوابة منظومة مشاريع التخرج وربط سوق العمل (Capstone Market)
          </div>
          <span className="text-slate-400 text-[11px] hidden md:inline">
            الدخول الموحد للطلبة والمشرفين والشركات
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-7 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-950 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {authMode === 'login' ? 'تسجيل الدخول للنظام' : 'إنشاء حساب مستخدم جديد'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {authMode === 'login' 
                  ? 'يتم التحقق من بياناتك وتحديد صلاحياتك تلقائياً من خادم الـ API' 
                  : 'أدخل بياناتك لإنشاء حساب وتسجيل الدخول تلقائياً'}
              </p>
            </div>

            {/* أزرار التجربة السريعة للأدوار */}
            <div className="mb-4">
              <span className="text-[11px] text-slate-400 font-medium block mb-1.5">
                {authMode === 'login' ? 'اختيار بيانات تجريبية سريعة:' : 'اختر دورك في المنصة:'}
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'student', label: 'طالب خريج', icon: '🎓' },
                  { id: 'company', label: 'شركة / متجر', icon: '🏢' },
                  { id: 'supervisor', label: 'مشرف أكاديمي', icon: '🏛️' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => fillDemoCredentials(item.id)}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                      authRole === item.id
                        ? 'border-blue-500 bg-blue-600/20 text-white shadow-md'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="text-[10px]">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{authSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {authMode === 'register' && (
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1 font-medium">الاسم الكامل / اسم المنشأة</label>
                  <div className="relative">
                    <UserPlus className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={authFullName}
                      onChange={(e) => setAuthFullName(e.target.value)}
                      placeholder="أحمد منصور أو شركة التقنية"
                      className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pr-10 pl-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] text-slate-300 block mb-1 font-medium">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pr-10 pl-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1 font-medium">كلمة المرور</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pr-10 pl-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoadingAuth}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isLoadingAuth ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    جاري التحقق من الـ API...
                  </>
                ) : authMode === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    دخول إلى النظام (POST /login)
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    إنشاء الحساب ودخول النظام
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setAuthError('');
                  setAuthSuccess('');
                }}
                className="text-xs text-blue-400 hover:text-blue-300 transition"
              >
                {authMode === 'login' 
                  ? 'ليس لديك حساب بعد؟ اضغط لإنشاء حساب جديد' 
                  : 'لديك حساب بالفعل؟ العودة لتسجيل الدخول'}
              </button>
            </div>
          </div>
        </div>

        <footer className="text-center py-3 text-[11px] text-slate-500 border-t border-slate-900 bg-slate-950">
          منظومة إدارة مشاريع التخرج الأكاديمية والربط بسوق العمل © 2026
        </footer>
      </div>
    );
  }

  // ==========================================
  // الشاشة الرئيسية بعد تسجيل الدخول الحقيقي
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" dir="rtl">
      
      {/* الشريط العلوي للمواعيد */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-xs py-2 px-4 md:px-6 shadow-md flex items-center justify-between border-b border-amber-500/20">
        <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <span className="flex items-center gap-1.5 bg-amber-500 text-slate-950 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
            <Megaphone className="w-3 h-3" /> تسليمات المساق
          </span>
          <span className="text-slate-200 text-xs truncate">
            📅 موعد تسليم التقرير القادم لجميع الفرق: <strong>الثلاثاء القادم (وثيقة SRS والنموذج المبدئي)</strong>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-amber-300/80 text-xs">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> الفصل الدراسي 2026/2027
          </span>
        </div>
      </div>

      {/* رأس الصفحة الثابت: h-16 و z-40 لمنع غطاء السايد بار له */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40 h-16 px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="w-10 h-10 rounded-xl bg-blue-900 border border-amber-500/30 flex items-center justify-center font-black text-amber-400 shadow-md">
            {currentUser.role === 'company' ? <Store className="w-5 h-5" /> : currentUser.role === 'supervisor' ? <ShieldCheck className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
          </div>
          <div>
            <h1 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
              منصة مشاريع التخرج وربط سوق العمل
            </h1>
            <p className="text-[11px] text-slate-400">
              جلسة نشطة: <strong className="text-slate-200">{currentUser.name}</strong> ({currentUser.title})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {currentUser.role !== 'company' && (
            <button
              onClick={() => setActiveTab('reports_hub')}
              className="hidden sm:flex items-center gap-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-200 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              تسليم ومتابعة التقارير
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl text-xs text-slate-200">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>{currentUser.name}</span>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
              title="تسجيل الخروج والعودة لشاشة الدخول"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* جسم المنصة الرئيسي */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* خلفية معتمة على الموبايل تبدأ من top-16 وزاوية z-20 لتكون أسفل الهيدر تماماً */}
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-x-0 top-16 bottom-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
          />
        )}

        {/* القائمة الجانبية: تبدأ على الموبايل من top-16 و z-30 وتكون sticky على الديسكتوب */}
        <aside className={`
          fixed top-16 bottom-0 right-0 z-30 w-64 bg-slate-900 border-l border-slate-800 p-4 
          overflow-y-auto flex flex-col justify-between transition-transform duration-300 ease-in-out
          md:static md:top-auto md:bottom-auto md:h-auto md:z-auto
          ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
          <div className="space-y-3">
            <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-xl mb-4">
              <span className="text-[10px] text-slate-400 block mb-0.5">الحساب النشط (GET /me):</span>
              <p className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                {currentUser.role === 'company' ? (
                  <Store className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                ) : currentUser.role === 'supervisor' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : (
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
                {currentUser.name}
              </p>
              <span className="text-[10px] text-slate-400 block mt-1">
                {currentUser.title}
              </span>
            </div>

            <p className="text-[11px] font-semibold text-slate-500 uppercase px-2">لوحة التحكم والتنقل</p>
            
            {currentUser.role !== 'company' && (
              <button
                onClick={() => { setActiveTab('reports_hub'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  activeTab === 'reports_hub'
                    ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                    : 'bg-slate-800/70 border-slate-700 text-amber-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  تسليم ومتابعة التقارير
                </div>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                  الثلاثاء
                </span>
              </button>
            )}

            {currentUser.role === 'supervisor' && (
              <>
                <button
                  onClick={() => { setActiveTab('supervisor_teams'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    activeTab === 'supervisor_teams'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    إدارة ومتابعة شُعب التخرج
                  </div>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                    إشراف
                  </span>
                </button>

                <button
                  onClick={() => {
                    setShowApplicationsModal(true);
                    setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium bg-slate-800/60 hover:bg-slate-800 text-slate-300 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    اعتماد وإدارة الطلبات
                  </div>
                  {pendingCount > 0 && (
                    <span className="bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {pendingCount}
                    </span>
                  )}
                </button>
              </>
            )}

            {currentUser.role === 'company' && (
              <>
                <button
                  onClick={() => { setActiveTab('company_projects'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    activeTab === 'company_projects'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-blue-400" />
                  مشاريع شركتنا المطروحة
                </button>

                <button
                  onClick={() => {
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

            {currentUser.role === 'student' && (
              <>
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
                    {studentsList.filter(s => s.isFree).length} أحرار
                  </span>
                </button>
              </>
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
                <Sparkles className="w-4 h-4 text-blue-400" />
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

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              تسجيل الخروج والإنهاء
            </button>
          </div>
        </aside>

        {/* المساحة الرئيسية للمحتوى */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">

          {/* تبويب التقارير والتواصل الأكاديمي */}
          {activeTab === 'reports_hub' && currentUser.role !== 'company' ? (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-800/50 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-6 h-6 text-amber-400" />
                    <h2 className="text-xl font-bold text-white">بوابة تسليم التقارير والتواصل الأكاديمي المباشر</h2>
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
                    متابعة مراحل إعداد مساق مشروع التخرج، المواعيد المحددة من المشرف، التغذية الراجعة، والتواصل الفوري.
                  </p>
                </div>

                <div className="bg-slate-900/90 border border-slate-700/80 p-3 rounded-xl text-xs flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">الموعد النهائي القادم:</span>
                    <strong className="text-amber-400">الثلاثاء القادم (23:59 مساءً)</strong>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      جدول تسليم التقارير الدورية
                    </h3>
                  </div>

                  <div className="space-y-3.5">
                    {reportsTimeline.map((rep) => {
                      const isEditing = editingReportId === rep.id;

                      return (
                        <div key={rep.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl transition space-y-3">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                            <div>
                              <span className="text-[10px] bg-slate-800 text-blue-400 px-2 py-0.5 rounded border border-slate-700 font-bold">
                                تقرير رقم #{rep.id}
                              </span>
                              <h4 className="font-bold text-sm text-white mt-1">{rep.title}</h4>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                rep.status === 'submitted'
                                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                                  : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                              }`}>
                                {rep.status === 'submitted' ? 'تم تسليم المسودة' : 'بانتظار التسليم'}
                              </span>
                              {currentUser.role === 'supervisor' && (
                                <button
                                  onClick={() => {
                                    setEditingReportId(rep.id);
                                    setEditDeadlineInput(rep.deadlineDay);
                                    setEditFeedbackInput(rep.supervisorFeedback);
                                  }}
                                  className="p-1.5 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg transition"
                                  title="تعديل الموعد النهائي وملاحظات المشرف"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
                            <div className="flex items-center gap-2 text-slate-300">
                              <Calendar className="w-4 h-4 text-amber-400" />
                              <span>الموعد المحدد:</span>
                              <strong className="text-amber-400">{rep.deadlineDay}</strong>
                            </div>

                            {rep.submissionLink ? (
                              <a
                                href={rep.submissionLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-400 hover:underline flex items-center gap-1 text-[11px]"
                              >
                                <ExternalLink className="w-3.5 h-3.5" /> عرض ملف المسودة المسلمة
                              </a>
                            ) : (
                              <span className="text-slate-500 text-[11px]">لم يتم رفع ملف بعد</span>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="p-3 bg-slate-800/60 rounded-xl space-y-2 border border-slate-700">
                              <label className="text-[10px] text-slate-300 block">تعديل موعد التسليم:</label>
                              <input
                                type="text"
                                value={editDeadlineInput}
                                onChange={(e) => setEditDeadlineInput(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                              />

                              <label className="text-[10px] text-slate-300 block">ملاحظات المشرف:</label>
                              <textarea
                                rows={2}
                                value={editFeedbackInput}
                                onChange={(e) => setEditFeedbackInput(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                              />

                              <div className="flex justify-end gap-2 pt-1">
                                <button
                                  onClick={() => handleUpdateReportDeadline(rep.id)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold"
                                >
                                  <Save className="w-3.5 h-3.5" /> حفظ الموعد
                                </button>
                                <button
                                  onClick={() => setEditingReportId(null)}
                                  className="bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg"
                                >
                                  إلغاء
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs bg-blue-950/20 border border-blue-900/40 p-3 rounded-xl space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-blue-300 flex items-center gap-1.5">
                                  <MessageSquarePlus className="w-3.5 h-3.5 text-blue-400" />
                                  ملاحظات المشرف الأكاديمي:
                                </span>
                                <span className="text-[10px] bg-slate-800 text-amber-300 px-2 py-0.5 rounded font-mono">
                                  التقييم: {rep.grade}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300 leading-relaxed pr-5">
                                {rep.supervisorFeedback}
                              </p>
                            </div>
                          )}

                          {currentUser.role !== 'supervisor' && (
                            <div className="pt-2 flex justify-end">
                              <button
                                onClick={() => setSubmitReportModal(rep)}
                                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                              >
                                <UploadCloud className="w-4 h-4" />
                                {rep.status === 'submitted' ? 'تحديث / تسليم مسودة جديدة' : 'رفع وتسليم التقرير'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* المحادثة الفورية مع المشرف */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col h-[580px] shadow-xl">
                  <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        المحادثة الأكاديمية المباشرة
                      </h3>
                      <span className="text-[10px] text-slate-400">تواصل فوري بين المشرف والطلبة</span>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1 text-xs">
                    {supervisionChat.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-2xl max-w-[88%] space-y-1 ${
                          msg.sender === 'supervisor'
                            ? 'bg-amber-950/40 border border-amber-800/50 text-slate-200 ml-auto'
                            : 'bg-blue-600/90 text-white mr-auto'
                        }`}
                      >
                        <div className="flex justify-between items-center gap-2 text-[10px] font-bold text-slate-300">
                          <span>{msg.name}</span>
                          <span className="text-[9px] opacity-70">{msg.time}</span>
                        </div>
                        <p className="text-xs leading-relaxed">{msg.text}</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={sendSupervisionMsg} className="pt-2 border-t border-slate-800 flex gap-2">
                    <input
                      type="text"
                      value={chatInputText}
                      onChange={(e) => setChatInputText(e.target.value)}
                      placeholder="اكتب رسالتك الأكاديمية هنا..."
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-xl transition cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : activeTab === 'supervisor_teams' && currentUser.role === 'supervisor' ? (
            /* شاشة المشرف: إدارة الشُعب والفرق */
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-amber-400" />
                    لوحة متابعة وإدارة شُعبة مشاريع التخرج
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                    تسجيل الملاحظات، تعديل حالة تسكين الطلاب، وفك ارتباط أو استبعاد أي طالب.
                  </p>
                </div>
                <button
                  onClick={() => setShowApplicationsModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <CheckCircle className="w-4 h-4" />
                  مراجعة واعتماد طلبات المشاريع ({applications.length})
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="p-3.5">الرقم الجامعي</th>
                      <th className="p-3.5">اسم الطالب والتخصص</th>
                      <th className="p-3.5">المساق</th>
                      <th className="p-3.5">حالة المشروع المسند</th>
                      <th className="p-3.5">ملاحظات المشرف الأكاديمي</th>
                      <th className="p-3.5 text-center">الإجراءات والتحكم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {studentsList.map((st) => {
                      const isEditing = editingStudentId === st.id;
                      return (
                        <tr key={st.id} className="hover:bg-slate-800/20 transition">
                          <td className="p-3.5 font-mono text-slate-400">{st.academicId}</td>
                          <td className="p-3.5">
                            <div className="font-semibold text-white flex items-center gap-2">
                              <span>{st.avatar}</span>
                              <span>{st.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{st.major}</span>
                          </td>
                          <td className="p-3.5">
                            <span className="bg-blue-950 text-blue-300 border border-blue-800/60 px-2 py-0.5 rounded text-[10px]">
                              {st.course}
                            </span>
                          </td>
                          <td className="p-3.5">
                            {isEditing ? (
                              <div className="space-y-1.5">
                                <select
                                  value={editStatusValue ? 'free' : 'assigned'}
                                  onChange={(e) => setEditStatusValue(e.target.value === 'free')}
                                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1 text-[11px] text-white"
                                >
                                  <option value="assigned">مرتبط بمشروع</option>
                                  <option value="free">طالب حر (غير مرتبط)</option>
                                </select>
                                {!editStatusValue && (
                                  <input
                                    type="text"
                                    value={editProjectTitle}
                                    onChange={(e) => setEditProjectTitle(e.target.value)}
                                    placeholder="اسم المشروع..."
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1 text-[10px] text-white"
                                  />
                                )}
                              </div>
                            ) : (
                              <div>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border inline-block ${
                                  st.isFree
                                    ? 'bg-amber-950/40 text-amber-300 border-amber-800/50'
                                    : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                                }`}>
                                  {st.isFree ? 'طالب حر' : 'مرتبط بمشروع'}
                                </span>
                                <span className="text-[11px] text-slate-400 block mt-1">{st.projectTitle}</span>
                              </div>
                            )}
                          </td>
                          <td className="p-3.5 max-w-xs">
                            {isEditing ? (
                              <textarea
                                rows={2}
                                value={editNoteText}
                                onChange={(e) => setEditNoteText(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                              />
                            ) : (
                              <div className="flex items-start gap-1.5 text-slate-300 bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                                <MessageSquarePlus className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                <span className="text-[11px] leading-relaxed">
                                  {st.supervisorNote || <em className="text-slate-500">لا توجد ملاحظات مسجلة بعد</em>}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setStudentsList((prev) =>
                                      prev.map((s) =>
                                        s.id === st.id
                                          ? {
                                              ...s,
                                              supervisorNote: editNoteText,
                                              isFree: editStatusValue,
                                              projectTitle: editStatusValue ? 'غير مرتبط بمشروع' : (editProjectTitle || 'مشروع معتمد')
                                            }
                                          : s
                                      )
                                    );
                                    setEditingStudentId(null);
                                  }}
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingStudentId(null)}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingStudentId(st.id);
                                    setEditNoteText(st.supervisorNote || '');
                                    setEditStatusValue(st.isFree);
                                    setEditProjectTitle(st.projectTitle || '');
                                  }}
                                  className="p-1.5 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg transition"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`استبعاد الطالب "${st.name}" من الكشف؟`)) {
                                      setStudentsList((prev) => prev.filter((s) => s.id !== st.id));
                                    }
                                  }}
                                  className="p-1.5 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'company_projects' && currentUser.role === 'company' ? (
            /* شاشة الشركة */
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 border border-blue-800/50 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Store className="w-5 h-5 text-amber-400" />
                    لوحة تحكم: {currentUser.name}
                  </h2>
                  <p className="text-xs text-slate-300 mt-1.5 max-w-xl leading-relaxed">
                    من هنا تطرح التحديات التقنية التي تواجه أعمالكم ليقوم طلاب مشاريع التخرج بحلها تحت إشراف أكاديمي.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  طرح فكرة مشروع لشركتك (POST /projects/)
                </button>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-base text-white">المشاريع التي طرحتموها للطلاب ({myCompanyProjects.length})</h3>
                  <button
                    onClick={fetchProjects}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> تحديث القائمة
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {myCompanyProjects.map((p) => (
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
                          onClick={() => setShowApplicationsModal(true)}
                          className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5 text-blue-400" />
                          عرض طلبات الطلاب المتقدمين ({applications.filter(a => a.project_id === p.id).length})
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'teams' && currentUser.role === 'student' ? (
            /* ملتقى تشكيل الفرق للطلاب */
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    دليل الطلاب المتاحين وبناء الفرق الهندسية
                  </h2>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
                    استكشف زملاءك من مختلف تخصصات الكلية لتكوين فرق متعددة المهارات (Cross-functional Teams).
                  </p>
                </div>
                <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs text-slate-300">
                  الطلاب الجاهزون للانضمام: <span className="font-bold text-emerald-400">{studentsList.filter(s => s.isFree).length} طلاب</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {studentsList.map((student) => (
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
          ) : activeTab === 'student_cv' && currentUser.role === 'student' ? (
            /* السيرة الذاتية */
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  السيرة الذاتية والملف الأكاديمي للطالب
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  تُرفق تلقائياً عند تقديمك على المشاريع المطروحة.
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
                  <label className="text-[11px] text-slate-300 block mb-1">رابط GitHub / Portfolio</label>
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
                  <p className="text-2xl font-black mt-2 text-blue-400">{rawProjects.length || matchedProjects.length}</p>
                  <span className="text-[10px] text-emerald-400 mt-1 block">نشطة في قاعدة البيانات</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <p className="text-xs text-slate-400">المهارات الأكثر طلباً</p>
                  <p className="text-2xl font-black mt-2 text-amber-400">Python & SQL</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">في طلبات الشركات والمتاجر</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <p className="text-xs text-slate-400">الطلبات المسجلة</p>
                  <p className="text-2xl font-black mt-2 text-emerald-400">{applications.length}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">طلبات انضمام مسجلة بالخادم</span>
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
                </div>

                <div className="space-y-4 pt-2">
                  {[
                    { skill: 'Python & FastAPI', demand: 78, supply: 55, status: 'توازن جيد' },
                    { skill: 'SQL & Database Architecture', demand: 72, supply: 68, status: 'تغطية ممتازة' },
                    { skill: 'Power BI & Data Analytics', demand: 65, supply: 28, status: '⚠️ فجوة حرجة (طلب عالٍ ونقص طلبة)' },
                    { skill: 'React & Frontend Frameworks', demand: 60, supply: 64, status: 'وفرة طلابية' },
                    { skill: 'Cybersecurity & Ethical Hacking', demand: 45, supply: 20, status: '⚠️ بحاجة لتدريب مكثف' }
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
              </div>
            </div>
          ) : activeTab === 'milestones' ? (
            /* مراحل التخرج */
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">خريطة طريق التخرج (Milestones Tracker)</h2>
                <p className="text-xs text-slate-400 mt-1">متابعة دقيقة للخطوات المعتمدة لدى مشاريع التخرج</p>
              </div>

              <div className="space-y-4">
                {[
                  { stage: 'المرحلة 1: تشكيل الفريق وتثبيت المشكلة مع الشريك التجاري', status: 'مكتمل', desc: 'الاتفاق على متطلبات النظام وتوقيع المقترح المبدئي.', progress: 100, color: 'bg-emerald-500' },
                  { stage: 'المرحلة 2: اعتماد المشروع والمشرف الأكاديمي', status: 'قيد التنفيذ', desc: 'موافقة القسم الأكاديمي على مطابقة العمل لشروط مشروع التخرج.', progress: 70, color: 'bg-blue-500' },
                  { stage: 'المرحلة 3: وثيقة التصميم والنموذج الأولي (SRS & Prototype)', status: 'قريباً', desc: 'بناء الواجهات وقاعدة البيانات ومسارات الـ API.', progress: 25, color: 'bg-amber-500' },
                  { stage: 'المرحلة 4: الفحص والتشغيل الفعلي لدى الشريك التجاري', status: 'معلق', desc: 'تجربة النظام في بيئة العمل الحقيقية وقياس الكفاءة.', progress: 0, color: 'bg-slate-700' },
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
            /* تصفح المشاريع وقائمة المطابقة الذكية */
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

              {isLoadingProjects && (
                <div className="text-center py-8 text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                  جاري جلب المشاريع الحية من قاعدة البيانات...
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProjects.map((project) => {
                  const isFull = project.currentMembers >= project.maxMembers;
                  const isFav = favorites.includes(project.id);
                  const isAlreadyApplied = applications.some((a) => a.project_id === project.id && a.student_id === currentUser.id);

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

                        <div className="space-y-2 mb-4 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span className="flex items-center gap-1 font-medium text-slate-300">
                              <Sparkles className="w-3.5 h-3.5 text-blue-400" /> تحليل مطابقة المهارات:
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
                        {currentUser.role === 'student' ? (
                          <button
                            disabled={isFull || isAlreadyApplied}
                            onClick={() => {
                              setSelectedProject(project);
                              setIsApplyModalOpen(true);
                            }}
                            className={`flex-1 py-2 rounded-xl text-xs font-semibold shadow-md transition flex items-center justify-center gap-1.5 ${
                              isAlreadyApplied
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 cursor-not-allowed'
                                : isFull
                                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 cursor-pointer'
                            }`}
                          >
                            {isAlreadyApplied ? '✓ تم التقديم مسبقاً' : isFull ? 'المقاعد مكتملة' : 'تقديم طلب انضمام / فريق'}
                            {!isFull && !isAlreadyApplied && <ArrowUpRight className="w-3.5 h-3.5" />}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setShowApplicationsModal(true);
                            }}
                            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                          >
                            <Users className="w-3.5 h-3.5 text-blue-400" />
                            عرض تفاصيل وطلبات المشروع
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ==========================================
          النوافذ المنبثقة (Modals)
      ========================================== */}

      {/* نافذة تسليم التقرير للطلاب */}
      {submitReportModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setSubmitReportModal(null)} className="absolute left-4 top-4 text-slate-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold mb-1 text-white">تسليم تقرير المساق الأكاديمي</h2>
            <p className="text-xs text-blue-400 mb-4">{submitReportModal.title}</p>

            <form onSubmit={handleStudentSubmitReport} className="space-y-4">
              <div>
                <label className="text-[11px] text-slate-300 block mb-1">رابط المستند (Google Docs / GitHub PDF)</label>
                <input
                  type="url"
                  required
                  placeholder="https://docs.google.com/document/d/..."
                  value={reportUrlInput}
                  onChange={(e) => setReportUrlInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 text-left"
                  dir="ltr"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>• الموعد النهائي المحدد: <strong className="text-amber-400">{submitReportModal.deadlineDay}</strong></div>
                <div>• سيتم إشعار المشرف الأكاديمي لمراجعة المسودة وتزويدك بالتقييم.</div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl font-bold text-xs text-white transition shadow-lg cursor-pointer"
              >
                تأكيد تسليم التقرير
              </button>
            </form>
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

      {/* نافذة إضافة مشروع (للشركات والمشرفين - POST /projects/) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setIsCreateModalOpen(false)} className="absolute left-4 top-4 text-slate-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold mb-2 text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-blue-400" />
              طرح فكرة مشروع وتحدي عملي جديد
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              سيتم تسجيل المشروع باسمك الحقيقي (معرّف #{currentUser.id}) وربطه بقاعدة البيانات.
            </p>

            <form onSubmit={handleCreateProjectSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] text-slate-300 block mb-1">عنوان المشروع</label>
                <input
                  type="text"
                  placeholder="مثال: نظام إدارة عمليات التوزيع والتوصيل السحابي"
                  required
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">وصف المشروع والمتطلبات</label>
                <textarea
                  placeholder="شرح المشكلة والميزات المطلوبة من فريق الطلاب..."
                  rows={3}
                  required
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">المهارات والتقنيات المطلوبة</label>
                <input
                  type="text"
                  placeholder="Python, FastAPI, React, Docker, PostgreSQL"
                  required
                  value={newProjectSkills}
                  onChange={(e) => setNewProjectSkills(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingProject}
                className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl font-bold text-xs text-white transition cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {isSubmittingProject ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    جاري الحفظ في الخادم...
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    تأكيد ونشر المشروع في الباك إند
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* نافذة التقديم على مشروع (POST /applications/) */}
      {isApplyModalOpen && selectedProject && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setIsApplyModalOpen(false)} className="absolute left-4 top-4 text-slate-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold mb-1 text-white">
              تقديم طلب لـ: <span className="text-blue-400">{selectedProject.title}</span>
            </h2>
            <p className="text-[11px] text-slate-400 mb-4">
              سيتم تسجيل الطلب في الباك إند باسمك ({currentUser.name}) وربطه بالسيرة الذاتية.
            </p>

            <form onSubmit={handleApplySubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] text-slate-300 block mb-1">اسم الطالب المتقدم</label>
                <input
                  type="text"
                  readOnly
                  value={currentUser.name}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">الدور المطلوب في المشروع</label>
                <input
                  type="text"
                  placeholder="مثال: مهندس واجهات، مطور باك إند، محلل بيانات"
                  required
                  value={applicantRole}
                  onChange={(e) => setApplicantRole(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">رسالة الطلب / نبذة عن جاهزية الفريق</label>
                <textarea
                  placeholder="اكتب نبذة عن مهاراتك ولماذا ترغب بهذا المشروع تحديداً..."
                  rows={3}
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>• سيتم التحقق من منع التقديم المتكرر آلياً عبر السيرفر.</div>
                <div>• ستظهر حالتك الحالية كـ <strong>قيد المراجعة (Pending)</strong> لحين الاعتماد.</div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingApply}
                className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl font-semibold text-xs text-white transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmittingApply ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    جاري إرسال الطلب للسيرفر...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    إرسال الطلب وتأكيد الانضمام
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* نافذة طلبات الطلاب المتقدمين وإدارتها (قبول / رفض عبر PUT /applications/{id}/status) */}
      {showApplicationsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 relative">
            <button onClick={() => setShowApplicationsModal(false)} className="absolute left-4 top-4 text-slate-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  إدارة طلبات الطلاب المسجلة في السيرفر
                </h2>
                <p className="text-xs text-slate-400">
                  يمكنك مراجعة رسائل المتقدمين والقبول أو الرفض بشكل لحظي.
                </p>
              </div>
              <button
                onClick={fetchApplications}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> تحديث
              </button>
            </div>

            {isLoadingApplications ? (
              <div className="text-center py-8 text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                جاري جلب الطلبات من السيرفر...
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 bg-slate-950/60 rounded-xl border border-slate-800">
                لا توجد طلبات انضمام مسجلة حالياً.
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {applications.map((app) => (
                  <div key={app.id} className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">طلب رقم #{app.id}</span>
                        <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                          مشروع #{app.project_id}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          طالب #{app.student_id}
                        </span>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed">
                        {app.message || 'لا توجد رسالة مرفقة بالطلب.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${
                        app.status === 'accepted'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                          : app.status === 'rejected'
                            ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                            : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                      }`}>
                        {app.status === 'accepted' ? '✓ معتمد ومقبول' : app.status === 'rejected' ? '✕ مرفوض' : 'قيد المراجعة'}
                      </span>

                      {(currentUser.role === 'company' || currentUser.role === 'supervisor') && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleUpdateApplicationStatus(app.id, 'accepted')}
                            disabled={app.status === 'accepted'}
                            className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                              app.status === 'accepted'
                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-sm'
                            }`}
                            title="قبول الطلب"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span className="text-[10px] hidden sm:inline">قبول</span>
                          </button>

                          <button
                            onClick={() => handleUpdateApplicationStatus(app.id, 'rejected')}
                            disabled={app.status === 'rejected'}
                            className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                              app.status === 'rejected'
                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                : 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-sm'
                            }`}
                            title="رفض الطلب"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span className="text-[10px] hidden sm:inline">رفض</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}