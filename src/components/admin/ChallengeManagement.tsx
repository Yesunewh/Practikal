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
  useGetUnitTreeQuery,
} from '../../store/apiSlice/practikalApi';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n/I18nContext';
import { interpolate, type Messages } from '../../i18n/messages';

interface ChallengeManagementProps {
  currentUser: User;
}

const GAMIFICATION_ADMINS = ['SUPERADMIN', 'ORG_ADMIN', 'DEPT_ADMIN', 'UNIT_ADMIN'];

function SuperadminPublishScopeCard({
  scopeOrgId,
  scopeDeptId,
  scopeUnitId,
  onOrgChange,
  onDeptChange,
  onUnitChange,
  organizations,
  departments,
  units,
  authoring: a,
}: {
  scopeOrgId: string;
  scopeDeptId: string;
  scopeUnitId: string;
  onOrgChange: (orgId: string) => void;
  onDeptChange: (deptId: string) => void;
  onUnitChange: (unitId: string) => void;
  organizations: { id: string; name: string; slug: string }[];
  departments: { id: string; name: string }[];
  units: { id: string; name: string }[];
  authoring: Messages['admin']['challengesHub']['authoring'];
}) {
  const orgFieldId = useId();
  const deptFieldId = useId();
  const unitFieldId = useId();
  const hasTenant = Boolean(scopeOrgId.trim());

  return (
    <div className="rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/95 via-white to-white p-5 shadow-sm ring-1 ring-amber-100/60">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label htmlFor={orgFieldId} className="text-xs font-semibold text-neutral-800">
            {a.tenant}
          </label>
          <select
            id={orgFieldId}
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm outline-none ring-emerald-500/0 transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25"
            value={scopeOrgId}
            onChange={(e) => onOrgChange(e.target.value)}
          >
            <option value="">{a.allTenantsOption}</option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor={unitFieldId}
            className={`text-xs font-semibold ${hasTenant ? 'text-neutral-800' : 'text-neutral-400'}`}
          >
            {a.unitLabel}
            <span className="ml-1 font-normal text-neutral-500">{a.optionalSuffix}</span>
          </label>
          {hasTenant ? (
            <select
              id={unitFieldId}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm outline-none ring-emerald-500/0 transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25"
              value={scopeUnitId}
              onChange={(e) => onUnitChange(e.target.value)}
            >
              <option value="">Whole organization (all branches)</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50/80 px-3 py-2.5 text-xs leading-snug text-neutral-500">
              {a.selectTenantHint}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor={deptFieldId}
            className={`text-xs font-semibold ${hasTenant ? 'text-neutral-800' : 'text-neutral-400'}`}
          >
            {a.departmentLabel}
            <span className="ml-1 font-normal text-neutral-500">{a.optionalSuffix}</span>
          </label>
          {hasTenant ? (
            <select
              id={deptFieldId}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm outline-none ring-emerald-500/0 transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25"
              value={scopeDeptId}
              onChange={(e) => onDeptChange(e.target.value)}
            >
              <option value="">{a.wholeTenantDepts}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          ) : (
            <div
              id={deptFieldId}
              className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50/80 px-3 py-2.5 text-xs leading-snug text-neutral-500"
            >
              {a.selectTenantHint}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChallengeManagement({ currentUser }: ChallengeManagementProps) {
  const { messages } = useI18n();
  const a = messages.admin.challengesHub.authoring;
  const location = useLocation();
  const challengeListSearchId = useId();
  const dispatch = useDispatch<AppDispatch>();
  const reduxChallenges = useSelector((state: { challenges: { challenges: Challenge[] } }) => state.challenges.challenges);
  const canManageApi =
    GAMIFICATION_ADMINS.includes(currentUser.user_type || '') ||
    (!!currentUser.deptId &&
      currentUser.role === 'admin' &&
      (currentUser.user_type == null || currentUser.user_type === ''));

  const [createChallengeApi, { isLoading: creatingApi }] = useCreateGamificationChallengeMutation();
  const [updateChallengeApi, { isLoading: updatingApi }] = useUpdateGamificationChallengeMutation();
  const [deleteChallengeApi] = useDeleteGamificationChallengeMutation();

  const { data: deptsResponse } = useGetDepartmentsQuery(currentUser.orgId || '', {
    skip:
      !useGamificationApi ||
      !currentUser.orgId ||
      !['ORG_ADMIN', 'DEPT_ADMIN', 'UNIT_ADMIN'].includes(currentUser.user_type || ''),
  });
  const departments = (deptsResponse as { depts?: { id: string; name: string }[] } | undefined)?.depts ?? [];

  const { data: unitTreeData } = useGetUnitTreeQuery(currentUser.orgId || '', {
    skip: !useGamificationApi || !currentUser.orgId || !['ORG_ADMIN', 'UNIT_ADMIN'].includes(currentUser.user_type || ''),
  });
  
  const flattenUnits = (nodes: any[]): any[] => {
    let result: any[] = [];
    if (!nodes) return result;
    nodes.forEach(node => {
      result.push({ id: node.id, name: node.name });
      if (node.children) {
        result = result.concat(flattenUnits(node.children));
      }
    });
    return result;
  };
  const units = useMemo(() => flattenUnits(unitTreeData?.tree ?? []), [unitTreeData]);

  const [scopeOrgId, setScopeOrgId] = useState(currentUser.orgId || '');
  const [scopeDeptId, setScopeDeptId] = useState(
    currentUser.user_type === 'ORG_ADMIN' ? '' : currentUser.deptId || '',
  );
  const [scopeUnitId, setScopeUnitId] = useState(
    currentUser.unitId || ''
  );

  const challengesQueryArg = useMemo(() => {
    const base: { for_exam_bank: true; org_id?: string; dept_id?: string; unit_id?: string } = { for_exam_bank: true };
    if (currentUser.user_type === 'SUPERADMIN') {
      if (scopeOrgId.trim()) base.org_id = scopeOrgId.trim();
      if (scopeDeptId.trim()) base.dept_id = scopeDeptId.trim();
      if (scopeUnitId.trim()) base.unit_id = scopeUnitId.trim();
    }
    return base;
  }, [currentUser.user_type, scopeOrgId, scopeDeptId, scopeUnitId]);

  const { data: apiList, refetch } = useGetGamificationChallengesQuery(challengesQueryArg, {
    skip: !useGamificationApi || !canManageApi,
  });

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

  const { data: superUnitTreeData } = useGetUnitTreeQuery(scopeOrgId, {
    skip: !useGamificationApi || !canManageApi || currentUser.user_type !== 'SUPERADMIN' || !scopeOrgId,
  });
  const superUnits = useMemo(() => flattenUnits(superUnitTreeData?.tree ?? []), [superUnitTreeData]);

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

  const unitNameById = useMemo(() => {
    const m = new Map<string, string>();
    units.forEach((u) => m.set(u.id, u.name));
    superUnits.forEach((u) => m.set(u.id, u.name));
    return m;
  }, [units, superUnits]);


  const challengeScopeLines = (c: Challenge): { title: string; subtitle: string } => {
    if (!c.orgId && !c.deptId && !c.unitId) {
      return { title: a.scopeGlobalTitle, subtitle: a.scopeGlobalSubtitle };
    }
    if (c.deptId) {
      const name = deptNameById.get(c.deptId);
      return {
        title: a.scopeDeptTitle,
        subtitle: name ?? interpolate(a.scopeIdSubtitle, { prefix: String(c.deptId).slice(0, 8) }),
      };
    }
    if (c.unitId) {
      const name = unitNameById.get(c.unitId);
      return {
        title: a.filterScopeUnit, // "Branch / Unit"
        subtitle: name ?? interpolate(a.scopeIdSubtitle, { prefix: String(c.unitId).slice(0, 8) }),
      };
    }
    const on = c.orgId ? orgNameById.get(c.orgId) : undefined;
    return {
      title: a.scopeOrgTitle,
      subtitle: on ?? (c.orgId ? interpolate(a.scopeIdSubtitle, { prefix: String(c.orgId).slice(0, 8) }) : ''),
    };
  };

  useEffect(() => {
    if (currentUser.user_type === 'DEPT_ADMIN') {
      setScopeOrgId(currentUser.orgId || '');
      setScopeDeptId(currentUser.deptId || '');
      setScopeUnitId('');
    } else if (currentUser.user_type === 'UNIT_ADMIN') {
      setScopeOrgId(currentUser.orgId || '');
      setScopeUnitId(currentUser.unitId || '');
      setScopeDeptId('');
    }
  }, [currentUser.user_type, currentUser.orgId, currentUser.deptId, currentUser.unitId]);

  useEffect(() => {
    if (useGamificationApi && canManageApi && apiList?.challenges?.length) {
      const list = apiList.challenges as Challenge[];
      // Learner-facing redux sync: active catalog only (admin list includes archived)
      dispatch(setChallenges(list.filter((c) => c.isActive !== false)));
    }
  }, [useGamificationApi, canManageApi, apiList?.challenges, dispatch]);

  const allChallenges = useMemo(() => {
    if (useGamificationApi && canManageApi && apiList?.challenges?.length) {
      return apiList.challenges as Challenge[];
    }
    return reduxChallenges;
  }, [useGamificationApi, canManageApi, apiList?.challenges, reduxChallenges]);

  const [activeTopTab, setActiveTopTab] = useState<'organization' | 'global' | 'departments'>(
    ['UNIT_ADMIN', 'DEPT_ADMIN'].includes(currentUser.user_type || '') ? 'departments' : 'organization'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterScope, setFilterScope] = useState<'all' | 'global' | 'organization' | 'department' | 'unit'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const canEditChallenge = (challenge: Challenge) => {
    if (currentUser.user_type === 'SUPERADMIN') return true;
    const isGlobal = !challenge.orgId && !challenge.deptId && !challenge.unitId;
    if (isGlobal) return false;
    
    if (currentUser.user_type === 'ORG_ADMIN') {
      return challenge.orgId === currentUser.orgId;
    }
    if (currentUser.user_type === 'UNIT_ADMIN') {
      return challenge.unitId === currentUser.unitId;
    }
    if (currentUser.user_type === 'DEPT_ADMIN') {
      return challenge.deptId === currentUser.deptId;
    }
    return false;
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTopTab, searchQuery, filterType, filterScope, filterStatus]);

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
    const isGlobalChallenge = !challenge.orgId && !challenge.deptId && !challenge.unitId;
    const isDeptChallenge = !!challenge.deptId || !!challenge.unitId;
    const isOrgWideChallenge = !!challenge.orgId && !challenge.deptId && !challenge.unitId;

    let matchesTab = false;
    if (activeTopTab === 'global') matchesTab = isGlobalChallenge;
    else if (activeTopTab === 'departments') matchesTab = isDeptChallenge;
    else matchesTab = isOrgWideChallenge;

    if (!matchesTab) return false;

    const matchesSearch =
      challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      challenge.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || challenge.type === filterType;
    const matchesScope =
      filterScope === 'all' ||
      (filterScope === 'global' && isGlobalChallenge) ||
      (filterScope === 'organization' && !!challenge.orgId && !challenge.deptId && !challenge.unitId) ||
      (filterScope === 'unit' && !!challenge.unitId) ||
      (filterScope === 'department' && !!challenge.deptId);
    const isArchived = challenge.isActive === false;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && !isArchived) ||
      (filterStatus === 'archived' && isArchived);
    return matchesSearch && matchesType && matchesScope && matchesStatus;
  });

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredChallenges.length / ITEMS_PER_PAGE);
  const paginatedChallenges = filteredChallenges.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );


  const resolvePublishScope = () => {
    if (currentUser.user_type === 'DEPT_ADMIN') {
      return { 
        orgId: currentUser.orgId ?? null, 
        deptId: currentUser.deptId ?? null,
        unitId: null
      };
    }
    if (currentUser.user_type === 'UNIT_ADMIN') {
      return { 
        orgId: currentUser.orgId ?? null, 
        deptId: scopeDeptId || null,
        unitId: scopeUnitId || currentUser.unitId || null
      };
    }
    if (currentUser.user_type === 'ORG_ADMIN') {
      return {
        orgId: currentUser.orgId ?? null,
        deptId: scopeDeptId || null,
        unitId: scopeUnitId || null,
      };
    }
    return {
      orgId: scopeOrgId || null,
      deptId: scopeDeptId || null,
      unitId: scopeUnitId || null,
    };
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    if (!confirm(a.confirmDelete)) return;
    try {
      if (useGamificationApi && canManageApi) {
        await deleteChallengeApi(challengeId).unwrap();
        await refetch();
      } else {
        dispatch(deleteChallenge(challengeId));
      }
    } catch {
      toast.error(a.toastDeleteError);
    }
  };

  const handleEditChallenge = (challenge: Challenge) => {
    setScopeOrgId(challenge.orgId ?? '');
    setScopeUnitId(challenge.unitId ?? '');
    setScopeDeptId(challenge.deptId ?? '');
    setEditingChallenge(challenge);
  };

  const handleSaveChallenge = async (newChallenge: Partial<Challenge>) => {
    const { orgId, deptId, unitId } = resolvePublishScope();
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
      unitId,
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
          unitId,
        }).unwrap();
        await refetch();
      } else {
        dispatch(addChallenge(challenge));
      }
      setIsCreating(false);
      toast.success(a.toastCreated);
    } catch {
      toast.error(a.toastSaveError);
    }
  };

  const handleUpdateChallenge = async (partial: Partial<Challenge>) => {
    if (!editingChallenge) return;
    const { orgId, deptId, unitId } = resolvePublishScope();
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
      unitId,
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
          unitId,
        }).unwrap();
        await refetch();
      } else {
        dispatch(updateChallenge({ id: editingChallenge.id, challenge: merged }));
      }
      setEditingChallenge(null);
      toast.success(a.toastUpdated);
    } catch {
      toast.error(a.toastUpdateError);
    }
  };

  const getStatusStyle = (isArchived: boolean) =>
    isArchived ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';

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
        return 'text-neutral-700 bg-neutral-100';
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
            scopeUnitId={scopeUnitId}
            onOrgChange={(id) => {
              setScopeOrgId(id);
              setScopeDeptId('');
              setScopeUnitId('');
            }}
            onDeptChange={setScopeDeptId}
            onUnitChange={setScopeUnitId}
            organizations={superOrgs}
            departments={superDepartments}
            units={superUnits}
            authoring={a}
          />
        )}
        {useGamificationApi && canManageApi && currentUser.user_type === 'ORG_ADMIN' && (
          <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/50 p-5 shadow-sm space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-emerald-950" htmlFor="org-admin-scope-unit">
                  {a.unitLabel}{' '}
                  <span className="font-normal text-emerald-800/70">{a.optionalSuffix}</span>
                </label>
                <select
                  id="org-admin-scope-unit"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25"
                  value={scopeUnitId}
                  onChange={(e) => setScopeUnitId(e.target.value)}
                >
                  <option value="">Whole organization (all branches)</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-emerald-950" htmlFor="org-admin-scope-dept">
                  {a.departmentLabel}{' '}
                  <span className="font-normal text-emerald-800/70">{a.optionalSuffix}</span>
                </label>
                <select
                  id="org-admin-scope-dept"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25"
                  value={scopeDeptId}
                  onChange={(e) => setScopeDeptId(e.target.value)}
                >
                  <option value="">{a.wholeOrgDepts}</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        {useGamificationApi && canManageApi && currentUser.user_type === 'UNIT_ADMIN' && (
          <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/50 p-5 shadow-sm space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-emerald-950" htmlFor="unit-admin-target-unit">
                  {a.unitLabel}
                </label>
                <select
                  id="unit-admin-target-unit"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25"
                  value={scopeUnitId}
                  onChange={(e) => setScopeUnitId(e.target.value)}
                >
                  <option value={currentUser.unitId || ""}>Your Branch (Self)</option>
                  {units.filter(u => u.id !== currentUser.unitId).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-emerald-950" htmlFor="unit-admin-scope-dept">
                  {a.departmentLabel}{' '}
                  <span className="font-normal text-emerald-800/70">{a.optionalSuffix}</span>
                </label>
                <select
                  id="unit-admin-scope-dept"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25"
                  value={scopeDeptId}
                  onChange={(e) => setScopeDeptId(e.target.value)}
                >
                  <option value="">Whole Branch</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="mt-4 text-xs text-emerald-800/70">
              {a.deptAdminEditNote.replace(a.departmentLabel, 'Branch / Department')}
            </p>
          </div>
        )}
        {useGamificationApi && canManageApi && currentUser.user_type === 'DEPT_ADMIN' && (
          <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/50 p-5 shadow-sm">
            <div className="max-w-md">
              <label className="mb-1.5 block text-xs font-semibold text-emerald-950">
                {a.departmentLabel}
              </label>
              <div className="rounded-lg border border-emerald-200 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm">
                {departments.find(d => d.id === currentUser.deptId)?.name || currentUser.deptId || 'Your Department'}
              </div>
              <p className="mt-2 text-xs text-emerald-800/70">
                {a.deptAdminEditNote}
              </p>
            </div>
          </div>
        )}
        <CreateChallenge
          key={editingChallenge.id}
          initialChallenge={editingChallenge}
          onSave={handleUpdateChallenge}
          onCancel={() => setEditingChallenge(null)}
        />
        {updatingApi && <p className="text-sm text-neutral-500">{a.savingServer}</p>}
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
            scopeUnitId={scopeUnitId}
            onOrgChange={(id) => {
              setScopeOrgId(id);
              setScopeDeptId('');
              setScopeUnitId('');
            }}
            onDeptChange={setScopeDeptId}
            onUnitChange={setScopeUnitId}
            organizations={superOrgs}
            departments={superDepartments}
            units={superUnits}
            authoring={a}
          />
        )}
        {useGamificationApi && canManageApi && currentUser.user_type === 'ORG_ADMIN' && (
          <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/50 p-5 shadow-sm space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-emerald-950" htmlFor="org-admin-scope-unit-create">
                  {a.unitLabel}{' '}
                  <span className="font-normal text-emerald-800/70">{a.optionalSuffix}</span>
                </label>
                <select
                  id="org-admin-scope-unit-create"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25"
                  value={scopeUnitId}
                  onChange={(e) => setScopeUnitId(e.target.value)}
                >
                  <option value="">Whole organization (all branches)</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-emerald-950" htmlFor="org-admin-scope-dept-create">
                  {a.departmentLabel}{' '}
                  <span className="font-normal text-emerald-800/70">{a.optionalSuffix}</span>
                </label>
                <select
                  id="org-admin-scope-dept-create"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25"
                  value={scopeDeptId}
                  onChange={(e) => setScopeDeptId(e.target.value)}
                >
                  <option value="">{a.wholeOrgDepts}</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        {useGamificationApi && canManageApi && currentUser.user_type === 'UNIT_ADMIN' && (
          <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/50 p-5 shadow-sm space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-emerald-950" htmlFor="unit-admin-target-unit-create">
                  {a.unitLabel}
                </label>
                <select
                  id="unit-admin-target-unit-create"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25"
                  value={scopeUnitId}
                  onChange={(e) => setScopeUnitId(e.target.value)}
                >
                  <option value={currentUser.unitId || ""}>Your Branch (Self)</option>
                  {units.filter(u => u.id !== currentUser.unitId).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-emerald-950" htmlFor="unit-admin-scope-dept-create">
                  {a.departmentLabel}{' '}
                  <span className="font-normal text-emerald-800/70">{a.optionalSuffix}</span>
                </label>
                <select
                  id="unit-admin-scope-dept-create"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25"
                  value={scopeDeptId}
                  onChange={(e) => setScopeDeptId(e.target.value)}
                >
                  <option value="">Whole Branch</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="mt-4 text-xs text-emerald-800/70">
              {a.deptAdminCreateNote.replace(a.departmentLabel, 'Branch / Department')}
            </p>
          </div>
        )}
        {useGamificationApi && canManageApi && currentUser.user_type === 'DEPT_ADMIN' && (
          <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/50 p-5 shadow-sm">
            <div className="max-w-md">
              <label className="mb-1.5 block text-xs font-semibold text-emerald-950">
                {a.departmentLabel}
              </label>
              <div className="rounded-lg border border-emerald-200 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm">
                {departments.find(d => d.id === currentUser.deptId)?.name || currentUser.deptId || 'Your Department'}
              </div>
              <p className="mt-2 text-xs text-emerald-800/70">
                {a.deptAdminCreateNote}
              </p>
            </div>
          </div>
        )}
        <CreateChallenge
          onSave={handleSaveChallenge}
          onCancel={() => setIsCreating(false)}
        />
        {creatingApi && <p className="text-sm text-neutral-500">{a.savingServer}</p>}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-neutral-200 overflow-hidden">
      <div className="flex w-full border-b border-neutral-200 bg-neutral-50/50">
        <button
          onClick={() => setActiveTopTab('organization')}
          className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
            activeTopTab === 'organization'
              ? 'text-emerald-700 bg-white border-b-4 border-emerald-600'
              : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100/50'
          }`}
        >
          {['UNIT_ADMIN', 'DEPT_ADMIN'].includes(currentUser.user_type || '') ? 'Organization (Read-Only)' : a.tabOrganization}
        </button>
        <button
          onClick={() => setActiveTopTab('departments')}
          className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
            activeTopTab === 'departments'
              ? 'text-emerald-700 bg-white border-b-4 border-emerald-600'
              : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100/50'
          }`}
        >
          {currentUser.user_type === 'UNIT_ADMIN' ? 'Branch & Departments' : a.tabDepartments}
        </button>
        <button
          onClick={() => setActiveTopTab('global')}
          className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
            activeTopTab === 'global'
              ? 'text-emerald-700 bg-white border-b-4 border-emerald-600'
              : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100/50'
          }`}
        >
          {a.tabGlobal}
        </button>
      </div>

      <div className="p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h2 className="text-lg font-semibold text-neutral-800">
            {activeTopTab === 'global' ? a.tabGlobal : activeTopTab === 'departments' ? a.tabDepartments : a.tabOrganization}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            {activeTopTab === 'global' 
              ? a.scopeGlobalSubtitle 
              : interpolate(a.showingChallenges, { shown: filteredChallenges.length, total: filteredChallenges.length })}
          </p>
        </div>
        {(() => {
          const isDeptOrUnitAdmin = currentUser.user_type === 'DEPT_ADMIN' || currentUser.user_type === 'UNIT_ADMIN';
          const isSuper = currentUser.user_type === 'SUPERADMIN';
          
          let canCreateOnThisTab = false;
          if (isSuper) canCreateOnThisTab = true;
          else if (activeTopTab === 'global') canCreateOnThisTab = false; // Only superadmin creates global
          else if (activeTopTab === 'departments') canCreateOnThisTab = true; // All admins can create for their scope
          else if (activeTopTab === 'organization') {
            // Only Org Admin (and Super) can create Org-wide
            canCreateOnThisTab = currentUser.user_type === 'ORG_ADMIN';
          }

          if (!canCreateOnThisTab) return null;

          return (
            <button
              onClick={() => setIsCreating(true)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center transition shadow-sm"
            >
              <PlusCircle size={16} className="mr-2" />
              {a.createChallenge}
            </button>
          );
        })()}
      </div>

      <div className="p-6 border-b bg-neutral-50/30">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative w-full md:w-64">
            <label htmlFor={challengeListSearchId} className="sr-only">
              {a.searchSrOnly}
            </label>
            <input
              id={challengeListSearchId}
              type="text"
              placeholder={a.searchSrOnly}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={16} className="absolute left-3 top-2.5 text-neutral-400 pointer-events-none" aria-hidden />
          </div>

          <div className="relative w-full md:w-48">
            <select
              className="w-full pl-4 pr-10 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none text-sm bg-white"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              {challengeTypes.map((type) => (
                <option key={type} value={type}>
                  {type === 'all' ? a.allTypes : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-2.5 text-neutral-400 pointer-events-none" />
          </div>

          {activeTopTab === 'organization' && (
            <div className="relative w-full md:w-56">
              <select
                className="w-full pl-4 pr-10 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none text-sm bg-white"
                value={filterScope}
                onChange={(e) => setFilterScope(e.target.value as typeof filterScope)}
              >
                <option value="all">{a.filterScopeAll}</option>
                <option value="organization">{a.filterScopeOrg}</option>
                <option value="unit">{a.filterScopeUnit}</option>
                <option value="department">{a.filterScopeDept}</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-2.5 text-neutral-400 pointer-events-none" />
            </div>
          )}

          <div className="relative w-full md:w-44">
            <select
              className="w-full pl-4 pr-10 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none text-sm bg-white"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            >
              <option value="all">{a.statusAll}</option>
              <option value="active">{a.statusActive}</option>
              <option value="archived">{a.statusArchived}</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-2.5 text-neutral-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                {a.thChallenge}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                {a.thScope}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">{a.thType}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">{a.thReward}</th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                title={a.thAttemptsTitle}
              >
                {a.thAttempts}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">{a.thStatus}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{a.thActions}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-100">
            {paginatedChallenges.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-neutral-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Search size={32} className="text-neutral-200" />
                    <p>{a.emptyFilters}</p>
                  </div>
                </td>
              </tr>
            ) : null}
            {paginatedChallenges.map((challenge: Challenge) => {
              const canEdit = canEditChallenge(challenge);
              return (
                <tr key={challenge.id} className="hover:bg-neutral-50/50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center text-neutral-400">
                        <FileText size={20} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-neutral-900">{challenge.title}</div>
                        <div className="text-xs text-neutral-500 max-w-xs truncate">{challenge.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const { title, subtitle } = challengeScopeLines(challenge);
                      return (
                        <div className="space-y-0.5">
                          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight">{title}</div>
                          {subtitle ? <div className="text-xs text-neutral-600 font-medium">{subtitle}</div> : null}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-0.5 inline-flex text-[10px] font-bold rounded-full uppercase tracking-wide ${getChallengeTypeColor(challenge.type)}`}
                    >
                      {challenge.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-amber-600 font-medium text-xs">
                      <Award size={14} className="mr-1" />
                      <span>{interpolate(a.xpReward, { n: challenge.xpReward })}</span>
                    </div>
                    {challenge.reputationReward ? (
                      <div className="flex items-center mt-1 text-blue-600 font-medium text-[10px]">
                        <Award size={14} className="mr-1" />
                        <span>
                          {interpolate(a.reputationReward, { n: challenge.reputationReward ?? 0 })}
                        </span>
                      </div>
                    ) : null}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 font-medium">
                    {(challenge.attemptCount ?? 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 inline-flex text-[10px] font-bold rounded-full uppercase tracking-wide ${getStatusStyle(challenge.isActive === false)}`}
                    >
                      {challenge.isActive === false ? a.statusArchived : a.statusActive}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-1">
                      {canEdit ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEditChallenge(challenge)}
                            className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title={a.thActions}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteChallenge(challenge.id)}
                            className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-neutral-300 font-medium uppercase px-2 py-1">ReadOnly</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-neutral-700">
          {interpolate(a.showingChallenges, {
            shown: paginatedChallenges.length,
            total: filteredChallenges.length,
          })}
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
              className="px-4 py-2 border border-neutral-200 rounded-md text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {a.previous}
            </button>
            <div className="flex items-center px-4 text-sm font-medium text-neutral-700">
              {currentPage} / {totalPages}
            </div>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-neutral-200 rounded-md text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {a.next}
            </button>
          </div>
      </div>
    </div>
  );
}
