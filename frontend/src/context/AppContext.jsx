import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { API_URL, INITIAL_FALLBACK_PROJECTS, ACADEMIC_MAJORS } from '../api/client';

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
  // ==========================================
  const [rawProjects, setRawProjects] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  const [applications, setApplications] = useState([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);

  // المفضلة
  const [favorites, setFavorites] = useState([]);
  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
  }, []);

  // مهارات الطالب
  const [userSkills, setUserSkills] = useState(['Python', 'FastAPI', 'Docker', 'React', 'TailwindCSS']);
  const addSkill = useCallback((skill) => {
    const s = skill.trim();
    if (s && !userSkills.includes(s)) {
      setUserSkills((prev) => [...prev, s]);
    }
  }, [userSkills]);

  const removeSkill = useCallback((skillToRemove) => {
    setUserSkills((prev) => prev.filter((s) => s !== skillToRemove));
  }, []);

  // السيرة الذاتية للطالب
  const [studentCv, setStudentCv] = useState(() => {
    if (typeof window === 'undefined') return { major: 'أنظمة المعلومات الحاسوبية (CIS)', course: 'مشروع تخرج 1', portfolioUrl: 'https://github.com', bio: '' };
    const saved = localStorage.getItem('student_academic_cv');
    return saved ? JSON.parse(saved) : {
      major: 'أنظمة المعلومات الحاسوبية (CIS)',
      course: 'مشروع تخرج 1',
      portfolioUrl: 'https://github.com',
      bio: 'طالب في السنة النهائية، مهتم بتطوير الأنظمة السحابية وحلول الويب المتكاملة.'
    };
  });

  // ==========================================
  // النوافذ المنبثقة (Modals State)
  // ==========================================
  const [activeChatProject, setActiveChatProject] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [showSkillsModal, setShowSkillsModal] = useState(false);

  // السايد بار في الموبايل
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ==========================================
  // الإشعارات الحية (Live Notifications)
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

  // دليل الطلاب المتاحين
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

  // مؤقت أمان يمنع بقاء حالة تحميل المشاريع معلقة لأكثر من 1.5 ثانية
  useEffect(() => {
    let timer;
    if (isLoadingProjects) {
      timer = setTimeout(() => {
        setIsLoadingProjects(false);
        setRawProjects((prev) => (prev.length > 0 ? prev : INITIAL_FALLBACK_PROJECTS));
      }, 1500);
    }
    return () => clearTimeout(timer);
  }, [isLoadingProjects]);

  // ==========================================
  // دوال الاتصال بالباك إند وجلب البيانات
  // ==========================================
  const fetchProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    try {
      const res = await fetch(`${API_URL}/projects/`, { signal: controller.signal });
      clearTimeout(timeoutId);
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
    } catch {
      setRawProjects(INITIAL_FALLBACK_PROJECTS);
    } finally {
      clearTimeout(timeoutId);
      setIsLoadingProjects(false);
    }
  }, []);

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

  // تحديث البيانات عند بدء التشغيل
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (currentUser) {
      fetchApplications();
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser, fetchApplications, fetchNotifications]);

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
  // اعتماد أو رفض مشروع من المشرف
  // ==========================================
  const approveProject = useCallback(async (projectId, targetStatus) => {
    try {
      const res = await apiFetch(`/projects/${projectId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: targetStatus })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(translateErrorMessage(errData.detail || (isRtl ? 'تعذر تحديث حالة المشروع.' : 'Could not update project status.')));
      }
      await fetchProjects();
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
  // تحديث حالة طلب الانضمام
  // ==========================================
  const updateApplicationStatus = useCallback(async (applicationId, targetStatus) => {
    try {
      const res = await apiFetch(`/applications/${applicationId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: targetStatus })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(translateErrorMessage(errData.detail || (isRtl ? 'تعذر تحديث حالة الطلب.' : 'Could not update application status.')));
      }

      setApplications((prev) =>
        prev.map((app) => app.id === applicationId ? { ...app, status: targetStatus } : app)
      );
      await fetchProjects();
      fetchNotifications();
      showToast(t('toasts.status_updated', {
        status: targetStatus === 'accepted' ? (isRtl ? 'مقبول' : 'Accepted') : (isRtl ? 'مرفوض' : 'Rejected')
      }), 'success');
      return true;
    } catch (err) {
      showToast(`${isRtl ? 'خطأ' : 'Error'}: ${err.message}`, 'error');
      throw err;
    }
  }, [apiFetch, fetchProjects, fetchNotifications, translateErrorMessage, isRtl, showToast, t]);

  // ==========================================
  // تسليم تقرير الطالب
  // ==========================================
  const submitReport = useCallback((reportId, url) => {
    if (!url?.trim()) return;
    setReportsTimeline((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: 'submitted',
              submissionLink: url,
              submittedAt: isRtl ? 'اليوم، تم التسليم بنجاح' : 'Today, submitted successfully'
            }
          : r
      )
    );
    setSubmitReportModal(null);
    showToast(t('toasts.report_submitted'), 'success');
  }, [isRtl, showToast, t]);

  // ==========================================
  // حفظ السيرة الذاتية للطالب
  // ==========================================
  const saveStudentCv = useCallback((newCv) => {
    setStudentCv(newCv);
    if (typeof window !== 'undefined') {
      localStorage.setItem('student_academic_cv', JSON.stringify(newCv));
    }
    showToast(t('toasts.cv_saved'), 'success');
  }, [showToast, t]);

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
        toggleFavorite,
        userSkills,
        setUserSkills,
        addSkill,
        removeSkill,
        studentCv,
        setStudentCv,
        saveStudentCv,
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
        submitReportModal,
        setSubmitReportModal,
        submitReport,
        studentsList,
        setStudentsList,
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
