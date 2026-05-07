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
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';
import UserHierarchyMatrix from './UserHierarchyMatrix';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n/I18nContext';
import { interpolate } from '../../i18n/messages';
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
  const { messages } = useI18n();
  const u = messages.admin.users;
  const location = useLocation();
  const navigate = useNavigate();

  const isSuperAdmin =
    currentUser.role === 'superadmin' || currentUser.user_type === 'SUPERADMIN';
  const isOrgAdmin = currentUser.user_type === 'ORG_ADMIN';
  const isUnitAdminViewer = currentUser.user_type === 'UNIT_ADMIN';
  /** Org admin (not super): organization / HQ onboarding — no branch picker; server pins org root unit. */
  const showOrgHqFlow = isOrgAdmin && !isSuperAdmin;
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
    if (isUnitAdminViewer && currentUser.orgId && currentUser.unitId) {
      return { org_id: currentUser.orgId, unit_id: currentUser.unitId };
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
  }, [
    isDeptAdmin,
    isOrgAdmin,
    isUnitAdminViewer,
    isSuperAdmin,
    currentUser.orgId,
    currentUser.deptId,
    currentUser.unitId,
  ]);

  const skipUsersQuery =
    (isDeptAdmin && (!currentUser.orgId || !currentUser.deptId)) ||
    (isUnitAdminViewer && (!currentUser.orgId || !currentUser.unitId)) ||
    (isOrgAdmin && !currentUser.orgId);

  const { data: usersData, isLoading: loadingUsers, refetch: refetchUsers } = useGetUsersQuery(usersQueryArg, {
    skip: skipUsersQuery,
  });
  const { data: orgsData } = useGetOrganizationsQuery(undefined);
  const [createUser, { isLoading: isCreating }] = useAdminCreateUserMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetUserPasswordMutation();
  const [deactivateUser] = useDeactivateUserMutation();
  const [activateUser] = useActivateUserMutation();
  const [resettingUserId, setResettingId] = useState<string | null>(null);
  const [lifecycleUserId, setLifecycleUserId] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<any>(null);

  const [viewMode, setViewMode] = useState<'table' | 'matrix'>('table');



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

  /** Org for API queries in the modal — unit/org admins may have an empty string in form until we sync. */
  const effectiveOrgId = useMemo(
    () => (formData.org_id || currentUser.orgId || '').trim(),
    [formData.org_id, currentUser.orgId],
  );

  const buildEmptyUserForm = () => ({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    password: 'Password123',
    user_type: '' as any,
    org_id: '',
    dept_id: '',
    unit_id: isUnitAdminViewer ? currentUser.unitId || '' : '',
    role_id: '',
    status: 'ACTIVE' as const,
  });

  const openAddUserModal = () => {
    const empty = buildEmptyUserForm();
    // Super admins create platform-level users — org_id stays empty (null on submit)
    if (!isSuperAdmin && currentUser.orgId) {
      empty.org_id = currentUser.orgId;
    }
    setFormData(empty);
    setIsAddUserModalOpen(true);
  };

  useEffect(() => {
    const st = location.state as { prefillUnitAdmin?: { unitId: string; orgId: string } } | null;
    const pref = st?.prefillUnitAdmin;
    if (!pref?.unitId || !pref.orgId) return;
    if (showOrgHqFlow) {
      navigate(location.pathname, { replace: true, state: null });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      org_id: pref.orgId,
      unit_id: pref.unitId,
      user_type: 'UNIT_ADMIN',
      dept_id: '',
    }));
    setIsAddUserModalOpen(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate, showOrgHqFlow]);

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
    if (isUnitAdminViewer) {
      return ['STAFF', 'EXTERNAL'].includes(row.user_type);
    }
    return false;
  };

  const handleResetPassword = (userId: string) => {
    const user = users.find((u: any) => u.user_id === userId);
    setUserToReset(user);
    setIsResetModalOpen(true);
  };

  const confirmResetPassword = async () => {
    if (!userToReset) return;
    const userId = userToReset.user_id;
    try {
      const res = await resetPassword(userId).unwrap();
      setIsResetModalOpen(false);
      const hint = (res as { login_hint?: string }).login_hint;
      const msgPart = (res as { message?: string }).message ?? u.toastPasswordResetShort;
      toast.success(
        hint ? interpolate(u.toastPasswordResetWithHint, { msg: msgPart, hint }) : msgPart || u.toastPasswordResetShort,
      );
      await refetchUsers();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? String((err as { data?: { message?: string } }).data?.message ?? '')
          : '';
      toast.error(msg || u.toastPasswordResetError);
    } finally {
      setUserToReset(null);
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!confirm(u.confirmDeactivate)) return;
    setLifecycleUserId(userId);
    try {
      await deactivateUser(userId).unwrap();
      toast.success(u.toastUserDeactivated);
      await refetchUsers();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? String((err as { data?: { message?: string } }).data?.message ?? '')
          : '';
      toast.error(msg || u.toastDeactivateError);
    } finally {
      setLifecycleUserId(null);
    }
  };

  const handleActivateUser = async (userId: string) => {
    setLifecycleUserId(userId);
    try {
      await activateUser(userId).unwrap();
      toast.success(u.toastUserActivated);
      await refetchUsers();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? String((err as { data?: { message?: string } }).data?.message ?? '')
          : '';
      toast.error(msg || u.toastActivateError);
    } finally {
      setLifecycleUserId(null);
    }
  };

  // Hierarchy Data (use effectiveOrgId so unit/org admins still load when form org_id was not synced)
  const { data: deptsData } = useGetDepartmentsQuery(effectiveOrgId, { skip: !effectiveOrgId });
  const { data: rolesData } = useGetRolesQuery(
    { orgId: isSuperAdmin ? undefined : effectiveOrgId, includeSystem: true },
    // Super admins fetch system-level roles with no org filter; others need an org first
    { skip: !isSuperAdmin && !effectiveOrgId },
  );
  const { data: unitTreeData } = useGetUnitTreeQuery(effectiveOrgId, {
    skip: !effectiveOrgId || showOrgHqFlow,
  });

  const deptNameById = useMemo(() => {
    const m = new Map<string, string>();
    const list = (deptsData as { depts?: { id: string; name: string }[] } | undefined)?.depts ?? [];
    list.forEach((d) => m.set(d.id, d.name));
    return m;
  }, [deptsData]);

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
  const filteredUnits = allUnits.filter(
    (unitRow) => !effectiveOrgId || unitRow.org_id === effectiveOrgId,
  );

  const filteredUsers = users.filter((user: any) => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const search = searchQuery.toLowerCase();
    const phone = String(user.phone_number ?? '');
    const email = String(user.email ?? '').toLowerCase();
    return fullName.includes(search) || phone.includes(search) || email.includes(search);
  });

  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const orgIdResolved = (formData.org_id || '').trim();
    if (!orgIdResolved && !isSuperAdmin) {
      toast.error('Please select a valid organization for this user.');
      return;
    }
    if (showOrgHqFlow && String(formData.role_id || '').trim() === '') {
      toast.error(u.toastRoleRequiredOrgAdmin ?? 'Select a role for this user.');
      return;
    }
    if (formData.user_type === 'UNIT_ADMIN' && !formData.unit_id?.trim()) {
      toast.error(u.toastUnitAdminNeedsUnit ?? 'Select a branch (unit) for this unit administrator.');
      return;
    }
    if (isUnitAdminViewer && !currentUser.unitId?.trim()) {
      toast.error(u.toastUnitAdminScope ?? 'Your account has no branch assigned. Contact an organization admin.');
      return;
    }
    try {
      const payload = {
        ...formData,
        // Super admins always create platform-level users (no org)
        org_id: isSuperAdmin ? null : orgIdResolved?.trim() || null,
        unit_id: (showOrgHqFlow
          ? ''
          : isUnitAdminViewer
            ? (currentUser.unitId || formData.unit_id)
            : formData.unit_id)?.trim() || null,
        dept_id: (formData.user_type === 'UNIT_ADMIN' ? '' : formData.dept_id)?.trim() || null,
      };
      await createUser(payload).unwrap();
      setIsAddUserModalOpen(false);
      setFormData(buildEmptyUserForm());
      refetchUsers();
      toast.success('User created.');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? String((err as { data?: { message?: string } }).data?.message ?? '')
          : '';
      toast.error(msg || u.createUserError);
    }
  };

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'SUPERADMIN': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'ORG_ADMIN': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'UNIT_ADMIN': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'EXTERNAL': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  /** Branch / unit row: superadmin picks branch; branch admin locked; org admin path hides entirely. */
  const showBranchUnitRow = !showOrgHqFlow && (isSuperAdmin || isUnitAdminViewer);

  const roleHintText = isUnitAdminViewer ? u.roleFieldHintUnitAdmin : u.roleFieldHint;


  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-100/90 bg-gradient-to-br from-white via-white to-emerald-50/50 p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 min-w-0 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
              {u.title}
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              {searchQuery.trim()
                ? interpolate(u.rosterCountFiltered, { filtered: filteredUsers.length, total: users.length })
                : interpolate(u.rosterCountAll, { filtered: filteredUsers.length, total: users.length })}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-neutral-100 p-1 rounded-lg border border-neutral-200">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  viewMode === 'table' ? 'bg-white text-emerald-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <TableIcon size={14} /> Table
              </button>
              <button
                onClick={() => setViewMode('matrix')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  viewMode === 'matrix' ? 'bg-white text-emerald-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <LayoutGrid size={14} /> Matrix
              </button>
            </div>

            {!isDeptAdmin && (
              <button
                type="button"
                onClick={openAddUserModal}
                className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 active:scale-[0.98] sm:text-base"
              >
                <UserPlus size={18} className="shrink-0" aria-hidden />
                {u.addUser}
              </button>
            )}
          </div>
        </div>
      </div>

      {viewMode === 'matrix' ? (
        <div className="min-h-[600px]">
          {loadingUsers ? (
             <div className="flex flex-col items-center justify-center gap-3 p-20 text-gray-400">
               <Loader2 className="animate-spin" size={32} aria-hidden />
               <p className="font-medium">{u.loadingUsers}</p>
             </div>
          ) : (
            <UserHierarchyMatrix 
              users={users}
              unitTree={unitTreeData?.tree || []}
              departments={deptsData?.depts || []}
              onManageUser={(user) => {
                // Future: open user detail modal
              }}
            />
          )}
        </div>
      ) : (
        <>
          {skipUsersQuery ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-5 py-6 text-sm text-amber-950 shadow-sm">
              {isUnitAdminViewer ? u.toastUnitAdminScope : u.toastOrgRequired}
            </div>
          ) : (
            <div className="min-h-[500px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-gray-100 bg-gray-50/80 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5">
            <div className="relative min-w-0 flex-1 sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-gray-400" aria-hidden />
              <input
                type="search"
                placeholder={u.searchPlaceholder}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
            </div>
            <p className="shrink-0 whitespace-nowrap text-sm text-gray-500 tabular-nums">
              <span className="font-medium text-gray-700">
                {searchQuery.trim()
                  ? interpolate(u.rosterCountFiltered, { filtered: filteredUsers.length, total: users.length })
                  : interpolate(u.rosterCountAll, { filtered: filteredUsers.length, total: users.length })}
              </span>
            </p>
          </div>

          <div className="overflow-x-auto">
            {loadingUsers ? (
              <div className="flex flex-col items-center justify-center gap-3 p-20 text-gray-400">
                <Loader2 className="animate-spin" size={32} aria-hidden />
                <p className="font-medium">{u.loadingUsers}</p>
              </div>
            ) : (
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/90 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 sm:px-6">{u.thFullName}</th>
                    <th className="whitespace-nowrap px-4 py-3 sm:px-6">{u.thPhone}</th>
                    <th className="whitespace-nowrap px-4 py-3 sm:px-6">{u.thEmail}</th>
                    {!isDeptAdmin && (
                      <th className="whitespace-nowrap px-4 py-3 sm:px-6">{u.thDepartment}</th>
                    )}
                    <th className="whitespace-nowrap px-4 py-3 sm:px-6">{u.thStatus}</th>
                    <th className="whitespace-nowrap px-4 py-3 sm:px-6">Role</th>
                    <th className="whitespace-nowrap px-4 py-3 sm:px-6">{u.labelOrganization}</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right sm:px-6">{u.thActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedUsers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">
                        {u.rosterCountAll.replace('{total}', '0').replace('{filtered}', '0')}
                      </td>
                    </tr>
                  )}
                  {paginatedUsers.map((user: any) => (
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
                          <span className="font-mono text-sm">{user.phone_number || u.emDash}</span>
                        </div>
                      </td>
                      <td className="max-w-[14rem] px-4 py-3 sm:max-w-[18rem] sm:px-6">
                        <div className="flex min-w-0 items-center gap-2 text-gray-600">
                          <Mail size={14} className="shrink-0 text-gray-400" aria-hidden />
                          <span
                            className="truncate text-sm"
                            title={user.email?.trim() ? user.email : undefined}
                          >
                            {user.email?.trim() ? user.email : u.emDash}
                          </span>
                        </div>
                      </td>
                      {!isDeptAdmin && (
                        <td className="max-w-[200px] px-4 py-3 sm:px-6">
                          <div className="flex min-w-0 items-center gap-1.5 text-gray-800">
                            <Layers size={14} className="shrink-0 text-gray-400" aria-hidden />
                            <span className="truncate whitespace-nowrap text-sm" title={user.Department?.name || (user.dept_id ? (deptNameById.get(user.dept_id) || String(user.dept_id)) : undefined)}>
                              {user.Department?.name || (user.dept_id
                                ? deptNameById.get(user.dept_id) || `${String(user.dept_id).slice(0, 8)}…`
                                : u.emDash)}
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
                        <span className="text-sm font-medium text-gray-900">
                          {user.roleDisplayName || u.emDash}
                        </span>
                      </td>
                      <td className="min-w-[140px] px-4 py-3 sm:px-6">
                        <div className="flex min-w-0 items-center gap-1.5 text-gray-600">
                          <Building2 size={14} className="shrink-0 text-gray-400" aria-hidden />
                          <span className="truncate text-sm" title={user.Organization?.name || user.organization}>
                            {user.Organization?.name || user.organization || u.emDash}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right sm:px-5">
                        {canStaffAdminActionsForRow(user) ? (
                          <div className="inline-flex max-w-full flex-nowrap items-center justify-end gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            <button
                              type="button"
                              title={u.titleResetPassword}
                              aria-label={u.ariaResetPassword}
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
                                title={u.titleDeactivateUser}
                                aria-label={u.ariaDeactivateUser}
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
                                title={u.titleActivateUser}
                                aria-label={u.ariaActivateUser}
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
                          <span className="text-xs text-gray-400">{u.emDash}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={isDeptAdmin ? 6 : 7} className="py-20 text-center text-gray-500">
                        {u.noSearchResults}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/80 px-4 py-3 sm:px-6">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-900">{paginatedUsers.length}</span> of <span className="font-medium text-gray-900">{filteredUsers.length}</span> users
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex items-center px-2 text-sm font-medium text-gray-700">
                {currentPage} / {totalPages || 1}
              </div>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages || 1, p + 1))}
                disabled={currentPage === (totalPages || 1)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )}

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
                      {u.modalAddTitle}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddUserModalOpen(false)}
                    className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                    aria-label={u.modalCloseAria}
                  >
                    <X size={20} strokeWidth={2} />
                  </button>
                </div>

                <form onSubmit={handleCreateUser} className="flex min-h-0 flex-1 flex-col">
                  <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label htmlFor="onboard-first" className="text-xs font-medium text-gray-600">
                          {u.labelFirstName}
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
                          {u.labelLastName}
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

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label htmlFor="onboard-phone" className="text-xs font-medium text-gray-600">
                          {u.labelPhone}
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
                      <div className="space-y-1.5">
                        <label htmlFor="onboard-email" className="text-xs font-medium text-gray-600">
                          {messages.admin.organizations.labelEmailOptional}
                        </label>
                        <input
                          id="onboard-email"
                          type="email"
                          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/25"
                          placeholder="user@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>


                    {!isSuperAdmin && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-600">
                          {u.labelOrganization}
                        </label>
                        <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/50 px-3.5 py-2.5 text-sm font-semibold text-gray-700">
                          <Building2 size={16} className="text-gray-400" />
                          {(currentUser as any).Organization?.name || currentUser.organization || "Your Organization"}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label htmlFor="onboard-role-field" className="text-xs font-medium text-gray-600">
                        Role
                      </label>
                      <select
                        id="onboard-role-field"
                        required
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/25 disabled:opacity-50"
                        disabled={!effectiveOrgId && !isSuperAdmin}
                        value={formData.role_id}
                        onChange={(e) => {
                          const rid = e.target.value;
                          const roleObj = roles.find((r: any) => String(r.id) === String(rid));
                          const rname = roleObj?.name || '';

                          let ut = 'STAFF';
                          if (rname === 'Super Admin') ut = 'SUPERADMIN';
                          else if (rname === 'Organization Admin') ut = 'ORG_ADMIN';
                          else if (rname === 'Branch Admin') ut = 'UNIT_ADMIN';
                          else if (rname === 'Department Admin') ut = 'DEPT_ADMIN';

                          setFormData({
                            ...formData,
                            role_id: rid,
                            user_type: ut as any,
                            ...(ut === 'UNIT_ADMIN' ? { dept_id: '' } : {})
                          });
                        }}
                      >
                        <option value="">Select Role</option>
                        {roles
                          .filter((r: any) => {
                            if (r.name === 'Organization Admin') return false;

                            if (isSuperAdmin) {
                              // Super Admin can only add Learner and Super Admin
                              const allowed = ['Learner', 'Super Admin'];
                              return allowed.includes(r.name);
                            }
                            return true;
                          })
                          .map((r: { id: string; name: string }) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                      </select>
                    </div>
 
                    {isSuperAdmin && (formData.user_type === 'STAFF' || formData.user_type === 'EXTERNAL') && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-600">User Classification</label>
                        <div className="flex gap-4 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="radio"
                              name="user_classification"
                              checked={formData.user_type === 'STAFF'}
                              onChange={() => setFormData({ ...formData, user_type: 'STAFF' })}
                              className="size-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                            />
                            <span className="text-xs font-semibold text-neutral-700 group-hover:text-emerald-700 transition-colors">Internal Staff</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="radio"
                              name="user_classification"
                              checked={formData.user_type === 'EXTERNAL'}
                              onChange={() => setFormData({ ...formData, user_type: 'EXTERNAL' })}
                              className="size-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                            />
                            <span className="text-xs font-semibold text-neutral-700 group-hover:text-emerald-700 transition-colors">External</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {!effectiveOrgId && !isSuperAdmin && (
                      <p className="text-xs text-amber-800">{u.roleOrgMissingHint}</p>
                    )}
                    {effectiveOrgId && roles.length === 0 && (
                      <p className="text-xs text-amber-800">{u.roleListEmptyHint}</p>
                    )}

                    <div
                      className={`grid grid-cols-1 gap-4 ${formData.user_type === 'UNIT_ADMIN'
                        ? ''
                        : showBranchUnitRow && !isSuperAdmin
                          ? 'sm:grid-cols-2'
                          : ''
                        }`}
                    >
                      {formData.user_type !== 'UNIT_ADMIN' && !isSuperAdmin && (
                        <div className="space-y-1.5">
                          <label htmlFor="onboard-dept" className="text-xs font-medium text-gray-600">
                            {u.labelDepartment}
                          </label>
                          <select
                            id="onboard-dept"
                            required
                            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/25 disabled:opacity-50"
                            disabled={!isSuperAdmin && !effectiveOrgId}
                            value={formData.dept_id}
                            onChange={(e) => setFormData({ ...formData, dept_id: e.target.value })}
                          >
                            <option value="" disabled>{u.selectDepartment || "Select Department"}</option>
                            {depts.map((d: any) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      {showBranchUnitRow && !isSuperAdmin && (
                        <div className="space-y-1.5">
                          <label htmlFor="onboard-unit" className="text-xs font-medium text-gray-600">
                            {formData.user_type === 'UNIT_ADMIN' ? `${u.labelBranchUnit} *` : u.labelBranchUnit}
                          </label>
                          {formData.user_type === 'UNIT_ADMIN' && (
                            <p className="text-xs text-gray-500">{u.unitAdminDeptHint}</p>
                          )}
                          {isUnitAdminViewer && formData.user_type === 'STAFF' && (
                            <p className="text-xs text-gray-500">{u.unitAdminBranchLockedHint}</p>
                          )}
                          <select
                            id="onboard-unit"
                            required
                            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/25 disabled:opacity-50"
                            disabled={!effectiveOrgId || isUnitAdminViewer}
                            value={isUnitAdminViewer ? (currentUser.unitId || formData.unit_id) : formData.unit_id}
                            onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                          >
                            <option value="" disabled>{u.selectBranch || "Select Branch"}</option>
                            {filteredUnits.map((unitRow: { id: string; name: string }) => (
                              <option key={unitRow.id} value={unitRow.id}>
                                {unitRow.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>


                    <div className="flex gap-3 rounded-xl border border-amber-200/80 bg-amber-50/80 p-3.5">
                      <Shield className="mt-0.5 size-[18px] shrink-0 text-amber-600" aria-hidden />
                      <p className="text-xs leading-relaxed text-amber-950/90">{u.defaultPasswordBlurb}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50/80 px-4 py-3 sm:flex-row sm:justify-end sm:gap-3 sm:px-5">
                    <button
                      type="button"
                      onClick={() => setIsAddUserModalOpen(false)}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                    >
                      {u.cancel || 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {isCreating ? u.createUserCreating : u.createUserSubmit}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}
      {/* Password Reset Confirmation Modal */}
      {isResetModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] overflow-y-auto overflow-x-hidden bg-slate-900/50 backdrop-blur-sm"
            role="presentation"
            onClick={() => setIsResetModalOpen(false)}
          >
            <div className="flex min-h-[100dvh] items-center justify-center p-4 pointer-events-none">
              <div
                className="pointer-events-auto w-full max-w-sm rounded-2xl border border-gray-200/90 bg-white p-6 shadow-2xl"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-4">
                    <KeyRound size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Reset Password?</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Are you sure you want to reset the password for{' '}
                    <span className="font-semibold text-gray-900">
                      {userToReset?.first_name} {userToReset?.last_name}
                    </span>?
                  </p>
                  <div className="flex w-full gap-3">
                    <button
                      type="button"
                      onClick={() => setIsResetModalOpen(false)}
                      className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isResetting}
                      onClick={() => void confirmResetPassword()}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isResetting && <Loader2 size={16} className="animate-spin" />}
                      Reset
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
