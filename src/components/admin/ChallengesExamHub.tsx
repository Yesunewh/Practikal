import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User } from '../../types';
import { FileQuestion, FileText } from 'lucide-react';
import ExamBank from './ExamBank';
import ChallengeManagement from './ChallengeManagement';

interface ChallengesExamHubProps {
  currentUser: User;
}

type HubTab = 'bank' | 'authoring';

function accessFlags(user: User) {
  const isSuperRole = user.role === 'superadmin';
  const legacyDeptHead =
    user.role === 'admin' && !!user.deptId && (user.user_type == null || user.user_type === '');
  const isOrgOrDeptConsole =
    ['ORG_ADMIN', 'DEPT_ADMIN'].includes(user.user_type || '') || legacyDeptHead;
  const perms = user.permissions ?? [];

  const canAuthor =
    isSuperRole || user.user_type === 'SUPERADMIN' || isOrgOrDeptConsole || perms.includes('MANAGE_CHALLENGES');

  const canBank =
    isSuperRole ||
    user.user_type === 'SUPERADMIN' ||
    isOrgOrDeptConsole ||
    perms.includes('MANAGE_EXAMS') ||
    perms.includes('MANAGE_CHALLENGES') ||
    canAuthor;

  return { canAuthor, canBank };
}

export default function ChallengesExamHub({ currentUser }: ChallengesExamHubProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { canAuthor, canBank } = useMemo(() => accessFlags(currentUser), [currentUser]);

  const validTabs = useMemo(() => {
    const t: HubTab[] = [];
    if (canBank) t.push('bank');
    if (canAuthor) t.push('authoring');
    return t;
  }, [canBank, canAuthor]);

  const tabFromUrl = (searchParams.get('tab') || '').toLowerCase();
  const activeTab: HubTab =
    tabFromUrl === 'authoring' && canAuthor
      ? 'authoring'
      : tabFromUrl === 'bank' && canBank
        ? 'bank'
        : validTabs[0] || 'bank';

  useEffect(() => {
    if (validTabs.length === 0) return;
    const raw = (searchParams.get('tab') || '').toLowerCase();
    if (raw === 'authoring' && !canAuthor) {
      setSearchParams({ tab: validTabs[0] }, { replace: true });
      return;
    }
    if (raw === 'bank' && !canBank) {
      setSearchParams({ tab: validTabs[0] }, { replace: true });
    }
  }, [searchParams, validTabs, canAuthor, canBank, setSearchParams]);

  const setTab = useCallback(
    (tab: HubTab) => {
      if (tab === 'bank' && !canBank) return;
      if (tab === 'authoring' && !canAuthor) return;
      setSearchParams({ tab }, { replace: true });
    },
    [canBank, canAuthor, setSearchParams],
  );

  if (validTabs.length === 0) {
    return (
      <div className="rounded-xl border border-amber-100 bg-amber-50 p-6 text-amber-900">
        <p className="font-semibold">No access</p>
        <p className="mt-1 text-sm">You need Exam Bank or Custom Challenges permission to use this page.</p>
      </div>
    );
  }

  const showTabs = validTabs.length > 1;

  return (
    <div className="space-y-4">
      {showTabs && (
        <div className="flex flex-wrap gap-2 rounded-2xl border border-gray-200/80 bg-white p-1.5 shadow-sm">
          {canBank && (
            <button
              type="button"
              onClick={() => setTab('bank')}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:flex-none ${
                activeTab === 'bank'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FileQuestion size={18} className="shrink-0" aria-hidden />
              Exam bank
            </button>
          )}
          {canAuthor && (
            <button
              type="button"
              onClick={() => setTab('authoring')}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:flex-none ${
                activeTab === 'authoring'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FileText size={18} className="shrink-0" aria-hidden />
              Authoring
            </button>
          )}
        </div>
      )}

      {canBank && activeTab === 'bank' && (
        <ExamBank
          currentUser={currentUser}
          onRequestAuthoring={canAuthor ? () => setTab('authoring') : undefined}
          canAuthorChallenges={canAuthor}
        />
      )}

      {canAuthor && activeTab === 'authoring' && <ChallengeManagement currentUser={currentUser} />}
    </div>
  );
}
