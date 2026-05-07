import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  useGetOrganizationsQuery,
  useAllocatePermissionMutation,
  useBulkAllocatePermissionsMutation,
  useGetAvailablePermissionsQuery,
  useGetUsersQuery,
  useResetUserPasswordMutation,
  useDeactivateUserMutation,
  useActivateUserMutation,
  useGetDepartmentsQuery,
  useGetUnitTreeQuery,
} from '../../store/apiSlice/practikalApi';
import {
  Building2,
  X,
  Loader2,
  Users,
  Key,
  Power,
  Smartphone,
  Layout,
  Layers,
  ShieldCheck,
  Network,
  Copy,
  Check,
  Calendar,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n/I18nContext';
import { interpolate } from '../../i18n/messages';
import { useNavigate } from 'react-router-dom';

function rtkErrorMessage(err: unknown): string {
  if (!err || typeof err !== 'object') return '';
  const o = err as Record<string, unknown>;
  if (o.data && typeof o.data === 'object') {
    const m = (o.data as Record<string, unknown>).message;
    if (typeof m === 'string' && m) return m;
  }
  if (typeof o.message === 'string' && o.message) return o.message;
  return '';
}

interface ApiUser {
  user_id: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  email?: string;
  status?: string;
  org_id?: string | null;
  user_type?: string;
}

interface PermissionRow {
  id: string;
  name: string;
  description?: string;
  has_access?: boolean;
}

export default function OrgDetails({ orgSlug }: { orgSlug: string }) {
  const navigate = useNavigate();
  const { messages } = useI18n();
  const o = messages.admin.organizations;
  const oc = o.console;

  const { data: orgsData, isLoading: orgsLoading } = useGetOrganizationsQuery(undefined);
  const org = (orgsData?.orgs ?? []).find((org: any) => org.slug === orgSlug);

  const [tab, setTab] = useState<'permissions' | 'people' | 'structure'>('permissions');
  const [copied, setCopied] = useState(false);

  const { data: permsData, isLoading: permsLoading } = useGetAvailablePermissionsQuery(org?.id, { skip: !org?.id });
  const { data: usersData, isLoading: usersLoading } = useGetUsersQuery(org?.id, { skip: !org?.id });
  const { data: deptsData, isLoading: deptsLoading } = useGetDepartmentsQuery(org?.id, { skip: !org?.id });
  const { data: unitTree, isLoading: unitsLoading } = useGetUnitTreeQuery(org?.id, { skip: !org?.id });

  const [allocatePermission, { isLoading: isAllocating }] = useAllocatePermissionMutation();
  const [bulkAllocate, { isLoading: isBulking }] = useBulkAllocatePermissionsMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetUserPasswordMutation();
  const [deactivateUser, { isLoading: isDeactivating }] = useDeactivateUserMutation();
  const [activateUser, { isLoading: isActivating }] = useActivateUserMutation();

  // Confirmation Modals State
  const [confirmModal, setConfirmModal] = useState<{
    type: 'reset' | 'deactivate' | 'activate' | 'grant_all' | null;
    targetUser?: ApiUser | null;
    isOpen: boolean;
  }>({ type: null, targetUser: null, isOpen: false });

  const handleTogglePermission = async (permId: string) => {
    if (!org) return;
    try {
      await allocatePermission({
        permissionId: permId,
        type: 'ORGANIZATION',
        targetId: org.id,
        effect: 'GRANT',
      }).unwrap();
      toast.success(o.toastPermUpdated);
    } catch (err: unknown) {
      toast.error(rtkErrorMessage(err) || o.toastPermUpdateError);
    }
  };

  const handleGrantFullSuite = async () => {
    if (!org) return;
    setConfirmModal({ type: 'grant_all', isOpen: true });
  };

  const executeGrantFullSuite = async () => {
    if (!org) return;
    try {
      await bulkAllocate({ orgId: org.id, effect: 'GRANT' }).unwrap();
      toast.success(o.toastAllGranted);
      setConfirmModal({ ...confirmModal, isOpen: false });
    } catch (err: unknown) {
      toast.error(rtkErrorMessage(err) || o.toastBulkGrantFailed);
    }
  };

  const copyId = useCallback(() => {
    if (!org) return;
    void navigator.clipboard.writeText(org.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [org?.id]);

  const handleResetPassword = (user: ApiUser) => {
    setConfirmModal({ type: 'reset', targetUser: user, isOpen: true });
  };

  const executeResetPassword = async () => {
    if (!confirmModal.targetUser) return;
    const userId = confirmModal.targetUser.user_id;
    try {
      const res = await resetPassword(userId).unwrap();
      setConfirmModal({ ...confirmModal, isOpen: false });
      const msg =
        res && typeof res === 'object' && 'message' in res
          ? String((res as { message?: string }).message)
          : '';
      const hint =
        res && typeof res === 'object' && 'login_hint' in res
          ? String((res as { login_hint?: string }).login_hint)
          : '';
      toast.success(
        hint
          ? interpolate(o.toastPasswordResetSuccess, {
              msg: msg || o.toastPasswordResetFallback,
              hint,
            })
          : msg || o.toastPasswordResetFallback,
      );
    } catch (err: unknown) {
      toast.error(rtkErrorMessage(err) || o.toastPasswordResetFailed);
    }
  };

  const handleToggleStatus = (user: ApiUser) => {
    setConfirmModal({
      type: user.status === 'ACTIVE' ? 'deactivate' : 'activate',
      targetUser: user,
      isOpen: true
    });
  };

  const executeToggleStatus = async () => {
    const u = confirmModal.targetUser;
    if (!u) return;
    try {
      if (u.status === 'ACTIVE') {
        await deactivateUser(u.user_id).unwrap();
        toast.success(o.toastUserDeactivated);
      } else {
        await activateUser(u.user_id).unwrap();
        toast.success(o.toastUserActivated);
      }
      setConfirmModal({ ...confirmModal, isOpen: false });
    } catch (err: unknown) {
      toast.error(rtkErrorMessage(err) || o.toastStatusFailed);
    }
  };

  if (orgsLoading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center text-gray-500">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500 space-y-4">
        <Building2 size={48} className="text-gray-300" />
        <h2 className="text-xl font-medium text-gray-900">Organization not found</h2>
        <p>The organization "{orgSlug}" does not exist or you do not have permission to view it.</p>
        <button
          onClick={() => navigate('/admin')}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const permissions = (permsData?.data ?? []) as PermissionRow[];
  const users = (usersData?.users ?? []) as ApiUser[];

  const tabs = [
    { id: 'permissions' as const, label: oc.tabPermissions, icon: ShieldCheck },
    { id: 'people' as const, label: oc.tabPeople, icon: Users },
    { id: 'structure' as const, label: oc.tabStructure, icon: Network },
  ];

  return (
    <div className="flex flex-col w-full h-full space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Organizations
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="shrink-0 p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shrink-0">
              <Building2 size={24} />
            </div>
            <div className="min-w-0 flex flex-wrap items-center gap-3">
              <h3 className="text-xl font-semibold text-gray-900 truncate">{org.name}</h3>
              <p className="text-sm text-gray-500 font-mono">/{org.slug}</p>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                {org.status ?? 'ACTIVE'}
              </span>
              <button
                type="button"
                onClick={copyId}
                className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-medium ml-2"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? oc.copied : oc.copyOrgId}
              </button>
            </div>
          </div>
        </div>

        <div className="shrink-0 px-5 sm:px-6 border-b border-gray-100 flex gap-1 overflow-x-auto bg-white">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 bg-gray-50/50">
          {tab === 'permissions' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="font-medium text-gray-900">{oc.productPermissions}</h4>
                </div>
                <button
                  type="button"
                  onClick={handleGrantFullSuite}
                  disabled={isBulking}
                  className="shrink-0 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isBulking ? oc.applying : oc.grantAll}
                </button>
              </div>
              {permsLoading ? (
                <div className="py-16 flex justify-center text-gray-500">
                  <Loader2 className="animate-spin" size={28} />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {permissions.map((perm) => (
                    <div
                      key={perm.id}
                      className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{perm.name}</p>
                        {perm.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{perm.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={isAllocating}
                        onClick={() => handleTogglePermission(perm.id)}
                        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                          perm.has_access ? 'bg-emerald-600' : 'bg-gray-200'
                        } disabled:opacity-50`}
                        aria-pressed={!!perm.has_access}
                        aria-label={interpolate(oc.ariaPermToggle, {
                          action: perm.has_access ? oc.disable : oc.enable,
                          name: perm.name,
                        })}
                      >
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
                            perm.has_access ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'people' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{oc.peopleIntro}</p>
              {usersLoading ? (
                <div className="py-16 flex justify-center text-gray-500">
                  <Loader2 className="animate-spin" size={28} />
                </div>
              ) : users.length === 0 ? (
                <p className="text-sm text-gray-500 py-8 text-center bg-white rounded-xl border border-gray-200">
                  {oc.peopleEmpty}
                </p>
              ) : (
                <ul className="space-y-2">
                  {users.map((u) => (
                    <li
                      key={u.user_id}
                      className="bg-white p-4 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center font-semibold text-sm">
                          {(u.first_name?.[0] ?? '?').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {u.first_name} {u.last_name}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-0.5">
                            <span className="inline-flex items-center gap-1">
                              <Smartphone size={12} /> {u.phone_number ?? '—'}
                            </span>
                            {u.user_type && (
                              <span className="font-medium text-gray-600">{u.user_type.replace(/_/g, ' ')}</span>
                            )}
                            <span
                              className={`font-medium ${
                                u.status === 'ACTIVE' ? 'text-emerald-700' : 'text-amber-700'
                              }`}
                            >
                              {u.status ?? '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleResetPassword(u)}
                          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                          title={oc.resetPasswordTitle}
                        >
                          <Key size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className={`p-2 rounded-lg ${
                            u.status === 'ACTIVE'
                              ? 'text-amber-700 hover:bg-amber-50'
                              : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                          title={u.status === 'ACTIVE' ? oc.deactivateTitle : oc.activateTitle}
                        >
                          <Power size={18} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === 'structure' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Layers size={16} className="text-gray-400" />
                  {oc.departmentsHeading}
                </h4>
                {deptsLoading ? (
                  <Loader2 className="animate-spin text-gray-400" />
                ) : (
                  <ul className="space-y-2">
                    {(deptsData?.depts ?? []).map((d: { id: string; name: string }) => (
                      <li
                        key={d.id}
                        className="bg-white px-4 py-3 rounded-lg border border-gray-200 text-sm text-gray-800 flex items-center gap-2"
                      >
                        <ArrowRight size={14} className="text-gray-300 shrink-0" />
                        {d.name}
                      </li>
                    ))}
                    {(deptsData?.depts ?? []).length === 0 && (
                      <li className="text-sm text-gray-500 italic py-4 px-4 bg-white rounded-lg border border-dashed border-gray-200">
                        {oc.noDepartments}
                      </li>
                    )}
                  </ul>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Layout size={16} className="text-gray-400" />
                  {oc.unitsHeading}
                </h4>
                {unitsLoading ? (
                  <Loader2 className="animate-spin text-gray-400" />
                ) : (
                  <ul className="space-y-2">
                    {(unitTree?.data ?? []).map((u: { id: string; name: string; UnitType?: { name?: string } }) => (
                      <li key={u.id} className="bg-white px-4 py-3 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-900">{u.name}</p>
                        {u.UnitType?.name && (
                          <p className="text-xs text-gray-500 mt-0.5">{u.UnitType.name}</p>
                        )}
                      </li>
                    ))}
                    {(unitTree?.data ?? []).length === 0 && (
                      <li className="text-sm text-gray-500 italic py-4 px-4 bg-white rounded-lg border border-dashed border-gray-200">
                        {oc.noUnits}
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 sm:px-6 border-t border-gray-100 bg-white flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <Calendar size={12} />
            {oc.orgIdLabel} <span className="font-mono text-gray-700">{org.id.slice(0, 8)}…</span>
          </p>
        </div>
      </div>

      {/* Dynamic Confirmation Modal */}
      {confirmModal.isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] overflow-y-auto overflow-x-hidden bg-slate-900/50 backdrop-blur-sm"
            role="presentation"
            onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
          >
            <div className="flex min-h-[100dvh] items-center justify-center p-4 pointer-events-none">
              <div
                className="pointer-events-auto w-full max-w-sm rounded-2xl border border-gray-200/90 bg-white p-6 shadow-2xl"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`flex size-14 items-center justify-center rounded-full mb-4 ${
                    confirmModal.type === 'reset' ? 'bg-amber-100 text-amber-600' :
                    confirmModal.type === 'deactivate' ? 'bg-rose-100 text-rose-600' :
                    confirmModal.type === 'activate' ? 'bg-emerald-100 text-emerald-600' :
                    'bg-indigo-100 text-indigo-600'
                  }`}>
                    {confirmModal.type === 'reset' && <Key size={28} />}
                    {(confirmModal.type === 'deactivate' || confirmModal.type === 'activate') && <Power size={28} />}
                    {confirmModal.type === 'grant_all' && <ShieldCheck size={28} />}
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {confirmModal.type === 'reset' && 'Reset Password?'}
                    {confirmModal.type === 'deactivate' && 'Deactivate User?'}
                    {confirmModal.type === 'activate' && 'Activate User?'}
                    {confirmModal.type === 'grant_all' && 'Grant All Permissions?'}
                  </h3>
                  
                  <p className="text-sm text-gray-500 mb-6">
                    {confirmModal.type === 'reset' && `Are you sure you want to reset the password for ${confirmModal.targetUser?.first_name} ${confirmModal.targetUser?.last_name}?`}
                    {confirmModal.type === 'deactivate' && `Are you sure you want to deactivate ${confirmModal.targetUser?.first_name} ${confirmModal.targetUser?.last_name}? They will lose access immediately.`}
                    {confirmModal.type === 'activate' && `Are you sure you want to reactivate ${confirmModal.targetUser?.first_name} ${confirmModal.targetUser?.last_name}?`}
                    {confirmModal.type === 'grant_all' && 'This will grant this organization access to all available training modules and features. Continue?'}
                  </p>

                  <div className="flex w-full gap-3">
                    <button
                      type="button"
                      onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                      className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      {o.cancel || 'Cancel'}
                    </button>
                    <button
                      type="button"
                      disabled={isResetting || isDeactivating || isActivating || isBulking}
                      onClick={() => {
                        if (confirmModal.type === 'reset') void executeResetPassword();
                        else if (confirmModal.type === 'deactivate' || confirmModal.type === 'activate') void executeToggleStatus();
                        else if (confirmModal.type === 'grant_all') void executeGrantFullSuite();
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-70 disabled:cursor-not-allowed ${
                        confirmModal.type === 'reset' ? 'bg-amber-600 hover:bg-amber-700' :
                        confirmModal.type === 'deactivate' ? 'bg-rose-600 hover:bg-rose-700' :
                        confirmModal.type === 'activate' ? 'bg-emerald-600 hover:bg-emerald-700' :
                        'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {(isResetting || isDeactivating || isActivating || isBulking) && (
                        <Loader2 size={16} className="animate-spin" />
                      )}
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
