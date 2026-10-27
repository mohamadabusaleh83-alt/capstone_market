import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { UserCog, Search, UserPlus, KeyRound, Ban, CheckCircle, Trash2 } from 'lucide-react';

const PAGE = 25;
const inputClass = 'w-full bg-slate-50 dark:bg-[#0B152E] border border-slate-300 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2499F2]';

function errorText(data, fallback) {
  if (Array.isArray(data?.detail)) return data.detail.map((d) => d.msg).join(', ');
  return data?.detail || fallback;
}

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const { apiFetch, currentUser } = useAuth();
  const { showToast, getRoleLabel } = useApp();

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'supervisor' });
  const [resetFor, setResetFor] = useState(null);
  const [resetPassword, setResetPassword] = useState('');

  const load = useCallback(async (nextOffset = 0) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE), offset: String(nextOffset) });
      if (query.trim()) params.set('q', query.trim());
      if (role) params.set('role', role);
      const res = await apiFetch(`/admin/users?${params}`);
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(errorText(data, t('admin_users.load_failed')));
      setUsers(data);
      setTotal(Number(res.headers.get('X-Total-Count')) || data.length);
      setOffset(nextOffset);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch, query, role, showToast, t]);

  useEffect(() => {
    load(0);
  }, [load]);

  const call = async (endpoint, options, successMsg) => {
    const res = await apiFetch(endpoint, options);
    const data = res.status === 204 ? {} : await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(errorText(data, t('admin_users.action_failed')), 'error');
      return false;
    }
    showToast(successMsg, 'success');
    await load(offset);
    return true;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const ok = await call('/admin/users', { method: 'POST', body: JSON.stringify(form) }, t('admin_users.created'));
    if (ok) setForm({ full_name: '', email: '', password: '', role: 'supervisor' });
  };

  const handleReset = async (e) => {
    e.preventDefault();
    const ok = await call(`/admin/users/${resetFor.id}/reset-password`, {
      method: 'POST', body: JSON.stringify({ new_password: resetPassword })
    }, t('admin_users.password_reset'));
    if (ok) {
      setResetFor(null);
      setResetPassword('');
    }
  };

  const handleDelete = (user) => {
    if (!window.confirm(t('admin_users.confirm_delete', { name: user.full_name }))) return;
    call(`/admin/users/${user.id}`, { method: 'DELETE' }, t('admin_users.deleted'));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 p-5 rounded-2xl">
        <h1 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <UserCog className="w-5 h-5 text-[#2499F2]" />
          {t('admin_users.title')}
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{t('admin_users.desc')}</p>
      </div>

      <form onSubmit={handleCreate} className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 p-5 rounded-2xl space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-emerald-500" />
          {t('admin_users.create_title')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input className={inputClass} required minLength={2} maxLength={100} placeholder={t('admin_users.full_name')} aria-label={t('admin_users.full_name')}
            value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <input className={inputClass} required type="email" dir="ltr" placeholder={t('admin_users.email')} aria-label={t('admin_users.email')}
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className={inputClass} required type="password" dir="ltr" minLength={8} maxLength={128} placeholder={t('admin_users.password')} aria-label={t('admin_users.password')}
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} aria-label={t('admin_users.role')}>
            <option value="supervisor">{getRoleLabel('supervisor')}</option>
            <option value="admin">{getRoleLabel('admin')}</option>
          </select>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer">
            {t('admin_users.create_btn')}
          </button>
        </div>
      </form>

      <div className="bg-white dark:bg-[#101E42] border border-slate-200 dark:border-[#2499F2]/20 p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute top-2.5 start-3 pointer-events-none" />
            <input className={`${inputClass} ps-9`} placeholder={t('admin_users.search')} aria-label={t('admin_users.search')}
              value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select className={`${inputClass} sm:w-48`} value={role} onChange={(e) => setRole(e.target.value)} aria-label={t('admin_users.role')}>
            <option value="">{t('common.all')}</option>
            {['student', 'company', 'supervisor', 'admin'].map((r) => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
                <th className="py-2 px-2 text-start">{t('admin_users.full_name')}</th>
                <th className="py-2 px-2 text-start">{t('admin_users.email')}</th>
                <th className="py-2 px-2 text-start">{t('admin_users.role')}</th>
                <th className="py-2 px-2 text-start">{t('admin_users.status')}</th>
                <th className="py-2 px-2 text-end">{t('admin_users.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id} className="border-b border-slate-100 dark:border-white/5">
                    <td className="py-2 px-2 font-semibold text-slate-900 dark:text-white">{u.full_name}</td>
                    <td className="py-2 px-2 font-mono text-slate-600 dark:text-slate-300" dir="ltr">{u.email}</td>
                    <td className="py-2 px-2 text-slate-700 dark:text-slate-300">{getRoleLabel(u.role)}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.is_active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300'}`}>
                        {u.is_active ? t('admin_users.active') : t('admin_users.disabled')}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex justify-end gap-1.5 flex-wrap">
                        <button type="button" disabled={isSelf} title={u.is_active ? t('admin_users.disable') : t('admin_users.enable')}
                          onClick={() => call(`/admin/users/${u.id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !u.is_active }) },
                            u.is_active ? t('admin_users.disabled_ok') : t('admin_users.enabled_ok'))}
                          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-[#152550] text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer flex items-center gap-1">
                          {u.is_active ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          <span className="hidden md:inline">{u.is_active ? t('admin_users.disable') : t('admin_users.enable')}</span>
                        </button>
                        <button type="button" title={t('admin_users.reset_password')} onClick={() => { setResetFor(u); setResetPassword(''); }}
                          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-[#152550] text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-1">
                          <KeyRound className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">{t('admin_users.reset_password')}</span>
                        </button>
                        <button type="button" disabled={isSelf} title={t('common.delete')} onClick={() => handleDelete(u)}
                          className="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 disabled:opacity-40 cursor-pointer flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">{t('common.delete')}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!isLoading && users.length === 0 && (
            <p className="text-center text-xs text-slate-500 py-6">{t('admin_users.empty')}</p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <span>{t('admin_users.range', { from: total ? offset + 1 : 0, to: Math.min(offset + PAGE, total), total })}</span>
          <div className="flex gap-2">
            <button type="button" disabled={offset === 0} onClick={() => load(Math.max(0, offset - PAGE))}
              className="px-3 py-1 rounded-lg border border-slate-300 dark:border-white/10 disabled:opacity-40 cursor-pointer">{t('admin_users.prev')}</button>
            <button type="button" disabled={offset + PAGE >= total} onClick={() => load(offset + PAGE)}
              className="px-3 py-1 rounded-lg border border-slate-300 dark:border-white/10 disabled:opacity-40 cursor-pointer">{t('admin_users.next')}</button>
          </div>
        </div>
      </div>

      {resetFor && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleReset} className="bg-white dark:bg-[#101E42] rounded-2xl p-5 w-full max-w-sm space-y-3 border border-slate-200 dark:border-[#2499F2]/25">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('admin_users.reset_for', { name: resetFor.full_name })}</h3>
            <input className={inputClass} type="password" dir="ltr" required minLength={8} maxLength={128}
              placeholder={t('admin_users.new_password')} aria-label={t('admin_users.new_password')}
              value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setResetFor(null)} className="px-3 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-white/10 cursor-pointer">{t('common.cancel')}</button>
              <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#2499F2] text-white cursor-pointer">{t('common.save')}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
