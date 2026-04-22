import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { User, Assignment } from '../../types';
import { Calendar, Plus, Trash2, Loader2 } from 'lucide-react';
import { useGamificationApi } from '../../config/gamification';
import {
  useGetOrganizationsQuery,
  useGetGamificationTrainingAssignmentsAdminQuery,
  useCreateGamificationTrainingAssignmentMutation,
  useDeleteGamificationTrainingAssignmentMutation,
} from '../../store/apiSlice/practikalApi';

interface CampaignAssignmentsProps {
  currentUser: User;
}

function canUseAssignmentApi(user: User): boolean {
  return user.user_type === 'SUPERADMIN' || user.user_type === 'ORG_ADMIN';
}

/** Backend: passing attempt by due date, same threshold as challenges (70%+). */
function formatCompletionSummary(a: Assignment): string {
  const done = a.completedCount ?? 0;
  if (a.userId !== 'all') {
    return done >= 1 ? 'Completed' : 'Not completed';
  }
  if (a.audienceTotal != null && a.audienceTotal > 0) {
    const pct = a.completionPercent ?? Math.round((done / a.audienceTotal) * 100);
    return `${done} / ${a.audienceTotal} (${pct}%)`;
  }
  if (done > 0) {
    return `${done} learner(s) completed (platform-wide)`;
  }
  return '—';
}

export default function CampaignAssignments({ currentUser }: CampaignAssignmentsProps) {
  const challenges = useSelector((state: { challenges: { challenges: { id: string; title: string }[] } }) => state.challenges.challenges);
  const apiEnabled = useGamificationApi && canUseAssignmentApi(currentUser);

  const isSuperAdmin = currentUser.user_type === 'SUPERADMIN';
  const orgIdLocked = currentUser.orgId || '';

  const { data: orgsRes } = useGetOrganizationsQuery(undefined, { skip: !apiEnabled || !isSuperAdmin });
  const orgs = orgsRes?.orgs ?? [];

  const [listOrgFilter, setListOrgFilter] = useState('');
  const listQueryArg = useMemo(() => {
    if (!isSuperAdmin) return {};
    if (listOrgFilter.trim()) return { org_id: listOrgFilter.trim() };
    return {};
  }, [isSuperAdmin, listOrgFilter]);

  const {
    data: adminListRes,
    isFetching: listLoading,
    isError: listError,
    refetch: refetchList,
  } = useGetGamificationTrainingAssignmentsAdminQuery(listQueryArg, {
    skip: !apiEnabled,
  });

  const adminAssignments = useMemo(
    () => (Array.isArray(adminListRes?.assignments) ? (adminListRes.assignments as Assignment[]) : []),
    [adminListRes?.assignments],
  );

  const [createTitle, setCreateTitle] = useState('');
  const [challengeId, setChallengeId] = useState(challenges[0]?.id ?? '');
  const [dueDate, setDueDate] = useState(() => new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [createOrgScope, setCreateOrgScope] = useState('');

  const [createAssignment, { isLoading: creating }] = useCreateGamificationTrainingAssignmentMutation();
  const [deleteAssignment, { isLoading: isDeleting }] = useDeleteGamificationTrainingAssignmentMutation();

  useEffect(() => {
    if (challenges.length && !challengeId) {
      setChallengeId(challenges[0].id);
    }
  }, [challenges, challengeId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) {
      toast.error('Enter a title for this assignment.');
      return;
    }
    if (!challengeId) {
      toast.error('Select a challenge (load challenges from the catalog first).');
      return;
    }
    try {
      await createAssignment({
        challenge_id: challengeId,
        title: createTitle.trim(),
        due_date: dueDate,
        assign_all: true,
        org_id: isSuperAdmin ? (createOrgScope.trim() || null) : null,
      }).unwrap();
      toast.success('Training assignment created.');
      setCreateTitle('');
      void refetchList();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? String((err as { data?: { message?: string } }).data?.message ?? '')
          : '';
      toast.error(msg || 'Could not create assignment.');
    }
  };

  const handleDelete = async (row: Assignment) => {
    if (!confirm(`Remove assignment “${row.title}”?`)) return;
    try {
      await deleteAssignment(row.id).unwrap();
      toast.success('Assignment removed.');
      void refetchList();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? String((err as { data?: { message?: string } }).data?.message ?? '')
          : '';
      toast.error(msg || 'Could not delete assignment.');
    }
  };

  if (!useGamificationApi) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
        <p className="font-semibold">Gamification API is off</p>
        <p className="mt-1">
          Training assignments are stored in the database when the API is enabled. Set{' '}
          <code className="rounded bg-white px-1">VITE_USE_GAMIFICATION_API</code> (default on) and ensure the backend is
          reachable.
        </p>
      </div>
    );
  }

  if (!canUseAssignmentApi(currentUser)) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-700 shadow-sm">
        <p className="font-semibold text-neutral-900">Training assignments</p>
        <p className="mt-2">
          Creating and listing organization training assignments requires a <strong>Superadmin</strong> or{' '}
          <strong>Organization admin</strong> account. The backend only allows these roles to call the assignment API.
        </p>
        {currentUser.permissions?.includes('MANAGE_CAMPAIGNS') && (
          <p className="mt-2 text-neutral-500">
            Your role includes campaign permission, but assignment management is limited to Superadmin / Org admin.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-4 text-sm text-emerald-950">
        <strong>Database-backed assignments.</strong> Rows are stored in <code className="text-xs">LearnerTrainingAssignments</code>.
        Learners see them via <code className="text-xs">GET /gamification/assignments/me</code>. This page uses{' '}
        <code className="text-xs">POST</code>, <code className="text-xs">GET /gamification/assignments</code>, and{' '}
        <code className="text-xs">DELETE /gamification/assignments/:id</code>.
        <p className="mt-2 text-emerald-900/90">
          <strong>Completion</strong> shows how many users finished the linked challenge with a passing score on or before the
          due date, vs active users in the org (org-wide) or a single assignee.
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">New assignment</h2>
        <form onSubmit={(e) => void handleCreate(e)} className="max-w-2xl space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Title</label>
            <input
              className="w-full rounded-lg border border-neutral-200 px-3 py-2"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Challenge</label>
            <select
              className="w-full rounded-lg border border-neutral-200 px-3 py-2"
              value={challengeId}
              onChange={(e) => setChallengeId(e.target.value)}
              disabled={challenges.length === 0}
            >
              {challenges.length === 0 ? <option value="">No challenges loaded</option> : null}
              {challenges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            {challenges.length === 0 && (
              <p className="mt-1 text-xs text-amber-800">Open Learning challenges so the catalog loads from the API.</p>
            )}
          </div>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="mb-1 flex items-center gap-1 text-sm font-medium text-neutral-700">
                <Calendar size={14} /> Due date
              </label>
              <input
                type="date"
                className="rounded-lg border border-neutral-200 px-3 py-2"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
            {isSuperAdmin && (
              <div className="min-w-[220px] flex-1">
                <label className="mb-1 block text-sm font-medium text-neutral-700">Organization scope</label>
                <select
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2"
                  value={createOrgScope}
                  onChange={(e) => setCreateOrgScope(e.target.value)}
                >
                  <option value="">Platform-wide (all tenants)</option>
                  {orgs.map((o: { id: string; name: string }) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-neutral-500">Org-wide assignment applies to all learners in that tenant.</p>
              </div>
            )}
          </div>
          {!isSuperAdmin && orgIdLocked && (
            <p className="text-sm text-neutral-600">
              Assignments will apply to <strong>your organization</strong> ({currentUser.organization || orgIdLocked.slice(0, 8) + '…'}).
            </p>
          )}
          <button
            type="submit"
            disabled={creating || challenges.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {creating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
            Create assignment
          </button>
        </form>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-neutral-900">Active assignments</h2>
          {isSuperAdmin && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-600">Filter list by organization</label>
              <select
                className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                value={listOrgFilter}
                onChange={(e) => setListOrgFilter(e.target.value)}
              >
                <option value="">All organizations</option>
                {orgs.map((o: { id: string; name: string }) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        {listError && (
          <p className="text-sm text-red-600">Could not load assignments. Check permissions and try again.</p>
        )}
        {listLoading && !adminAssignments.length && (
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Loader2 className="animate-spin" size={18} /> Loading…
          </div>
        )}
        {!listLoading && !listError && adminAssignments.length === 0 && (
          <p className="text-sm text-neutral-500">No assignments yet.</p>
        )}
        {adminAssignments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  <th className="py-2 pr-3">Title</th>
                  <th className="py-2 pr-3">Due</th>
                  <th className="py-2 pr-3">Audience</th>
                  <th className="py-2 pr-3">Completion</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {adminAssignments.map((a) => (
                  <tr key={a.id}>
                    <td className="py-3 pr-3 font-medium text-neutral-900">{a.title}</td>
                    <td className="py-3 pr-3 whitespace-nowrap text-neutral-600">{a.dueDate}</td>
                    <td className="py-3 pr-3 text-neutral-600">
                      {a.userId === 'all' ? 'Everyone in scope' : `User ${a.userId.slice(0, 8)}…`}
                    </td>
                    <td className="py-3 pr-3 text-neutral-800">{formatCompletionSummary(a)}</td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void handleDelete(a)}
                        disabled={isDeleting}
                        className="inline-flex p-2 text-red-600 hover:text-red-800 disabled:opacity-50"
                        aria-label="Remove assignment"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-neutral-400">Signed in as {currentUser.email}</p>
    </div>
  );
}
