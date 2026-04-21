import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { User } from '../../types';
import {
  Search,
  UserPlus,
  Building2,
  Shield,
  Smartphone,
  Mail,
  Loader2,
  KeyRound,
  Layers,
  UserX,
  UserCheck,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useGetUsersQuery,
  useGetOrganizationsQuery,
  useAdminCreateUserMutation,
  useGetDepartmentsQuery,
  useGetRolesQuery,
  useGetUnitTreeQuery,
  useResetUserPasswordMutation,
  useDeactivateUserMutation,
  useActivateUserMutation,
} from '../../store/apiSlice/practikalApi';

interface UserManagementProps {
  currentUser: User;
}

export default function UserManagement({ currentUser }: UserManagementProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isSuperAdmin = currentUser.role === 'superadmin';
  const isOrgAdmin = currentUser.user_type === 'ORG_ADMIN';
  /** Treat as department head even if an older saved session omitted `user_type`. */
  const isDeptAdmin =
    currentUser.user_type === 'DEPT_ADMIN' ||
    (currentUser.role === 'admin' &&
      !!currentUser.deptId &&
      (currentUser.user_type == null || currentUser.user_type === ''));

  const usersQueryArg = useMemo(() => {
    if (isDeptAdmin && currentUser.orgId && currentUser.deptId) {
      return { org_id: currentUser.orgId, dept_id: currentUser.deptId };
    }
    if (isOrgAdmin && currentUser.orgId) {
      return currentUser.orgId;
    }
    if (isSuperAdmin) {
      return undefined;
    }
    if (currentUser.orgId) {
      return currentUser.orgId;
    }
    return undefined;
  }, [isDeptAdmin, isOrgAdmin, isSuperAdmin, currentUser.orgId, currentUser.deptId]);

  const { data: usersData, isLoading: loadingUsers, refetch: refetchUsers } = useGetUsersQuery(usersQueryArg);
  const { data: orgsData } = useGetOrganizationsQuery(undefined);
  const [createUser, { isLoading: isCreating }] = useAdminCreateUserMutation();
  const [resetPassword] = useResetUserPasswordMutation();
  const [deactivateUser] = useDeactivateUserMutation();
  const [activateUser] = useActivateUserMutation();
  const [resettingUserId, setResettingId] = useState<string | null>(null);
  const [lifecycleUserId, setLifecycleUserId] = useState<string | null>(null);

  const { data: rosterDeptsData } = useGetDepartmentsQuery(currentUser.orgId || '', {
    skip: !currentUser.orgId,
  });
  const deptNameById = useMemo(() => {
    const m = new Map<string, string>();
    const list = (rosterDeptsData as { depts?: { id: string; name: string }[] } | undefined)?.depts ?? [];
    list.forEach((d) => m.set(d.id, d.name));
    return m;
  }, [rosterDeptsData]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    password: 'Password123',
    user_type: 'STAFF',
    org_id: currentUser.orgId || '',
    dept_id: '',
    unit_id: '',
    role_id: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    const st = location.state as { prefillUnitAdmin?: { unitId: string; orgId: string } } | null;
    const pref = st?.prefillUnitAdmin;
    if (!pref?.unitId || !pref.orgId) return;
    setFormData((prev) => ({
      ...prev,
      org_id: pref.orgId,
      unit_id: pref.unitId,
      user_type: 'UNIT_ADMIN',
    }));
    setIsAddUserModalOpen(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    if (!isAddUserModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isAddUserModalOpen]);

  const orgs = orgsData?.orgs || [];
  const users = usersData?.users || [];

  const canStaffAdminActionsForRow = (row: { user_type: string }) => {
    if (isSuperAdmin) return true;
    if (isOrgAdmin) {
      return !['SUPERADMIN', 'ORG_ADMIN'].includes(row.user_type);
    }
    if (isDeptAdmin) {
      return ['STAFF', 'EXTERNAL'].includes(row.user_type);
    }
    return false;
  };

  const handleResetPassword = async (userId: string) => {
    if (
      !confirm(
        'Reset this account password to the platform default? The user should sign in with their phone number and the new temporary password.'
      )
    ) {
      return;
    }
    setResettingId(userId);
    try {
      const res = await resetPassword(userId).unwrap();
      const hint = (res as { login_hint?: string }).login_hint;
      toast.success(hint ? `${(res as { message?: string }).message ?? 'Password reset.'} ${hint}` : 'Password reset.');
      await refetchUsers();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? String((err as { data?: { message?: string } }).data?.message ?? '')
          : '';
      toast.error(msg || 'Could not reset password.');
    } finally {
      setResettingId(null);
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!confirm('Deactivate this account? They will not be able to sign in until reactivated.')) return;
    setLifecycleUserId(userId);
    try {
      await deactivateUser(userId).unwrap();
      toast.success('User deactivated.');
      await refetchUsers();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? String((err as { data?: { message?: string } }).data?.message ?? '')
          : '';
      toast.error(msg || 'Could not deactivate.');
    } finally {
      setLifecycleUserId(null);
    }
  };

  const handleActivateUser = async (userId: string) => {
    setLifecycleUserId(userId);
    try {
      await activateUser(userId).unwrap();
      toast.success('User activated.');
      await refetchUsers();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? String((err as { data?: { message?: string } }).data?.message ?? '')
          : '';
      toast.error(msg || 'Could not activate.');
    } finally {
      setLifecycleUserId(null);
    }
  };

  // Hierarchy Data
  const { data: deptsData } = useGetDepartmentsQuery(formData.org_id, { skip: !formData.org_id });
  const { data: rolesData } = useGetRolesQuery({ orgId: formData.org_id, includeSystem: true }, { skip: !formData.org_id });
  const { data: unitTreeData } = useGetUnitTreeQuery(formData.org_id, {
    skip: !formData.org_id,
  });
  
  const depts = deptsData?.depts || [];
  const roles = rolesData?.data || [];
  
  // Flatten units for the dropdown
  const flattenUnits = (units: any[]): any[] => {
    let result: any[] = [];
    units?.forEach((u) => {
      result.push(u);
      const kids = u.SubUnits || u.children;
      if (kids?.length) result = [...result, ...flattenUnits(kids)];
    });
    return result;
  };
  const allUnits = flattenUnits(unitTreeData?.data || []);
  const filteredUnits = allUnits.filter(u => !formData.org_id || u.org_id === formData.org_id);

  const filteredUsers = users.filter((user: any) => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const search = searchQuery.toLowerCase();
    const phone = String(user.phone_number ?? '');
    const email = String(user.email ?? '').toLowerCase();
    return fullName.includes(search) || phone.includes(search) || email.includes(search);
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser(formData).unwrap();
      setIsAddUserModalOpen(false);
      setFormData({
        first_name: '',
        last_name: '',
        phone_number: '',
        email: '',
        password: 'Password123',
        user_type: 'STAFF',
        org_id: currentUser.orgId || '',
        dept_id: '',
        unit_id: '',
        role_id: '',
        status: 'ACTIVE'
      });
      refetchUsers();
    } catch (err: any) {
      alert(err.data?.message || 'Failed to create user');
    }
  };

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'SUPERADMIN': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'ORG_ADMIN': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'UNIT_ADMIN': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-100/90 bg-gradient-to-br from-white via-white to-emerald-50/50 p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 min-w-0 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">User management</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">Personnel roster</h2>
          </div>
          {!isDeptAdmin && (
            <button
              type="button"
              onClick={() => setIsAddUserModalOpen(true)}
              className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 active:scale-[0.98] sm:text-base"
            >
              <UserPlus size={18} className="shrink-0" aria-hidden />
              Add user
            </button>
          )}
        </div>
      </div>

      <div className="min-h-[500px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 bg-gray-50/80 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-gray-400" aria-hidden />
            <input
              type="search"
              placeholder="Search name, phone, or email…"
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
          <p className="shrink-0 whitespace-nowrap text-sm text-gray-500 tabular-nums">
            <span className="font-medium text-gray-700">{filteredUsers.length}</span>
            {searchQuery.trim() ? ' matching' : ''} of {users.length} users
          </p>
        </div>

        <div className="overflow-x-auto">
           {loadingUsers ? (
              <div className="flex flex-col items-center justify-center gap-3 p-20 text-gray-400">
                 <Loader2 className="animate-spin" size={32} aria-hidden />
                 <p className="font-medium">Loading users…</p>
              </div>
           ) : (
             <table className="w-full min-w-[860px] text-left text-sm">
               <thead className="border-b border-gray-100 bg-gray-50/90 text-xs font-semibold uppercase tracking-wide text-gray-500">
                 <tr>
                   <th className="whitespace-nowrap px-4 py-3 sm:px-6">Full name</th>
                   <th className="whitespace-nowrap px-4 py-3 sm:px-6">Phone number</th>
                   <th className="whitespace-nowrap px-4 py-3 sm:px-6">Email</th>
                   {!isDeptAdmin && (
                     <th className="whitespace-nowrap px-4 py-3 sm:px-6">Department</th>
                   )}
                   <th className="whitespace-nowrap px-4 py-3 sm:px-6">Status</th>
                   <th className="whitespace-nowrap px-4 py-3 sm:px-6">Role &amp; user type</th>
                   <th className="whitespace-nowrap px-4 py-3 text-right sm:px-6">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {filteredUsers.map((user: any) => (
                   <tr key={user.user_id} className="transition-colors hover:bg-gray-50/60">
                     <td className="px-4 py-3 sm:px-6">
                        <div
                          className="max-w-[16rem] truncate font-semibold whitespace-nowrap text-gray-900 sm:max-w-none"
                          title={`${user.first_name} ${user.last_name}`}
                        >
                          {user.first_name} {user.last_name}
                        </div>
                     </td>
                     <td className="whitespace-nowrap px-4 py-3 sm:px-6">
                        <div className="flex min-w-0 items-center gap-2 text-gray-800">
                          <Smartphone size={14} className="shrink-0 text-gray-400" aria-hidden />
                          <span className="font-mono text-sm">{user.phone_number || '—'}</span>
                        </div>
                     </td>
                     <td className="max-w-[14rem] px-4 py-3 sm:max-w-[18rem] sm:px-6">
                        <div className="flex min-w-0 items-center gap-2 text-gray-600">
                          <Mail size={14} className="shrink-0 text-gray-400" aria-hidden />
                          <span
                            className="truncate text-sm"
                            title={user.email?.trim() ? user.email : undefined}
                          >
                            {user.email?.trim() ? user.email : '—'}
                          </span>
                        </div>
                     </td>
                     {!isDeptAdmin && (
                     <td className="max-w-[200px] px-4 py-3 sm:px-6">
                        <div className="flex min-w-0 items-center gap-1.5 text-gray-800">
                          <Layers size={14} className="shrink-0 text-gray-400" aria-hidden />
                          <span className="truncate whitespace-nowrap text-sm" title={user.dept_id ? (deptNameById.get(user.dept_id) || String(user.dept_id)) : undefined}>
                            {user.dept_id
                              ? deptNameById.get(user.dept_id) || `${String(user.dept_id).slice(0, 8)}…`
                              : '—'}
                          </span>
                        </div>
                     </td>
                     )}
                     <td className="whitespace-nowrap px-4 py-3 sm:px-6">
                        <span className={`inline-flex border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${(user.status || 'ACTIVE') === 'ACTIVE' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-100 text-gray-500'}`}>
                           {user.status || 'ACTIVE'}
                        </span>
                     </td>
                     <td className="min-w-[140px] px-4 py-3 sm:px-6">
                        <div className="flex flex-col gap-1.5">
                           <span className={`inline-flex w-fit whitespace-nowrap rounded-lg border px-2.5 py-1 text-xs font-semibold ${getUserTypeColor(user.user_type)}`}>
                             {user.user_type}
                           </span>
                           {user.Organization && (
                             <div className="flex min-w-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                <Building2 size={12} className="shrink-0" aria-hidden />
                                <span className="truncate whitespace-nowrap" title={user.Organization.name}>{user.Organization.name}</span>
                             </div>
                           )}
                        </div>
                     </td>
                     <td className="px-3 py-2 text-right sm:px-5">
                       {canStaffAdminActionsForRow(user) ? (
                         <div className="inline-flex max-w-full flex-nowrap items-center justify-end gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                           <button
                             type="button"
                             title="Reset password to default"
                             aria-label="Reset password to default"
                             disabled={resettingUserId === user.user_id || lifecycleUserId === user.user_id}
                             onClick={() => void handleResetPassword(user.user_id)}
                             className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-amber-200/90 bg-amber-50 text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                           >
                             {resettingUserId === user.user_id ? (
                               <Loader2 className="animate-spin" size={14} aria-hidden />
                             ) : (
                               <KeyRound size={14} className="shrink-0" aria-hidden />
                             )}
                           </button>
                           {user.status !== 'DEACTIVATED' && (
                             <button
                               type="button"
                               title="Deactivate user"
                               aria-label="Deactivate user"
                               disabled={lifecycleUserId === user.user_id || resettingUserId === user.user_id}
                               onClick={() => void handleDeactivateUser(user.user_id)}
                               className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-rose-200/90 bg-rose-50 text-rose-900 hover:bg-rose-100 disabled:opacity-50"
                             >
                               {lifecycleUserId === user.user_id ? (
                                 <Loader2 className="animate-spin" size={14} aria-hidden />
                               ) : (
                                 <UserX size={14} className="shrink-0" aria-hidden />
                               )}
                             </button>
                           )}
                           {user.status === 'DEACTIVATED' && (
                             <button
                               type="button"
                               title="Activate user"
                               aria-label="Activate user"
                               disabled={lifecycleUserId === user.user_id || resettingUserId === user.user_id}
                               onClick={() => void handleActivateUser(user.user_id)}
                               className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-emerald-200/90 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
                             >
                               {lifecycleUserId === user.user_id ? (
                                 <Loader2 className="animate-spin" size={14} aria-hidden />
                               ) : (
                                 <UserCheck size={14} className="shrink-0" aria-hidden />
                               )}
                             </button>
                           )}
                         </div>
                       ) : (
                         <span className="text-xs text-gray-400">—</span>
                       )}
                     </td>
                   </tr>
                 ))}
                 {filteredUsers.length === 0 && (
                   <tr>
                     <td colSpan={isDeptAdmin ? 6 : 7} className="py-20 text-center text-gray-500">
                        No users match your search.
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           )}
        </div>
      </div>

      {/* Add user modal — portaled to body so position:fixed is viewport-relative (App shell uses transform animation). */}
      {isAddUserModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] overflow-y-auto overflow-x-hidden bg-slate-900/50 backdrop-blur-sm"
            role="presentation"
            onClick={() => setIsAddUserModalOpen(false)}
          >
            <div className="flex min-h-[100dvh] items-center justify-center p-4 py-8 sm:p-6 sm:py-10 pointer-events-none">
              <div
                className="pointer-events-auto flex max-h-[min(90dvh,44rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-2xl shadow-emerald-950/10"
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-user-dialog-title"
                onClick={(e) => e.stopPropagation()}
              >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-emerald-100/90 bg-gradient-to-r from-emerald-50/60 via-white to-white px-4 py-3.5 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                  <UserPlus size={20} strokeWidth={2} aria-hidden />
                </div>
                <h3 id="add-user-dialog-title" className="truncate text-lg font-semibold text-gray-900">
                  Add user
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                aria-label="Close"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="onboard-first" className="text-xs font-medium text-gray-600">
                      First name
                    </label>
                    <input
                      id="onboard-first"
                      required
                      type="text"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/25"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="onboard-last" className="text-xs font-medium text-gray-600">
                      Last name
                    </label>
                    <input
                      id="onboard-last"
                      required
                      type="text"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/25"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="onboard-phone" className="text-xs font-medium text-gray-600">
                    Phone number
                  </label>
                  <input
                    id="onboard-phone"
                    required
                    type="text"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/25"
                    placeholder="0911000000"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="onboard-user-type" className="text-xs font-medium text-gray-600">
                      User type
                    </label>
                    <select
                      id="onboard-user-type"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/25"
                      value={formData.user_type}
                      onChange={(e) => setFormData({ ...formData, user_type: e.target.value })}
                    >
                      <option value="STAFF">Staff member</option>
                      <option value="ORG_ADMIN">Organization admin</option>
                      <option value="UNIT_ADMIN">Branch / unit admin</option>
                      {isSuperAdmin && <option value="SUPERADMIN">System super admin</option>}
                    </select>
                  </div>

                  {isSuperAdmin && (
                    <div className="space-y-1.5">
                      <label htmlFor="onboard-org" className="text-xs font-medium text-gray-600">
                        Organization
                      </label>
                      <select
                        id="onboard-org"
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/25"
                        value={formData.org_id}
                        onChange={(e) => setFormData({ ...formData, org_id: e.target.value })}
                      >
                        <option value="">No organization</option>
                        {orgs.map((o: any) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="onboard-dept" className="text-xs font-medium text-gray-600">
                      Department
                    </label>
                    <select
                      id="onboard-dept"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/25 disabled:opacity-50"
                      disabled={!formData.org_id}
                      value={formData.dept_id}
                      onChange={(e) => setFormData({ ...formData, dept_id: e.target.value })}
                    >
                      <option value="">No department</option>
                      {depts.map((d: any) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="onboard-unit" className="text-xs font-medium text-gray-600">
                      Branch / unit
                    </label>
                    <select
                      id="onboard-unit"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/25 disabled:opacity-50"
                      disabled={!formData.org_id}
                      value={formData.unit_id}
                      onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                    >
                      <option value="">No unit</option>
                      {filteredUnits.map((u: any) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="onboard-role" className="text-xs font-medium text-gray-600">
                    Role (permissions)
                  </label>
                  <select
                    id="onboard-role"
                    required={formData.user_type !== 'SUPERADMIN'}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/25 disabled:opacity-50"
                    disabled={!formData.org_id}
                    value={formData.role_id}
                    onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                  >
                    <option value="">Select a role…</option>
                    {roles.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 rounded-xl border border-amber-200/80 bg-amber-50/80 p-3.5">
                  <Shield className="mt-0.5 size-[18px] shrink-0 text-amber-600" aria-hidden />
                  <p className="text-xs leading-relaxed text-amber-950/90">
                    Default sign-in password is <span className="font-semibold">Password123</span>. Ask the user to change it after first login.
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50/80 px-4 py-3 sm:flex-row sm:justify-end sm:gap-3 sm:px-5">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isCreating ? 'Creating…' : 'Create user'}
                </button>
              </div>
            </form>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
