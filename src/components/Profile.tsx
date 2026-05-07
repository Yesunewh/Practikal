import { useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { selectPassedChallengeIds } from '../store/slices/progressSlice';
import { updateUser } from '../store/slices/authSlice';
import { useUpdateProfileMutation, useChangePasswordMutation } from '../store/apiSlice/practikalApi';
import {
  User as UserIcon,
  Mail,
  Building2,
  Calendar,
  Trophy,
  Target,
  Flame,
  Layers,
  Shield,
  Edit2,
  Lock,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Phone,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import type { Locale } from '../i18n/messages';

/** Formats `Users.createdAt` from login (`memberSinceAt` ISO string) for the active UI locale. */
function formatMemberSince(iso: string | undefined, locale: Locale): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  try {
    return new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', year: 'numeric' }).format(d);
  } catch {
    return new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(d);
  }
}

export default function Profile() {
  const { locale, messages } = useI18n();
  const p = messages.profile;
  const c = messages.common;
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const passedIds = useSelector(selectPassedChallengeIds(user?.id || ''));

  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const [editForm, setEditForm] = useState({
    firstName: user?.first_name || user?.name?.split(' ')[0] || '',
    lastName: user?.last_name || user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phoneNumber: user?.phone_number || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPw }] = useChangePasswordMutation();
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const memberSinceText = useMemo(
    () => formatMemberSince(user?.memberSinceAt, locale),
    [user?.memberSinceAt, locale],
  );

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const result = await updateProfile({
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        phoneNumber: editForm.phoneNumber,
      }).unwrap();
      
      dispatch(updateUser({
        name: `${editForm.firstName} ${editForm.lastName}`.trim(),
        first_name: editForm.firstName,
        last_name: editForm.lastName,
        email: editForm.email,
        phone_number: editForm.phoneNumber,
      }));
      
      setIsEditing(false);
      setSuccess(p.toastProfileUpdated);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.data?.message || p.toastUpdateError);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError(p.passwordMismatch);
      return;
    }

    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }).unwrap();
      
      setIsChangingPassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccess(p.toastPasswordChanged);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.data?.message || p.toastPasswordError);
    }
  };

  if (!user) return null;

  const levelProgress =
    user.xpToNextLevel > 0 ? Math.min(100, (user.xp / user.xpToNextLevel) * 100) : 100;

  return (
    <div className="min-h-screen bg-gray-50 overflow-auto">
      {/* Profile header — single row; larger level & org */}
      <header className="bg-white border-b border-neutral-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-200 sm:h-14 sm:w-14"
              aria-hidden
            >
              {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
                {user.name}
              </h1>
              <p className="text-sm font-medium text-neutral-500">
                {user.roleDisplayName?.trim() || p.role}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 rounded-lg bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-200"
              >
                <Edit2 size={16} />
                <span className="hidden sm:inline">{p.editProfile}</span>
              </button>
            )}
            <button
              onClick={() => setIsChangingPassword(true)}
              className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              <Lock size={16} />
              <span className="hidden sm:inline">{p.changePassword}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-6xl">
          {success && (
            <div className="mb-6 flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800 border border-emerald-100">
              <CheckCircle2 size={18} className="shrink-0" />
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Profile Information / Edit Form */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-neutral-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-neutral-900">{p.profileInformation}</h2>
                  {isEditing && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-500 hover:bg-neutral-100 transition"
                      >
                        {p.cancel}
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleEditSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{p.fullName} (First)</label>
                        <input
                          type="text"
                          required
                          className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm transition focus:border-emerald-500 focus:ring-emerald-500"
                          value={editForm.firstName}
                          onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{p.fullName} (Last)</label>
                        <input
                          type="text"
                          required
                          className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm transition focus:border-emerald-500 focus:ring-emerald-500"
                          value={editForm.lastName}
                          onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{p.email}</label>
                        <input
                          type="email"
                          required
                          className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm transition focus:border-emerald-500 focus:ring-emerald-500"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{p.phoneNumber}</label>
                        <input
                          type="text"
                          required
                          className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm transition focus:border-emerald-500 focus:ring-emerald-500"
                          value={editForm.phoneNumber}
                          onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                        <AlertCircle size={16} />
                        {error}
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isUpdatingProfile}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {isUpdatingProfile ? c.loading : (
                          <>
                            <Save size={18} />
                            {p.saveChanges}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-neutral-50 text-neutral-400">
                        <UserIcon size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-0.5">{p.fullName}</p>
                        <p className="text-neutral-900 font-semibold">{user.name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-neutral-50 text-neutral-400">
                        <Mail size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-0.5">{p.email}</p>
                        <p className="text-neutral-900 font-semibold truncate max-w-[15rem]">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-neutral-50 text-neutral-400">
                        <Phone size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-0.5">{p.phoneNumber}</p>
                        <p className="text-neutral-900 font-semibold">{user.phone_number}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-neutral-50 text-neutral-400">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-0.5">{p.organization}</p>
                        <p className="text-neutral-900 font-semibold">{user.organization}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-neutral-50 text-neutral-400">
                        <Layers size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-0.5">{p.department}</p>
                        <p className="text-neutral-900 font-semibold">{user.departmentName?.trim() || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-neutral-50 text-neutral-400">
                        <Shield size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-0.5">{p.role}</p>
                        <p className="text-neutral-900 font-semibold">{user.roleDisplayName?.trim() || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-neutral-50 text-neutral-400">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-0.5">{p.memberSince}</p>
                        <p className="text-neutral-900 font-semibold">{memberSinceText ?? c.dash}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress and Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 mb-3">
                    <Trophy size={24} />
                  </div>
                  <p className="text-2xl font-bold text-neutral-900">{passedIds.size}</p>
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mt-1">{p.challengesCompleted}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 mb-3">
                    <Target size={24} />
                  </div>
                  <p className="text-2xl font-bold text-neutral-900">{user.reputation}%</p>
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mt-1">{p.reputation}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 mb-3">
                    <Flame size={24} />
                  </div>
                  <p className="text-2xl font-bold text-neutral-900">{user.streak}</p>
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mt-1">{p.dayStreak}</p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Level Progress */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-neutral-900">{p.learningProgress}</h2>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {user.level} {p.levelSuffix}
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="w-full bg-neutral-100 rounded-full h-3.5 overflow-hidden border border-neutral-200">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out shadow-sm"
                      style={{ width: `${levelProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-500 font-medium">{user.xp} XP</span>
                    <span className="text-neutral-400 font-medium">{user.xpToNextLevel} XP total</span>
                  </div>
                </div>
              </div>

              {/* Recent Achievements */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
                <h2 className="font-bold text-neutral-900 mb-6">{p.recentAchievements}</h2>
                <div className="space-y-4">
                  {user.achievements.length > 0 ? (
                    user.achievements.slice(0, 3).map((achievement) => (
                      <div key={achievement.id} className="group flex items-center gap-4 p-3 rounded-xl hover:bg-neutral-50 transition border border-transparent hover:border-neutral-100">
                        <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                          <Trophy size={18} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-neutral-900 truncate">{achievement.title}</h3>
                          <p className="text-xs text-neutral-500 truncate">{achievement.description}</p>
                        </div>
                        <ChevronRight size={14} className="ml-auto text-neutral-300 opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-200 mx-auto mb-3">
                        <Trophy size={24} />
                      </div>
                      <p className="text-xs font-medium text-neutral-400 px-4">
                        {p.achievementsEmpty}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {isChangingPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden motion-safe:animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <h3 className="text-lg font-bold text-neutral-900">{p.changePassword}</h3>
              <button
                onClick={() => setIsChangingPassword(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{p.currentPassword}</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 pr-10 text-sm transition focus:border-emerald-500 focus:ring-emerald-500"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 focus:outline-none"
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{p.newPassword}</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 pr-10 text-sm transition focus:border-emerald-500 focus:ring-emerald-500"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 focus:outline-none"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{p.confirmPassword}</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 pr-10 text-sm transition focus:border-emerald-500 focus:ring-emerald-500"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-neutral-600 border border-neutral-200 hover:bg-neutral-50 transition"
                >
                  {p.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isChangingPw}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isChangingPw ? c.loading : p.saveChanges}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}