import { useLocation, Navigate } from 'react-router-dom';
import { User } from '../../types';

import UserManagement from './UserManagement';
import SystemSettings from './SystemSettings';
import ChallengesExamHub from './ChallengesExamHub';
import UserProgressReport from './UserProgressReport';
import CampaignAssignments from './CampaignAssignments';
import OrgManagement from './OrgManagement';
import DepartmentManagement from './DepartmentManagement';
import BranchManagement from './BranchManagement';
import RoleManagement from './RoleManagement';
import UnitTypeConfigurator from './UnitTypeConfigurator';
import PermissionManager from './PermissionManager';
import BulkUserImport from './BulkUserImport';
import PendingRegistrations from './PendingRegistrations';
import AdminSystemReportsHub from './AdminSystemReportsHub';
import OrgDetails from './OrgDetails';
import CategoryManagement from './CategoryManagement';

import { downloadCsv } from '../../utils/csv';
import { reviveAttempts } from '../../utils/progressCalculations';
import { isSuperAdminUser } from '../../utils/authIdentity';

interface AdminDashboardProps {
  currentUser: User;
  onBack?: () => void;
}

export default function AdminDashboard({ currentUser, onBack }: AdminDashboardProps) {
  const location = useLocation();

  if (location.pathname === '/admin/exams') {
    return <Navigate to="/admin/challenges?tab=bank" replace />;
  }

  // Derive activeTab from URL
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/admin') return 'overview';
    const sub = path.replace('/admin/', '');
    if (sub === 'exams') return 'challenges';
    // Mapping for UI naming consistency
    if (sub === 'import') return 'bulk';
    if (sub === 'pending-users') return 'pending-users';
    // Sidebar links to /admin/campaigns; content lives under the legacy "assignments" tab id
    if (sub === 'campaigns') return 'assignments';
    if (sub === 'departments') return 'departments';
    if (sub.startsWith('organizations/')) return 'org-details';
    return sub;
  };

  const activeTab = getActiveTab();
  const orgSlug = activeTab === 'org-details' ? location.pathname.replace('/admin/organizations/', '') : null;

  const isSuperAdmin = isSuperAdminUser(currentUser);
  
  const legacyDeptHeadConsole =
    currentUser.role === 'admin' &&
    !!currentUser.deptId &&
    (currentUser.user_type == null || currentUser.user_type === '');
  const isOrgAdmin = currentUser.user_type === 'ORG_ADMIN' || (currentUser.role === 'admin' && currentUser.orgId && !currentUser.user_type && !legacyDeptHeadConsole && !isSuperAdmin);
  const isDeptHead = currentUser.user_type === 'DEPT_ADMIN' || legacyDeptHeadConsole;
  const isBranchAdmin = currentUser.user_type === 'UNIT_ADMIN';

  const checkPerm = (p: string) => {
    if (isSuperAdmin) return true;
    if (currentUser.permissions?.includes(p)) return true;
    if (['MANAGE_TENANTS', 'MANAGE_SYSTEM'].includes(p)) return false;
    if (['MANAGE_USERS', 'IMPORT_USERS', 'VIEW_REPORTS'].includes(p)) return isOrgAdmin || isDeptHead || isBranchAdmin;
    if (p === 'MANAGE_DEPARTMENTS') return isOrgAdmin;
    if (p === 'MANAGE_EXAMS') return isOrgAdmin || isDeptHead;
    if (['MANAGE_CAMPAIGNS', 'MANAGE_CHALLENGES'].includes(p)) return isOrgAdmin || isDeptHead || isBranchAdmin;
    if (['MANAGE_TERMINOLOGY', 'MANAGE_ROLES', 'MANAGE_PERMISSIONS', 'MANAGE_HIERARCHY'].includes(p)) return isOrgAdmin;
    return false;
  };

  const hasTabAccess = () => {
    // SuperAdmin restrictions: block them from accessing these routes directly
    if (isSuperAdmin && ['departments', 'terminology', 'hierarchy', 'bulk', 'reports'].includes(activeTab)) {
      return false;
    }

    switch (activeTab) {
      case 'overview': return true; // Fallback route
      case 'users': return checkPerm('MANAGE_USERS');
      case 'challenges': return checkPerm('MANAGE_EXAMS') || checkPerm('MANAGE_CHALLENGES');
      case 'reports': return checkPerm('VIEW_REPORTS');
      case 'assignments': return checkPerm('MANAGE_CAMPAIGNS');
      case 'settings': return isSuperAdmin;
      case 'organizations': return checkPerm('MANAGE_TENANTS');
      case 'org-details': return checkPerm('MANAGE_TENANTS');
      case 'departments': return checkPerm('MANAGE_DEPARTMENTS');
      case 'terminology': return checkPerm('MANAGE_TERMINOLOGY');
      case 'hierarchy': return checkPerm('MANAGE_HIERARCHY');
      case 'roles': return checkPerm('MANAGE_ROLES');
      case 'permissions': return checkPerm('MANAGE_PERMISSIONS');
      case 'bulk': return checkPerm('IMPORT_USERS');
      case 'pending-users': return checkPerm('MANAGE_USERS');
      case 'categories': return isSuperAdmin;
      default: return true;
    }
  };

  if (!hasTabAccess() && activeTab !== 'overview') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="flex w-full min-h-screen flex-col bg-gray-50">
      <div className="min-h-0 flex-1 overflow-auto transition-all duration-300">
        <main className="p-4 sm:p-6">
          {activeTab === 'overview' && checkPerm('VIEW_REPORTS') && <AdminSystemReportsHub currentUser={currentUser} />}
          
          {activeTab === 'users' && checkPerm('MANAGE_USERS') && (
            <UserManagement currentUser={currentUser} />
          )}
          
          {activeTab === 'challenges' && (checkPerm('MANAGE_EXAMS') || checkPerm('MANAGE_CHALLENGES')) && <ChallengesExamHub currentUser={currentUser} />}
          
          {activeTab === 'reports' && checkPerm('VIEW_REPORTS') && (
            <UserProgressReport currentUser={currentUser} />
          )}

          {activeTab === 'assignments' && checkPerm('MANAGE_CAMPAIGNS') && (
            <CampaignAssignments currentUser={currentUser} />
          )}
          
          {activeTab === 'settings' && isSuperAdmin && (
            <SystemSettings currentUser={currentUser} />
          )}

          {activeTab === 'organizations' && checkPerm('MANAGE_TENANTS') && (
            <OrgManagement />
          )}

          {activeTab === 'org-details' && checkPerm('MANAGE_TENANTS') && orgSlug && (
            <OrgDetails orgSlug={orgSlug} />
          )}

          {activeTab === 'departments' && checkPerm('MANAGE_DEPARTMENTS') && (
            <DepartmentManagement currentUser={currentUser} />
          )}

          {activeTab === 'terminology' && checkPerm('MANAGE_TERMINOLOGY') && (
            <UnitTypeConfigurator currentUser={currentUser} />
          )}

          {activeTab === 'hierarchy' && checkPerm('MANAGE_HIERARCHY') && (
            <BranchManagement currentUser={currentUser} />
          )}

          {activeTab === 'roles' && checkPerm('MANAGE_ROLES') && (
            <RoleManagement currentUser={currentUser} />
          )}

          {activeTab === 'permissions' && checkPerm('MANAGE_PERMISSIONS') && (
            <PermissionManager currentUser={currentUser} />
          )}

          {activeTab === 'bulk' && checkPerm('IMPORT_USERS') && (
            <BulkUserImport currentUser={currentUser} />
          )}

          {activeTab === 'pending-users' && checkPerm('MANAGE_USERS') && (
            <PendingRegistrations currentUser={currentUser} />
          )}

          {activeTab === 'categories' && isSuperAdmin && (
            <CategoryManagement />
          )}

        </main>
      </div>
    </div>
  );
}
