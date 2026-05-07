import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n/I18nContext';
import { interpolate, type Messages } from '../../i18n/messages';
import { User, Assignment } from '../../types';
import { Calendar, Plus, Trash2, Loader2 } from 'lucide-react';
import { useGamificationApi } from '../../config/gamification';
import {
  useGetOrganizationsQuery,
  useGetGamificationTrainingAssignmentsAdminQuery,
  useCreateGamificationTrainingAssignmentMutation,
  useDeleteGamificationTrainingAssignmentMutation,
  useGetDepartmentsQuery,
  useGetUnitTreeQuery,
} from '../../store/apiSlice/practikalApi';

interface CampaignAssignmentsProps {
  currentUser: User;
}

function canUseAssignmentApi(user: User): boolean {
  return ['SUPERADMIN', 'ORG_ADMIN', 'DEPT_ADMIN', 'UNIT_ADMIN'].includes(user.user_type || '');
}

/** Backend: passing attempt by due date, same threshold as challenges (70%+). */
function formatCompletionSummary(
  a: Assignment,
  c: Messages['admin']['campaigns'],
): string {
  const done = a.completedCount ?? 0;
  if (a.userId !== 'all') {
    return done >= 1 ? c.completionCompleted : c.completionNotCompleted;
  }
  if (a.audienceTotal != null && a.audienceTotal > 0) {
    const pct = a.completionPercent ?? Math.round((done / a.audienceTotal) * 100);
    return interpolate(c.completionRatio, { done, total: a.audienceTotal, pct });
  }
  if (done > 0) {
    return interpolate(c.completionLearnersWide, { done });
  }
  return c.emDash;
}

export default function CampaignAssignments({ currentUser }: CampaignAssignmentsProps) {
  const { messages } = useI18n();
  const c = messages.admin.campaigns;
  const challenges = useSelector((state: { challenges: { challenges: { id: string; title: string }[] } }) => state.challenges.challenges);
  const apiEnabled = useGamificationApi && canUseAssignmentApi(currentUser);

  const isSuperAdmin = currentUser.user_type === 'SUPERADMIN';
  const orgIdLocked = currentUser.orgId || '';

  const { data: orgsRes } = useGetOrganizationsQuery(undefined, { skip: !apiEnabled || !isSuperAdmin });
  const orgs = orgsRes?.orgs ?? [];

  const [listOrgFilter, setListOrgFilter] = useState(currentUser.orgId || '');
  const [listDeptFilter, setListDeptFilter] = useState(currentUser.deptId || '');
  const [listUnitFilter, setListUnitFilter] = useState(currentUser.unitId || '');

  const listQueryArg = useMemo(() => {
    const arg: any = {};
    if (listOrgFilter.trim()) arg.org_id = listOrgFilter.trim();
    if (listDeptFilter.trim()) arg.dept_id = listDeptFilter.trim();
    if (listUnitFilter.trim()) arg.unit_id = listUnitFilter.trim();
    return arg;
  }, [listOrgFilter, listDeptFilter, listUnitFilter]);

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
  const [campaignType, setCampaignType] = useState<'one_time' | 'triggered' | null>('one_time');
  const [triggerType, setTriggerType] = useState<'new_hire' | 'group_rule' | 'failed_simulation'>('new_hire');

  const [createAssignment, { isLoading: creating }] = useCreateGamificationTrainingAssignmentMutation();
  const [deleteAssignment, { isLoading: isDeleting }] = useDeleteGamificationTrainingAssignmentMutation();

  const { data: deptsRes } = useGetDepartmentsQuery(listOrgFilter || currentUser.orgId || '', {
    skip: !apiEnabled || !(listOrgFilter || currentUser.orgId),
  });
  const departments = deptsRes?.depts ?? [];

  const { data: unitTreeData } = useGetUnitTreeQuery(listOrgFilter || currentUser.orgId || '', {
    skip: !apiEnabled || !(listOrgFilter || currentUser.orgId),
  });

  const flattenUnits = (nodes: any[]): any[] => {
    let result: any[] = [];
    if (!nodes) return result;
    nodes.forEach(node => {
      result.push({ id: node.id, name: node.name });
      if (node.children) result = result.concat(flattenUnits(node.children));
    });
    return result;
  };
  const units = useMemo(() => flattenUnits(unitTreeData?.tree ?? []), [unitTreeData]);

  const [createOrgScope, setCreateOrgScope] = useState(currentUser.orgId || '');
  const [createDeptScope, setCreateDeptScope] = useState(currentUser.deptId || '');
  const [createUnitScope, setCreateUnitScope] = useState(currentUser.unitId || '');

  useEffect(() => {
    if (challenges.length && !challengeId) {
      setChallengeId(challenges[0].id);
    }
  }, [challenges, challengeId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignType) {
      toast.error(c.toastPickCampaignType);
      return;
    }
    if (campaignType === 'triggered') {
      toast.error(c.toastTriggeredNotReady);
      return;
    }
    if (!createTitle.trim()) {
      toast.error(c.toastEnterTitle);
      return;
    }
    if (!challengeId) {
      toast.error(c.toastSelectChallenge);
      return;
    }
    try {
      await createAssignment({
        challenge_id: challengeId,
        title: createTitle.trim(),
        due_date: dueDate,
        assign_all: true,
        org_id: createOrgScope.trim() || null,
        dept_id: createDeptScope.trim() || null,
        unit_id: createUnitScope.trim() || null,
      }).unwrap();
      toast.success(c.toastCreated);
      setCreateTitle('');
      void refetchList();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? String((err as { data?: { message?: string } }).data?.message ?? '')
          : '';
      toast.error(msg || c.toastCreateError);
    }
  };

  const handleDelete = async (row: Assignment) => {
    if (!confirm(interpolate(c.confirmDelete, { title: row.title }))) return;
    try {
      await deleteAssignment(row.id).unwrap();
      toast.success(c.toastRemoved);
      void refetchList();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? String((err as { data?: { message?: string } }).data?.message ?? '')
          : '';
      toast.error(msg || c.toastDeleteError);
    }
  };

  if (!useGamificationApi) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
        <p className="font-semibold">{c.gamificationOffTitle}</p>
        <p className="mt-1">
          {(() => {
            const marker = 'VITE_USE_GAMIFICATION_API';
            const body = c.gamificationOffBody;
            const i = body.indexOf(marker);
            if (i < 0) return body;
            return (
              <>
                {body.slice(0, i)}
                <code className="rounded bg-white px-1">{marker}</code>
                {body.slice(i + marker.length)}
              </>
            );
          })()}
        </p>
      </div>
    );
  }

  if (!canUseAssignmentApi(currentUser)) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-700 shadow-sm">
        <p className="font-semibold text-neutral-900">{c.accessTitle}</p>
        <p className="mt-2">{c.accessLead}</p>
        {currentUser.permissions?.includes('MANAGE_CAMPAIGNS') && (
          <p className="mt-2 text-neutral-500">{c.accessCampaignNote}</p>
        )}
      </div>
    );
  }

  const hasAssignmentsIntro =
    Boolean(c.introLead?.trim() || c.introStore?.trim() || c.introCompletion?.trim());

  return (
    <div className="space-y-8">
      {hasAssignmentsIntro ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-4 text-sm text-emerald-950">
          {c.introLead?.trim() || c.introStore?.trim() ? (
            <span>
              {c.introLead?.trim() ? <strong>{c.introLead}</strong> : null}
              {c.introLead?.trim() && c.introStore?.trim() ? <> </> : null}
              {c.introStore?.trim() ? c.introStore : null}
            </span>
          ) : null}
          {c.introCompletion?.trim() ? (
            <p className="mt-2 text-emerald-900/90">{c.introCompletion}</p>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">{c.newAssignment}</h2>
        <form onSubmit={(e) => void handleCreate(e)} className="max-w-2xl space-y-4">
          <div className="space-y-3">
            <label className="mb-1 block text-sm font-medium text-neutral-700">{c.campaignTypeLabel}</label>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setCampaignType('one_time')}
                className={`rounded-2xl border p-4 text-left transition ${
                  campaignType === 'one_time'
                    ? 'border-neutral-900 ring-1 ring-neutral-900'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
                aria-pressed={campaignType === 'one_time'}
              >
                <h3 className="text-xl font-semibold text-neutral-900">{c.campaignTypeOneTimeTitle}</h3>
                <p className="mt-2 text-sm text-neutral-600">{c.campaignTypeOneTimeBody}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-900">
                    {c.campaignTypeTagAllEmployees}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-900">
                    {c.campaignTypeTagNamedGroups}
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setCampaignType('triggered')}
                className={`rounded-2xl border p-4 text-left transition ${
                  campaignType === 'triggered'
                    ? 'border-neutral-900 ring-1 ring-neutral-900'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
                aria-pressed={campaignType === 'triggered'}
              >
                <h3 className="text-xl font-semibold text-neutral-900">{c.campaignTypeTriggeredTitle}</h3>
                <p className="mt-2 text-sm text-neutral-600">{c.campaignTypeTriggeredBody}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-900">
                    {c.campaignTypeTagNewHires}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-900">
                    {c.campaignTypeTagGroupRule}
                  </span>
                  <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-900">
                    {c.campaignTypeTagFailedSimulation}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {campaignType === 'triggered' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <label className="mb-1 block text-sm font-medium text-amber-900">{c.triggerTypeLabel}</label>
              <select
                className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2"
                value={triggerType}
                onChange={(e) =>
                  setTriggerType(e.target.value as 'new_hire' | 'group_rule' | 'failed_simulation')
                }
              >
                <option value="new_hire">{c.triggerTypeNewHire}</option>
                <option value="group_rule">{c.triggerTypeGroupRule}</option>
                <option value="failed_simulation">{c.triggerTypeFailedSimulation}</option>
              </select>
              <p className="mt-2 text-sm text-amber-900/90">{c.triggeredComingSoon}</p>
            </div>
          )}

          {campaignType === 'one_time' && (
            <>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">{c.labelTitle}</label>
            <input
              className="w-full rounded-lg border border-neutral-200 px-3 py-2"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">{c.labelChallenge}</label>
            <select
              className="w-full rounded-lg border border-neutral-200 px-3 py-2"
              value={challengeId}
              onChange={(e) => setChallengeId(e.target.value)}
              disabled={challenges.length === 0}
            >
              {challenges.length === 0 ? <option value="">{c.noChallengesLoaded}</option> : null}
              {challenges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            {challenges.length === 0 && (
              <p className="mt-1 text-xs text-amber-800">{c.openChallengesHint}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="mb-1 flex items-center gap-1 text-sm font-medium text-neutral-700">
                <Calendar size={14} /> {c.labelDueDate}
              </label>
              <input
                type="date"
                className="rounded-lg border border-neutral-200 px-3 py-2"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {isSuperAdmin && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-neutral-500 uppercase tracking-wider">{c.orgScope}</label>
                  <select
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm bg-white"
                    value={createOrgScope}
                    onChange={(e) => {
                      setCreateOrgScope(e.target.value);
                      setCreateDeptScope('');
                      setCreateUnitScope('');
                    }}
                  >
                    <option value="">{c.platformWideOption}</option>
                    {orgs.map((o: { id: string; name: string }) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {(isSuperAdmin || currentUser.user_type === 'ORG_ADMIN') && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-neutral-500 uppercase tracking-wider">{messages.admin.challengesHub.authoring.departmentLabel}</label>
                    <select
                      className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm bg-white"
                      value={createDeptScope}
                      onChange={(e) => {
                        setCreateDeptScope(e.target.value);
                        if (e.target.value) setCreateUnitScope('');
                      }}
                    >
                      <option value="">{messages.admin.challengesHub.authoring.wholeOrgDepts}</option>
                      {(isSuperAdmin && createOrgScope ? departments : (currentUser.user_type === 'ORG_ADMIN' ? departments : [])).map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-neutral-500 uppercase tracking-wider">{messages.admin.challengesHub.authoring.unitLabel}</label>
                    <select
                      className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm bg-white"
                      value={createUnitScope}
                      onChange={(e) => {
                        setCreateUnitScope(e.target.value);
                        if (e.target.value) setCreateDeptScope('');
                      }}
                    >
                      <option value="">{c.allUnits || 'Whole Organization'}</option>
                      {(isSuperAdmin && createOrgScope ? units : (currentUser.user_type === 'ORG_ADMIN' ? units : [])).map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
          
            {!isSuperAdmin && !['ORG_ADMIN'].includes(currentUser.user_type || '') && (
              <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                <p className="text-sm text-neutral-600">
                  {currentUser.user_type === 'DEPT_ADMIN' 
                    ? interpolate(c.assignmentsApply || 'Applying to {label}', { label: `Department: ${currentUser.department || currentUser.deptId}` })
                    : interpolate(c.assignmentsApply || 'Applying to {label}', { label: `Branch: ${currentUser.unit || currentUser.unitId}` })}
                </p>
              </div>
            )}
            </>
          )}
          <button
            type="submit"
            disabled={creating || challenges.length === 0 || campaignType == null}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {creating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
            {campaignType === 'triggered' ? c.createTriggeredSubmit : c.createSubmit}
          </button>
        </form>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-neutral-900">{c.listTitle}</h2>
          <div className="flex flex-wrap items-center gap-3">
            {isSuperAdmin && (
              <div className="flex flex-col gap-1 min-w-[150px]">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{c.filterByOrg}</label>
                <select
                  className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm bg-white"
                  value={listOrgFilter}
                  onChange={(e) => {
                    setListOrgFilter(e.target.value);
                    setListDeptFilter('');
                    setListUnitFilter('');
                  }}
                >
                  <option value="">{c.allOrgs}</option>
                  {orgs.map((o: { id: string; name: string }) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
            )}
            {(isSuperAdmin || currentUser.user_type === 'ORG_ADMIN') && (
              <>
                <div className="flex flex-col gap-1 min-w-[150px]">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Dept</label>
                  <select
                    className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm bg-white"
                    value={listDeptFilter}
                    onChange={(e) => setListDeptFilter(e.target.value)}
                  >
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1 min-w-[150px]">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Branch</label>
                  <select
                    className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm bg-white"
                    value={listUnitFilter}
                    onChange={(e) => setListUnitFilter(e.target.value)}
                  >
                    <option value="">All Branches</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
        {listError && (
          <p className="text-sm text-red-600">{c.listLoadError}</p>
        )}
        {listLoading && !adminAssignments.length && (
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Loader2 className="animate-spin" size={18} /> {c.listLoading}
          </div>
        )}
        {!listLoading && !listError && adminAssignments.length === 0 && (
          <p className="text-sm text-neutral-500">{c.noAssignments}</p>
        )}
        {adminAssignments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  <th className="py-2 pr-3">{c.thTitle}</th>
                  <th className="py-2 pr-3">{c.thDue}</th>
                  <th className="py-2 pr-3">{c.thAudience}</th>
                  <th className="py-2 pr-3">{c.thCompletion}</th>
                  <th className="py-2 text-right">{c.thActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {adminAssignments.map((a) => (
                  <tr key={a.id}>
                    <td className="py-3 pr-3 font-medium text-neutral-900">{a.title}</td>
                    <td className="py-3 pr-3 whitespace-nowrap text-neutral-600">{a.dueDate}</td>
                    <td className="py-3 pr-3 text-neutral-600">
                      {a.userId === 'all'
                        ? c.audienceEveryone
                        : interpolate(c.audienceUser, { idPrefix: a.userId.slice(0, 8) })}
                    </td>
                    <td className="py-3 pr-3 text-neutral-800">{formatCompletionSummary(a, c)}</td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void handleDelete(a)}
                        disabled={isDeleting}
                        className="inline-flex p-2 text-red-600 hover:text-red-800 disabled:opacity-50"
                        aria-label={c.removeAssignmentAria}
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

      <p className="text-xs text-neutral-400">
        {interpolate(c.signedInAs, { email: currentUser.email ?? '' })}
      </p>
    </div>
  );
}
