import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../../types';
import TrainingSummaryDashboard from './TrainingSummaryDashboard';
import { useI18n } from '../../i18n/I18nContext';

interface AdminSystemReportsHubProps {
  currentUser: User;
}

/** Mirrors `hasPermission` in App.tsx for report access and inline nav hints. */
function hasAdminPermission(user: User, permission: string): boolean {
  if (!user) return false;
  if (user.user_type === 'SUPERADMIN' || user.role === 'superadmin') return true;
  const legacyDeptHead =
    user.role === 'admin' && !!user.deptId && (user.user_type == null || user.user_type === '');
  const isOrgOrDeptConsole =
    ['ORG_ADMIN', 'DEPT_ADMIN'].includes(user.user_type || '') || legacyDeptHead;
  if (permission === 'MANAGE_DEPARTMENTS' && isOrgOrDeptConsole) {
    return true;
  }
  if (permission === 'MANAGE_CHALLENGES' && isOrgOrDeptConsole) {
    return true;
  }
  if (permission === 'MANAGE_EXAMS' && isOrgOrDeptConsole) {
    return true;
  }
  if (permission === 'MANAGE_USERS' && isOrgOrDeptConsole) {
    return true;
  }
  if (permission === 'MANAGE_TERMINOLOGY' && user.user_type === 'ORG_ADMIN') {
    return true;
  }
  return user.permissions?.includes(permission) ?? false;
}

export default function AdminSystemReportsHub({ currentUser }: AdminSystemReportsHubProps) {
  const { messages } = useI18n();
  const ad = messages.admin;
  const nav = messages.nav.items;
  const canReports = hasAdminPermission(currentUser, 'VIEW_REPORTS');

  const navHints = useMemo((): { to: string; label: string }[] => {
    const hints: { to: string; label: string }[] = [];
    if (hasAdminPermission(currentUser, 'MANAGE_CAMPAIGNS')) {
      hints.push({ to: '/admin/campaigns', label: nav.adminCampaigns });
    }
    if (hasAdminPermission(currentUser, 'MANAGE_USERS')) {
      hints.push({ to: '/admin/pending-users', label: nav.adminPendingUsers });
      hints.push({ to: '/admin/users', label: nav.adminUsers });
    }
    if (hasAdminPermission(currentUser, 'IMPORT_USERS')) {
      hints.push({ to: '/admin/import', label: nav.adminImport });
    }
    if (
      hasAdminPermission(currentUser, 'MANAGE_CHALLENGES') ||
      hasAdminPermission(currentUser, 'MANAGE_EXAMS')
    ) {
      hints.push({ to: '/admin/challenges', label: nav.adminChallenges });
    }
    return hints;
  }, [currentUser, nav]);

  return (
    <div className="space-y-8">


      {canReports ? (
        <TrainingSummaryDashboard currentUser={currentUser} />
      ) : (
        <>
          <div>
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-800">{ad.overviewTitle}</h1>
            <p className="max-w-3xl text-sm text-gray-600">{ad.overviewSubtitle}</p>
          </div>
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-5 text-sm text-amber-950 shadow-sm">
            <p className="font-semibold text-amber-900">{ad.noReportsTitle}</p>
            <p className="mt-2 text-amber-900/90">{ad.noReportsBody}</p>
            {navHints.length > 0 && (
              <ul className="mt-4 list-disc space-y-1 pl-5 text-amber-950">
                {navHints.map((h) => (
                  <li key={`${h.to}-${h.label}`}>
                    <Link to={h.to} className="font-medium text-emerald-800 underline-offset-2 hover:underline">
                      {h.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
