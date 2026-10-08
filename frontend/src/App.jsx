import React, { useState, useEffect } from 'react';
import { 
  Briefcase, CheckCircle, Clock, Search, PlusCircle, 
  Users, BarChart2, Bell, X, Check, Sparkles,
  Calendar, Award, TrendingUp, Download, Megaphone, ArrowUpRight,
  Star, MessageSquare, Layers, LogIn, LogOut, Store, UserCheck,
  Menu, ShieldCheck, GraduationCap, FileText, AlertTriangle, PieChart,
  Edit2, Trash2, MessageSquarePlus, Save, UploadCloud, Send, ExternalLink,
  Lock, KeyRound, Mail, AlertCircle
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
    const token = localStorage.getItem('token');
    return (saved && token) ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('app_user_role');
    const token = localStorage.getItem('token');
    if (saved && token) {
      const parsed = JSON.parse(saved);
      if (parsed.role === 'supervisor') return 'supervisor_teams';
      if (parsed.role === 'company') return 'company_projects';
      return 'match';
    }
    return 'login';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  const [authRole, setAuthRole] = useState('student');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

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

  const [supervisionChat, setSupervisionChat] = useState([
    { sender: 'supervisor', name: 'د. إياد الأحمد (المشرف الأكاديمي)', text: 'مرحباً بالجميع، تذكير بأن موعد تسليم تقرير المقترح SRS محدد يوم الثلاثاء القادم دون تأخير.', time: '10:30 ص' },
    { sender: 'student', name: 'أحمد منصور (قائد الفريق)', text: 'أهلاً دكتور، قمنا بإنهاء المخططات المبدئية ورفعنا رابط المسودة في خانة التسليم.', time: '11:15 ص' }
  ]);
  const [chatInputText, setChatInputText] = useState('');

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

  const [favorites, setFavorites] = useState([]);

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
      title: 'تطبيق ويب لحجز المواعيد وإدارة الطلبات للشركات الخدمية',
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
  const [chatProject, setChatProject] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [applicantRole, setApplicantRole] = useState('مطور أنظمة وواجهات');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsLoadingAuth(true);

    try {
      const defaultProfiles = {
        student: { name: 'أحمد منصور', title: 'طالب خريج (CIS)' },
        supervisor: { name: 'د. إياد الأحمد', title: 'مشرف أكاديمي' },
        company: { name: 'شركة الهدى للتجارة والخدمات', title: 'شريك تجاري / شركة' }
      };

      const userObj = {
        role: authRole,
        name: authEmail ? authEmail.split('@')[0] : defaultProfiles[authRole].name,
        title: defaultProfiles[authRole].title,
        email: authEmail || `${authRole}@domain.ps`
      };

      localStorage.setItem('token', 'mock_token_' + Date.now());
      localStorage.setItem('app_user_role', JSON.stringify(userObj));
      setCurrentUser(userObj);

      if (authRole === 'supervisor') {
        setActiveTab('supervisor_teams');
      } else if (authRole === 'company') {
        setActiveTab('company_projects');
      } else {
        setActiveTab('match');
      }
    } catch {
      setAuthError('تعذر تسجيل الدخول.');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('app_user_role');
    setCurrentUser(null);
    setIsSidebarOpen(false);
    setShowApplicationsModal(false);
    setChatProject(null);
    setEditingStudentId(null);
    setEditingReportId(null);
    setActiveTab('login');
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

  // 1. شاشة الدخول إذا لم يسجل الدخول
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans" dir="rtl">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-xs py-2.5 px-6 border-b border-amber-500/20 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-2 text-amber-300 font-semibold">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            بوابة منظومة مشاريع التخرج وربط سوق العمل (Capstone Management)
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
              <h2 className="text-xl font-bold text-white tracking-tight">تسجيل الدخول للنظام</h2>
              <p className="text-xs text-slate-400 mt-1">
                يرجى اختيار نوع الحساب لإدخال بيانات الاعتماد وتوليد الـ Session
              </p>
            </div>

            <div className="mb-5">
              <label className="text-[11px] text-slate-400 font-medium block mb-2">الدور الأكاديمي / الوظيفي:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'student', label: 'طالب خريج', icon: '🎓' },
                  { id: 'company', label: 'شركة / متجر', icon: '🏢' },
                  { id: 'supervisor', label: 'مشرف أكاديمي', icon: '🏛️' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { setAuthRole(item.id); setAuthError(''); }}
                    className={`py-2.5 px-1 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                      authRole === item.id
                        ? 'border-blue-500 bg-blue-600/20 text-white shadow-md'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-[11px]">{item.label}</span>
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

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] text-slate-300 block mb-1 font-medium">البريد الإلكتروني / الرقم الجامعي</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder={authRole === 'student' ? '12020412@edu.ps' : authRole === 'supervisor' ? 'dr.eyad@edu.ps' : 'contact@company.com'}
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
                <LogIn className="w-4 h-4" />
                {isLoadingAuth ? 'جاري التحقق من الصلاحيات...' : 'دخول إلى النظام (Authorize)'}
              </button>
            </form>
          </div>
        </div>

        <footer className="text-center py-3 text-[11px] text-slate-500 border-t border-slate-900 bg-slate-950">
          منظومة إدارة مشاريع التخرج الأكاديمية والربط بسوق العمل © 2026
        </footer>
      </div>
    );
  }

  // 2. الشاشة الرئيسية بعد تسجيل الدخول
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" dir="rtl">
      
      {/* الشريط العلوي */}
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

      {/* رأس الصفحة */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 md:px-6 py-3 flex items-center justify-between">
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
            <h1 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
              منصة مشاريع التخرج وربط سوق العمل
            </h1>
            <p className="text-[11px] text-slate-400">
              جلسة نشطة: <strong className="text-slate-200">{currentUser.name}</strong> ({currentUser.title})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* إخفاء زر التقارير عن حساب الشركة */}
          {currentUser.role !== 'company' && (
            <button
              onClick={() => setActiveTab('reports_hub')}
              className="flex items-center gap-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-200 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
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
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* جسم المنصة */}
      <div className="flex-1 flex relative overflow-hidden">
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-35 md:hidden"
          />
        )}

        {/* القائمة الجانبية */}
        <aside className={`
          fixed md:static inset-y-0 right-0 z-40 w-64 bg-slate-900 border-l border-slate-800 p-4 
          flex flex-col justify-between transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
          <div className="space-y-3">
            <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-xl mb-4">
              <span className="text-[10px] text-slate-400 block mb-0.5">الحساب النشط:</span>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                {currentUser.role === 'company' ? (
                  <Store className="w-3.5 h-3.5 text-blue-400" />
                ) : currentUser.role === 'supervisor' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                )}
                {currentUser.name}
              </p>
              <span className="text-[10px] text-slate-400 block mt-1">
                {currentUser.title}
              </span>
            </div>

            <p className="text-[11px] font-semibold text-slate-500 uppercase px-2">لوحة التحكم والتنقل</p>
            
            {/* إخفاء زر التقارير بالقائمة الجانبية عن حساب الشركة */}
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
                  onClick={() => { setActiveTab('supervisor_review'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    activeTab === 'supervisor_review'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  اعتماد المشاريع الأكاديمية
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

        {/* المساحة الرئيسية */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">

          {/* تبويب التقارير (محمي للطالب والمشرف فقط) */}
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
                  طرح فكرة مشروع لشركتك
                </button>
              </div>

              <div>
                <h3 className="font-bold text-base text-white mb-4">المشاريع التي طرحتموها للطلاب</h3>
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
                          onClick={() => setShowApplicationsModal(true)}
                          className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5 text-blue-400" />
                          عرض طلبات الطلاب المتقدمين
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
                  <p className="text-2xl font-black mt-2 text-blue-400">{matchedProjects.length}</p>
                  <span className="text-[10px] text-emerald-400 mt-1 block">نشطة وقابلة للتطبيق</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <p className="text-xs text-slate-400">المهارات الأكثر طلباً</p>
                  <p className="text-2xl font-black mt-2 text-amber-400">Python & SQL</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">في طلبات الشركات والمتاجر</span>
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
            /* المشاريع والمطابقة */
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
                        <button
                          disabled={isFull}
                          onClick={() => {
                            setSelectedProject(project);
                            setIsApplyModalOpen(true);
                          }}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold shadow-md transition flex items-center justify-center gap-1.5 ${
                            isFull
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 cursor-pointer'
                          }`}
                        >
                          {isFull ? 'مكتمل' : 'تقديم طلب انضمام / فريق'}
                          {!isFull && <ArrowUpRight className="w-3.5 h-3.5" />}
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

      {/* نافذة إضافة مشروع (للشركات) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setIsCreateModalOpen(false)} className="absolute left-4 top-4 text-slate-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold mb-4 text-white">طرح مشكلة برمجية من قبل الشركة</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              setIsCreateModalOpen(false);
              alert('تم نشر المشروع بنجاح وهو الآن بانتظار اعتماد المشرف الأكاديمي!');
            }} className="space-y-3.5">
              <input
                type="text"
                placeholder="عنوان المشكلة (مثال: نظام إدارة عمليات التوزيع)"
                required
                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
              />
              <textarea
                placeholder="شرح المشكلة والمتطلبات المتوقعة من الطلاب..."
                rows={3}
                required
                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
              />
              <input
                type="text"
                placeholder="المهارات المقترحة (مثال: Python, React, SQL)"
                required
                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
              />
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl font-bold text-xs text-white transition cursor-pointer"
              >
                تأكيد ونشر المشكلة
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

            <form onSubmit={(e) => {
              e.preventDefault();
              setIsApplyModalOpen(false);
              alert('تم إرسال الطلب والسيرة الذاتية للمشرف الأكاديمي بنجاح!');
            }} className="space-y-3.5">
              <input
                type="text"
                placeholder="اسمك الكامل"
                required
                defaultValue={currentUser.name}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
              />
              <input
                type="text"
                placeholder="الدور المطلوب (مثال: مهندس واجهات، ذكاء اصطناعي)"
                required
                defaultValue={applicantRole}
                onChange={(e) => setApplicantRole(e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
              />
              <textarea
                placeholder="رسالة تعريفية موجزة أو نبذة عن جاهزية الفريق..."
                rows={2}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
              />
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl font-semibold text-xs text-white transition cursor-pointer"
              >
                إرسال الطلب للمشرف
              </button>
            </form>
          </div>
        </div>
      )}

      {/* نافذة طلبات الطلاب المتقدمين (للشركات) */}
      {showApplicationsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 relative">
            <button onClick={() => setShowApplicationsModal(false)} className="absolute left-4 top-4 text-slate-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold mb-1 text-white">طلبات الطلاب المتقدمين لمشاريع الشركة</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto mt-4 pr-1">
              {applications.map((app) => (
                <div key={app.id} className="p-3.5 bg-slate-800/50 border border-slate-700/60 rounded-xl flex items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="font-semibold text-white mb-1">{app.applicant_name} ({app.applicant_role})</div>
                    <p className="text-slate-400">{app.message}</p>
                  </div>
                  <span className="text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2.5 py-1 rounded-lg shrink-0">
                    {app.status === 'accepted' ? 'معتمد' : 'قيد المراجعة'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}