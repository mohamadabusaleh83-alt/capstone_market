import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { MessageSquare, RefreshCw, X, Send } from 'lucide-react';

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
    isRtl
  } = useApp();

  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef(null);

  // التمرير التلقائي لأسفل المحادثة فور الفتح وتلقي أي رسالة جديدة
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (activeChatProject) {
      scrollToBottom('auto');
    }
  }, [activeChatProject]);

  useEffect(() => {
    if (chatMessages && chatMessages.length > 0) {
      scrollToBottom('smooth');
    }
  }, [chatMessages]);

  if (!activeChatProject) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    try {
      await sendProjectMessage(activeChatProject.id, messageInput);
      setMessageInput('');
    } catch {
      // Error is handled in context
    }
  };

  const roleLabels = {
    student: t('roles.student'),
    supervisor: t('roles.supervisor'),
    company: t('roles.company'),
    partner: t('roles.company'),
    admin: t('roles.admin')
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl flex flex-col h-[620px] max-h-[92vh] shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* رأس الشات العصري */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-indigo-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="truncate max-w-xs">{activeChatProject.title}</span>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                    activeChatProject.status === 'approved'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border-amber-800'
                  }`}
                >
                  {activeChatProject.status === 'approved'
                    ? t('chat.approved_badge')
                    : t('chat.pending_badge')}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">{t('chat.subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fetchProjectMessages(activeChatProject.id)}
              title={t('chat.refresh')}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition cursor-pointer active:scale-90"
              aria-label={t('chat.refresh')}
            >
              <RefreshCw className={`w-4 h-4 ${isFetchingChat ? 'animate-spin text-blue-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setActiveChatProject(null)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition cursor-pointer active:scale-90"
              aria-label={t('common.close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* منطقة الرسائل مع التباين اللوني الأنيق */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-950/40">
          {isFetchingChat && chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
              </div>
              <span>{t('chat.loading')}</span>
            </div>
          ) : chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2.5 text-xs text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-500 shadow-md">
                <MessageSquare className="w-7 h-7 text-blue-400" />
              </div>
              <p className="font-bold text-slate-200 text-sm mt-1">{t('chat.empty_title')}</p>
              <span className="text-[11px] text-slate-500 max-w-xs">{t('chat.empty_desc')}</span>
            </div>
          ) : (
            chatMessages.map((msg) => {
              const isMe = msg.sender_id === currentUser?.id;
              const senderInitial = msg.sender_name ? msg.sender_name.charAt(0) : '#';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[85%] ${
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
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                    <span className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-300">
                      {senderInitial}
                    </span>
                    <span className="font-bold text-slate-200">
                      {isMe ? (isRtl ? 'أنت' : 'You') : (msg.sender_name || t('chat.user_fallback', { id: msg.sender_id }))}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded border font-medium ${
                        msg.sender_role === 'supervisor'
                          ? 'bg-amber-950/70 text-amber-300 border-amber-800'
                          : msg.sender_role === 'company'
                            ? 'bg-purple-950/70 text-purple-300 border-purple-800'
                            : 'bg-blue-950/70 text-blue-300 border-blue-800'
                      }`}
                    >
                      {roleLabels[msg.sender_role] || msg.sender_role}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {msg.created_at
                        ? new Date(msg.created_at).toLocaleTimeString(isRtl ? 'ar-EG' : 'en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : ''}
                    </span>
                  </div>

                  {/* فقاعة الرسالة مع تباين ألوان عالي ومريح للعين */}
                  <div
                    className={`p-3.5 text-xs leading-relaxed transition-all shadow-md ${
                      isMe
                        ? isRtl
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-xs shadow-blue-900/30 ring-1 ring-blue-400/30'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tl-xs shadow-blue-900/30 ring-1 ring-blue-400/30'
                        : isRtl
                          ? 'bg-slate-800/95 text-slate-100 border border-slate-700/80 rounded-2xl rounded-tl-xs shadow-black/30'
                          : 'bg-slate-800/95 text-slate-100 border border-slate-700/80 rounded-2xl rounded-tr-xs shadow-black/30'
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

        {/* نموذج إرسال رسالة بتصميم عصري */}
        <form onSubmit={handleSubmit} className="p-3 sm:p-3.5 bg-slate-950 border-t border-slate-800 flex gap-2.5">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={t('chat.input_placeholder')}
            className="flex-1 bg-slate-800/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-inner"
          />
          <button
            type="submit"
            disabled={isSendingChat || !messageInput.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-lg shadow-blue-600/30 active:scale-95 shrink-0"
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
