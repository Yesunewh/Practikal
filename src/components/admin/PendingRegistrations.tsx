import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { User } from '../../types';
import {
  useGetPendingApplicantsQuery,
  useApproveApplicantMutation,
  useRejectApplicantMutation,
  useGetOrganizationsQuery,
  useGetDepartmentsQuery,
  useGetUnitTreeQuery,
  useGetRolesQuery,
} from '../../store/apiSlice/practikalApi';
import type { PendingApplicantRow } from '../../store/apiSlice/practikalApi';
import { Loader2, ClipboardCheck, X, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { interpolate } from '../../i18n/messages';

type UnitNode = {
  id: string;
  name: string;
  children?: UnitNode[];
  SubUnits?: UnitNode[];
};

function flattenUnits(nodes: UnitNode[], prefix = ''): { id: string; name: string }[] {
  let result: { id: string; name: string }[] = [];
  for (const node of nodes) {
    result.push({ id: node.id, name: `${prefix}${node.name}` });
    const kids = node.SubUnits || node.children;
    if (kids?.length) {
      result = result.concat(flattenUnits(kids, `${prefix}— `));
    }
  }
  return result;
}

interface PendingRegistrationsProps {
  currentUser: User;
}

export default function PendingRegistrations({ currentUser }: PendingRegistrationsProps) {
  const { messages } = useI18n();
  const p = messages.admin.pendingUsers;
  const isSuperAdmin = currentUser.role === 'superadmin' || currentUser.user_type === 'SUPERADMIN';
  const isDeptAdmin =
    currentUser.user_type === 'DEPT_ADMIN' ||
    (currentUser.role === 'admin' &&
      !!currentUser.deptId &&
      (currentUser.user_type == null || currentUser.user_type === ''));

  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{messages.admin.accessDeniedTitle}</h2>
        <p className="mt-2 max-w-md text-gray-500">
          This registration pool is only accessible to Platform Super Administrators. 
          Please contact your system admin if you believe this is an error.
        </p>
        <button
          onClick={() => window.history.back()}
          className="mt-6 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
          Go back
        </button>
      </div>
    );
  }

  const { data, isLoading, isError, refetch } = useGetPendingApplicantsQuery();
  const { data: orgsRes } = useGetOrganizationsQuery(undefined, { skip: !isSuperAdmin });

  const [approveTarget, setApproveTarget] = useState<PendingApplicantRow | null>(null);
  const [formOrgId, setFormOrgId] = useState('');
  const [formDeptId, setFormDeptId] = useState('');
  const [formUnitId, setFormUnitId] = useState('');
  const [formRoleId, setFormRoleId] = useState('');

  const orgIdForQueries = isSuperAdmin ? formOrgId : currentUser.orgId || '';

  const { data: deptsRes } = useGetDepartmentsQuery(orgIdForQueries, { skip: !orgIdForQueries });
  const { data: treeRes } = useGetUnitTreeQuery(orgIdForQueries, { skip: !orgIdForQueries });

  // For org admins / dept admins: roles scoped to their org
  const { data: rolesRes } = useGetRolesQuery(
    { orgId: orgIdForQueries, includeSystem: true },
    { skip: isSuperAdmin || !orgIdForQueries },
  );
  // For super admins: fetch system roles with no org filter
  const { data: superRolesRes } = useGetRolesQuery(
    { orgId: undefined, includeSystem: true },
    { skip: !isSuperAdmin },
  );

  const [approveApplicant, { isLoading: approving }] = useApproveApplicantMutation();
  const [rejectApplicant, { isLoading: isRejecting }] = useRejectApplicantMutation();

  const orgs = orgsRes?.orgs ?? [];
  const depts = deptsRes?.depts ?? [];
  const flatUnits = useMemo(
    () => flattenUnits((treeRes?.data ?? []) as UnitNode[]),
    [treeRes?.data],
  );
  // Super admin uses system roles; others use org-scoped roles
  const roles = isSuperAdmin ? (superRolesRes?.data ?? []) : (rolesRes?.data ?? []);
  // Super admin: only allow platform-level roles
  const filteredRoles = isSuperAdmin
    ? roles.filter((r: { name: string }) =>
        ['Super Admin', 'Organization Admin', 'Learner'].includes(r.name)
      )
    : roles;

  const users = data?.users ?? [];

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
  const paginatedUsers = users.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (!approveTarget) return;
    setFormOrgId(isSuperAdmin ? '' : currentUser.orgId || '');
    setFormDeptId(isDeptAdmin ? currentUser.deptId || '' : '');
    setFormUnitId('');
    setFormRoleId('');
  }, [approveTarget, isSuperAdmin, isDeptAdmin, currentUser.orgId, currentUser.deptId]);

  const handleReject = async (row: PendingApplicantRow) => {
    if (
      !confirm(
        interpolate(p.confirmReject, { first: row.first_name, last: row.last_name }),
      )
    ) {
      return;
    }
    try {
      await rejectApplicant(row.user_id).unwrap();
      toast.success(p.toastRegistrationRemoved);
      void refetch();
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'data' in e
          ? String((e as { data?: { message?: string } }).data?.message ?? '')
          : '';
      toast.error(msg || p.toastRejectError);
    }
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveTarget) return;

    if (isSuperAdmin) {
      // Platform-level approval: only role is required
      if (!formRoleId) {
        toast.error(p.toastSelectBranchRole);
        return;
      }
      try {
        await approveApplicant({
          userId: approveTarget.user_id,
          org_id: null,
          dept_id: undefined,
          unit_id: null,
          role_id: formRoleId,
        }).unwrap();
        toast.success(p.toastUserApproved);
        setApproveTarget(null);
        void refetch();
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'data' in err
            ? String((err as { data?: { message?: string } }).data?.message ?? '')
            : '';
        toast.error(msg || p.toastApproveError);
      }
      return;
    }

    if (!formUnitId || !formRoleId) {
      toast.error(p.toastSelectBranchRole);
      return;
    }
    try {
      await approveApplicant({
        userId: approveTarget.user_id,
        org_id: undefined,
        dept_id: formDeptId || undefined,
        unit_id: formUnitId,
        role_id: formRoleId,
      }).unwrap();
      toast.success(p.toastUserApproved);
      setApproveTarget(null);
      void refetch();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? String((err as { data?: { message?: string } }).data?.message ?? '')
          : '';
      toast.error(msg || p.toastApproveError);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20';

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-100/90 bg-gradient-to-br from-white via-white to-emerald-50/40 p-4 shadow-sm sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <ClipboardCheck size={20} strokeWidth={2} aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">{p.kicker}</p>
            <h2 className="text-lg font-bold text-gray-900 sm:text-xl">{p.title}</h2>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-gray-500">
            <Loader2 className="animate-spin" size={28} />
            <span className="text-sm">{messages.common.loading}</span>
          </div>
        )}
        {isError && (
          <div className="p-8 text-center text-sm text-rose-600">{p.loadError}</div>
        )}
        {!isLoading && !isError && users.length === 0 && (
          <div className="p-12 text-center text-sm text-gray-500">{p.empty}</div>
        )}
        {!isLoading && !isError && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/90 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 sm:px-6">{p.thName}</th>
                  <th className="whitespace-nowrap px-4 py-3 sm:px-6">{p.thPhone}</th>
                  <th className="whitespace-nowrap px-4 py-3 sm:px-6">{p.thEmail}</th>
                  <th className="whitespace-nowrap px-4 py-3 sm:px-6">{p.thRequested}</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right sm:px-6">{p.thActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedUsers.map((row) => (
                  <tr key={row.user_id} className="hover:bg-gray-50/60">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 sm:px-6">
                      {row.first_name} {row.last_name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-gray-800 sm:px-6">
                      {row.phone_number}
                    </td>
                    <td className="max-w-[14rem] truncate px-4 py-3 text-gray-600 sm:px-6">
                      {row.email?.trim() ? row.email : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600 sm:px-6">
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right sm:px-6">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setApproveTarget(row)}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          {p.approve}
                        </button>
                        <button
                          type="button"
                          disabled={isRejecting}
                          onClick={() => void handleReject(row)}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          {p.reject}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/80 px-4 py-3 sm:px-6">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium text-gray-900">{paginatedUsers.length}</span> of <span className="font-medium text-gray-900">{users.length}</span> pending users
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

      {approveTarget &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] overflow-y-auto overflow-x-hidden bg-slate-900/50 backdrop-blur-sm"
            role="presentation"
            onClick={() => !approving && setApproveTarget(null)}
          >
            <div className="flex min-h-[100dvh] items-center justify-center p-4 py-8 sm:p-6 sm:py-10 pointer-events-none">
              <div
                className="pointer-events-auto w-full max-w-md rounded-2xl border border-gray-200/90 bg-white shadow-2xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="approve-applicant-title"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-5">
                  <h3 id="approve-applicant-title" className="text-lg font-semibold text-gray-900">
                    {interpolate(p.modalTitle, { first: approveTarget.first_name, last: approveTarget.last_name })}
                  </h3>
                  <button
                    type="button"
                    disabled={approving}
                    onClick={() => setApproveTarget(null)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                    aria-label={p.closeModal}
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={(e) => void handleApproveSubmit(e)} className="space-y-4 p-4 sm:p-5">
                  {isSuperAdmin ? (
                    // ── Super admin: platform-level approval (no org/branch required) ──
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-600">{p.role}</label>
                        <select
                          required
                          className={inputClass}
                          value={formRoleId}
                          onChange={(e) => setFormRoleId(e.target.value)}
                        >
                          <option value="">{p.selectRole}</option>
                          {filteredRoles.map((r: { id: string; name: string; org_id?: string | null }) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  ) : (
                    // ── Org / dept admins: org-scoped approval ──
                    <>
                      {!isDeptAdmin && (
                        <p className="text-xs text-gray-500">{p.orgHintNonDept}</p>
                      )}
                      {isDeptAdmin && (
                        <p className="text-xs text-gray-600">{p.deptAdminHint}</p>
                      )}
                      {!isDeptAdmin && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-gray-600">{p.departmentOptional}</label>
                          <select
                            className={inputClass}
                            value={formDeptId}
                            onChange={(e) => setFormDeptId(e.target.value)}
                            disabled={!orgIdForQueries}
                          >
                            <option value="">{p.none}</option>
                            {depts.map((d: { id: string; name: string }) => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-600">{p.branchUnit}</label>
                        <select
                          required
                          className={inputClass}
                          value={formUnitId}
                          onChange={(e) => setFormUnitId(e.target.value)}
                          disabled={!orgIdForQueries}
                        >
                          <option value="">{p.selectBranch}</option>
                          {flatUnits.map((u) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-600">{p.role}</label>
                        <select
                          required
                          className={inputClass}
                          value={formRoleId}
                          onChange={(e) => setFormRoleId(e.target.value)}
                          disabled={!orgIdForQueries}
                        >
                          <option value="">{p.selectRole}</option>
                          {filteredRoles.map((r: { id: string; name: string; org_id?: string | null }) => (
                            <option key={r.id} value={r.id}>
                              {r.name}{r.org_id ? p.roleCustom : p.roleSystem}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      disabled={approving}
                      onClick={() => setApproveTarget(null)}
                      className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {p.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={approving || !formRoleId}
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {approving ? p.approveSaving : p.approveSubmit}
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
