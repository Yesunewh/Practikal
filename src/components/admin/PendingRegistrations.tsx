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
import { Loader2, ClipboardCheck, X } from 'lucide-react';

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
  const isSuperAdmin = currentUser.role === 'superadmin';
  const isDeptAdmin =
    currentUser.user_type === 'DEPT_ADMIN' ||
    (currentUser.role === 'admin' &&
      !!currentUser.deptId &&
      (currentUser.user_type == null || currentUser.user_type === ''));

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
  const { data: rolesRes } = useGetRolesQuery(
    { orgId: orgIdForQueries, includeSystem: true },
    { skip: !orgIdForQueries },
  );

  const [approveApplicant, { isLoading: approving }] = useApproveApplicantMutation();
  const [rejectApplicant, { isLoading: rejectingId }] = useRejectApplicantMutation();

  const orgs = orgsRes?.orgs ?? [];
  const depts = deptsRes?.depts ?? [];
  const flatUnits = useMemo(
    () => flattenUnits((treeRes?.data ?? []) as UnitNode[]),
    [treeRes?.data],
  );
  const roles = rolesRes?.data ?? [];

  const users = data?.users ?? [];

  useEffect(() => {
    if (!approveTarget) return;
    setFormOrgId(isSuperAdmin ? '' : currentUser.orgId || '');
    setFormDeptId(isDeptAdmin ? currentUser.deptId || '' : '');
    setFormUnitId('');
    setFormRoleId('');
  }, [approveTarget, isSuperAdmin, isDeptAdmin, currentUser.orgId, currentUser.deptId]);

  const handleReject = async (row: PendingApplicantRow) => {
    if (!confirm(`Remove registration for ${row.first_name} ${row.last_name}? They will need to register again.`)) {
      return;
    }
    try {
      await rejectApplicant(row.user_id).unwrap();
      toast.success('Registration removed');
      void refetch();
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'data' in e
          ? String((e as { data?: { message?: string } }).data?.message ?? '')
          : '';
      toast.error(msg || 'Could not reject');
    }
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveTarget) return;
    if (isSuperAdmin && !formOrgId) {
      toast.error('Select an organization');
      return;
    }
    if (!formUnitId || !formRoleId) {
      toast.error('Select branch and role');
      return;
    }
    try {
      await approveApplicant({
        userId: approveTarget.user_id,
        org_id: isSuperAdmin ? formOrgId : undefined,
        dept_id: formDeptId || undefined,
        unit_id: formUnitId,
        role_id: formRoleId,
      }).unwrap();
      toast.success('User approved and assigned');
      setApproveTarget(null);
      void refetch();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? String((err as { data?: { message?: string } }).data?.message ?? '')
          : '';
      toast.error(msg || 'Could not approve');
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
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Personnel</p>
            <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Pending registrations</h2>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-gray-500">
            <Loader2 className="animate-spin" size={28} />
            <span className="text-sm">Loading…</span>
          </div>
        )}
        {isError && (
          <div className="p-8 text-center text-sm text-rose-600">Could not load pending registrations.</div>
        )}
        {!isLoading && !isError && users.length === 0 && (
          <div className="p-12 text-center text-sm text-gray-500">No pending registrations.</div>
        )}
        {!isLoading && !isError && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/90 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 sm:px-6">Name</th>
                  <th className="whitespace-nowrap px-4 py-3 sm:px-6">Phone</th>
                  <th className="whitespace-nowrap px-4 py-3 sm:px-6">Email</th>
                  <th className="whitespace-nowrap px-4 py-3 sm:px-6">Requested</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right sm:px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((row) => (
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
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={isRejecting}
                          onClick={() => void handleReject(row)}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
                    Approve {approveTarget.first_name} {approveTarget.last_name}
                  </h3>
                  <button
                    type="button"
                    disabled={approving}
                    onClick={() => setApproveTarget(null)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={(e) => void handleApproveSubmit(e)} className="space-y-4 p-4 sm:p-5">
                  {isSuperAdmin && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">Organization</label>
                      <select
                        required
                        className={inputClass}
                        value={formOrgId}
                        onChange={(e) => {
                          setFormOrgId(e.target.value);
                          setFormDeptId('');
                          setFormUnitId('');
                          setFormRoleId('');
                        }}
                      >
                        <option value="">Select organization…</option>
                        {orgs.map((o: { id: string; name: string }) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {!isDeptAdmin && !isSuperAdmin && (
                    <p className="text-xs text-gray-500">Users will be added to your organization.</p>
                  )}

                  {isDeptAdmin && (
                    <p className="text-xs text-gray-600">
                      Department is set to your department. Choose branch and role.
                    </p>
                  )}

                  {!isDeptAdmin && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">Department (optional)</label>
                      <select
                        className={inputClass}
                        value={formDeptId}
                        onChange={(e) => setFormDeptId(e.target.value)}
                        disabled={!orgIdForQueries}
                      >
                        <option value="">None</option>
                        {depts.map((d: { id: string; name: string }) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600">Branch / unit</label>
                    <select
                      required
                      className={inputClass}
                      value={formUnitId}
                      onChange={(e) => setFormUnitId(e.target.value)}
                      disabled={!orgIdForQueries}
                    >
                      <option value="">Select branch…</option>
                      {flatUnits.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600">Role</label>
                    <select
                      required
                      className={inputClass}
                      value={formRoleId}
                      onChange={(e) => setFormRoleId(e.target.value)}
                      disabled={!orgIdForQueries}
                    >
                      <option value="">Select role…</option>
                      {roles.map((r: { id: string; name: string; org_id?: string | null }) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                          {r.org_id ? ' (custom)' : ' (system)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      disabled={approving}
                      onClick={() => setApproveTarget(null)}
                      className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={approving || (isSuperAdmin && !formOrgId) || !orgIdForQueries}
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {approving ? 'Saving…' : 'Approve & assign'}
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
