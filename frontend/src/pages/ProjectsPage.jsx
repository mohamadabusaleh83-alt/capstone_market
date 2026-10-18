import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { ACADEMIC_MAJORS } from '../api/client';
import ProjectCard from '../components/ProjectCard';
import ProjectCardSkeleton from '../components/ProjectCardSkeleton';
import {
  Search,
  Sparkles,
  Star,
  Layers,
  PlusCircle,
  RefreshCw,
  FolderSearch
} from 'lucide-react';

export default function ProjectsPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const {
    matchedProjects,
    isLoadingProjects,
    favorites,
    setIsCreateModalOpen,
    translateMajor,
    isRtl
  } = useApp();

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'match';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  // مزامنة استعلام العنوان
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const categories = ['الكل', ...ACADEMIC_MAJORS];

  // تصفية المشاريع للبحث والتصنيف
  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const queryTerms = query ? query.split(/\s+/).filter(Boolean) : [];

    return matchedProjects
      .filter((p) => {
        // 1. فلترة المفضلة
        if (activeTab === 'favorites' && !favorites.includes(p.id)) {
          return false;
        }

        // 2. فلترة التخصص الأكاديمي
        if (selectedCategory !== 'الكل' && p.category !== selectedCategory) {
          return false;
        }

        // 3. فلترة البحث
        if (queryTerms.length > 0) {
          const title = (p.title || '').toLowerCase();
          const desc = (p.description || '').toLowerCase();
          const cat = (p.category || '').toLowerCase();
          const skillsStr = Array.isArray(p.skills)
            ? p.skills.join(' ').toLowerCase()
            : (p.required_skills || '').toLowerCase();
          const difficulty = (p.difficulty || '').toLowerCase();

          const combinedText = `${title} ${desc} ${cat} ${skillsStr} ${difficulty}`;

          const matchesAllTerms = queryTerms.every((term) =>
            combinedText.includes(term)
          );

          if (!matchesAllTerms) return false;
        }

        return true;
      })
      .sort((a, b) => (activeTab === 'match' ? (b.matchRate || 0) - (a.matchRate || 0) : 0));
  }, [matchedProjects, activeTab, favorites, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* رأس الصفحة مع التبويبات وزر إضافة مشروع */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => handleTabChange('match')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap ${
              activeTab === 'match'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/40'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-600 dark:text-amber-400 animate-pulse" />
            <span>{t('nav.smart_match')}</span>
            <span className="text-[10px] bg-blue-500/15 dark:bg-blue-500/20 px-1.5 py-0.2 rounded border border-blue-400/30 text-blue-600 dark:text-blue-200 font-semibold">AI</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('browse')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap ${
              activeTab === 'browse'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/40'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span>{t('nav.browse_all')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('favorites')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap ${
              activeTab === 'favorites'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/40'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Star className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>{t('nav.favorites')}</span>
            {favorites.length > 0 && (
              <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-300 px-1.5 py-0.2 rounded-full font-bold">
                {favorites.length}
              </span>
            )}
          </button>
        </div>

        {(currentUser?.role === 'company' || currentUser?.role === 'supervisor') && (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all duration-200 cursor-pointer shrink-0 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('create_project.btn_add')}</span>
          </button>
        )}
      </div>

      {/* شريط البحث وتصفية التخصصات */}
      <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-3.5 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-3" />
          <input
            type="text"
            placeholder={t('projects.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700/80 rounded-xl ps-10 pe-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-200"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat, idx) => (
            <button
              type="button"
              key={idx}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3.5 py-1.5 rounded-xl font-medium transition-all duration-150 cursor-pointer whitespace-nowrap active:scale-95 ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/40'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {cat === 'الكل' ? t('common.all') : translateMajor(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* شبكة المشاريع مع شاشات Skeleton وميضية وحالات الفراغ الجذابة */}
      {isLoadingProjects ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <ProjectCardSkeleton key={n} />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-8 sm:p-14 text-center space-y-5 shadow-sm dark:shadow-xl relative overflow-hidden">
          {/* خلفية جمالية خفيفة */}
          <div className="absolute inset-0 bg-radial from-cyan-500/5 via-transparent to-transparent pointer-events-none" />

          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center mx-auto text-cyan-600 dark:text-blue-400 shadow-md">
              {activeTab === 'favorites' ? (
                <Star className="w-8 h-8 text-amber-500 dark:text-amber-400" />
              ) : (
                <FolderSearch className="w-8 h-8 text-cyan-600 dark:text-blue-400" />
              )}
            </div>
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {activeTab === 'favorites' ? (isRtl ? 'قائمة المفضلة فارغة حالياً' : 'No Favorite Projects Yet') : t('projects.no_results_title')}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {activeTab === 'favorites'
                ? t('projects.no_favorites_desc')
                : t('projects.no_results_desc')}
            </p>
          </div>

          {(searchQuery || selectedCategory !== 'الكل' || activeTab === 'favorites') && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('الكل');
                  if (activeTab === 'favorites') handleTabChange('browse');
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer shadow-md shadow-cyan-500/20 active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t('projects.clear_filters')}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
