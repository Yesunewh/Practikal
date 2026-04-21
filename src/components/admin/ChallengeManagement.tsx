import { useMemo, useState, useEffect, useId } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { User, Challenge } from '../../types';
import { Search, Edit, Trash2, PlusCircle, ChevronDown, Award, FileText } from 'lucide-react';
import { AppDispatch } from '../../store';
import { addChallenge, deleteChallenge, setChallenges, updateChallenge } from '../../store/slices/challengesSlice';
import CreateChallenge from './CreateChallenge';
import { useGamificationApi } from '../../config/gamification';
import {
  useGetGamificationChallengesQuery,
  useCreateGamificationChallengeMutation,
  useUpdateGamificationChallengeMutation,
  useDeleteGamificationChallengeMutation,
  useGetDepartmentsQuery,
  useGetOrganizationsQuery,
} from '../../store/apiSlice/practikalApi';
import toast from 'react-hot-toast';

interface ChallengeManagementProps {
  currentUser: User;
}

const GAMIFICATION_ADMINS = ['SUPERADMIN', 'ORG_ADMIN', 'DEPT_ADMIN'];

function SuperadminPublishScopeCard({
  scopeOrgId,
  scopeDeptId,
  onOrgChange,
  onDeptChange,
  organizations,
  departments,
}: {
  scopeOrgId: string;
  scopeDeptId: string;
  onOrgChange: (orgId: string) => void;
  onDeptChange: (deptId: string) => void;
  organizations: { id: string; name: string; slug: string }[];
  departments: { id: string; name: string }[];
}) {
  const orgFieldId = useId();
  const deptFieldId = useId();
  const hasTenant = Boolean(scopeOrgId.trim());

  return (
    <div className="rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/95 via-white to-white p-5 shadow-sm ring-1 ring-amber-100/60">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={orgFieldId} className="text-xs font-semibold text-gray-800">
            Tenant
          </label>
          <select
            id={orgFieldId}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none ring-emerald-500/0 transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25"
            value={scopeOrgId}
            onChange={(e) => onOrgChange(e.target.value)}
          >
            <option value="">All tenants (platform-wide)</option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor={deptFieldId}
            className={`text-xs font-semibold ${hasTenant ? 'text-gray-800' : 'text-gray-400'}`}
          >
            Department
            <span className="ml-1 font-normal text-gray-500">(optional)</span>
          </label>
          {hasTenant ? (
            <select
              id={deptFieldId}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none ring-emerald-500/0 transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25"
              value={scopeDeptId}
              onChange={(e) => onDeptChange(e.target.value)}
            >
              <option value="">Whole tenant (all departments)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          ) : (
            <div
              id={deptFieldId}
              className="rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-3 py-2.5 text-xs leading-snug text-gray-500"
            >
              Select a tenant to optionally limit this challenge to one department.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChallengeManagement({ currentUser }: ChallengeManagementProps) {
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const reduxChallenges = useSelector((state: { challenges: { challenges: Challenge[] } }) => state.challenges.challenges);
  const canManageApi =
    GAMIFICATION_ADMINS.includes(currentUser.user_type || '') ||
    (!!currentUser.deptId &&
      currentUser.role === 'admin' &&
      (currentUser.user_type == null || currentUser.user_type === ''));

  const { data: apiList, refetch } = useGetGamificationChallengesQuery(undefined, {
    skip: !useGamificationApi || !canManageApi,
  });

  const [createChallengeApi, { isLoading: creatingApi }] = useCreateGamificationChallengeMutation();
  const [updateChallengeApi, { isLoading: updatingApi }] = useUpdateGamificationChallengeMutation();
  const [deleteChallengeApi] = useDeleteGamificationChallengeMutation();

  const { data: deptsResponse } = useGetDepartmentsQuery(currentUser.orgId || '', {
    skip:
      !useGamificationApi ||
      !currentUser.orgId ||
      !['ORG_ADMIN', 'DEPT_ADMIN'].includes(currentUser.user_type || ''),
  });
  const departments = (deptsResponse as { depts?: { id: string; name: string }[] } | undefined)?.depts ?? [];

  const [scopeOrgId, setScopeOrgId] = useState(currentUser.orgId || '');
  const [scopeDeptId, setScopeDeptId] = useState(
    currentUser.user_type === 'ORG_ADMIN' ? '' : currentUser.deptId || '',
  );

  const { data: orgsData } = useGetOrganizationsQuery(undefined, {
    skip: !useGamificationApi || !canManageApi || currentUser.user_type !== 'SUPERADMIN',
  });
  const superOrgs = (orgsData?.orgs ?? []) as { id: string; name: string; slug: string }[];

  const { data: superDeptsResponse } = useGetDepartmentsQuery(scopeOrgId, {
    skip:
      !useGamificationApi ||
      !canManageApi ||
      currentUser.user_type !== 'SUPERADMIN' ||
      !scopeOrgId,
  });
  const superDepartments =
    (superDeptsResponse as { depts?: { id: string; name: string }[] } | undefined)?.depts ?? [];

  const orgNameById = useMemo(() => {
    const m = new Map<string, string>();
    superOrgs.forEach((o) => m.set(o.id, o.name));
    if (currentUser.orgId && currentUser.organization) {
      m.set(currentUser.orgId, currentUser.organization);
    }
    return m;
  }, [superOrgs, currentUser.orgId, currentUser.organization]);

  const deptNameById = useMemo(() => {
    const m = new Map<string, string>();
    departments.forEach((d) => m.set(d.id, d.name));
    superDepartments.forEach((d) => m.set(d.id, d.name));
    return m;
  }, [departments, superDepartments]);

  const challengeScopeLines = (c: Challenge): { title: string; subtitle: string } => {
    if (!c.orgId && !c.deptId) {
      return { title: 'Global (platform)', subtitle: 'Visible across all tenants' };
    }
    if (c.deptId) {
      const name = deptNameById.get(c.deptId);
      return {
        title: 'Department',
        subtitle: name ?? `ID ${String(c.deptId).slice(0, 8)}…`,
      };
    }
    const on = c.orgId ? orgNameById.get(c.orgId) : undefined;
    return {
      title: 'Organization',
      subtitle: on ?? (c.orgId ? `ID ${String(c.orgId).slice(0, 8)}…` : ''),
    };
  };

  useEffect(() => {
    if (currentUser.user_type === 'DEPT_ADMIN') {
      setScopeOrgId(currentUser.orgId || '');
      setScopeDeptId(currentUser.deptId || '');
    }
  }, [currentUser.user_type, currentUser.orgId, currentUser.deptId]);

  useEffect(() => {
    if (useGamificationApi && canManageApi && apiList?.challenges?.length) {
      dispatch(setChallenges(apiList.challenges as Challenge[]));
    }
  }, [useGamificationApi, canManageApi, apiList?.challenges, dispatch]);

  const allChallenges = useMemo(() => {
    if (useGamificationApi && canManageApi && apiList?.challenges?.length) {
      return apiList.challenges as Challenge[];
    }
    return reduxChallenges;
  }, [useGamificationApi, canManageApi, apiList?.challenges, reduxChallenges]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterScope, setFilterScope] = useState<'all' | 'global' | 'organization' | 'department'>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);

  /** Deep links from /admin/departments: scope + optional “open create” for org / superadmin / dept head. */
  useEffect(() => {
    const st = location.state as {
      presetOrgId?: string;
      presetDeptId?: string;
      startCreating?: boolean;
    } | undefined;
    const params = new URLSearchParams(location.search);
    const deptFromQuery = params.get('dept') || undefined;
    const effectiveDept = st?.presetDeptId || deptFromQuery;

    if (currentUser.user_type === 'SUPERADMIN' && st?.presetOrgId) {
      setScopeOrgId(st.presetOrgId);
      if (effectiveDept) setScopeDeptId(effectiveDept);
    } else if (currentUser.user_type === 'ORG_ADMIN') {
      if (!st?.presetOrgId || st.presetOrgId === currentUser.orgId) {
        if (effectiveDept) setScopeDeptId(effectiveDept);
      }
    }

    const openComposer = st?.startCreating === true || params.get('new') === '1';
    if (effectiveDept) {
      setFilterScope('department');
    }
    if (openComposer && canManageApi) {
      setIsCreating(true);
    }
  }, [location.key, location.search, location.state, currentUser.user_type, currentUser.orgId, canManageApi]);

  const filteredChallenges = allChallenges.filter((challenge: Challenge) => {
    const matchesSearch =
      challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      challenge.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || challenge.type === filterType;
    const matchesScope =
      filterScope === 'all' ||
      (filterScope === 'global' && !challenge.orgId && !challenge.deptId) ||
      (filterScope === 'organization' && !!challenge.orgId && !challenge.deptId) ||
      (filterScope === 'department' && !!challenge.deptId);
    return matchesSearch && matchesType && matchesScope;
  });

  const resolvePublishScope = () => {
    if (currentUser.user_type === 'DEPT_ADMIN') {
      return { orgId: currentUser.orgId ?? null, deptId: currentUser.deptId ?? null };
    }
    if (currentUser.user_type === 'ORG_ADMIN') {
      return {
        orgId: currentUser.orgId ?? null,
        deptId: scopeDeptId || null,
      };
    }
    return {
      orgId: scopeOrgId || null,
      deptId: scopeDeptId || null,
    };
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    if (!confirm('Are you sure you want to delete this challenge?')) return;
    try {
      if (useGamificationApi && canManageApi) {
        await deleteChallengeApi(challengeId).unwrap();
        await refetch();
      } else {
        dispatch(deleteChallenge(challengeId));
      }
    } catch {
      toast.error('Could not delete challenge. Check permissions and try again.');
    }
  };

  const handleEditChallenge = (challenge: Challenge) => {
    setScopeOrgId(challenge.orgId ?? '');
    setScopeDeptId(challenge.deptId ?? '');
    setEditingChallenge(challenge);
  };

  const handleSaveChallenge = async (newChallenge: Partial<Challenge>) => {
    const { orgId, deptId } = resolvePublishScope();
    const id = `ch_${Date.now()}`;
    const challenge: Challenge = {
      id,
      title: newChallenge.title || '',
      description: newChallenge.description || '',
      type: (newChallenge.type || 'quiz') as Challenge['type'],
      xpReward: newChallenge.xpReward || 100,
      reputationReward: newChallenge.reputationReward || 5,
      duration: newChallenge.duration || 10,
      difficulty: newChallenge.difficulty || 'beginner',
      category: newChallenge.category || 'general',
      steps: newChallenge.steps || [],
      completed: false,
      orgId,
      deptId,
    };

    try {
      if (useGamificationApi && canManageApi) {
        await createChallengeApi({
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          type: challenge.type,
          category: challenge.category,
          difficulty: challenge.difficulty,
          duration: challenge.duration,
          xpReward: challenge.xpReward,
          reputationReward: challenge.reputationReward,
          steps: challenge.steps,
          orgId,
          deptId,
        }).unwrap();
        await refetch();
      } else {
        dispatch(addChallenge(challenge));
      }
      setIsCreating(false);
      toast.success('Challenge created.');
    } catch {
      toast.error('Could not save challenge. Check fields and permissions (org / department scope).');
    }
  };

  const handleUpdateChallenge = async (partial: Partial<Challenge>) => {
    if (!editingChallenge) return;
    const { orgId, deptId } = resolvePublishScope();
    const merged: Challenge = {
      ...editingChallenge,
      title: partial.title ?? editingChallenge.title,
      description: partial.description ?? editingChallenge.description,
      type: (partial.type ?? editingChallenge.type) as Challenge['type'],
      xpReward: partial.xpReward ?? editingChallenge.xpReward,
      reputationReward: partial.reputationReward ?? editingChallenge.reputationReward,
      duration: partial.duration ?? editingChallenge.duration,
      difficulty: (partial.difficulty ?? editingChallenge.difficulty) as Challenge['difficulty'],
      category: (partial.category ?? editingChallenge.category) as Challenge['category'],
      steps: partial.steps ?? editingChallenge.steps,
      orgId,
      deptId,
    };

    try {
      if (useGamificationApi && canManageApi) {
        await updateChallengeApi({
          id: editingChallenge.id,
          title: merged.title,
          description: merged.description,
          type: merged.type,
          category: merged.category,
          difficulty: merged.difficulty,
          duration: merged.duration,
          xpReward: merged.xpReward,
          reputationReward: merged.reputationReward,
          steps: merged.steps,
          orgId,
          deptId,
        }).unwrap();
        await refetch();
      } else {
        dispatch(updateChallenge({ id: editingChallenge.id, challenge: merged }));
      }
      setEditingChallenge(null);
      toast.success('Challenge updated.');
    } catch {
      toast.error('Could not update challenge. Check fields and permissions (org / department scope).');
    }
  };

  const getChallengeTypeColor = (type: string) => {
    switch (type) {
      case 'quiz':
        return 'text-blue-700 bg-blue-100';
      case 'scenario':
        return 'text-purple-700 bg-purple-100';
      case 'password':
        return 'text-green-700 bg-green-100';
      case 'simulation':
        return 'text-amber-700 bg-amber-100';
      case 'sequential':
        return 'text-indigo-700 bg-indigo-100';
      case 'verification':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const challengeTypes = ['all', ...Array.from(new Set(allChallenges.map((c) => c.type)))];

  if (editingChallenge) {
    return (
      <div className="space-y-4">
        {useGamificationApi && canManageApi && currentUser.user_type === 'SUPERADMIN' && (
          <SuperadminPublishScopeCard
            scopeOrgId={scopeOrgId}
            scopeDeptId={scopeDeptId}
            onOrgChange={(id) => {
              setScopeOrgId(id);
              setScopeDeptId('');
            }}
            onDeptChange={setScopeDeptId}
            organizations={superOrgs}
            departments={superDepartments}
          />
        )}
        {useGamificationApi && canManageApi && currentUser.user_type === 'ORG_ADMIN' && (
          <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/50 p-5 shadow-sm">
            <label className="mb-1.5 block text-xs font-semibold text-emerald-950" htmlFor="org-admin-scope-dept">
              Department <span className="font-normal text-emerald-800/70">(optional)</span>
            </label>
            <select
              id="org-admin-scope-dept"
              className="w-full max-w-md rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25"
              value={scopeDeptId}
              onChange={(e) => setScopeDeptId(e.target.value)}
            >
              <option value="">Whole organization (all departments)</option>
              {(departments as { id: string; name: string }[]).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {useGamificationApi && canManageApi && currentUser.user_type === 'DEPT_ADMIN' && (
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
            Scope stays tied to <strong>your department</strong> when you save.
          </p>
        )}
        <CreateChallenge
          key={editingChallenge.id}
          initialChallenge={editingChallenge}
          onSave={handleUpdateChallenge}
          onCancel={() => setEditingChallenge(null)}
        />
        {updatingApi && <p className="text-sm text-gray-500">Saving to server…</p>}
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="space-y-4">
        {useGamificationApi && canManageApi && currentUser.user_type === 'SUPERADMIN' && (
          <SuperadminPublishScopeCard
            scopeOrgId={scopeOrgId}
            scopeDeptId={scopeDeptId}
            onOrgChange={(id) => {
              setScopeOrgId(id);
              setScopeDeptId('');
            }}
            onDeptChange={setScopeDeptId}
            organizations={superOrgs}
            departments={superDepartments}
          />
        )}
        {useGamificationApi && canManageApi && currentUser.user_type === 'ORG_ADMIN' && (
          <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/50 p-5 shadow-sm">
            <label className="mb-1.5 block text-xs font-semibold text-emerald-950" htmlFor="org-admin-scope-dept-create">
              Department <span className="font-normal text-emerald-800/70">(optional)</span>
            </label>
            <select
              id="org-admin-scope-dept-create"
              className="w-full max-w-md rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25"
              value={scopeDeptId}
              onChange={(e) => setScopeDeptId(e.target.value)}
            >
              <option value="">Whole organization (all departments)</option>
              {(departments as { id: string; name: string }[]).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {useGamificationApi && canManageApi && currentUser.user_type === 'DEPT_ADMIN' && (
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
            Challenges you publish are scoped to <strong>your department</strong> only.
          </p>
        )}
        <CreateChallenge
          onSave={handleSaveChallenge}
          onCancel={() => setIsCreating(false)}
        />
        {creatingApi && <p className="text-sm text-gray-500">Saving to server…</p>}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <h2 className="text-lg font-semibold text-gray-800">Challenge Management</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center"
        >
          <PlusCircle size={16} className="mr-2" />
          Create Challenge
        </button>
      </div>

      <div className="p-6 border-b">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search challenges..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          </div>

          <div className="relative w-full md:w-48">
            <select
              className="w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              {challengeTypes.map((type) => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
            <ChevronDown size={18} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative w-full md:w-56">
            <select
              className="w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
              value={filterScope}
              onChange={(e) => setFilterScope(e.target.value as typeof filterScope)}
            >
              <option value="all">All scopes</option>
              <option value="global">Global (platform)</option>
              <option value="organization">Organization</option>
              <option value="department">Department</option>
            </select>
            <ChevronDown size={18} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Challenge
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Scope
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reward</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredChallenges.map((challenge: Challenge) => (
              <tr key={challenge.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <FileText size={20} className="text-gray-500" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{challenge.title}</div>
                      <div className="text-xs text-gray-500 max-w-xs truncate">{challenge.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-gray-600">
                  {(() => {
                    const { title, subtitle } = challengeScopeLines(challenge);
                    return (
                      <div>
                        <div className="font-medium text-gray-800">{title}</div>
                        {subtitle ? <div className="text-gray-500 mt-0.5">{subtitle}</div> : null}
                      </div>
                    );
                  })()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getChallengeTypeColor(challenge.type)}`}
                  >
                    {challenge.type.charAt(0).toUpperCase() + challenge.type.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Award size={16} className="text-amber-500 mr-1" />
                    <span className="text-sm text-gray-900">{challenge.xpReward} XP</span>
                  </div>
                  {challenge.reputationReward ? (
                    <div className="flex items-center mt-1">
                      <Award size={16} className="text-blue-500 mr-1" />
                      <span className="text-xs text-gray-500">{challenge.reputationReward} Reputation</span>
                    </div>
                  ) : null}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => handleEditChallenge(challenge)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteChallenge(challenge.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{filteredChallenges.length}</span> of{' '}
          <span className="font-medium">{allChallenges.length}</span> challenges
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            type="button"
            className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
