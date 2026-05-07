import { useEffect, useMemo, useState } from 'react';
import {
  useGetRolesQuery,
  useGetAvailablePermissionsQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useGetOrganizationsQuery,
  type AvailablePermissionRow,
} from '../../store/apiSlice/practikalApi';
import { Eye, Lock, Pencil, Plus, Shield } from 'lucide-react';
import { User } from '../../types';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n/I18nContext';
import { interpolate } from '../../i18n/messages';
import {
  baselineRoleSortKey,
  isBaselineSystemRole,
} from '../../constants/systemBaselineRoles';

interface RoleManagementProps {
  currentUser: User;
}

type RoleRow = {
  id: string;
  name: string;
  description?: string | null;
  org_id?: string | null;
  Permissions?: { id: string; name?: string }[];
};

type PermissionRow = AvailablePermissionRow;

export default function RoleManagement({ currentUser }: RoleManagementProps) {
  const { messages } = useI18n();
  const r = messages.admin.roles;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRow | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [tenantOrgId, setTenantOrgId] = useState('');
  const [permissionsViewRole, setPermissionsViewRole] = useState<RoleRow | null>(null);

  const isSuperAdmin = currentUser.user_type === 'SUPERADMIN' || currentUser.role === 'superadmin';
  /** Ensure RTK/query passes org_id when profile uses number/string from JWT */
  const orgFromProfileRaw = currentUser.orgId as string | number | undefined | null;
  const orgFromProfile =
    orgFromProfileRaw !== undefined &&
    orgFromProfileRaw !== null &&
    String(orgFromProfileRaw).trim() !== ''
      ? String(orgFromProfileRaw)
      : undefined;
  const orgIdForScope = orgFromProfile ?? (tenantOrgId || undefined);

  const { data: orgsResponse } = useGetOrganizationsQuery(undefined, {
    skip: !isSuperAdmin || !!orgFromProfile,
  });
  const orgList = (orgsResponse?.orgs ?? []) as { id: string; name?: string }[];

  const { data: rolesResponse, isLoading: rolesLoading, refetch } = useGetRolesQuery({
    orgId: orgIdForScope,
    includeSystem: true,
  });
  const { data: permissionsResponse, isLoading: permsLoading } = useGetAvailablePermissionsQuery(orgIdForScope);
  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const isSaving = isCreating || isUpdating;

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
    setRoleName('');
    setRoleDescription('');
    setSelectedPermissions([]);
  };

  const openCreateModal = () => {
    setPermissionsViewRole(null);
    setEditingRole(null);
    setRoleName('');
    setRoleDescription('');
    setSelectedPermissions([]);
    setIsModalOpen(true);
  };

  const openEditModal = (role: RoleRow) => {
    if (!role.org_id && !isSuperAdmin) return;
    setPermissionsViewRole(null);
    setEditingRole(role);
    setRoleName(String(role.name ?? ''));
    setRoleDescription(String(role.description ?? ''));
    setSelectedPermissions((role.Permissions ?? []).map((p) => String(p.id)));
    setIsModalOpen(true);
  };

  const isEditingSystemBaseline = !!(editingRole && !editingRole.org_id);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRole) {
        const rid = String(editingRole.id);
        const bodyOrg =
          isSuperAdmin && !orgFromProfile
            ? String(editingRole.org_id ?? tenantOrgId ?? '')
            : undefined;
        await updateRole({
          id: rid,
          name: roleName.trim(),
          description: roleDescription.trim(),
          permissionIds: selectedPermissions,
          ...(bodyOrg ? { org_id: bodyOrg } : {}),
        }).unwrap();
        toast.success(r.toastUpdateSuccess);
      } else {
        await createRole({
          name: roleName,
          description: roleDescription,
          org_id: (isSuperAdmin && !orgFromProfile) ? null : orgIdForScope,
          permissionIds: selectedPermissions,
        }).unwrap();
      }
      closeModal();
      refetch();
    } catch (err: unknown) {
      console.error(err);
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? String((err as { data?: { message?: string } }).data?.message ?? '')
          : '';
      toast.error(msg || (editingRole ? r.toastUpdateFailed : r.toastCreateFailed));
    }
  };

  const permissionsPayload = permissionsResponse?.data;

  /** Platform-only picks; omit from tenant custom role modal (Org Admin etc.). Still show when Super Admin edits system baselines. */
  const isSystemBaselineEditModal = Boolean(editingRole && !editingRole.org_id);
  const modalPermissionList = useMemo(() => {
    const list = (permissionsPayload ?? []) as PermissionRow[];
    if (!list.length || isSystemBaselineEditModal) return list;
    return list.filter(
      (p) => p.name !== 'MANAGE_TENANTS' && p.name !== 'MANAGE_SYSTEM'
    );
  }, [permissionsPayload, isSystemBaselineEditModal]);

  const togglePermission = (id: string) => {
    const sid = String(id);
    const row = modalPermissionList.find((p) => String(p.id) === sid);
    if (!isSuperAdmin && row?.matrix_locked_for_editor && row?.has_access) {
      return;
    }
    setSelectedPermissions((prev) =>
      prev.includes(sid) ? prev.filter((p) => p !== sid) : [...prev, sid]
    );
  };

  /** Keep matrix-locked preview permissions selected for Org/Branch/Dept editors (SUPERADMIN can clear freely). */
  useEffect(() => {
    if (!isModalOpen || isSuperAdmin || !modalPermissionList.length) return;
    const lockedIds = modalPermissionList
      .filter((p) => p.matrix_locked_for_editor && p.has_access)
      .map((p) => String(p.id));
    if (lockedIds.length === 0) return;
    setSelectedPermissions((prev) => [...new Set([...prev, ...lockedIds])]);
  }, [isModalOpen, isSuperAdmin, modalPermissionList]);

  const rolesRaw = rolesResponse?.data || [];
  const sortedRoles = useMemo(() => {
    const list = [...rolesRaw] as RoleRow[];
    list.sort((a, b) => {
      const d = baselineRoleSortKey(String(a.name ?? '')) - baselineRoleSortKey(String(b.name ?? ''));
      if (d !== 0) return d;
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
    return list;
  }, [rolesRaw]);

  const sortedPermissionsForViewer = useMemo(() => {
    const plist = permissionsViewRole?.Permissions ?? [];
    if (!plist.length) return [];
    return [...plist].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  }, [permissionsViewRole]);

  const closePermissionsViewer = () => setPermissionsViewRole(null);

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{r.title}</h2>
        </div>
        {/* Organization dropdown removed for Super Admins so they only manage platform-level roles */}
        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          <Plus size={18} />
          {r.createCustomRole}
        </button>
      </div>

      <div className="p-6 overflow-x-auto min-h-[300px]">
        {rolesLoading ? (
          <div className="text-center py-10 text-gray-500">{r.loadingRoles}</div>
        ) : sortedRoles.length === 0 ? (
          <div className="text-center py-10 text-gray-500">{r.emptyRoles}</div>
        ) : (
          <table className="w-full text-left">
             <thead className="bg-gray-50 border-y">
               <tr>
                 <th className="px-4 py-3 text-sm font-semibold text-gray-600">{r.thRoleName}</th>
                 <th className="px-4 py-3 text-sm font-semibold text-gray-600">{r.thScope}</th>
                 <th className="px-4 py-3 text-sm font-semibold text-gray-600">{r.thPermissions}</th>
                 <th className="px-4 py-3 text-sm font-semibold text-gray-600 whitespace-nowrap">{r.thActions}</th>
               </tr>
             </thead>
             <tbody className="divide-y text-sm text-gray-800">
               {sortedRoles.map((role: RoleRow) => (
                 <tr key={role.id}>
                    <td className="px-4 py-3 font-medium">
                      <div className="flex flex-nowrap items-center gap-2 min-w-0 max-w-md">
                        <Shield
                          size={16}
                          className={`flex-shrink-0 ${
                            !role.org_id && isBaselineSystemRole(String(role.name))
                              ? 'text-indigo-500'
                              : role.org_id
                                ? 'text-emerald-500'
                                : 'text-gray-400'
                          }`}
                        />
                        <span className="whitespace-nowrap">{role.name}</span>
                        {!role.org_id && isBaselineSystemRole(String(role.name)) && (
                          <span className="flex-shrink-0 rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-900">
                            {r.badgeBaseline ?? 'Baseline'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                        {role.org_id ? <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-semibold tracking-wide">{r.scopeCustom}</span> : <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold tracking-wide">{r.scopeSystem}</span>}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span className="text-sm text-gray-700 tabular-nums">
                        {interpolate(r.permissionsCount, { n: role.Permissions?.length ?? 0 })}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle whitespace-nowrap">
                      <div className="flex flex-nowrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPermissionsViewRole(role)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                        >
                          <Eye size={14} aria-hidden />
                          {r.viewPermissions}
                        </button>
                        {role.org_id || isSuperAdmin ? (
                          <button
                            type="button"
                            onClick={() => openEditModal(role)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40"
                          >
                            <Pencil size={14} aria-hidden />
                            {r.editRole}
                          </button>
                        ) : null}
                      </div>
                    </td>
                 </tr>
               ))}
             </tbody>
          </table>
        )}
      </div>

      {/* Role Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b bg-gray-50">
                 <h2 className="text-xl font-bold text-gray-800">
                   {editingRole
                     ? isEditingSystemBaseline
                       ? (r.modalTitleBaselineEdit ?? r.modalTitleEdit)
                       : r.modalTitleEdit
                     : r.modalTitle}
                 </h2>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                 <form id="roleForm" onSubmit={handleSave} className="space-y-6">
                    {isEditingSystemBaseline && (
                      <p className="text-sm text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        {r.hintBaselineLockedName}
                      </p>
                    )}
                    {/* Tenant hint removed for Super Admin as requested */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{r.labelRoleName}</label>
                          <input
                            required={!isEditingSystemBaseline}
                            readOnly={isEditingSystemBaseline}
                            type="text"
                            value={roleName}
                            onChange={(e) => setRoleName(e.target.value)}
                            className={`w-full border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2.5 bg-gray-50 border ${isEditingSystemBaseline ? 'cursor-not-allowed bg-gray-100 text-gray-700' : ''}`}
                            placeholder={r.placeholderRoleName}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{r.labelDescriptionOptional}</label>
                          <input type="text" value={roleDescription} onChange={e => setRoleDescription(e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2.5 bg-gray-50 border" placeholder={r.placeholderDescription} />
                      </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-end border-b pb-2 mb-4 mt-6">
                           <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">{r.availablePermissions}</h3>
                           <span className="text-xs text-gray-500">{interpolate(r.selectedCount, { n: selectedPermissions.length })}</span>
                        </div>
                        {permsLoading ? <div className="py-6 text-center text-sm text-gray-500 animate-pulse">{r.loadingPermissions}</div> : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {modalPermissionList.map((p: PermissionRow) => {
                                  const lockedMatrix =
                                    !isSuperAdmin && !!(p.matrix_locked_for_editor && p.has_access);
                                  const chkDisabled = !p.has_access || lockedMatrix;
                                  const titleTxt = !p.has_access
                                    ? r.permLockedTitle
                                    : lockedMatrix
                                      ? (r.matrixLockedPreview ??
                                        'Required preview permissions per matrix — cannot unset.')
                                      : r.permAssignTitle;
                                  return (
                                    <label key={p.id} className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${!p.has_access ? 'bg-gray-100 border-gray-200 opacity-60' : selectedPermissions.includes(String(p.id)) ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300' : 'cursor-pointer hover:bg-gray-50 border-gray-300'}`}>
                                        <input 
                                           title={titleTxt}
                                           type="checkbox" 
                                           disabled={chkDisabled}
                                           checked={selectedPermissions.includes(String(p.id))}
                                           onChange={() => togglePermission(String(p.id))}
                                           className={`mt-1 flex-shrink-0 h-4 w-4 rounded ${chkDisabled ? 'text-gray-300' : 'text-emerald-600 focus:ring-emerald-500'}`}
                                        />
                                        <div className="flex-1">
                                           <div className="text-sm font-medium text-gray-900 flex justify-between items-center pr-2">
                                              {p.name}
                                              {(!p.has_access || lockedMatrix) && (
                                                <Lock size={14} className="text-gray-500" title={lockedMatrix ? titleTxt : r.lockedByAdmin} />
                                              )}
                                           </div>
                                           <p className="text-xs text-gray-500 mt-1 leading-snug">{p.description || r.systemPermissionFallback}</p>
                                        </div>
                                    </label>
                                  );
                                })}
                            </div>
                        )}
                    </div>
                 </form>
              </div>
              <div className="px-6 py-4 border-t bg-white flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                 <button type="button" onClick={closeModal} className="px-5 py-2.5 font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">{r.cancel}</button>
                 <button
                    type="submit"
                    form="roleForm"
                    disabled={
                      isSaving ||
                      !roleName.trim() ||
                      (!editingRole && selectedPermissions.length === 0)
                    }
                    className="px-5 py-2.5 font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  >
                    {isSaving ? r.saving : editingRole ? r.saveRole : r.constructRole}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Read-only permission list */}
      {permissionsViewRole && (
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center bg-black/60 p-4"
          onClick={() => closePermissionsViewer()}
          role="presentation"
        >
          <div
            role="dialog"
            aria-labelledby="permissions-viewer-title"
            aria-modal="true"
            className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Escape') closePermissionsViewer();
            }}
          >
            <div className="border-b bg-gray-50 px-5 py-4">
              <h2 id="permissions-viewer-title" className="text-lg font-semibold text-gray-900">
                {r.permissionsModalTitle}
              </h2>
              <p className="mt-1 text-sm font-medium text-emerald-800">{permissionsViewRole.name}</p>
              <p className="mt-2 text-xs text-gray-500">
                {interpolate(r.permissionsCount, { n: permissionsViewRole.Permissions?.length ?? 0 })}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {permissionsViewRole.description?.trim() ? (
                <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    {r.thDescription}
                  </p>
                  <p className="text-sm leading-relaxed text-slate-800">{permissionsViewRole.description.trim()}</p>
                </div>
              ) : null}
              {sortedPermissionsForViewer.length ? (
                <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {sortedPermissionsForViewer.map((p) => (
                    <li key={p.id}>
                      <code className="block rounded-md border border-gray-100 bg-gray-50 px-2.5 py-1.5 font-mono text-[11px] leading-snug text-gray-900">
                        {p.name || p.id}
                      </code>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-sm text-gray-400 py-8">{r.permissionsNone}</p>
              )}
            </div>
            <div className="border-t bg-white px-5 py-3 flex justify-end">
              <button
                type="button"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                onClick={() => closePermissionsViewer()}
              >
                {r.permissionsModalClose}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
