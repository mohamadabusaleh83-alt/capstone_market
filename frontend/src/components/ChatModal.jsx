import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { MessageSquare, RefreshCw, X, Send, Building2, GraduationCap, Trash2 } from 'lucide-react';

export default function ChatModal() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const {
    activeChatProject,
    setActiveChatProject,
    chatMessages,
    isFetchingChat,
    isSendingChat,
    fetchProjectMessages,
    sendProjectMessage,
    deleteProjectMessage,
    isRtl
  } = useApp();

  const userRole = (currentUser?.role || '').toLowerCase();
  const isCompany = ['company', 'partner', 'business'].includes(userRole);
  const isSupervisor = userRole === 'supervisor';
  const isAdmin = userRole === 'admin';

  // تحديد القناة الافتراضية بحسب الدور (المشرف يبدأ بالإشراف، الشركة والطلاب يبدأون بالنقاش الفني)
  const [activeTab, setActiveTab] = useState(
    isSupervisor ? 'supervisor_student' : 'company_student'
  );
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef(null);

  // الشركات ممنوعة تماماً من قناة الإشراف الأكاديمي
  useEffect(() => {
    if (isCompany && activeTab !== 'company_student') {
      setActiveTab('company_student');
    }
  }, [isCompany, activeTab]);

  // جلب الرسائل عند تغيير القناة أو فتح الشات
  useEffect(() => {
    if (activeChatProject?.id) {
      fetchProjectMessages(activeChatProject.id, activeTab);
    }
  }, [activeChatProject?.id, activeTab, fetchProjectMessages]);

  // التمرير التلقائي لأسفل المحادثة فور الفتح وتلقي أي رسالة جديدة
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (activeChatProject) {
      scrollToBottom('auto');
    }
  }, [activeChatProject, scrollToBottom]);

  useEffect(() => {
    if (chatMessages && chatMessages.length > 0) {
      scrollToBottom('smooth');
    }
  }, [chatMessages, scrollToBottom]);

  if (!activeChatProject) return null;

  const handleSwitchTab = (tab) => {
    if (isCompany && tab === 'supervisor_student') return;
    setActiveTab(tab);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    try {
      await sendProjectMessage(activeChatProject.id, messageInput, activeTab);
      setMessageInput('');
    } catch {
      // Handled in context
    }
  };

  const handleDeleteMessage = async (msgId) => {
    const confirmText = t(
      'chat.confirm_delete_message',
      isRtl ? 'هل أنت متأكد من حذف هذه الرسالة؟' : 'Are you sure you want to delete this message?'
    );
    if (window.confirm(confirmText)) {
      await deleteProjectMessage(activeChatProject.id, msgId);
    }
  };

  const roleLabels = {
    student: t('roles.student'),
    supervisor: t('roles.supervisor'),
    company: t('roles.company'),
    partner: t('roles.company'),
    admin: t('roles.admin')
  };

  // تصفية الرسائل المباشرة المعروضة للقناة النشطة فقط
  const displayedMessages = chatMessages.filter(
    (m) => (m.conversation_type || 'company_student') === activeTab
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl flex flex-col h-[640px] max-h-[92vh] shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* رأس الشات العصري */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 dark:bg-slate-800 border border-cyan-500/20 dark:border-slate-700 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-sm shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="truncate max-w-xs">{activeChatProject.title}</span>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                    activeChatProject.status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
                      : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30'
                  }`}
                >
                  {activeChatProject.status === 'approved'
                    ? t('chat.approved_badge')
                    : t('chat.pending_badge')}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {activeTab === 'supervisor_student'
                  ? t('chat.supervisor_subtitle', 'متابعة وتقييم وتوجيهات المشرف الأكاديمي مع الطلاب')
                  : t('chat.company_subtitle', 'نقاش المتطلبات الفنية والمهام العملية مع الشريك الصناعي والطلاب')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fetchProjectMessages(activeChatProject.id, activeTab)}
              title={t('chat.refresh')}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition cursor-pointer active:scale-90"
              aria-label={t('chat.refresh')}
            >
              <RefreshCw className={`w-4 h-4 ${isFetchingChat ? 'animate-spin text-cyan-600 dark:text-cyan-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setActiveChatProject(null)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition cursor-pointer active:scale-90"
              aria-label={t('common.close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* شريط التبويبات الفاصل بين القنوات (مخفي للشركات لحظر الوصول الأكاديمي) */}
        {!isCompany && (
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/60 p-1.5 gap-1.5">
            <button
              type="button"
              onClick={() => handleSwitchTab('company_student')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'company_student'
                  ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-900/50'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>{t('chat.tab_company', 'نقاش الشركة والطلاب الفني')}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab('supervisor_student')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'supervisor_student'
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-900/50'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>{t('chat.tab_supervisor', 'الإشراف والمتابعة الأكاديمية')}</span>
            </button>
          </div>
        )}

        {/* منطقة الرسائل مع التباين اللوني الأنيق */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-50/50 dark:bg-slate-950/40">
          {isFetchingChat && displayedMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-cyan-500/10 dark:bg-slate-800 border border-cyan-500/20 dark:border-slate-700">
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-600 dark:text-cyan-400" />
              </div>
              <span>{t('chat.loading')}</span>
            </div>
          ) : displayedMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-2.5 text-xs text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center text-slate-400 shadow-sm">
                {activeTab === 'supervisor_student' ? (
                  <GraduationCap className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                ) : (
                  <Building2 className="w-7 h-7 text-cyan-600 dark:text-cyan-400" />
                )}
              </div>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-1">
                {activeTab === 'supervisor_student'
                  ? t('chat.supervisor_empty_title', 'لا توجد رسائل إشراف أكاديمي بعد')
                  : t('chat.company_empty_title', 'لا توجد رسائل فنية متبادلة بعد')}
              </p>
              <span className="text-[11px] text-slate-500 max-w-xs">
                {activeTab === 'supervisor_student'
                  ? t('chat.supervisor_empty_desc', 'تواصل مع المشرف الأكاديمي للمشروع لمناقشة التقارير وتوجيهات الإنجاز الأكاديمي.')
                  : t('chat.company_empty_desc', 'ابدأ النقاش والتنسيق التقني مع الشريك الصناعي حول متطلبات المشروع ومراحله.')}
              </span>
            </div>
          ) : (
            displayedMessages.map((msg) => {
              const isMe = msg.sender_id === currentUser?.id;
              const senderInitial = msg.sender_name ? msg.sender_name.charAt(0) : '#';
              const canDelete = isMe || isSupervisor || isAdmin;

              return (
                <div
                  key={msg.id}
                  className={`group flex flex-col max-w-[85%] ${
                    isMe
                      ? isRtl
                        ? 'mr-auto items-end'
                        : 'ml-auto items-end'
                      : isRtl
                        ? 'ml-auto items-start'
                        : 'mr-auto items-start'
                  }`}
                >
                  {/* بيانات مرسل الرسالة */}
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mb-1 px-1">
                    <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-700 dark:text-slate-300">
                      {senderInitial}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {isMe ? (isRtl ? 'أنت' : 'You') : (msg.sender_name || t('chat.user_fallback', { id: msg.sender_id }))}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded border font-medium ${
                        msg.sender_role === 'supervisor'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30'
                          : ['company', 'partner', 'business'].includes(msg.sender_role)
                            ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30'
                            : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30'
                      }`}
                    >
                      {roleLabels[msg.sender_role] || msg.sender_role}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                      {msg.created_at
                        ? new Date(msg.created_at).toLocaleTimeString(isRtl ? 'ar-EG' : 'en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : ''}
                    </span>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-red-500 cursor-pointer"
                        title={t('chat.delete_message', 'حذف الرسالة')}
                        aria-label={t('chat.delete_message', 'حذف الرسالة')}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* فقاعة الرسالة */}
                  <div
                    className={`p-3.5 text-xs leading-relaxed transition-all shadow-md ${
                      isMe
                        ? isRtl
                          ? activeTab === 'supervisor_student'
                            ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl rounded-tr-xs shadow-amber-900/20'
                            : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-2xl rounded-tr-xs shadow-cyan-900/20'
                          : activeTab === 'supervisor_student'
                            ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl rounded-tl-xs shadow-amber-900/20'
                            : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-2xl rounded-tl-xs shadow-cyan-900/20'
                        : isRtl
                          ? 'bg-white dark:bg-slate-800/95 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-2xl rounded-tl-xs shadow-sm'
                          : 'bg-white dark:bg-slate-800/95 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-2xl rounded-tr-xs shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          {/* مرجع التمرير لأسفل */}
          <div ref={messagesEndRef} />
        </div>

        {/* نموذج إرسال رسالة بتصميم عصري متكيف مع القناة */}
        <form onSubmit={handleSubmit} className="p-3 sm:p-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex gap-2.5">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={
              activeTab === 'supervisor_student'
                ? t('chat.supervisor_input_placeholder', 'اكتب رسالة للمشرف الأكاديمي أو الطالب...')
                : t('chat.company_input_placeholder', 'اكتب رسالة فنية لممثل الشركة والفريق...')
            }
            className="flex-1 bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition shadow-sm"
          />
          <button
            type="submit"
            disabled={isSendingChat || !messageInput.trim()}
            className={`text-white disabled:text-slate-400 dark:disabled:text-slate-600 px-5 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 shrink-0 ${
              activeTab === 'supervisor_student'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-amber-500/20'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/20'
            } disabled:from-slate-200 disabled:to-slate-300 dark:disabled:from-slate-800 dark:disabled:to-slate-800`}
          >
            {isSendingChat ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">{t('chat.send')}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
