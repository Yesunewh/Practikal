import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  useGetUnitTreeQuery,
  useCreateUnitMutation,
  useGetUnitTypesQuery,
  useGetOrganizationsQuery,
  useUpdateUnitMutation,
  useAdminCreateUserMutation,
  useGetRolesQuery,
  useGetUsersQuery,
  useDeactivateUserMutation,
  useActivateUserMutation,
  useResetUserPasswordMutation,
} from '../../store/apiSlice/practikalApi';
import { GitFork, Plus, ChevronRight, ChevronDown, MapPin, UserPlus, Edit2, X, Trash2, ArrowLeft, Shield, Key, Lock, Power } from 'lucide-react';
import { User } from '../../types';
import toast from 'react-hot-toast';
import AdminHierarchyPageShell from './AdminHierarchyPageShell';
import HierarchyLevelsGraphic from './HierarchyLevelsGraphic';
import BranchHierarchyDiagram from './BranchHierarchyDiagram';
import { useI18n } from '../../i18n/I18nContext';
import { interpolate } from '../../i18n/messages';

export default function BranchManagement({ currentUser }: { currentUser: User }) {
  const { messages } = useI18n();
  const h = messages.admin.hierarchy;
  const navigate = useNavigate();
  const isSuperAdmin =
    currentUser.role === 'superadmin' || currentUser.user_type === 'SUPERADMIN';
  const isOrgAdminUser = currentUser.user_type === 'ORG_ADMIN';
  const isUnitAdminUser = currentUser.user_type === 'UNIT_ADMIN';
  const assignedUnitId = typeof currentUser.unitId === 'string' ? currentUser.unitId : undefined;
  const orgIdFromUser = typeof currentUser.orgId === 'string' ? currentUser.orgId : undefined;

  /** Tenant org structure is managed by org/unit admins, but Superadmin can also configure it. */
  const canMutateHierarchy = true;
  const canAddRootLocation = isOrgAdminUser || isSuperAdmin;
  /** Org and Super admins can manage any node; unit admins may manage any node within their scoped subtree. */
  const canAddChildUnderNode = (nodeId: string | null) => {
    if (isSuperAdmin) return true;
    if (isOrgAdminUser) return nodeId === null;
    if (isUnitAdminUser) return nodeId === assignedUnitId;
    return false;
  };

  const canManageAdmins = (node: any) => {
    if (isSuperAdmin) return true;
    if (isOrgAdminUser) {
      const type = unitTypes.find((t: any) => t.id === node.type_id);
      return type?.level === 1;
    }
    if (isUnitAdminUser) {
      return String(node.parent_id) === String(assignedUnitId);
    }
    return false;
  };

  const canEditNode = (node: any) => {
    if (isSuperAdmin) return true;
    if (isOrgAdminUser) {
      const type = unitTypes.find((t: any) => t.id === node.type_id);
      return type?.level === 1;
    }
    if (isUnitAdminUser) {
      if (String(node.id) === String(assignedUnitId)) return false;
      return String(node.parent_id) === String(assignedUnitId);
    }
    return false;
  };

  const { data: orgsData } = useGetOrganizationsQuery(undefined, {
    skip: !isSuperAdmin,
  });

  const orgs = (orgsData?.orgs ?? []) as { id: string; name: string }[];

  const [superOrgId, setSuperOrgId] = useState('');

  useEffect(() => {
    if (!isSuperAdmin) {
      setSuperOrgId('');
      return;
    }
    if (orgIdFromUser && !superOrgId) {
      setSuperOrgId(orgIdFromUser);
    }
  }, [isSuperAdmin, orgIdFromUser, superOrgId]);

  const effectiveOrgId = isSuperAdmin ? superOrgId || orgIdFromUser || '' : orgIdFromUser || '';

  const { data: treeRes, isLoading: loadingTree, refetch: refetchTree } = useGetUnitTreeQuery(
    effectiveOrgId,
    { skip: !effectiveOrgId }
  );
  const { data: typesRes, isLoading: loadingTypes } = useGetUnitTypesQuery(effectiveOrgId, {
    skip: !effectiveOrgId,
  });
  const [createUnit, { isLoading: isCreating }] = useCreateUnitMutation();
  const [updateUnit, { isLoading: isUpdating }] = useUpdateUnitMutation();
  const [createUser, { isLoading: isCreatingAdmin }] = useAdminCreateUserMutation();
  const [deactivateUser, { isLoading: isDeactivating }] = useDeactivateUserMutation();
  const [activateUser, { isLoading: isActivating }] = useActivateUserMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetUserPasswordMutation();

  const { data: rolesData } = useGetRolesQuery(
    { orgId: effectiveOrgId, includeSystem: true },
    { skip: !effectiveOrgId }
  );

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [unitModalState, setUnitModalState] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    parentId: string | null;
    targetTypeId: string | null;
    unitId?: string;
    unitName: string;
  }>({
    isOpen: false,
    mode: 'add',
    parentId: null,
    targetTypeId: null,
    unitName: '',
  });

  const [adminModalState, setAdminModalState] = useState<{ isOpen: boolean; unitId: string; mode: 'list' | 'add' }>({
    isOpen: false,
    unitId: '',
    mode: 'list'
  });
  const [adminFormData, setAdminFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
  });

  const { data: usersData, isLoading: loadingUsers } = useGetUsersQuery(
    { unit_id: adminModalState.unitId },
    { skip: !adminModalState.isOpen || !adminModalState.unitId }
  );

  const unitAdmins = ((usersData?.users as any[]) || (usersData?.data as any[]) || []).filter(
    (u) => u.user_type === 'UNIT_ADMIN'
  );

  // Body scroll lock for modals
  useEffect(() => {
    if (unitModalState.isOpen || adminModalState.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [unitModalState.isOpen, adminModalState.isOpen]);

  if (!effectiveOrgId) {
    return (
      <AdminHierarchyPageShell title={h.shellTitleSelect} subtitle={h.shellSubtitleSelect}>
        <div className="p-6">
          {isSuperAdmin ? (
            <>
              <label className="mb-1 block text-xs font-medium text-indigo-900/80">{h.orgLabel}</label>
              <select
                className="w-full max-w-xl rounded-xl border border-indigo-200/90 bg-white px-3 py-2.5 text-sm text-neutral-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                value={superOrgId}
                onChange={(e) => setSuperOrgId(e.target.value)}
              >
                <option value="">{h.selectOrgPlaceholder}</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              {h.accountNotLinked}
            </p>
          )}
        </div>
      </AdminHierarchyPageShell>
    );
  }

  if (loadingTree || loadingTypes) {
    return (
      <div className="animate-pulse rounded-2xl border border-indigo-100 bg-indigo-50/50 p-8 text-center text-sm text-indigo-800/80">
        {h.loading}
      </div>
    );
  }

  const unitTypes = (typesRes?.data || []).slice().sort((a: any, b: any) => a.level - b.level);
  const rootUnits = treeRes?.data || [];

  const getTypeLabel = (typeId: string) =>
    String(unitTypes.find((t: any) => t.id === typeId)?.name ?? h.typeFallbackUnit);

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = unitModalState.unitName.trim();
    if (!name) return;
    if (isSuperAdmin) {
      toast.error(h.toastSuperReadOnly);
      return;
    }

    try {
      if (unitModalState.mode === 'edit' && unitModalState.unitId) {
        await updateUnit({
          id: unitModalState.unitId,
          name,
          org_id: effectiveOrgId,
        }).unwrap();
        toast.success('Location updated.');
      } else {
        const body: { name: string; type_id: string; parent_id: string | null; org_id?: string } = {
          name,
          type_id: unitModalState.targetTypeId!,
          parent_id: unitModalState.parentId,
        };
        await createUnit(body).unwrap();
        toast.success(h.toastLocationSaved);
        if (unitModalState.parentId) {
          setExpandedNodes((prev) => new Set(prev).add(unitModalState.parentId!));
        }
      }

      setUnitModalState(prev => ({ ...prev, isOpen: false }));
      await refetchTree();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? String((err as { data?: { message?: string } }).data?.message ?? '')
          : '';
      toast.error(msg || (unitModalState.mode === 'edit' ? 'Failed to update' : h.toastCreateBranchFailed));
    }
  };

  const openAddModal = (parentId: string | null, targetTypeId: string) => {
    setUnitModalState({
      isOpen: true,
      mode: 'add',
      parentId,
      targetTypeId,
      unitName: '',
    });
  };

  const openEditModal = (unit: any, targetTypeId: string) => {
    setUnitModalState({
      isOpen: true,
      mode: 'edit',
      parentId: unit.parent_id,
      targetTypeId,
      unitId: unit.id,
      unitName: unit.name,
    });
  };

  const openAdminModal = (unitId: string) => {
    setAdminModalState({ isOpen: true, unitId, mode: 'list' });
    setAdminFormData({ first_name: '', last_name: '', phone_number: '', email: '' });
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminFormData.first_name.trim() || !adminFormData.last_name.trim() || !adminFormData.phone_number.trim()) return;

    // Find the Branch Admin role
    const roles = rolesData?.data || [];
    const branchRole = roles.find((r: any) => r.name === 'Branch Admin' || r.name === 'Unit Admin');
    const roleId = branchRole?.id || '';

    try {
      await createUser({
        ...adminFormData,
        password: 'Password123',
        user_type: 'UNIT_ADMIN',
        org_id: effectiveOrgId,
        unit_id: adminModalState.unitId,
        role_id: roleId,
        status: 'ACTIVE',
      }).unwrap();
      toast.success('Unit Admin successfully added.');
      setAdminModalState(prev => ({ ...prev, mode: 'list' }));
      setAdminFormData({ first_name: '', last_name: '', phone_number: '', email: '' });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? String((err as { data?: { message?: string } }).data?.message ?? '')
          : '';
      toast.error(msg || 'Failed to add unit admin');
    }
  };



  const handleToggleStatus = async (user: any) => {
    const isActive = user.status === 'ACTIVE';
    const action = isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this admin's account?`)) return;

    try {
      if (isActive) {
        await deactivateUser(user.user_id).unwrap();
        toast.success('Account deactivated.');
      } else {
        await activateUser(user.user_id).unwrap();
        toast.success('Account activated.');
      }
    } catch (err: unknown) {
      toast.error(`Failed to ${action} account.`);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!window.confirm('Reset this admin\'s password to the default?')) return;
    try {
      await resetPassword(userId).unwrap();
      toast.success('Password reset successfully to default.');
    } catch (err: unknown) {
      toast.error('Failed to reset password.');
    }
  };

  const handleDeactivateAdmin = async (userId: string) => {
    if (!window.confirm('Are you sure you want to remove this admin?')) return;
    try {
      await deactivateUser(userId).unwrap();
      toast.success('Admin removed successfully.');
    } catch (err: unknown) {
      toast.error('Failed to remove admin.');
    }
  };

  const getNextType = (currentLevel: number) => {
    return unitTypes.find((t: any) => t.level === currentLevel + 1);
  };

  const renderTree = (nodes: any[], currentLevel: number) => {
    if (!nodes || nodes.length === 0) return null;

    const nextType = getNextType(currentLevel);

    return (
      <ul className="relative ml-0 mt-1 space-y-2.5 border-l-[3px] border-indigo-300/90 pl-7 sm:space-y-3 sm:pl-9">
        {nodes.map((node) => {
          const isExpanded = expandedNodes.has(node.id);
          const childList = node.SubUnits || node.children || [];
          const hasChildren = childList.length > 0;
          const targetLevelType = unitTypes.find((t: any) => t.id === node.type_id);
          const allowChildHere = nextType && canAddChildUnderNode(node.id);

          return (
            <li key={node.id} className="relative">
              <div className="flex items-center gap-2 py-1.5 group">
                <button
                  type="button"
                  onClick={() => toggleNode(node.id)}
                  className="flex-shrink-0 rounded p-0.5 text-indigo-600/70 transition-colors hover:bg-indigo-100/80"
                >
                  {hasChildren ? (
                    isExpanded ? (
                      <ChevronDown size={18} />
                    ) : (
                      <ChevronRight size={18} />
                    )
                  ) : (
                    <span className="w-[18px] inline-block" />
                  )}
                </button>

                <div className="group flex max-w-md flex-1 items-center gap-2 rounded-xl border border-indigo-100/90 bg-white px-3 py-2 shadow-md shadow-indigo-950/[0.04] ring-1 ring-indigo-950/[0.03] transition-colors hover:border-indigo-300/90">
                  <MapPin size={16} className="shrink-0 text-indigo-500" />
                  <span className="font-medium text-neutral-800">{node.name}</span>
                  <span className="ml-auto rounded-full border border-violet-200/80 bg-violet-50/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-800/80">
                    {targetLevelType?.name || h.unknownType}
                  </span>
                </div>

                {allowChildHere && (
                  <button
                    type="button"
                    onClick={() => openAddModal(node.id, nextType.id)}
                    className="flex shrink-0 items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100 hover:text-indigo-900"
                  >
                    <Plus size={14} /> {interpolate(h.addNamedChild, { name: nextType.name })}
                  </button>
                )}
                {canEditNode(node) && (
                  <button
                    type="button"
                    onClick={() => openEditModal(node, targetLevelType?.id || '')}
                    className="flex shrink-0 items-center gap-1 rounded-md bg-white border border-indigo-200/90 px-2.5 py-1.5 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-50 hover:text-indigo-900"
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                )}
                {canManageAdmins(node) && (
                  <button
                    type="button"
                    onClick={() => openAdminModal(node.id)}
                    className="flex shrink-0 items-center gap-1 rounded-md border border-violet-200/90 bg-violet-50/90 px-2.5 py-1.5 text-xs font-medium text-violet-900 transition-colors hover:bg-violet-100"
                    title="Manage Unit Admins"
                  >
                    <Shield size={14} /> Manage Admins
                  </button>
                )}
              </div>

              {isExpanded && renderTree(node.SubUnits || node.children || [], currentLevel + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  const level1Type = unitTypes.find((t: any) => t.level === 1);

  if (unitTypes.length === 0) {
    return (
      <AdminHierarchyPageShell title={h.shellTitleMain} subtitle={messages.admin.terminology.shellSubtitleMain}>
        <div className="px-6 py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-200/80 bg-indigo-50/80">
            <GitFork size={32} className="text-indigo-400" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-indigo-950">{h.noTerminologyTitle}</h3>
          <p className="mx-auto max-w-md text-sm text-indigo-900/65">
            {h.noTerminologyBodyBefore}
            <strong className="text-indigo-900">{h.noTerminologyTerminologyWord}</strong>
            {h.noTerminologyBodyAfter}
          </p>
        </div>
      </AdminHierarchyPageShell>
    );
  }

  return (
    <AdminHierarchyPageShell title={h.shellTitleMain}>
      {isSuperAdmin && (
        <div className="border-b border-indigo-100/70 bg-white/50 px-4 py-4 sm:px-6">
          <div className="sm:flex sm:justify-end">
            <div className="w-full min-w-0 sm:max-w-xs">
              <label className="mb-1 block text-xs font-medium text-indigo-900/80">{h.orgLabel}</label>
              <select
                className="w-full rounded-xl border border-indigo-200/90 bg-white px-3 py-2.5 text-sm text-neutral-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                value={superOrgId}
                onChange={(e) => setSuperOrgId(e.target.value)}
              >
                <option value="">{h.selectOrgPlaceholder}</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="border-b border-indigo-100/70 bg-gradient-to-r from-violet-50/60 via-white to-indigo-50/45 px-4 py-4 sm:px-6">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-800/55">
          {h.branchDepthCaption}
        </p>
        <HierarchyLevelsGraphic
          levels={unitTypes.map((t: any) => ({
            id: String(t.id),
            level: Number(t.level),
            name: String(t.name ?? ''),
          }))}
        />
      </div>

      {rootUnits.length > 0 && (
        <div className="border-b border-indigo-100/70 px-4 py-4 sm:px-6">
          <BranchHierarchyDiagram roots={rootUnits} getTypeLabel={getTypeLabel} />
        </div>
      )}

      <div className="overflow-x-auto p-4 sm:p-6">
        {rootUnits.length === 0 ? (
          <div className="group rounded-2xl border-2 border-dashed border-indigo-200/80 bg-gradient-to-b from-indigo-50/60 to-violet-50/40 py-16 text-center transition-all hover:border-indigo-300 hover:from-indigo-50 hover:to-violet-50/60">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-indigo-100 bg-white shadow-sm transition-transform group-hover:scale-[1.02]">
              <MapPin size={32} className="text-indigo-400 group-hover:text-indigo-500" />
            </div>
            <h3 className="text-xl font-bold text-indigo-950">{h.emptyNetworkTitle}</h3>
            <p className="mx-auto mt-2 mb-8 max-w-sm text-sm text-indigo-900/65">
              {isSuperAdmin ? h.emptyNetworkBodySuper : h.emptyNetworkBodyAdmin}
            </p>
            {level1Type && canAddRootLocation && (
              <button
                type="button"
                onClick={() => openAddModal(null, level1Type.id)}
                className="mx-auto flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white shadow-lg shadow-indigo-600/25 transition-all hover:-translate-y-0.5 hover:bg-indigo-700"
              >
                <Plus size={20} />
                {interpolate(h.addFirstNamed, { name: level1Type.name })}
              </button>
            )}
            {level1Type && !canAddRootLocation && (
              <p className="mx-auto max-w-md text-sm text-indigo-900/70">
                {isSuperAdmin ? h.cannotCreateSuper : h.cannotCreateUnitAdmin}
              </p>
            )}
          </div>
        ) : (
          <div className="relative">
            {level1Type && canAddRootLocation && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => openAddModal(null, level1Type.id)}
                  className="flex items-center gap-2 rounded-xl border border-indigo-200/90 bg-indigo-50/90 px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-100 hover:text-indigo-900"
                >
                  <Plus size={16} /> {interpolate(h.addAnotherNamed, { name: level1Type.name })}
                </button>
              </div>
            )}
            
            <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-b from-indigo-50/50 to-violet-50/25 py-5 pr-4 shadow-inner shadow-indigo-100/40 sm:pr-6">
              {renderTree(rootUnits, 1)}
            </div>
          </div>
        )}
      </div>

      {unitModalState.isOpen && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" 
            onClick={() => setUnitModalState(prev => ({ ...prev, isOpen: false }))}
          ></div>
          <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
              <h3 className="text-lg font-bold text-neutral-900">
                {unitModalState.mode === 'add' ? 'Add Location' : 'Edit Location'}
              </h3>
              <button
                type="button"
                onClick={() => setUnitModalState(prev => ({ ...prev, isOpen: false }))}
                className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveUnit} className="p-6">
              <div className="mb-6">
                <label className="mb-2 block text-sm font-bold text-neutral-700">
                  Location Name
                </label>
                <input
                  autoFocus
                  type="text"
                  value={unitModalState.unitName}
                  onChange={(e) => setUnitModalState(prev => ({ ...prev, unitName: e.target.value }))}
                  placeholder="e.g. Headquarters"
                  className="w-full rounded-xl border-2 border-neutral-200 px-4 py-3 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setUnitModalState(prev => ({ ...prev, isOpen: false }))}
                  className="rounded-xl px-5 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating || !unitModalState.unitName.trim()}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isCreating || isUpdating ? 'Saving...' : 'Save Location'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {adminModalState.isOpen && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" 
            onClick={() => setAdminModalState(prev => ({ ...prev, isOpen: false }))}
          ></div>
          <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
              <div className="flex items-center gap-2">
                {adminModalState.mode === 'add' ? (
                  <button
                    type="button"
                    onClick={() => setAdminModalState(prev => ({ ...prev, mode: 'list' }))}
                    className="mr-1 rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                  >
                    <ArrowLeft size={18} />
                  </button>
                ) : (
                  <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                    <Shield size={16} strokeWidth={2} />
                  </div>
                )}
                <h3 className="text-lg font-bold text-neutral-900">
                  {adminModalState.mode === 'add' ? 'Add Unit Admin' : 'Manage Unit Admins'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAdminModalState(prev => ({ ...prev, isOpen: false }))}
                className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              >
                <X size={20} />
              </button>
            </div>
            
            {adminModalState.mode === 'list' ? (
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-neutral-700">Current Admins</h4>
                  <button
                    type="button"
                    onClick={() => setAdminModalState(prev => ({ ...prev, mode: 'add' }))}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
                  >
                    <UserPlus size={14} /> Add New
                  </button>
                </div>
                
                {loadingUsers ? (
                  <p className="text-sm text-neutral-500">Loading admins...</p>
                ) : unitAdmins.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 py-6 text-center">
                    <p className="text-sm text-neutral-500">No admins assigned to this unit yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {unitAdmins.map((admin) => (
                      <div key={admin.user_id} className="group/item flex flex-col rounded-xl border border-neutral-100 bg-white p-3 shadow-sm transition-all hover:border-indigo-100">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-neutral-800">{admin.first_name} {admin.last_name}</p>
                              {admin.status === 'DEACTIVATED' && (
                                <span className="rounded bg-red-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-600">Deactivated</span>
                              )}
                            </div>
                            <p className="text-[10px] font-medium text-indigo-600/70">{admin.roleDisplayName || 'Branch Admin'}</p>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-60 group-hover/item:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleResetPassword(admin.user_id)}
                              disabled={isResetting}
                              title="Reset Password"
                              className="rounded-lg p-1.5 text-indigo-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50"
                            >
                              <Key size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(admin)}
                              disabled={isActivating || isDeactivating}
                              title={admin.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                              className={`rounded-lg p-1.5 transition-colors disabled:opacity-50 ${
                                admin.status === 'ACTIVE' 
                                  ? 'text-amber-400 hover:bg-amber-50 hover:text-amber-600' 
                                  : 'text-emerald-400 hover:bg-emerald-50 hover:text-emerald-600'
                              }`}
                            >
                              <Power size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeactivateAdmin(admin.user_id)}
                              disabled={isDeactivating}
                              title="Remove Admin"
                              className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                           <span className="flex items-center gap-1"><Lock size={10} /> {admin.phone_number}</span>
                           {admin.email && <span className="flex items-center gap-1">@ {admin.email}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSaveAdmin} className="p-6">
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-neutral-700">First Name</label>
                    <input
                      autoFocus
                      required
                      type="text"
                      value={adminFormData.first_name}
                      onChange={(e) => setAdminFormData(prev => ({ ...prev, first_name: e.target.value }))}
                      className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-neutral-700">Last Name</label>
                    <input
                      required
                      type="text"
                      value={adminFormData.last_name}
                      onChange={(e) => setAdminFormData(prev => ({ ...prev, last_name: e.target.value }))}
                      className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-bold text-neutral-700">Phone Number</label>
                  <input
                    required
                    type="text"
                    placeholder="0911..."
                    value={adminFormData.phone_number}
                    onChange={(e) => setAdminFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="mb-6">
                  <label className="mb-1.5 block text-xs font-bold text-neutral-700">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={adminFormData.email}
                    onChange={(e) => setAdminFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setAdminModalState(prev => ({ ...prev, mode: 'list' }))}
                    className="rounded-xl px-5 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingAdmin || !adminFormData.first_name.trim() || !adminFormData.phone_number.trim()}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isCreatingAdmin ? 'Saving...' : 'Add Admin'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </AdminHierarchyPageShell>
  );
}
