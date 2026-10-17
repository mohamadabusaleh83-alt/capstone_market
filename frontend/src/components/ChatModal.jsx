import { useState } from 'react';
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
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    activeChatProject.status === 'approved'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchProjectMessages(activeChatProject.id)}
              title={t('chat.refresh')}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isFetchingChat ? 'animate-spin text-blue-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setActiveChatProject(null)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* منطقة الرسائل */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isFetchingChat && chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
              {t('chat.loading')}
            </div>
          ) : chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 text-xs">
              <MessageSquare className="w-8 h-8 text-slate-600" />
              <p>{t('chat.empty_title')}</p>
              <span className="text-[10px] text-slate-500">{t('chat.empty_desc')}</span>
            </div>
          ) : (
            chatMessages.map((msg) => {
              const isMe = msg.sender_id === currentUser?.id;
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
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                    <span className="font-bold text-slate-200">
                      {msg.sender_name || t('chat.user_fallback', { id: msg.sender_id })}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded border ${
                        msg.sender_role === 'supervisor'
                          ? 'bg-amber-950/70 text-amber-300 border-amber-800'
                          : msg.sender_role === 'company'
                            ? 'bg-purple-950/70 text-purple-300 border-purple-800'
                            : 'bg-blue-950/70 text-blue-300 border-blue-800'
                      }`}
                    >
                      {roleLabels[msg.sender_role] || msg.sender_role}
                    </span>
                    <span className="text-[9px] opacity-70">
                      {msg.created_at
                        ? new Date(msg.created_at).toLocaleTimeString(isRtl ? 'ar-EG' : 'en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : ''}
                    </span>
                  </div>
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      isMe
                        ? isRtl
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-blue-600 text-white rounded-tl-none'
                        : isRtl
                          ? 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-tl-none'
                          : 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-tr-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* نموذج إرسال رسالة */}
        <form onSubmit={handleSubmit} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={t('chat.input_placeholder')}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={isSendingChat || !messageInput.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md"
          >
            {isSendingChat ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{t('chat.send')}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
