import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { API_URL, INITIAL_FALLBACK_PROJECTS, ACADEMIC_MAJORS } from '../api/client';

const CANONICAL_SKILL_MAP = {
  spl: 'SQL', sql: 'SQL', python: 'Python', react: 'React', fastapi: 'FastAPI',
  docker: 'Docker', postgresql: 'PostgreSQL', postgres: 'PostgreSQL',
  node: 'Node.js', nodejs: 'Node.js', 'node.js': 'Node.js',
  tailwind: 'TailwindCSS', tailwindcss: 'TailwindCSS',
  javascript: 'JavaScript', typescript: 'TypeScript',
  'machine learning': 'Machine Learning', 'power bi': 'Power BI', powerbi: 'Power BI',
  cybersecurity: 'Cybersecurity'
};

function normalizeSkill(s) {
  if (!s || typeof s !== 'string') return '';
  const clean = s.trim().replace(/^['"<]+|['">]+$/g, '').replace(/<spl/gi, 'SQL');
  const lower = clean.toLowerCase();
  if (!lower) return '';
  return CANONICAL_SKILL_MAP[lower] || (clean.charAt(0).toUpperCase() + clean.slice(1));
}

// قائمة المشاريع تختلف حسب دور المستخدم، لذا يُفصل الكاش لكل مستخدم
let projectsMemoryCache = null; // { key, list }

function projectsCacheKey() {
  try {
    const user = JSON.parse(localStorage.getItem('app_user_role') || 'null');
    return `capstone_projects_cache_${user?.id ?? 'guest'}`;
  } catch {
    return 'capstone_projects_cache_guest';
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { t, i18n } = useTranslation();
  const { currentUser, apiFetch } = useAuth();
  const { theme, isDark, toggleTheme, setTheme } = useTheme();

  // ==========================================
  // حالات اللغة والاتجاه (Language & Direction)
  // ==========================================
  const [currentLang, setCurrentLang] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('app_language') || i18n.language || 'ar';
    }
    return i18n.language || 'ar';
  });

  const isRtl = currentLang === 'ar';

  const toggleLanguage = useCallback(() => {
    const nextLang = currentLang === 'ar' ? 'en' : 'ar';
    setCurrentLang(nextLang);
    i18n.changeLanguage(nextLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_language', nextLang);
      document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = nextLang;
      if (nextLang === 'ar') {
        document.documentElement.classList.add('font-arabic');
        document.documentElement.classList.remove('font-english');
      } else {
        document.documentElement.classList.add('font-english');
        document.documentElement.classList.remove('font-arabic');
      }
    }
  }, [currentLang, i18n]);

  useEffect(() => {
    const handleLangChange = (lng) => {
      setCurrentLang(lng);
      if (typeof document !== 'undefined') {
        document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lng;
      }
    };
    i18n.on('languageChanged', handleLangChange);
    return () => {
      i18n.off('languageChanged', handleLangChange);
    };
  }, [i18n]);

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
  // حالات المشاريع والبيانات الحية (Projects & Applications)
  // مع طبقة التخزين المؤقت الذكي (Zero-Latency Instant UI Caching)
  // ==========================================
  const [rawProjects, setRawProjects] = useState(() => {
    if (typeof window === 'undefined') return INITIAL_FALLBACK_PROJECTS;
    const cacheKey = projectsCacheKey();
    if (projectsMemoryCache?.key === cacheKey && projectsMemoryCache.list.length > 0) return projectsMemoryCache.list;
    {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            projectsMemoryCache = { key: cacheKey, list: parsed };
            return parsed;
          }
        }
      } catch (_err) {
        // Ignore cache parsing error
      }
    }
    return INITIAL_FALLBACK_PROJECTS;
  });
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  const [applications, setApplications] = useState([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);

  const currentUserId = currentUser?.id;

  // المفضلة - معزولة بنسبة 100% لكل مستخدم
  const [favorites, setFavorites] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const user = localStorage.getItem('app_user_role');
      const userId = user ? JSON.parse(user).id : 'guest';
      const saved = localStorage.getItem(`favorites_${userId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!currentUserId) {
      setFavorites([]);
      return;
    }
    try {
      const saved = localStorage.getItem(`favorites_${currentUserId}`);
      setFavorites(saved ? JSON.parse(saved) : []);
    } catch {
      setFavorites([]);
    }
  }, [currentUserId]);

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id];
      if (typeof window !== 'undefined' && currentUserId) {
        localStorage.setItem(`favorites_${currentUserId}`, JSON.stringify(next));
      }
      return next;
    });
  }, [currentUserId]);

  // مهارات الطالب - معزولة بنسبة 100% (الحساب الجديد يبدأ بـ 0 مهارات ونظيفة تماماً)
  const [userSkills, setUserSkills] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const user = localStorage.getItem('app_user_role');
      if (!user) return [];
      const userObj = JSON.parse(user);
      const saved = localStorage.getItem(`user_skills_${userObj.id}`);
      if (saved) return JSON.parse(saved);
      if (userObj.id === 'student-1') {
        return ['Python', 'FastAPI', 'Docker', 'React', 'TailwindCSS'];
      }
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!currentUser?.id) {
      setUserSkills([]);
      return;
    }
    try {
      const saved = localStorage.getItem(`user_skills_${currentUser.id}`);
      if (saved) {
        setUserSkills(JSON.parse(saved));
      } else if (currentUser.id === 'student-1') {
        setUserSkills(['Python', 'FastAPI', 'Docker', 'React', 'TailwindCSS']);
      } else {
        setUserSkills([]);
      }
    } catch {
      setUserSkills([]);
    }
  }, [currentUser?.id]);

  const addSkill = useCallback((skill) => {
    const s = skill.trim();
    if (s && !userSkills.includes(s)) {
      const nextSkills = [...userSkills, s];
      setUserSkills(nextSkills);
      if (typeof window !== 'undefined' && currentUserId) {
        localStorage.setItem(`user_skills_${currentUserId}`, JSON.stringify(nextSkills));
      }
      if (apiFetch) {
        apiFetch('/users/me/skills', {
          method: 'PUT',
          body: JSON.stringify({ skills: nextSkills.join(', ') })
        }).catch(() => {});
      }
    }
  }, [userSkills, currentUserId, apiFetch]);

  const removeSkill = useCallback((skillToRemove) => {
    setUserSkills((prev) => {
      const next = prev.filter((s) => s !== skillToRemove);
      if (typeof window !== 'undefined' && currentUserId) {
        localStorage.setItem(`user_skills_${currentUserId}`, JSON.stringify(next));
      }
      if (apiFetch) {
        apiFetch('/users/me/skills', {
          method: 'PUT',
          body: JSON.stringify({ skills: next.join(', ') })
        }).catch(() => {});
      }
      return next;
    });
  }, [currentUserId, apiFetch]);

  // السيرة الذاتية للطالب - معزولة بنسبة 100%
  const [studentCv, setStudentCv] = useState(() => {
    if (typeof window === 'undefined') return { major: 'أنظمة المعلومات الحاسوبية (CIS)', course: 'مشروع تخرج 1', portfolioUrl: '', bio: '' };
    try {
      const user = localStorage.getItem('app_user_role');
      const userId = user ? JSON.parse(user).id : 'guest';
      const saved = localStorage.getItem(`student_academic_cv_${userId}`);
      if (saved) return JSON.parse(saved);
      if (userId === 'student-1') {
        return {
          major: 'أنظمة المعلومات الحاسوبية (CIS)',
          course: 'مشروع تخرج 1',
          portfolioUrl: 'https://github.com',
          bio: 'طالب في السنة النهائية، مهتم بتطوير الأنظمة السحابية وحلول الويب المتكاملة.'
        };
      }
      return {
        major: 'أنظمة المعلومات الحاسوبية (CIS)',
        course: 'مشروع تخرج 1',
        portfolioUrl: '',
        bio: ''
      };
    } catch {
      return { major: 'أنظمة المعلومات الحاسوبية (CIS)', course: 'مشروع تخرج 1', portfolioUrl: '', bio: '' };
    }
  });

  useEffect(() => {
    if (!currentUser?.id) return;
    try {
      const saved = localStorage.getItem(`student_academic_cv_${currentUser.id}`);
      if (saved) {
        setStudentCv(JSON.parse(saved));
      } else if (currentUser.id === 'student-1') {
        setStudentCv({
          major: 'أنظمة المعلومات الحاسوبية (CIS)',
          course: 'مشروع تخرج 1',
          portfolioUrl: 'https://github.com',
          bio: 'طالب في السنة النهائية، مهتم بتطوير الأنظمة السحابية وحلول الويب المتكاملة.'
        });
      } else {
        setStudentCv({
          major: 'أنظمة المعلومات الحاسوبية (CIS)',
          course: 'مشروع تخرج 1',
          portfolioUrl: '',
          bio: ''
        });
      }
    } catch (_err) {
      // Ignore student CV reload error
    }
  }, [currentUser?.id]);

  // ==========================================
  // النوافذ المنبثقة (Modals State)
  // ==========================================
  const [activeChatProject, setActiveChatProject] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  // السايد بار في الموبايل
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // فحص استكمال ملف الطالب تلقائياً عند تسجيل الدخول أو تحميل الصفحة
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'student') {
      setIsOnboardingModalOpen(false);
      return;
    }

    const isSkipped = typeof window !== 'undefined' && sessionStorage.getItem('skip_student_onboarding') === 'true';
    if (isSkipped) return;

    const hasBio = Boolean(studentCv?.bio && studentCv.bio.trim().length > 0);
    const hasSkills = Boolean(Array.isArray(userSkills) && userSkills.length > 0);

    if (!hasBio || !hasSkills) {
      // إعطاء مهلة قصيرة (400ms) للسماح بتسوية تحميل الصفحة والمكونات بسلاسة
      const timer = setTimeout(() => {
        setIsOnboardingModalOpen(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentUser?.role, currentUser?.id, studentCv?.bio, userSkills]);

  // ==========================================
  // الإشعارات الحية (Live Notifications)
  // ==========================================
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // التقارير والمتابعة الأكاديمية (بيانات حية من قاعدة البيانات 100%)
  const [reportsTimeline, setReportsTimeline] = useState([]);
  const [submitReportModal, setSubmitReportModal] = useState(null);

  // دليل الطلاب المتاحين (بيانات حية من قاعدة البيانات 100%)
  const [studentsList, setStudentsList] = useState([]);

  // مشروع المستخدم الحالي (للطالب أو الشركة أو المشرف من /api/projects/my)
  const [myProject, setMyProject] = useState(null);

  // مؤقت أمان يمنع بقاء حالة تحميل المشاريع معلقة لأكثر من 1.5 ثانية
  useEffect(() => {
    let timer;
    if (isLoadingProjects) {
      timer = setTimeout(() => {
        setIsLoadingProjects(false);
      }, 1500);
    }
    return () => clearTimeout(timer);
  }, [isLoadingProjects]);

  // ==========================================
  // دوال الاتصال بالباك إند وجلب البيانات (Ultra-Fast Parallel & SWR Fetching)
  // ==========================================
  const fetchProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      // التوكن يحدد المشاريع المرئية (الزائر/الطالب: المعتمدة فقط، الشركة: + مشاريعها، المشرف: الكل)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_URL}/projects/`, {
        signal: controller.signal,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const formatted = data.map((p, idx) => {
            const rawSkillList = p.required_skills
              ? p.required_skills.replace(/<spl/gi, ', SQL').split(',').map((s) => normalizeSkill(s)).filter(Boolean)
              : ['Python', 'SQL', 'FastAPI', 'React'];
            const projectSkills = Array.from(new Set(rawSkillList));

            return {
              id: p.id,
              title: p.title || (isRtl ? 'مشروع تخرج' : 'Capstone Project'),
              description: p.description || '',
              required_skills: projectSkills.join(', '),
              skills: projectSkills,
              created_by: p.created_by,
              created_at: p.created_at,
              status: p.status || 'pending',
              category: p.category || ACADEMIC_MAJORS[idx % ACADEMIC_MAJORS.length],
              stipend: p.stipend || null,
              company_name: p.company_name || null,
              supervisor_id: p.supervisor_id || null,
              supervisor_name: p.supervisor_name || null,
              supervisor_feedback: p.supervisor_feedback || null,
              difficulty: idx % 2 === 0 ? 'متوسط' : 'متقدم',
              hoursPerWeek: 10 + (idx % 3) * 2,
              maxMembers: p.max_members || 4,
              currentMembers: p.current_members !== undefined ? p.current_members : 0,
              availableSeats: p.available_seats !== undefined ? p.available_seats : Math.max(0, (p.max_members || 4) - (p.current_members || 0))
            };
          });

          const cacheKey = projectsCacheKey();
          projectsMemoryCache = { key: cacheKey, list: formatted };
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.setItem(cacheKey, JSON.stringify(formatted));
            } catch (_err) {
              // Ignore session storage error
            }
          }
          setRawProjects(formatted);
          return;
        }
      }
      setRawProjects([]);
    } catch {
      setRawProjects((prev) => prev);
    } finally {
      clearTimeout(timeoutId);
      setIsLoadingProjects(false);
    }
  }, [isRtl]);

  const fetchMyProject = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setMyProject(null);
      return;
    }
    try {
      const res = await apiFetch('/projects/my');
      if (res && res.ok) {
        const data = await res.json();
        setMyProject(data || null);
      } else {
        setMyProject(null);
      }
    } catch {
      setMyProject(null);
    }
  }, [apiFetch]);

  const fetchReports = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    try {
      const res = await apiFetch('/reports/');
      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setReportsTimeline(data.map((r) => ({
            id: r.id,
            project_id: r.project_id,
            student_id: r.student_id,
            student_name: r.student_name,
            project_title: r.project_title,
            title: r.title,
            description: r.description || '',
            deadlineDate: r.deadline_date || '',
            deadlineDay: r.deadline_date ? new Date(r.deadline_date).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { weekday: 'long' }) : '',
            status: r.status,
            submissionLink: r.file_url || '',
            submittedAt: r.created_at ? new Date(r.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US') : '',
            supervisorFeedback: r.supervisor_feedback || '',
            grade: r.grade || ''
          })));
        }
      }
    } catch (_err) {
      // Ignored
    }
  }, [apiFetch, isRtl]);

  const fetchStudents = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    // دليل الطلاب متاح للمشرف والأدمن فقط (GET /users/)
    if (!['supervisor', 'admin'].includes(currentUser?.role)) {
      setStudentsList([]);
      return;
    }
    try {
      const res = await apiFetch('/users/?role=student');
      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setStudentsList(data.map((u) => ({
            id: u.id,
            academicId: String(u.id),
            name: u.full_name,
            email: u.email,
            major: u.major || 'أنظمة المعلومات الحاسوبية (CIS)',
            course: u.course || 'مشروع تخرج 1',
            role: 'طالب خريج',
            skills: u.skills ? u.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
            bio: u.bio || '',
            portfolioUrl: u.portfolio_url || '',
            isFree: true,
            projectTitle: '',
            supervisorNote: '',
            avatar: '👨‍🎓'
          })));
        }
      }
    } catch (_err) {
      // Ignored
    }
  }, [apiFetch, currentUser?.role]);

  const fetchApplications = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
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
    } catch {
      // Ignored
    } finally {
      setIsLoadingApplications(false);
    }
  }, [apiFetch]);

  const fetchNotifications = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    setIsLoadingNotifications(true);
    try {
      const res = await apiFetch('/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch {
      // Ignored
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [apiFetch]);

  const fetchUserProfile = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token || token.startsWith('demo-token-')) return;

    try {
      const res = await apiFetch('/users/me/profile');
      if (res && res.ok) {
        const data = await res.json();
        setStudentCv((prev) => ({ ...prev, hasCv: Boolean(data.has_cv) }));
        if (data.skills) {
          const sList = data.skills.split(',').map((s) => s.trim()).filter(Boolean);
          if (sList.length > 0) {
            setUserSkills(sList);
            if (typeof window !== 'undefined' && currentUserId) {
              localStorage.setItem(`user_skills_${currentUserId}`, JSON.stringify(sList));
            }
          }
        }
        if (data.major || data.bio || data.portfolio_url || data.course) {
          const cvObj = {
            major: data.major || 'أنظمة المعلومات الحاسوبية (CIS)',
            course: data.course || 'مشروع تخرج 1',
            portfolioUrl: data.portfolio_url || '',
            bio: data.bio || '',
            hasCv: Boolean(data.has_cv)
          };
          setStudentCv(cvObj);
          if (typeof window !== 'undefined' && currentUserId) {
            localStorage.setItem(`student_academic_cv_${currentUserId}`, JSON.stringify(cvObj));
          }
        }
      }
    } catch (_err) {
      // Ignored
    }
  }, [apiFetch, currentUserId]);

  // استدعاء متوازٍ سريع لجميع الـ Endpoints بدون أي بطء أو انتظار تعاقبي
  const refreshAllData = useCallback(async () => {
    const promises = [fetchProjects()];
    if (currentUser) {
      promises.push(
        fetchApplications(),
        fetchNotifications(),
        fetchUserProfile(),
        fetchReports(),
        fetchStudents(),
        fetchMyProject()
      );
    }
    await Promise.allSettled(promises);
  }, [currentUser, fetchProjects, fetchApplications, fetchNotifications, fetchUserProfile, fetchReports, fetchStudents, fetchMyProject]);

  const handleMarkNotificationRead = useCallback(async (notificationId) => {
    try {
      await apiFetch(`/notifications/${notificationId}/read`, { method: 'PUT' });
      setNotifications((prev) =>
        prev.map((n) => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch {
      // Ignored
    }
  }, [apiFetch]);

  const handleMarkAllNotificationsRead = useCallback(async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'PUT' });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      showToast(isRtl ? 'تم تحديد كافة الإشعارات كمقروءة بنجاح!' : 'All notifications marked as read!', 'success');
    } catch {
      showToast(isRtl ? 'تعذر تحديث الإشعارات، يرجى المحاولة لاحقاً' : 'Failed to update notifications', 'error');
    }
  }, [apiFetch, showToast, isRtl]);

  // تحديث البيانات المتوازي عند بدء التشغيل وتغيير الحساب
  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  useEffect(() => {
    if (currentUser) {
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser, fetchNotifications]);

  // حساب نسبة التطابق الذكية
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
        match: `${matchPercent}% ${isRtl ? 'تطابق' : 'Match'}`,
        matchedSkills,
        missingSkills
      };
    });
  }, [rawProjects, userSkills, isRtl]);

  // مساعد لترجمة مسميات التخصصات
  const translateMajor = useCallback((major) => {
    if (!major) return '';
    if (major.includes('CIS') || major.includes('أنظمة المعلومات')) return t('majors.cis');
    if (major.includes('Computer Science') || major.includes('علم الحاسوب')) return t('majors.cs');
    if (major.includes('IT') || major.includes('تقنية المعلومات')) return t('majors.it');
    if (major.includes('Cybersecurity') || major.includes('أمن المعلومات')) return t('majors.cybersecurity');
    if (major.includes('الوسائط') || major.includes('Media')) return t('majors.web');
    if (major.includes('هندسة البرمجيات') || major.includes('Software')) return t('majors.se');
    return major;
  }, [t]);

  // مساعد لترجمة مستوى الصعوبة
  const translateDifficulty = useCallback((diff) => {
    if (!diff) return '';
    if (diff === 'متوسط' || diff === 'Intermediate') return isRtl ? 'متوسط' : 'Intermediate';
    if (diff === 'متقدم' || diff === 'Advanced') return isRtl ? 'متقدم' : 'Advanced';
    if (diff === 'مبتدئ' || diff === 'Beginner') return isRtl ? 'مبتدئ' : 'Beginner';
    return diff;
  }, [isRtl]);

  // مساعد لترجمة مسمى الدور
  const getRoleLabel = useCallback((role) => {
    if (role === 'supervisor') return t('roles.supervisor');
    if (role === 'company' || role === 'partner') return t('roles.company');
    if (role === 'admin') return t('roles.admin');
    return t('roles.student');
  }, [t]);

  // مساعد لترجمة رسائل الأخطاء
  const translateErrorMessage = useCallback((detail) => {
    if (!detail) return t('common.error');
    if (typeof detail !== 'string') return String(detail);
    if (detail.includes('البريد الإلكتروني أو كلمة المرور')) {
      return isRtl ? detail : 'Invalid email or password.';
    }
    if (detail.includes('الصلاحية') || detail.includes('permission')) {
      return isRtl ? 'ليس لديك الصلاحية لتنفيذ هذا الإجراء.' : 'You do not have permission to perform this action.';
    }
    if (detail.includes('غير موجود') || detail.includes('not found')) {
      return isRtl ? 'العنصر المطلوب غير موجود.' : 'Requested item not found.';
    }
    if (detail.includes('المقاعد') || detail.includes('مكتملة') || detail.includes('seats')) {
      return isRtl ? 'المقاعد مكتملة لهذا المشروع.' : 'Seats are already full for this project.';
    }
    if (detail.includes('مسبقاً') || detail.includes('مسجل') || detail.includes('already')) {
      return isRtl ? 'تم تقديم طلب مسبقاً لهذا المشروع.' : 'You have already applied for this project.';
    }
    return detail;
  }, [t, isRtl]);

  // ==========================================
  // إدارة الشات المباشر للمشروع
  // ==========================================
  const [chatMessages, setChatMessages] = useState([]);
  const [isFetchingChat, setIsFetchingChat] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);

  const fetchProjectMessages = useCallback(async (projectId) => {
    if (!projectId) return;
    setIsFetchingChat(true);
    try {
      const res = await apiFetch(`/projects/${projectId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setChatMessages(Array.isArray(data) ? data : []);
      }
    } catch {
      // Ignored
    } finally {
      setIsFetchingChat(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (activeChatProject) {
      fetchProjectMessages(activeChatProject.id);
    } else {
      setChatMessages([]);
    }
  }, [activeChatProject, fetchProjectMessages]);

  const sendProjectMessage = useCallback(async (projectId, text) => {
    if (!text?.trim() || !projectId) return;
    setIsSendingChat(true);
    try {
      const res = await apiFetch(`/projects/${projectId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text: text.trim() })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(translateErrorMessage(errData.detail || (isRtl ? 'تعذر إرسال الرسالة.' : 'Could not send message.')));
      }
      const newMsg = await res.json();
      setChatMessages((prev) => [...prev, newMsg]);
      fetchNotifications();
      return newMsg;
    } catch (err) {
      showToast(`${isRtl ? 'خطأ في إرسال الرسالة' : 'Error sending message'}: ${err.message}`, 'error');
      throw err;
    } finally {
      setIsSendingChat(false);
    }
  }, [apiFetch, translateErrorMessage, isRtl, fetchNotifications, showToast]);

  // ==========================================
  // إضافة مشروع جديد
  // ==========================================
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);

  const createProject = useCallback(async ({ title, description, required_skills, max_members }) => {
    if (!title?.trim()) return;
    setIsSubmittingProject(true);
    try {
      const res = await apiFetch('/projects/', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description?.trim() || '',
          required_skills: required_skills?.trim() || '',
          max_members: Number(max_members) || 4
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(translateErrorMessage(errData.detail || (isRtl ? 'تعذر إضافة المشروع.' : 'Could not create project.')));
      }
      await fetchProjects();
      fetchNotifications();
      setIsCreateModalOpen(false);
      showToast(t('toasts.project_created'), 'success');
      return true;
    } catch (err) {
      showToast(`${isRtl ? 'خطأ' : 'Error'}: ${err.message}`, 'error');
      throw err;
    } finally {
      setIsSubmittingProject(false);
    }
  }, [apiFetch, fetchProjects, fetchNotifications, translateErrorMessage, isRtl, showToast, t]);

  // ==========================================
  // اعتماد أو رفض مشروع من المشرف (مع التحديث الفوري المباشر Optimistic Update)
  // ==========================================
  const approveProject = useCallback(async (projectId, targetStatus, feedback = null) => {
    // تحديث فوري مباشر للواجهة قبل انتظار الشبكة
    setRawProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status: targetStatus, supervisor_feedback: feedback } : p))
    );
    try {
      const res = await apiFetch(`/projects/${projectId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: targetStatus, feedback })
      });
      if (!res.ok) {
        // تراجع فوري في حال حدوث خطأ
        await fetchProjects();
        const errData = await res.json().catch(() => ({}));
        throw new Error(translateErrorMessage(errData.detail || (isRtl ? 'تعذر تحديث حالة المشروع.' : 'Could not update project status.')));
      }
      fetchNotifications();
      showToast(t('toasts.project_status_updated', {
        status: targetStatus === 'approved' ? (isRtl ? 'معتمد' : 'Approved') : targetStatus === 'rejected' ? (isRtl ? 'مرفوض' : 'Rejected') : (isRtl ? 'قيد المراجعة' : 'Pending')
      }), 'success');
      return true;
    } catch (err) {
      showToast(`${isRtl ? 'خطأ' : 'Error'}: ${err.message}`, 'error');
      throw err;
    }
  }, [apiFetch, fetchProjects, fetchNotifications, translateErrorMessage, isRtl, showToast, t]);

  // ==========================================
  // تقديم طلب انضمام لمشروع
  // ==========================================
  const [isSubmittingApply, setIsSubmittingApply] = useState(false);

  const applyToProject = useCallback(async ({ projectId, role, message }) => {
    if (!projectId) return;
    setIsSubmittingApply(true);
    try {
      const defaultRole = role || (isRtl ? 'مطور برمجيات' : 'Software Developer');
      const defaultMsg = message || (isRtl ? 'أرغب بالانضمام لتنفيذ هذا المشروع ومتحمس لتقديم أفضل نتائج.' : 'Interested in joining this project team.');
      const fullMsg = `[Role: ${defaultRole}] [Major: ${studentCv.major}] - ${defaultMsg}`;

      const res = await apiFetch('/applications/', {
        method: 'POST',
        body: JSON.stringify({
          project_id: projectId,
          message: fullMsg
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(translateErrorMessage(errData.detail || (isRtl ? 'تعذر تقديم الطلب.' : 'Could not submit application.')));
      }

      await fetchApplications();
      await fetchProjects();
      fetchNotifications();
      setIsApplyModalOpen(false);
      showToast(t('toasts.apply_success'), 'success');
      return true;
    } catch (err) {
      showToast(`${isRtl ? 'تنبيه' : 'Notice'}: ${err.message}`, 'error');
      throw err;
    } finally {
      setIsSubmittingApply(false);
    }
  }, [apiFetch, studentCv.major, translateErrorMessage, isRtl, fetchApplications, fetchProjects, fetchNotifications, showToast, t]);

  // ==========================================
  // تحديث حالة طلب الانضمام مع دعم الملاحظات
  // ==========================================
  const updateApplicationStatus = useCallback(async (applicationId, targetStatus, feedback = null) => {
    try {
      const payload = { status: targetStatus };
      if (feedback) payload.feedback = feedback;

      const res = await apiFetch(`/applications/${applicationId}/status`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(translateErrorMessage(errData.detail || (isRtl ? 'تعذر تحديث حالة الطلب.' : 'Could not update application status.')));
      }

      setApplications((prev) =>
        prev.map((app) => app.id === applicationId ? { ...app, status: targetStatus, feedback } : app)
      );
      await fetchProjects();
      await fetchApplications();
      fetchNotifications();
      showToast(t('toasts.status_updated', {
        status: (targetStatus === 'academically_approved' || targetStatus === 'accepted') 
          ? (isRtl ? 'معتمد أكاديمياً' : 'Academically Approved') 
          : (targetStatus === 'company_accepted' ? (isRtl ? 'مرشح من الشركة' : 'Company Nominated') : (isRtl ? 'مرفوض' : 'Rejected'))
      }), 'success');
      return true;
    } catch (err) {
      showToast(`${isRtl ? 'خطأ' : 'Error'}: ${err.message}`, 'error');
      throw err;
    }
  }, [apiFetch, fetchProjects, fetchApplications, fetchNotifications, translateErrorMessage, isRtl, showToast, t]);

  // ==========================================
  // تسليم تقرير الطالب وحفظه بقاعدة البيانات
  // ==========================================
  const submitReport = useCallback(async (reportData, url) => {
    try {
      let body;
      if (typeof reportData === 'object' && reportData !== null) {
        body = reportData;
      } else {
        const existing = reportsTimeline.find((r) => r.id === reportData);
        body = {
          project_id: existing?.project_id || myProject?.id || 1,
          title: existing?.title || (isRtl ? `تقرير تسليم مرحلي #${reportData}` : `Milestone Deliverable #${reportData}`),
          description: existing?.description || null,
          file_url: url || existing?.submissionLink || null,
          deadline_date: existing?.deadlineDate || null
        };
      }

      const res = await apiFetch('/reports/', {
        method: 'POST',
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || (isRtl ? 'تعذر تسليم التقرير' : 'Failed to submit report'));
      }

      await fetchReports();
      setSubmitReportModal(null);
      showToast(t('toasts.report_submitted') || (isRtl ? 'تم تسليم التقرير بنجاح!' : 'Report submitted successfully!'), 'success');
      return true;
    } catch (err) {
      showToast(`${isRtl ? 'خطأ' : 'Error'}: ${err.message}`, 'error');
      throw err;
    }
  }, [apiFetch, fetchReports, reportsTimeline, myProject, isRtl, showToast, t]);

  // ==========================================
  // تحديث حالة تقرير الطالب من قبل المشرف
  // ==========================================
  const updateReportStatus = useCallback(async (reportId, targetStatus, feedback = null, grade = null) => {
    try {
      const res = await apiFetch(`/reports/${reportId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: targetStatus,
          supervisor_feedback: feedback,
          grade: grade
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || (isRtl ? 'تعذر تحديث حالة التقرير' : 'Failed to update report status'));
      }

      await fetchReports();
      showToast(isRtl ? 'تم تحديث تقييم التقرير بنجاح' : 'Report evaluation updated successfully', 'success');
      return true;
    } catch (err) {
      showToast(`${isRtl ? 'خطأ' : 'Error'}: ${err.message}`, 'error');
      throw err;
    }
  }, [apiFetch, fetchReports, isRtl, showToast]);

  // ==========================================
  // الملفات الخاصة (السيرة الذاتية وملفات التقارير): تُفتح عبر رابط موقّع قصير الأجل
  // ==========================================
  const openSignedFile = useCallback(async (endpoint) => {
    try {
      const res = await apiFetch(endpoint);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        throw new Error(data.detail || (isRtl ? 'تعذر فتح الملف' : 'Could not open the file'));
      }
      const url = data.url.startsWith('/') ? `${API_URL}${data.url}` : data.url;
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, [apiFetch, isRtl, showToast]);

  const openUserCv = useCallback((userId) => openSignedFile(`/users/${userId}/cv`), [openSignedFile]);

  const uploadMyCv = useCallback(async (file) => {
    if (!file) return false;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showToast(isRtl ? 'يرجى اختيار ملف بصيغة PDF فقط' : 'Please choose a PDF file', 'error');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast(isRtl ? 'حجم الملف يجب ألا يتجاوز 5 ميغابايت' : 'File size cannot exceed 5 MB', 'error');
      return false;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await apiFetch('/users/me/cv-upload', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || (isRtl ? 'تعذر رفع الملف' : 'Upload failed'));
      setStudentCv((prev) => ({ ...prev, hasCv: true }));
      showToast(isRtl ? 'تم رفع السيرة الذاتية بنجاح' : 'CV uploaded successfully', 'success');
      return true;
    } catch (err) {
      showToast(err.message, 'error');
      return false;
    }
  }, [apiFetch, isRtl, showToast]);

  // ==========================================
  // حفظ السيرة الذاتية للطالب
  // ==========================================
  const saveStudentCv = useCallback((newCv) => {
    setStudentCv(newCv);
    if (typeof window !== 'undefined' && currentUserId) {
      localStorage.setItem(`student_academic_cv_${currentUserId}`, JSON.stringify(newCv));
    }
    if (apiFetch) {
      apiFetch('/users/me/profile', {
        method: 'PUT',
        body: JSON.stringify({
          major: newCv.major,
          course: newCv.course,
          portfolio_url: newCv.portfolioUrl,
          bio: newCv.bio
        })
      }).catch(() => {});
    }
    showToast(t('toasts.cv_saved'), 'success');
  }, [currentUserId, apiFetch, showToast, t]);

  return (
    <AppContext.Provider
      value={{
        currentLang,
        isRtl,
        toggleLanguage,
        toasts,
        showToast,
        removeToast,
        rawProjects,
        isLoadingProjects,
        fetchProjects,
        applications,
        isLoadingApplications,
        fetchApplications,
        favorites,
        savedProjects: favorites,
        toggleFavorite,
        userSkills,
        setUserSkills,
        addSkill,
        removeSkill,
        studentCv,
        setStudentCv,
        saveStudentCv,
        openSignedFile,
        openUserCv,
        uploadMyCv,
        activeChatProject,
        setActiveChatProject,
        chatMessages,
        isFetchingChat,
        isSendingChat,
        fetchProjectMessages,
        sendProjectMessage,
        isCreateModalOpen,
        setIsCreateModalOpen,
        isSubmittingProject,
        createProject,
        approveProject,
        updateProjectStatus: approveProject,
        refreshAllData,
        isApplyModalOpen,
        setIsApplyModalOpen,
        isSubmittingApply,
        applyToProject,
        updateApplicationStatus,
        selectedProject,
        setSelectedProject,
        showApplicationsModal,
        setShowApplicationsModal,
        showSkillsModal,
        setShowSkillsModal,
        isOnboardingModalOpen,
        setIsOnboardingModalOpen,
        openStudentOnboarding: () => setIsOnboardingModalOpen(true),
        isSidebarOpen,
        setIsSidebarOpen,
        notifications,
        isLoadingNotifications,
        isNotificationsOpen,
        setIsNotificationsOpen,
        fetchNotifications,
        handleMarkNotificationRead,
        handleMarkAllNotificationsRead,
        reportsTimeline,
        setReportsTimeline,
        fetchReports,
        updateReportStatus,
        myProject,
        fetchMyProject,
        submitReportModal,
        setSubmitReportModal,
        submitReport,
        studentsList,
        setStudentsList,
        fetchStudents,
        matchedProjects,
        translateMajor,
        translateDifficulty,
        getRoleLabel,
        translateErrorMessage,
        theme,
        isDark,
        toggleTheme,
        setTheme
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
