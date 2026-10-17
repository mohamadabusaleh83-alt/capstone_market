import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { ACADEMIC_MAJORS } from '../api/client';
import ProjectCard from '../components/ProjectCard';
import {
  Search,
  Sparkles,
  Star,
  Layers,
  PlusCircle,
  RefreshCw
} from 'lucide-react';

export default function ProjectsPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const {
    matchedProjects,
    isLoadingProjects,
    favorites,
    setIsCreateModalOpen,
    translateMajor
  } = useApp();

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'match';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  // Keep URL query param synced
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

  // تصفية المشاريع للبحث والتصنيف بمرونة عالية
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => handleTabChange('match')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'match'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{t('nav.smart_match')}</span>
            <span className="text-[10px] bg-blue-500/20 px-1.5 py-0.2 rounded border border-blue-400/30">AI</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('browse')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'browse'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-blue-400" />
            <span>{t('nav.browse_all')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('favorites')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'favorites'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Star className="w-4 h-4 text-amber-400" />
            <span>{t('nav.favorites')}</span>
            {favorites.length > 0 && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-full font-bold">
                {favorites.length}
              </span>
            )}
          </button>
        </div>

        {(currentUser?.role === 'company' || currentUser?.role === 'supervisor') && (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 transition cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('create_project.btn_add')}</span>
          </button>
        )}
      </div>

      {/* شريط البحث وتصفية التخصصات */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-3" />
          <input
            type="text"
            placeholder={t('projects.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl ps-10 pe-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat, idx) => (
            <button
              type="button"
              key={idx}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-xl font-medium transition cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat === 'الكل' ? t('common.all') : translateMajor(cat)}
            </button>
          ))}
        </div>
      </div>

      {isLoadingProjects && (
        <div className="text-center py-8 text-xs text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
          {t('projects.loading')}
        </div>
      )}

      {/* شبكة المشاريع */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-4 my-2 shadow-inner">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400 shadow-md">
              <Search className="w-7 h-7 text-blue-400" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white">{t('projects.no_results_title')}</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                {activeTab === 'favorites'
                  ? t('projects.no_favorites_desc')
                  : t('projects.no_results_desc')}
              </p>
            </div>
            {(searchQuery || selectedCategory !== 'الكل' || activeTab === 'favorites') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('الكل');
                  if (activeTab === 'favorites') handleTabChange('browse');
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-blue-500/20"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {t('projects.clear_filters')}
              </button>
            )}
          </div>
        ) : (
          filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))
        )}
      </div>
    </div>
  );
}
