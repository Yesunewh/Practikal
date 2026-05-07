import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import type { LeaderboardEntry } from '../data/leaderboardData';
import LeaderboardHeader from './LeaderboardHeader';
import LeaderboardTable from './LeaderboardTable';
import { useGetGamificationLeaderboardQuery, useGetUnitTreeQuery, useGetDepartmentsQuery } from '../store/apiSlice/practikalApi';
import { useGamificationApi } from '../config/gamification';
import type { GamificationLeaderboardRow, User } from '../types';
import { xpProgressInCurrentTier } from '../utils/gamificationMetrics';
import { useI18n } from '../i18n/I18nContext';
import { interpolate } from '../i18n/messages';
import { Filter, Building2 } from 'lucide-react';

type LbScope = 'org' | 'dept' | 'global' | 'unit' | 'unit_subtree' | 'branch_compare' | 'branch_compare_top' | 'dept_compare';
type LbType = 'user' | 'branch' | 'branch_top' | 'dept';

function mapApiRowToEntry(
  row: GamificationLeaderboardRow,
  fallbackOrg: string,
  learnerFallback: string,
  deptDash: string,
): LeaderboardEntry {
  const xp = row.xp ?? 0;
  const level = (row.level || 'beginner').toLowerCase();
  
  if (row.isGroup) {
    return {
      id: row.id,
      name: row.name || 'Unknown',
      organization: fallbackOrg,
      department: row.type === 'branch' ? 'Branch' : 'Department',
      rank: 'group',
      progress: 0,
      earnings: 0,
      xp,
      challenges: row.userCount ?? 0,
      streak: 0,
      position: row.rank,
    };
  }

  return {
    id: row.userId,
    name: row.name?.trim() || learnerFallback,
    organization: (row.organizationName && row.organizationName.trim()) || fallbackOrg,
    department: row.departmentName?.trim() || deptDash,
    rank: level,
    progress: xpProgressInCurrentTier(xp),
    earnings: row.reputation ?? 0,
    xp,
    challenges: row.challengesCompleted ?? 0,
    streak: row.streak ?? 0,
    position: row.rank,
  };
}

function entryFromLocalUser(u: User, orgDash: string, deptDash: string): LeaderboardEntry {
  const xp = u.xp ?? 0;
  return {
    id: u.id,
    name: u.name,
    organization: u.organization || orgDash,
    department: deptDash,
    rank: (u.level || 'beginner').toLowerCase(),
    progress: xpProgressInCurrentTier(xp),
    earnings: u.reputation ?? 0,
    xp,
    challenges: u.completedChallenges?.length ?? 0,
    streak: u.streak ?? 0,
    position: 1,
  };
}

export default function Leaderboard() {
  const { messages } = useI18n();
  const lb = messages.leaderboard;
  const com = messages.common;
  const user = useSelector((state: RootState) => state.auth.user);
  const isSuper = user?.user_type === 'SUPERADMIN';
  const [lbType, setLbType] = useState<LbType>('user');
  const [lbScope, setLbScope] = useState<LbScope>(() => (isSuper || !user?.orgId ? 'global' : 'org'));
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const leaderboardArgs = useMemo(() => {
    const base: { limit: number; offset: number; scope: string; org_id?: string; dept_id?: string; unit_id?: string } = {
      limit: pageSize,
      offset: (page - 1) * pageSize,
      scope: lbType === 'branch' 
        ? 'branch_compare' 
        : lbType === 'branch_top'
          ? 'branch_compare_top'
          : lbType === 'dept' 
            ? 'dept_compare' 
            : lbScope,
    };
    if (user?.orgId) base.org_id = user.orgId;
    
    if (lbType === 'user') {
      if (lbScope === 'dept' && (selectedDeptId || user?.deptId)) {
        base.dept_id = selectedDeptId || user?.deptId;
      }
      if ((lbScope === 'unit' || lbScope === 'unit_subtree') && (selectedUnitId || user?.unit_id)) {
        base.unit_id = selectedUnitId || user?.unit_id;
      }
    }
    
    return base;
  }, [lbType, lbScope, selectedUnitId, selectedDeptId, user?.orgId, user?.deptId, user?.unit_id, page]);

  const { data: unitsData } = useGetUnitTreeQuery(user?.orgId, { skip: !user?.orgId || !['SUPERADMIN', 'ORG_ADMIN', 'UNIT_ADMIN'].includes(user.user_type) });
  const { data: deptsData } = useGetDepartmentsQuery(user?.orgId, { skip: !user?.orgId || !['SUPERADMIN', 'ORG_ADMIN', 'UNIT_ADMIN', 'DEPT_ADMIN'].includes(user.user_type) });

  const handleScopeChange = (newScope: LbScope) => {
    setLbScope(newScope);
    setPage(1);
  };

  const skipLb =
    !useGamificationApi ||
    !user ||
    (lbScope === 'org' && !user.orgId) ||
    (lbScope === 'dept' && !selectedDeptId && !user?.deptId) ||
    ((lbScope === 'unit' || lbScope === 'unit_subtree') && !selectedUnitId && !user?.unit_id);

  const { data, isFetching, isSuccess, isError, error } = useGetGamificationLeaderboardQuery(leaderboardArgs, {
    skip: skipLb,
  });

  const apiEntries = useMemo((): LeaderboardEntry[] | null => {
    if (!isSuccess || !data) return null;
    const rows = data.leaderboard as any[] | undefined;
    const orgLabel =
      lbScope === 'global' ? lb.variousOrgs : user?.organization?.trim() || lb.orgFallback;
    return (rows ?? []).map((r) => mapApiRowToEntry(r, orgLabel, com.learner, com.dash));
  }, [isSuccess, data, user?.organization, lbScope, lb.variousOrgs, lb.orgFallback, com.learner, com.dash]);

  if (!user) return null;

  const scopeHelp =
    lbType === 'branch' ? "Ranking branches by total XP." :
    lbType === 'dept' ? "Ranking departments by total XP." :
    lbScope === 'global'
      ? lb.scopeHelpGlobal
      : lbScope === 'org'
        ? interpolate(lb.scopeHelpOrg, { org: user.organization || lb.orgFallback })
        : lbScope === 'dept'
          ? lb.scopeHelpDept
          : lbScope === 'unit_subtree'
            ? "Ranking all learners within this branch and its sub-branches."
            : "Learners in the selected branch.";

  const useLive = useGamificationApi && !skipLb && isSuccess && apiEntries !== null;
  const localOnly = !useGamificationApi;
  const localEntries = localOnly ? [entryFromLocalUser(user, com.dash, com.dash)] : null;

  const needsOrg =
    useGamificationApi && user && !user.orgId && lbScope !== 'global' && !isSuper;

  const needsSelection =
    useGamificationApi &&
    user &&
    ((lbScope === 'dept' && !selectedDeptId && !user?.deptId) ||
      ((lbScope === 'unit' || lbScope === 'unit_subtree') && !selectedUnitId && !user?.unit_id));

  const loadingInCard = useGamificationApi && !skipLb && isFetching && !data;

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <LeaderboardHeader user={user} />

      {useGamificationApi && (
        <div className="flex flex-col gap-4 mb-6">
          {/* Main Tabs */}
          <div className="flex border-b border-gray-200">
            {user?.orgId && (
              <button
                className={`px-6 py-3 text-sm font-bold transition-all ${
                  lbType === 'user' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => { setLbType('user'); setPage(1); }}
              >
                {lb.tabLearners}
              </button>
            )}
            {user?.orgId && (
              <>
                <button
                  className={`px-6 py-3 text-sm font-bold transition-all ${
                    lbType === 'branch' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => { setLbType('branch'); setPage(1); }}
                >
                  {lb.tabByBranch}
                </button>
                <button
                  className={`px-6 py-3 text-sm font-bold transition-all ${
                    lbType === 'dept' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => { setLbType('dept'); setPage(1); }}
                >
                  {lb.tabByDept}
                </button>
                <button
                  className={`px-6 py-3 text-sm font-bold transition-all ${
                    lbType === 'branch_top' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => { setLbType('branch_top'); setPage(1); }}
                >
                  Compare Top Branches
                </button>
              </>
            )}
          </div>

          {/* Sub-tabs / Scopes (only for User type) */}
          {lbType === 'user' && (
            <div className="flex flex-wrap items-center gap-2">
              {user?.orgId && (
                <>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      lbScope === 'org' ? 'bg-emerald-600 text-white' : 'bg-white border text-gray-700'
                    }`}
                    onClick={() => handleScopeChange('org')}
                  >
                    {lb.btnOrganization}
                  </button>
                  
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      lbScope === 'dept' ? 'bg-emerald-600 text-white' : 'bg-white border text-gray-700'
                    }`}
                    onClick={() => handleScopeChange('dept')}
                  >
                    {lb.btnDepartment}
                  </button>

                  <button
                    type="button"
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      lbScope === 'unit' ? 'bg-emerald-600 text-white' : 'bg-white border text-gray-700'
                    }`}
                    onClick={() => handleScopeChange('unit')}
                  >
                    {lb.btnBranch}
                  </button>

                  <button
                    type="button"
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      lbScope === 'unit_subtree' ? 'bg-emerald-600 text-white' : 'bg-white border text-gray-700'
                    }`}
                    onClick={() => handleScopeChange('unit_subtree')}
                  >
                    Branch Subtree
                  </button>
                </>
              )}

              {user?.orgId && (
                <button
                  type="button"
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    lbScope === 'global' ? 'bg-emerald-600 text-white' : 'bg-white border text-gray-700'
                  }`}
                  onClick={() => handleScopeChange('global')}
                >
                  {lb.btnGlobal}
                </button>
              )}

              {/* Admin Selectors */}
              {['SUPERADMIN', 'ORG_ADMIN', 'UNIT_ADMIN'].includes(user.user_type) && (
                <div className="flex items-center gap-2 ml-auto">
                  <Filter className="w-4 h-4 text-gray-400" />
                  {lbScope === 'unit' && unitsData?.data && (
                    <select
                      className="text-xs border rounded-md px-2 py-1.5 bg-white"
                      value={selectedUnitId}
                      onChange={(e) => { setSelectedUnitId(e.target.value); setPage(1); }}
                    >
                      <option value="">{user.unit_id ? "Your Branch" : "Select Branch..."}</option>
                      {(() => {
                        const flatten = (items: any[]): any[] => {
                          let res: any[] = [];
                          items.forEach(u => {
                            res.push(u);
                            if (u.SubUnits?.length) res = [...res, ...flatten(u.SubUnits)];
                            if (u.children?.length) res = [...res, ...flatten(u.children)];
                          });
                          return res;
                        };
                        return flatten(unitsData.data).map((u: any) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ));
                      })()}
                    </select>
                  )}
                  {lbScope === 'dept' && deptsData?.depts && (
                    <select
                      className="text-xs border rounded-md px-2 py-1.5 bg-white"
                      value={selectedDeptId}
                      onChange={(e) => { setSelectedDeptId(e.target.value); setPage(1); }}
                    >
                      <option value="">{user.deptId ? "Your Dept" : "Select Dept..."}</option>
                      {deptsData.depts.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {needsOrg ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{lb.needsOrg}</h2>
          <p className="text-gray-500 max-w-md mx-auto">Your account is not linked to an organization. Ask an admin to assign you to an organization to see the live leaderboard.</p>
        </div>
      ) : needsSelection ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {lbScope === 'dept' ? "Please select a department" : "Please select a branch"}
          </h2>
          <p className="text-gray-500">Use the filter dropdown above to view the leaderboard for a specific group.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {isError && useGamificationApi && !skipLb && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-6">
              <p className="text-sm font-bold text-red-800 mb-1">{lb.loadError}</p>
              <p className="text-xs text-red-600">
                {(error as any)?.data?.message || (error as any)?.message || lb.unavailable}
              </p>
            </div>
          )}

          {localOnly ? (
            <>
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
                {lb.apiOff}
              </p>
              <LeaderboardTable
                teamData={localEntries!}
                companyData={localEntries!}
                worldwideData={localEntries!}
                userId={user.id}
                hideScopeTabs
                currentPage={page}
                onPageChange={setPage}
                pageSize={pageSize}
              />
            </>
          ) : loadingInCard ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">{lb.loading}</p>
            </div>
          ) : useLive ? (
            <>
              {/* <p className="text-sm text-gray-600 mb-4">{scopeHelp}</p> */}
              {apiEntries!.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-gray-500">{lb.emptyScope}</p>
                </div>
              ) : (
                <LeaderboardTable
                  teamData={apiEntries!}
                  companyData={apiEntries!}
                  worldwideData={apiEntries!}
                  userId={user.id}
                  hideScopeTabs
                  currentPage={page}
                  onPageChange={setPage}
                  pageSize={pageSize}
                />
              )}
            </>
          ) : (
            <div className="py-20 text-center">
              <p className="text-gray-500">{lb.unavailable}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
