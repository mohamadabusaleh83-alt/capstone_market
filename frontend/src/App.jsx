import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Briefcase, CheckCircle, Clock, Search, PlusCircle, 
  Users, Bell, X, Check, Sparkles,
  Calendar, Award, ArrowUpRight,
  Star, MessageSquare, Layers, LogIn, LogOut, Store, UserCheck,
  Menu, ShieldCheck, GraduationCap, FileText,
  Edit2, Trash2, Save, UploadCloud, Send, ExternalLink,
  Lock, Mail, AlertCircle, RefreshCw, UserPlus, CheckCircle2
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

// بيانات مشاريع افتراضية احتياطية في حال تعذر الاتصال بالخادم
const INITIAL_FALLBACK_PROJECTS = [
  {
    id: 1,
    title: 'نظام إدارة المستودعات ونقاط البيع السحابي (POS)',
    description: 'نظام متكامل لمتجر تجزئة لربط عمليات البيع بالمخزون وإصدار تنبيهات عند نفاد البضائع، مع تقارير أرباح يومية.',
    category: 'أنظمة المعلومات الحاسوبية (CIS)',
    difficulty: 'متوسط',
    hoursPerWeek: 12,
    maxMembers: 4,
    currentMembers: 1,
    status: 'approved',
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
    currentMembers: 0,
    status: 'pending',
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
    currentMembers: 0,
    status: 'approved',
    required_skills: 'Cybersecurity, Python, Docker, Linux',
    skills: ['Cybersecurity', 'Python', 'Docker', 'Linux'],
    created_by: 2
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
  const [newProjectMaxMembers, setNewProjectMaxMembers] = useState(4);
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);

  // فورم التقديم على مشروع
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [applicantRole, setApplicantRole] = useState('مطور أنظمة وواجهات');
  const [applyMessage, setApplyMessage] = useState('');
  const [isSubmittingApply, setIsSubmittingApply] = useState(false);

  // ==========================================
  // حالات شات المشروع الحقيقي (Project Messages)
  // ==========================================
  const [activeChatProject, setActiveChatProject] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [chatMessageInput, setChatMessageInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  // تصفية المشاريع في تبويب اعتماد المشرف
  const [reviewFilterStatus, setReviewFilterStatus] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'

  // المفضلة
  const [favorites, setFavorites] = useState([]);

  // ==========================================
  // نظام التنبيهات المنبثقة (Toasts System)
  // ==========================================
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // ==========================================
  // حالات الإشعارات الحية (Live Notifications)
  // ==========================================
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

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

  const [submitReportModal, setSubmitReportModal] = useState(null);
  const [reportUrlInput, setReportUrlInput] = useState('');

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
      course: 'مشروع تخرج 2',
      role: 'مهندسة ذكاء اصطناعي ونظم خلفية',
      skills: ['Python', 'PyTorch', 'FastAPI', 'Docker'],
      isFree: false,
      projectTitle: 'محرك توصيات ذكي لمنتجات المتجر',
      supervisorNote: 'تم تسليم المتطلبات بنجاح.',
      avatar: '👩‍💻'
    },
    {
      id: 'st-3',
      academicId: '12020874',
      name: 'طارق حسونة',
      major: 'أمن المعلومات والأدلة الرقمية (Cybersecurity)',
      course: 'مشروع تخرج 1',
      role: 'مختبر اختراق وضمان جودة',
      skills: ['PenTesting', 'OWASP', 'Linux', 'Network Security'],
      isFree: true,
      projectTitle: 'غير مرتبط بمشروع',
      supervisorNote: 'يبحث عن فريق عمل لمشروع تخرج 1.',
      avatar: '🛡️'
    },
    {
      id: 'st-4',
      academicId: '12020921',
      name: 'منى درويش',
      major: 'الوسائط الرقمية وتكنولوجيا الويب',
      course: 'مشروع تخرج 1',
      role: 'مصممة تجربة ومطورة واجهات (UI/UX & React)',
      skills: ['Figma', 'React', 'TailwindCSS', 'JavaScript'],
      isFree: true,
      projectTitle: 'غير مرتبط بمشروع',
      supervisorNote: '',
      avatar: '🎨'
    },
    {
      id: 'st-5',
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
    setActiveChatProject(null);
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
              status: p.status || 'pending',
              category: ACADEMIC_MAJORS[idx % ACADEMIC_MAJORS.length],
              difficulty: idx % 2 === 0 ? 'متوسط' : 'متقدم',
              hoursPerWeek: 10 + (idx % 3) * 2,
              maxMembers: p.max_members || 4,
              currentMembers: p.current_members !== undefined ? p.current_members : 0,
              availableSeats: p.available_seats !== undefined ? p.available_seats : Math.max(0, (p.max_members || 4) - (p.current_members || 0))
            };
          });
          setRawProjects(formatted);
          return;
        }
      }
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
  // جلب رسائل شات المشروع من الباك إند
  // ==========================================
  const fetchProjectMessages = useCallback(async (projectId) => {
    if (!projectId) return;
    setIsLoadingChat(true);
    try {
      const res = await apiFetch(`/projects/${projectId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setChatMessages(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('تعذر جلب رسائل شات المشروع:', err.message);
    } finally {
      setIsLoadingChat(false);
    }
  }, [apiFetch]);

  // جلب الرسائل تلقائياً عند فتح نافذة شات المشروع
  useEffect(() => {
    if (activeChatProject) {
      fetchProjectMessages(activeChatProject.id);
    }
  }, [activeChatProject, fetchProjectMessages]);

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
        .catch(() => {});
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
  // جلب إشعارات المستخدم الحية من الباك إند (GET /notifications)
  // ==========================================
  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsLoadingNotifications(true);
    try {
      const res = await apiFetch('/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('تعذر جلب الإشعارات:', err.message);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [apiFetch]);

  const handleMarkNotificationRead = useCallback(async (notificationId) => {
    try {
      await apiFetch(`/notifications/${notificationId}/read`, { method: 'PUT' });
      setNotifications((prev) =>
        prev.map((n) => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error('تعذر تحديث حالة الإشعار:', err);
    }
  }, [apiFetch]);

  const handleMarkAllNotificationsRead = useCallback(async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'PUT' });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      showToast('تم تحديد كافة الإشعارات كمقروءة بنجاح!', 'success');
    } catch {
      showToast('تعذر تحديث الإشعارات، يرجى المحاولة لاحقاً', 'error');
    }
  }, [apiFetch, showToast]);

  // جلب الإشعارات دورياً وتلقائياً عند تسجيل الدخول (كل 30 ثانية)
  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser, fetchNotifications]);

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
  // إضافة مشروع جديد للشركة أو المشرف (POST /projects/)
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
          required_skills: newProjectSkills.trim(),
          max_members: Number(newProjectMaxMembers) || 4
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'تعذر إضافة المشروع.');
      }

      await fetchProjects();
      fetchNotifications();
      setIsCreateModalOpen(false);
      setNewProjectTitle('');
      setNewProjectDesc('');
      setNewProjectSkills('');
      setNewProjectMaxMembers(4);
      showToast('تم طرح المشروع بنجاح وحفظه في قاعدة البيانات!', 'success');
    } catch (err) {
      showToast(`خطأ: ${err.message}`, 'error');
    } finally {
      setIsSubmittingProject(false);
    }
  };

  // ==========================================
  // اعتماد أو رفض مشروع من المشرف (PUT /projects/{project_id}/status)
  // ==========================================
  const handleApproveProject = async (projectId, targetStatus) => {
    try {
      const res = await apiFetch(`/projects/${projectId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: targetStatus })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'تعذر تحديث حالة المشروع.');
      }

      const statusLabels = {
        approved: 'اعتماد وقبول',
        rejected: 'رفض',
        pending: 'إعادة للتعليق'
      };

      await fetchProjects();
      fetchNotifications();
      showToast(`تم ${statusLabels[targetStatus] || targetStatus} المشروع بنجاح!`, 'success');
    } catch (err) {
      showToast(`خطأ: ${err.message}`, 'error');
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
      await fetchProjects();
      fetchNotifications();
      setIsApplyModalOpen(false);
      setApplyMessage('');
      showToast('تم إرسال طلب انضمامك بنجاح وحفظه في قاعدة البيانات!', 'success');
    } catch (err) {
      showToast(`تنبيه: ${err.message}`, 'error');
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
      // تحديث المشاريع لتحديث عداد المقاعد المحجوزة لحظياً
      await fetchProjects();
      fetchNotifications();
      showToast(`تم ${targetStatus === 'accepted' ? 'قبول' : 'رفض'} الطلب بنجاح!`, 'success');
    } catch (err) {
      showToast(`خطأ: ${err.message}`, 'error');
    }
  };

  // ==========================================
  // إرسال رسالة في شات المشروع (POST /projects/{id}/messages)
  // ==========================================
  const handleSendProjectMessage = async (e) => {
    e.preventDefault();
    if (!chatMessageInput.trim() || !activeChatProject) return;

    setIsSendingChat(true);
    try {
      const res = await apiFetch(`/projects/${activeChatProject.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text: chatMessageInput.trim() })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'تعذر إرسال الرسالة.');
      }

      const newMsg = await res.json();
      setChatMessages((prev) => [...prev, newMsg]);
      setChatMessageInput('');
      fetchNotifications();
    } catch (err) {
      showToast(`خطأ في إرسال الرسالة: ${err.message}`, 'error');
    } finally {
      setIsSendingChat(false);
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
    showToast('تم رفع التقرير بنجاح للمشرف الأكاديمي!', 'success');
  };

  // تصفية المشاريع للبحث والتصنيف بمرونة عالية (Flexible Search & Filter)
  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const queryTerms = query ? query.split(/\s+/).filter(Boolean) : [];

    return matchedProjects
      .filter((p) => {
        // 1. فلترة المفضلة
        if (activeTab === 'favorites' && !favorites.includes(p.id)) {
          return false;
        }

        // 2. فلترة التخصص بمرونة ودعم الاختصارات (مثل CIS أو Cybersecurity)
        if (selectedCategory !== 'الكل') {
          const catSelected = selectedCategory.trim().toLowerCase();
          const pCat = (p.category || '').trim().toLowerCase();

          // استخراج ما بين الأقواس للاختصارات الإنجليزية
          const matchAcronym = catSelected.match(/\(([^)]+)\)/);
          const acronym = matchAcronym ? matchAcronym[1].toLowerCase() : '';

          const isDirectMatch = pCat.includes(catSelected) || catSelected.includes(pCat);
          const isAcronymMatch = acronym ? pCat.includes(acronym) : false;

          if (!isDirectMatch && !isAcronymMatch) {
            return false;
          }
        }

        // 3. فلترة البحث بمرونة متقدمة (مطابقة كل الكلمات المفتاحية عبر العنوان والوصف والمهارات)
        if (queryTerms.length > 0) {
          const title = (p.title || '').toLowerCase();
          const desc = (p.description || '').toLowerCase();
          const cat = (p.category || '').toLowerCase();
          const reqSkills = (p.required_skills || '').toLowerCase();
          const skillsList = Array.isArray(p.skills) ? p.skills.map((s) => s.toLowerCase()) : [];

          const allTermsMatch = queryTerms.every((term) =>
            title.includes(term) ||
            desc.includes(term) ||
            cat.includes(term) ||
            reqSkills.includes(term) ||
            skillsList.some((s) => s.includes(term))
          );

          if (!allTermsMatch) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => (activeTab === 'match' ? (b.matchRate || 0) - (a.matchRate || 0) : 0));
  }, [matchedProjects, searchQuery, selectedCategory, activeTab, favorites]);

  // تصفية مشاريع الشركة الحالية
  const myCompanyProjects = useMemo(() => {
    if (!currentUser || currentUser.role !== 'company') return [];
    const created = matchedProjects.filter((p) => p.created_by === currentUser.id);
    return created.length > 0 ? created : matchedProjects.slice(0, 2);
  }, [currentUser, matchedProjects]);

  // تصفية المشاريع لشاشة اعتماد المشرف
  const projectsForSupervisorReview = useMemo(() => {
    if (reviewFilterStatus === 'all') return rawProjects;
    return rawProjects.filter((p) => p.status === reviewFilterStatus);
  }, [rawProjects, reviewFilterStatus]);

  const pendingCount = applications.filter((app) => app.status === 'pending').length;
  const pendingProjectsCount = rawProjects.filter((p) => p.status === 'pending').length;
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
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20 text-blue-400 mb-1">
                <GraduationCap className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {authMode === 'login' ? 'تسجيل الدخول للمنصة' : 'إنشاء حساب جديد'}
              </h1>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                {authMode === 'login' 
                  ? 'تسجيل الدخول المباشر مع الباك إند عبر الرمز الأمني (JWT)'
                  : 'انضم كطالب أو شريك صناعي أو مشرف أكاديمي'
                }
              </p>
            </div>

            {/* أزرار التجربة السريعة */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[11px] text-slate-400 font-medium block text-center">
                تعبئة بيانات تجريبية سريعة بنقرة واحدة:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('student')}
                  className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-[11px] font-bold border border-emerald-900/40 transition cursor-pointer"
                >
                  طالب خريج
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('supervisor')}
                  className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-[11px] font-bold border border-amber-900/40 transition cursor-pointer"
                >
                  مشرف أكاديمي
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('company')}
                  className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-lg text-[11px] font-bold border border-blue-900/40 transition cursor-pointer"
                >
                  شركة / شريك
                </button>
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'register' && (
                <>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">الاسم الكامل / اسم الجهة</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="مثال: أحمد منصور أو شركة النور"
                        value={authFullName}
                        onChange={(e) => setAuthFullName(e.target.value)}
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1">نوع الحساب والصلاحية</label>
                    <select
                      value={authRole}
                      onChange={(e) => setAuthRole(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="student">طالب خريج (Student)</option>
                      <option value="company">شركة / شريك تجاري (Company / Partner)</option>
                      <option value="supervisor">مشرف أكاديمي (Supervisor)</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="text-xs text-slate-300 block mb-1">البريد الإلكتروني</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="name@capstone.ps"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 text-left"
                    dir="ltr"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">كلمة المرور</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 text-left"
                    dir="ltr"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoadingAuth}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-xs transition duration-200 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoadingAuth ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    جاري التحقق والاتصال بالخادم...
                  </>
                ) : authMode === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    تسجيل الدخول (POST /login)
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    إنشاء الحساب (POST /users/)
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setAuthError('');
                  setAuthSuccess('');
                }}
                className="text-xs text-blue-400 hover:text-blue-300 transition cursor-pointer"
              >
                {authMode === 'login' 
                  ? 'ليس لديك حساب بعد؟ اضغط لإنشاء حساب جديد' 
                  : 'لديك حساب بالفعل؟ العودة لتسجيل الدخول'}
              </button>
            </div>
          </div>
        </div>

        <div className="text-center py-4 text-[11px] text-slate-500 border-t border-slate-900">
          منصة مشاريع التخرج الأكاديمية (Capstone Market) • متصلة بنظام FastAPI و PostgreSQL
        </div>
      </div>
    );
  }

  // ==========================================
  // الشاشة الرئيسية للمستخدم المسجل
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" dir="rtl">
      
      {/* الشريط العلوي المميز: محدد الارتفاع بـ h-16 مع z-40 ليظل فوق السايد بار دائماً */}
      <header className="h-16 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 md:hidden transition cursor-pointer"
            aria-label="القائمة الجانبية"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base text-white tracking-wide block leading-tight">
                سوق مشاريع التخرج
              </span>
              <span className="text-[10px] text-blue-400 font-mono hidden sm:inline-block">
                Capstone Market v1.1
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* أيقونة الإشعارات والتنبيهات التفاعلية */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen((prev) => !prev)}
              className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700/60 shadow-sm"
              title="الإشعارات والتنبيهات"
              aria-label="الإشعارات والتنبيهات"
            >
              <Bell className="w-4 h-4 text-blue-400" />
              {notifications.filter((n) => !n.is_read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-pulse shadow-md shadow-rose-500/50">
                  {notifications.filter((n) => !n.is_read).length}
                </span>
              )}
            </button>

            {/* القائمة المنسدلة للإشعارات */}
            {isNotificationsOpen && (
              <div 
                className="absolute left-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden"
                dir="rtl"
              >
                <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white">الإشعارات والتنبيهات</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full font-mono">
                      {notifications.length}
                    </span>
                  </div>
                  {notifications.some((n) => !n.is_read) && (
                    <button
                      onClick={handleMarkAllNotificationsRead}
                      className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer transition"
                    >
                      تحديد الكل كمقروء
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                  {isLoadingNotifications && notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-blue-400" />
                      جاري جلب الإشعارات...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                      لا توجد إشعارات جديدة حالياً
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.is_read && handleMarkNotificationRead(n.id)}
                        className={`p-3 text-xs transition cursor-pointer flex items-start gap-2.5 ${
                          n.is_read ? 'bg-slate-900/60 hover:bg-slate-850/60 opacity-75' : 'bg-slate-850/90 hover:bg-slate-800 border-r-2 border-blue-500'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.is_read ? 'bg-transparent' : 'bg-blue-400'}`} />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{n.title}</span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(n.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-300 text-[11px] leading-relaxed">{n.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold border ${
            currentUser.role === 'supervisor'
              ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
              : currentUser.role === 'company'
                ? 'bg-blue-950/60 text-blue-300 border-blue-800/60'
                : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
          }`}>
            {currentUser.title}
          </span>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
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
                    شُعبة 1
                  </span>
                </button>

                <button
                  onClick={() => { setActiveTab('supervisor_projects_review'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    activeTab === 'supervisor_projects_review'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    اعتماد المشاريع الأكاديمية
                  </div>
                  {pendingProjectsCount > 0 && (
                    <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-full font-bold">
                      {pendingProjectsCount} معلق
                    </span>
                  )}
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
              <Search className="w-4 h-4 text-slate-400" />
              استعراض كافة المشاريع
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
                المشاريع المفضلة
              </div>
              {favorites.length > 0 && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-bold">
                  {favorites.length}
                </span>
              )}
            </button>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
            <div>حالة الاتصال: <span className="text-emerald-400">متصل بالخادم ✓</span></div>
            <div>المشاريع بالخادم: <span className="text-white font-mono">{rawProjects.length}</span></div>
          </div>
        </aside>

        {/* مساحة العمل والمحتوى */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'reports_hub' ? (
            /* بوابة التقارير والمتابعة الأكاديمية */
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 border border-blue-800/60 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      متابعة أسبوعية مباشرة
                    </span>
                    <span className="text-xs text-slate-400">الفصل الدراسي الأول 2026</span>
                  </div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Clock className="w-6 h-6 text-amber-400" />
                    بوابة تسليم التقارير والتقييم الأكاديمي لمشاريع التخرج
                  </h2>
                  <p className="text-xs text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
                    منصة التسليم المباشر للمخرجات الأكاديمية. تسليم التقارير إلزامي كل أسبوع في موعد أقصاه <strong className="text-amber-400">يوم الثلاثاء</strong> لتثبيت التقييم.
                  </p>
                </div>

                {rawProjects.length > 0 && (
                  <button
                    onClick={() => {
                      const myProject = rawProjects.find(p => applications.some(a => a.project_id === p.id && a.student_id === currentUser.id && a.status === 'accepted')) || rawProjects[0];
                      setActiveChatProject(myProject);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shrink-0"
                  >
                    <MessageSquare className="w-4 h-4" />
                    شات ومحادثة المشروع المباشرة
                  </button>
                )}
              </div>

              {/* خط الزمن ومراحل التسليم */}
              <div className="space-y-4">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  الجدول الزمني ومحطات التسليم الرسمية
                </h3>

                <div className="space-y-4">
                  {reportsTimeline.map((rep) => {
                    const isSubmitted = rep.status === 'submitted';

                    return (
                      <div
                        key={rep.id}
                        className={`p-5 rounded-2xl border transition-all duration-200 ${
                          isSubmitted
                            ? 'bg-slate-900/90 border-slate-800 shadow-md'
                            : 'bg-slate-900/60 border-amber-800/30'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <span className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                              isSubmitted
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                                : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                            }`}>
                              {isSubmitted ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                              {isSubmitted ? 'تم التسليم' : 'بانتظار التسليم'}
                            </span>
                            <h4 className="font-bold text-sm text-white">{rep.title}</h4>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-400">الموعد النهائي:</span>
                            <span className="bg-slate-800 px-2.5 py-1 rounded-lg text-amber-300 font-bold border border-slate-700">
                              {rep.deadlineDay} ({rep.deadlineDate})
                            </span>
                          </div>
                        </div>

                        {/* تفاصيل التسليم والملاحظات */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 mb-3">
                          <div>
                            <span className="text-slate-400 block mb-1">رابط المستند المسلّم:</span>
                            {rep.submissionLink ? (
                              <a
                                href={rep.submissionLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono truncate"
                              >
                                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                {rep.submissionLink}
                              </a>
                            ) : (
                              <span className="text-slate-500 italic">لم يتم إرفاق رابط بعد</span>
                            )}
                            {rep.submittedAt && (
                              <span className="text-[10px] text-slate-500 block mt-1">تاريخ الرفع: {rep.submittedAt}</span>
                            )}
                          </div>

                          <div>
                            <span className="text-slate-400 block mb-1">تقييم وملاحظات المشرف:</span>
                            <p className="text-slate-300 leading-relaxed">{rep.supervisorFeedback}</p>
                            <span className="text-[10px] text-amber-400 block mt-1 font-bold">الدرجة: {rep.grade}</span>
                          </div>
                        </div>

                        {/* أزرار الإجراءات */}
                        {currentUser.role === 'student' && (
                          <div className="flex justify-end pt-2 border-t border-slate-800/80">
                            <button
                              onClick={() => {
                                setSubmitReportModal(rep);
                                setReportUrlInput(rep.submissionLink || '');
                              }}
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
            </div>
          ) : activeTab === 'supervisor_projects_review' && currentUser.role === 'supervisor' ? (
            /* شاشة المشرف الأكاديمي: مراجعة واعتماد المشاريع الأكاديمية */
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-800/40 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      بوابة التدقيق والاعتماد الأكاديمي (PUT /projects/{'{id}'}/approve)
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    مراجعة واعتماد المشاريع المقترحة من الشركاء الصناعيين
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    من هنا يمكنك مراجعة جودة التحديات المقترحة من الشركات والتحقق من ملاءمتها لمتطلبات مشاريع التخرج قبل إتاحتها للطلبة.
                  </p>
                </div>
                
                <button
                  onClick={fetchProjects}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border border-slate-700"
                >
                  <RefreshCw className="w-4 h-4" /> تحديث القائمة
                </button>
              </div>

              {/* أزرار تصفية الحالة */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold ml-2">تصفية حسب الحالة:</span>
                  <button
                    onClick={() => setReviewFilterStatus('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      reviewFilterStatus === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    كافة المشاريع ({rawProjects.length})
                  </button>
                  <button
                    onClick={() => setReviewFilterStatus('pending')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      reviewFilterStatus === 'pending'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-800 text-amber-300 hover:text-white'
                    }`}
                  >
                    <span>بانتظار الاعتماد</span>
                    <span className="bg-amber-950 text-amber-200 px-1.5 py-0.2 rounded-full text-[10px]">
                      {rawProjects.filter(p => p.status === 'pending').length}
                    </span>
                  </button>
                  <button
                    onClick={() => setReviewFilterStatus('approved')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      reviewFilterStatus === 'approved'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-emerald-300 hover:text-white'
                    }`}
                  >
                    معتمدة ({rawProjects.filter(p => p.status === 'approved').length})
                  </button>
                  <button
                    onClick={() => setReviewFilterStatus('rejected')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      reviewFilterStatus === 'rejected'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-800 text-rose-300 hover:text-white'
                    }`}
                  >
                    مرفوضة ({rawProjects.filter(p => p.status === 'rejected').length})
                  </button>
                </div>
              </div>

              {/* قائمة المشاريع للاعتماد */}
              {isLoadingProjects ? (
                <div className="text-center py-12 text-slate-400 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                  جاري جلب المشاريع من السيرفر...
                </div>
              ) : projectsForSupervisorReview.length === 0 ? (
                <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
                  لا توجد مشاريع تطابق هذا التصنيف حالياً.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {projectsForSupervisorReview.map((p) => (
                    <div
                      key={p.id}
                      className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3 gap-2">
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${
                            p.status === 'approved'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                              : p.status === 'rejected'
                                ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                                : 'bg-amber-950/80 text-amber-300 border-amber-800 animate-pulse'
                          }`}>
                            {p.status === 'approved' ? '✓ مشروع معتمد' : p.status === 'rejected' ? '✕ مشروع مرفوض' : '⏳ قيد المراجعة والاعتماد'}
                          </span>

                          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                            {p.currentMembers} من {p.maxMembers} مقاعد مقبولة
                          </span>
                        </div>

                        <h3 className="font-bold text-base text-white mb-2">{p.title}</h3>
                        <p className="text-xs text-slate-300 leading-relaxed mb-4 line-clamp-3">
                          {p.description}
                        </p>

                        <div className="mb-4">
                          <span className="text-[10px] text-slate-400 block mb-1 font-semibold">المهارات المطلوبة:</span>
                          <div className="flex flex-wrap gap-1">
                            {p.skills && p.skills.map((sk, i) => (
                              <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* أزرار التحكم والاعتماد */}
                      <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleApproveProject(p.id, 'approved')}
                            disabled={p.status === 'approved'}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                              p.status === 'approved'
                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>اعتماد المشروع</span>
                          </button>

                          <button
                            onClick={() => handleApproveProject(p.id, 'rejected')}
                            disabled={p.status === 'rejected'}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                              p.status === 'rejected'
                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                            }`}
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>رفض</span>
                          </button>

                          {p.status !== 'pending' && (
                            <button
                              onClick={() => handleApproveProject(p.id, 'pending')}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold transition cursor-pointer"
                              title="إعادة حالة المشروع إلى قيد المراجعة"
                            >
                              إعادة كمعلق
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => setActiveChatProject(p)}
                          className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                          <span>شات المشروع</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('supervisor_projects_review')}
                    className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    اعتماد المشاريع ({pendingProjectsCount} معلق)
                  </button>

                  <button
                    onClick={() => setShowApplicationsModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <CheckCircle className="w-4 h-4" />
                    طلبات الطلاب ({applications.length})
                  </button>
                </div>
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
                        <tr key={st.id} className="hover:bg-slate-800/30 transition">
                          <td className="p-3.5 font-mono text-slate-400">{st.academicId}</td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{st.avatar}</span>
                              <div>
                                <span className="font-bold text-white block">{st.name}</span>
                                <span className="text-[10px] text-slate-400">{st.major}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 text-slate-300">{st.course}</td>
                          <td className="p-3.5">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editProjectTitle}
                                onChange={(e) => setEditProjectTitle(e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white w-full"
                              />
                            ) : (
                              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${
                                st.isFree
                                  ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                              }`}>
                                {st.projectTitle}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-300">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editNoteText}
                                onChange={(e) => setEditNoteText(e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white w-full"
                              />
                            ) : (
                              st.supervisorNote || <span className="text-slate-500 italic">لا توجد ملاحظات</span>
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => {
                                    setStudentsList((prev) =>
                                      prev.map((s) =>
                                        s.id === st.id
                                          ? {
                                              ...s,
                                              supervisorNote: editNoteText,
                                              projectTitle: editProjectTitle,
                                              isFree: editStatusValue
                                            }
                                          : s
                                      )
                                    );
                                    setEditingStudentId(null);
                                  }}
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingStudentId(null)}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditingStudentId(st.id);
                                    setEditNoteText(st.supervisorNote);
                                    setEditProjectTitle(st.projectTitle);
                                    setEditStatusValue(st.isFree);
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
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition cursor-pointer"
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
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            p.status === 'approved'
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                              : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                          }`}>
                            {p.status === 'approved' ? 'معتمد أكاديمياً' : 'قيد مراجعة المشرف'}
                          </span>
                        </div>
                        <h4 className="font-bold text-base text-white mb-2">{p.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-3 mb-3">{p.description}</p>
                        
                        <div className="text-xs text-slate-400 mb-2">
                          السعة: <strong className="text-white">{p.currentMembers} من {p.maxMembers} مقاعد محجوزة</strong>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mb-4">
                          <div
                            className={`h-full rounded-full ${p.currentMembers >= p.maxMembers ? 'bg-rose-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(100, ((p.currentMembers || 0) / (p.maxMembers || 4)) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setShowApplicationsModal(true)}
                          className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5 text-blue-400" />
                          طلبات المتقدمين ({applications.filter(a => a.project_id === p.id).length})
                        </button>

                        <button
                          onClick={() => setActiveChatProject(p)}
                          className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                          محادثة المشروع
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
                      onClick={() => showToast(`تم إرسال دعوة انضمام للطالب ${student.name} بنجاح!`, 'success')}
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
            /* السيرة الذاتية للطالب */
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    الملف الأكاديمي والسيرة الذاتية (Student Academic CV)
                  </h2>
                  <button
                    onClick={() => setShowSkillsModal(true)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Award className="w-4 h-4" /> تعديل المهارات
                  </button>
                </div>

                {cvUpdateMessage && (
                  <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {cvUpdateMessage}
                  </div>
                )}

                <form onSubmit={handleSaveCv} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">الاسم الكامل</label>
                      <input
                        type="text"
                        disabled
                        value={currentUser.name}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">البريد الإلكتروني الجامعي</label>
                      <input
                        type="email"
                        disabled
                        value={currentUser.email}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300 cursor-not-allowed text-left font-mono"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">التخصص الأكاديمي</label>
                      <select
                        value={studentCv.major}
                        onChange={(e) => setStudentCv({ ...studentCv, major: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        {ACADEMIC_MAJORS.map((m, idx) => (
                          <option key={idx} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">المساق الحالي</label>
                      <select
                        value={studentCv.course}
                        onChange={(e) => setStudentCv({ ...studentCv, course: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="مشروع تخرج 1">مشروع تخرج 1 (تحليل ومقترح)</option>
                        <option value="مشروع تخرج 2">مشروع تخرج 2 (تطوير وتسليم نهائي)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">رابط الأعمال السابقة أو GitHub</label>
                    <input
                      type="url"
                      value={studentCv.portfolioUrl}
                      onChange={(e) => setStudentCv({ ...studentCv, portfolioUrl: e.target.value })}
                      placeholder="https://github.com/username"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 text-left font-mono"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">نبذة عن اهتماماتك وشغفك البرمجي</label>
                    <textarea
                      rows={3}
                      value={studentCv.bio}
                      onChange={(e) => setStudentCv({ ...studentCv, bio: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 leading-relaxed"
                    />
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block mb-2">المهارات المسجلة لملفك:</span>
                    <div className="flex flex-wrap gap-2">
                      {userSkills.map((sk, idx) => (
                        <span key={idx} className="bg-slate-800 text-blue-300 border border-blue-900/50 text-xs px-2.5 py-1 rounded-lg">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl font-bold text-xs text-white transition shadow-lg cursor-pointer"
                  >
                    حفظ وتحديث السيرة الذاتية
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* تبويبات استعراض المشاريع والمطابقة الذكية */
            <div className="space-y-6 max-w-6xl mx-auto">
              {/* شريط البحث وتصفية التخصصات */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="ابحث بالاسم، الكلمات المفتاحية، أو المهارات (مثل: Python, React, Cybersecurity)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pr-10 pl-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
                  {categories.map((cat, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-medium transition cursor-pointer whitespace-nowrap ${
                        selectedCategory === cat
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
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
                {filteredProjects.length === 0 ? (
                  <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-4 my-2 shadow-inner">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400 shadow-md">
                      <Search className="w-7 h-7 text-blue-400" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-white">لا توجد مشاريع مطابقة لبحثك</h3>
                      <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                        {activeTab === 'favorites'
                          ? 'لم تقم بإضافة أي مشروع إلى قائمة المفضلة بعد. انقر على أيقونة النجمة على بطاقة أي مشروع لحفظه هنا.'
                          : 'حاول تعديل كلمات البحث، أو تغيير تخصص البحث، أو مسح الفلاتر لاستعراض جميع المشاريع المتاحة.'}
                      </p>
                    </div>
                    {(searchQuery || selectedCategory !== 'الكل' || activeTab === 'favorites') && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('الكل');
                          if (activeTab === 'favorites') setActiveTab('browse');
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-blue-500/20"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        مسح الفلاتر واستعراض الكل
                      </button>
                    )}
                  </div>
                ) : (
                  filteredProjects.map((project) => {
                  const isFull = (project.currentMembers || 0) >= (project.maxMembers || 4);
                  const isRejected = project.status === 'rejected';
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

                        {/* شارات الحالة وسعة المقاعد */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            project.status === 'approved'
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                              : project.status === 'rejected'
                                ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                                : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                          }`}>
                            {project.status === 'approved' ? '✓ معتمد أكاديمياً' : project.status === 'rejected' ? '✕ مرفوض' : '⏳ قيد اعتماد المشرف'}
                          </span>

                          <span className="text-[10px] text-slate-400 font-mono">
                            {project.currentMembers}/{project.maxMembers} مقاعد
                          </span>
                        </div>

                        {/* مؤشر تقدم المقاعد */}
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mb-3">
                          <div
                            className={`h-full rounded-full ${isFull ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, ((project.currentMembers || 0) / (project.maxMembers || 4)) * 100)}%` }}
                          />
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

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                        {currentUser.role === 'student' ? (
                          <button
                            disabled={isFull || isAlreadyApplied || isRejected}
                            onClick={() => {
                              setSelectedProject(project);
                              setIsApplyModalOpen(true);
                            }}
                            className={`flex-1 py-2 rounded-xl text-xs font-semibold shadow-md transition flex items-center justify-center gap-1.5 ${
                              isAlreadyApplied
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 cursor-not-allowed'
                                : isRejected
                                  ? 'bg-rose-950/60 text-rose-400 border border-rose-900 cursor-not-allowed'
                                  : isFull
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 cursor-pointer'
                            }`}
                          >
                            {isAlreadyApplied
                              ? '✓ تم التقديم مسبقاً'
                              : isRejected
                                ? 'المشروع مرفوض'
                                : isFull
                                  ? 'المقاعد مكتملة'
                                  : 'تقديم طلب انضمام'}
                            {!isFull && !isAlreadyApplied && !isRejected && <ArrowUpRight className="w-3.5 h-3.5" />}
                          </button>
                        ) : (
                          <button
                            onClick={() => setShowApplicationsModal(true)}
                            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                          >
                            <Users className="w-3.5 h-3.5 text-blue-400" />
                            عرض طلبات المشروع
                          </button>
                        )}

                        <button
                          onClick={() => setActiveChatProject(project)}
                          title="غرفة نقاش وشات المشروع"
                          className="p-2 rounded-xl bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ==========================================
          نظام التنبيهات الفورية العائمة (Toast Container)
      ========================================== */}
      <div className="fixed top-20 left-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none" dir="rtl">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between gap-3 p-3.5 rounded-xl border shadow-2xl text-xs font-medium backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
              toast.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/60 text-emerald-100 shadow-emerald-900/30'
                : toast.type === 'error'
                  ? 'bg-rose-950/95 border-rose-500/60 text-rose-100 shadow-rose-900/30'
                  : 'bg-slate-900/95 border-slate-700 text-slate-100 shadow-slate-900/50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {toast.type === 'info' && <Bell className="w-4 h-4 text-blue-400 shrink-0" />}
              <span className="leading-snug">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer shrink-0"
              aria-label="إغلاق التنبيه"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* ==========================================
          النوافذ المنبثقة (Modals)
      ========================================== */}

      {/* نافذة شات المشروع التفاعلي الحقيقي (GET & POST /projects/{id}/messages) */}
      {activeChatProject && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl flex flex-col h-[600px] max-h-[90vh] shadow-2xl relative overflow-hidden">
            {/* رأس الشات */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {activeChatProject.title}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      activeChatProject.status === 'approved'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {activeChatProject.status === 'approved' ? 'معتمد' : 'معلق'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    غرفة المحادثة والتنسيق المباشر لأعضاء الفريق والمشرف الأكاديمي
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchProjectMessages(activeChatProject.id)}
                  title="تحديث الرسائل"
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingChat ? 'animate-spin text-blue-400' : ''}`} />
                </button>
                <button
                  onClick={() => setActiveChatProject(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* منطقة الرسائل */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoadingChat ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                  جاري تحميل الرسائل من السيرفر...
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 text-xs">
                  <MessageSquare className="w-8 h-8 text-slate-600" />
                  <p>لا توجد رسائل سابقة في هذا المشروع بعد.</p>
                  <span className="text-[10px] text-slate-500">كن أول من يبدأ النقاش والتنسيق!</span>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.sender_id === currentUser.id;
                  const roleLabels = {
                    student: 'طالب',
                    supervisor: 'مشرف أكاديمي',
                    company: 'شريك تجاري',
                    admin: 'مسؤول النظام'
                  };
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[85%] ${isMe ? 'mr-auto items-end' : 'ml-auto items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                        <span className="font-bold text-slate-200">{msg.sender_name || `مستخدم #${msg.sender_id}`}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded border ${
                          msg.sender_role === 'supervisor'
                            ? 'bg-amber-950/70 text-amber-300 border-amber-800'
                            : msg.sender_role === 'company'
                              ? 'bg-purple-950/70 text-purple-300 border-purple-800'
                              : 'bg-blue-950/70 text-blue-300 border-blue-800'
                        }`}>
                          {roleLabels[msg.sender_role] || msg.sender_role}
                        </span>
                        <span className="text-[9px] opacity-70">
                          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* نموذج إرسال رسالة */}
            <form onSubmit={handleSendProjectMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={chatMessageInput}
                onChange={(e) => setChatMessageInput(e.target.value)}
                placeholder="اكتب رسالتك لأعضاء المشروع والمشرف..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={isSendingChat || !chatMessageInput.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                {isSendingChat ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>إرسال</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* نافذة تسليم التقرير للطلاب */}
      {submitReportModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 relative">
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 relative">
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 relative">
            <button onClick={() => setIsCreateModalOpen(false)} className="absolute left-4 top-4 text-slate-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold mb-2 text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-blue-400" />
              طرح فكرة مشروع وتحدي عملي جديد
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              سيتم تسجيل المشروع باسمك الحقيقي (معرّف #{currentUser.id}) وتحديد عدد المقاعد في قاعدة البيانات.
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">المهارات المطلوبة</label>
                  <input
                    type="text"
                    placeholder="Python, React, SQL"
                    required
                    value={newProjectSkills}
                    onChange={(e) => setNewProjectSkills(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">الحد الأقصى للمقاعد</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={newProjectMaxMembers}
                    onChange={(e) => setNewProjectMaxMembers(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 relative">
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
                <div>• سيتم التحقق من منع التقديم المتكرر وتوفر المقاعد آلياً عبر السيرفر.</div>
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative">
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
                  يمكنك مراجعة رسائل المتقدمين والقبول أو الرفض مع تحديث فوري لعدد المقاعد المحجوزة.
                </p>
              </div>
              <button
                onClick={fetchApplications}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition cursor-pointer"
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
                {applications.map((app) => {
                  const targetProject = rawProjects.find((p) => p.id === app.project_id);
                  return (
                    <div key={app.id} className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">طلب رقم #{app.id}</span>
                          <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                            مشروع #{app.project_id}: {targetProject ? targetProject.title : ''}
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
                              title="قبول الطلب وتسكين المقعد"
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

                            {targetProject && (
                              <button
                                onClick={() => {
                                  setActiveChatProject(targetProject);
                                  setShowApplicationsModal(false);
                                }}
                                className="p-1.5 rounded-lg text-xs font-bold bg-slate-700 hover:bg-blue-600 text-slate-200 hover:text-white transition cursor-pointer"
                                title="فتح شات المشروع"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}