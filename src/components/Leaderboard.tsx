import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import type { LeaderboardEntry } from '../data/leaderboardData';
import LeaderboardHeader from './LeaderboardHeader';
import LeaderboardTable from './LeaderboardTable';
import { useGetGamificationLeaderboardQuery } from '../store/apiSlice/practikalApi';
import { useGamificationApi } from '../config/gamification';
import type { GamificationLeaderboardRow, User } from '../types';
import { xpProgressInCurrentTier } from '../utils/gamificationMetrics';

type LbScope = 'org' | 'dept' | 'global';

function mapApiRowToEntry(row: GamificationLeaderboardRow, fallbackOrg: string): LeaderboardEntry {
  const xp = row.xp ?? 0;
  const level = (row.level || 'beginner').toLowerCase();
  return {
    id: row.userId,
    name: row.name?.trim() || 'Learner',
    organization: (row.organizationName && row.organizationName.trim()) || fallbackOrg,
    department: row.departmentName?.trim() || '—',
    rank: level,
    progress: xpProgressInCurrentTier(xp),
    earnings: row.reputation ?? 0,
    xp,
    challenges: row.challengesCompleted ?? 0,
    streak: row.streak ?? 0,
    position: row.rank,
  };
}

function entryFromLocalUser(u: User): LeaderboardEntry {
  const xp = u.xp ?? 0;
  return {
    id: u.id,
    name: u.name,
    organization: u.organization || '—',
    department: '—',
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
  const user = useSelector((state: RootState) => state.auth.user);
  const isSuper = user?.user_type === 'SUPERADMIN';
  const [lbScope, setLbScope] = useState<LbScope>(() => (isSuper ? 'global' : 'org'));

  const leaderboardArgs = useMemo(() => {
    const base: { limit: number; scope: string; org_id?: string; dept_id?: string } = {
      limit: 100,
      scope: lbScope,
    };
    if (lbScope === 'org' || lbScope === 'dept') {
      if (user?.orgId) base.org_id = user.orgId;
      if (lbScope === 'dept' && user?.deptId) base.dept_id = user.deptId;
    }
    return base;
  }, [lbScope, user?.orgId, user?.deptId]);

  const skipLb =
    !useGamificationApi ||
    !user ||
    (lbScope === 'org' && !user.orgId) ||
    (lbScope === 'dept' && (!user.orgId || !user.deptId));

  const { data, isFetching, isSuccess, isError, error } = useGetGamificationLeaderboardQuery(leaderboardArgs, {
    skip: skipLb,
  });

  const apiEntries = useMemo((): LeaderboardEntry[] | null => {
    if (!isSuccess || !data) return null;
    const rows = data.leaderboard as GamificationLeaderboardRow[] | undefined;
    const orgLabel =
      lbScope === 'global'
        ? 'Various organizations'
        : user?.organization?.trim() || 'Your organization';
    return (rows ?? []).map((r) => mapApiRowToEntry(r, orgLabel));
  }, [isSuccess, data, user?.organization, lbScope]);

  if (!user) return null;

  const scopeTitle =
    lbScope === 'global' ? 'Global' : lbScope === 'org' ? 'Your organization' : 'Your department';

  const scopeHelp =
    lbScope === 'global'
      ? 'All organizations (superadmin). Ranked by total XP.'
      : lbScope === 'org'
        ? `Everyone in ${user.organization || 'your organization'}, all departments. Ranked by XP.`
        : 'Learners in your department only. Ranked by XP.';

  const useLive = useGamificationApi && !skipLb && isSuccess && apiEntries !== null;
  const localOnly = !useGamificationApi;
  const localEntries = localOnly ? [entryFromLocalUser(user)] : null;

  const needsOrg =
    useGamificationApi && user && !user.orgId && lbScope !== 'global' && !isSuper;

  const loadingInCard = useGamificationApi && !skipLb && isFetching && !data;

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <LeaderboardHeader user={user} organizationLabel={user.organization} scopeLabel={scopeTitle} />

      {useGamificationApi && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              lbScope === 'org' ? 'bg-emerald-600 text-white' : 'bg-white border text-gray-700'
            }`}
            onClick={() => setLbScope('org')}
            disabled={!user.orgId}
          >
            Organization
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              lbScope === 'dept' ? 'bg-emerald-600 text-white' : 'bg-white border text-gray-700'
            }`}
            onClick={() => setLbScope('dept')}
            disabled={!user.deptId}
          >
            Department
          </button>
          {isSuper && (
            <button
              type="button"
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                lbScope === 'global' ? 'bg-emerald-600 text-white' : 'bg-white border text-gray-700'
              }`}
              onClick={() => setLbScope('global')}
            >
              Global
            </button>
          )}
        </div>
      )}

      {needsOrg && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-sm px-4 py-3 mb-4">
          Your account is not linked to an organization in Practikal. Ask an admin to assign you to an org to see the
          live leaderboard.
        </div>
      )}

      {isError && useGamificationApi && !skipLb && (
        <p className="text-sm text-red-600 mb-4" role="alert">
          Could not load leaderboard.
          {'message' in (error as object) ? ` ${String((error as { message?: string }).message)}` : ''}
        </p>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        {localOnly ? (
          <>
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
              API mode is off — showing only your profile stats. Enable the gamification API to load your organization
              leaderboard.
            </p>
            <LeaderboardTable
              teamData={localEntries!}
              companyData={localEntries!}
              worldwideData={localEntries!}
              userId={user.id}
              hideScopeTabs
            />
          </>
        ) : loadingInCard ? (
          <p className="text-sm text-gray-500">Loading leaderboard…</p>
        ) : useLive ? (
          <>
            <p className="text-sm text-gray-600 mb-4">{scopeHelp}</p>
            {apiEntries!.length === 0 ? (
              <p className="text-sm text-gray-500">
                No learners in this scope yet — complete a challenge to appear here.
              </p>
            ) : (
              <LeaderboardTable
                teamData={apiEntries!}
                companyData={apiEntries!}
                worldwideData={apiEntries!}
                userId={user.id}
                hideScopeTabs
              />
            )}
          </>
        ) : useGamificationApi && skipLb ? (
          <p className="text-sm text-gray-500">
            Choose a scope above, or link your account to an organization to load rankings.
          </p>
        ) : (
          <p className="text-sm text-gray-500">Leaderboard is unavailable. Try again later.</p>
        )}
      </div>
    </div>
  );
}
