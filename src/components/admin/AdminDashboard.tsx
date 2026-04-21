import { useLocation, Navigate } from 'react-router-dom';
import { User } from '../../types';
import { Users, BookOpen, Shield, BarChart2, TrendingUp } from 'lucide-react';

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

import { downloadCsv } from '../../utils/csv';
import { reviveAttempts } from '../../utils/progressCalculations';

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
    return sub;
  };

  const activeTab = getActiveTab();

  const isSuperAdmin = currentUser.role === 'superadmin';
  const isOrgAdmin = currentUser.user_type === 'ORG_ADMIN';
  const canAccessTerminology = isSuperAdmin || isOrgAdmin;
  const canUseDepartments =
    isSuperAdmin ||
    currentUser.user_type === 'ORG_ADMIN' ||
    currentUser.user_type === 'DEPT_ADMIN' ||
    (currentUser.role === 'admin' &&
      !!currentUser.deptId &&
      (currentUser.user_type == null || currentUser.user_type === ''));
  
  // Stats for the overview dashboard
  const stats = {
    totalUsers: 1254,
    activeUsers: 876,
    completedChallenges: 8721,
    averageScore: 78,
  };

  return (
    <div className="flex w-full min-h-screen flex-col bg-gray-50">
      <div className="min-h-0 flex-1 overflow-auto transition-all duration-300">
        <main className="p-4 sm:p-6">
          {activeTab === 'overview' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-emerald-500">
                  <h3 className="text-gray-500 text-sm font-medium mb-1">Total Users</h3>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalUsers}</p>
                  <div className="flex items-center mt-2">
                    <span className="text-green-500 text-sm font-medium">+3.2%</span>
                    <span className="text-gray-500 text-sm ml-2">from last month</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                  <h3 className="text-gray-500 text-sm font-medium mb-1">Active Users</h3>
                  <p className="text-3xl font-bold text-gray-800">{stats.activeUsers}</p>
                  <div className="flex items-center mt-2">
                    <span className="text-green-500 text-sm font-medium">+5.1%</span>
                    <span className="text-gray-500 text-sm ml-2">from last month</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
                  <h3 className="text-gray-500 text-sm font-medium mb-1">Completed Challenges</h3>
                  <p className="text-3xl font-bold text-gray-800">{stats.completedChallenges}</p>
                  <div className="flex items-center mt-2">
                    <span className="text-green-500 text-sm font-medium">+12.7%</span>
                    <span className="text-gray-500 text-sm ml-2">from last month</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-amber-500">
                  <h3 className="text-gray-500 text-sm font-medium mb-1">Average Score</h3>
                  <p className="text-3xl font-bold text-gray-800">{stats.averageScore}%</p>
                  <div className="flex items-center mt-2">
                    <span className="text-green-500 text-sm font-medium">+2.4%</span>
                    <span className="text-gray-500 text-sm ml-2">from last month</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-6 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">
                          <Users size={16} />
                        </div>
                        <div>
                          <p className="text-sm text-gray-800">New user <span className="font-medium">Emma Davis</span> registered</p>
                          <p className="text-xs text-gray-500">2 hours ago</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-3">
                          <BookOpen size={16} />
                        </div>
                        <div>
                          <p className="text-sm text-gray-800"><span className="font-medium">Sarah Johnson</span> completed "Phishing Prevention" challenge</p>
                          <p className="text-xs text-gray-500">5 hours ago</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mr-3">
                          <Shield size={16} />
                        </div>
                        <div>
                          <p className="text-sm text-gray-800">New admin <span className="font-medium">Alex Wilson</span> added by Super Admin</p>
                          <p className="text-xs text-gray-500">Yesterday</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mr-3">
                          <BookOpen size={16} />
                        </div>
                        <div>
                          <p className="text-sm text-gray-800">New challenge <span className="font-medium">"Network Security Basics"</span> created</p>
                          <p className="text-xs text-gray-500">2 days ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-6 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">Top Performing Challenges</h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Phishing Prevention</span>
                          <span className="text-sm font-medium text-gray-700">92%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Password Security</span>
                          <span className="text-sm font-medium text-gray-700">85%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Secure Browsing</span>
                          <span className="text-sm font-medium text-gray-700">78%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Data Privacy</span>
                          <span className="text-sm font-medium text-gray-700">72%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '72%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'users' && (
            <UserManagement currentUser={currentUser} />
          )}
          
          {activeTab === 'challenges' && <ChallengesExamHub currentUser={currentUser} />}
          
          {activeTab === 'reports' && (
            <UserProgressReport currentUser={currentUser} />
          )}

          {activeTab === 'assignments' && (
            <CampaignAssignments currentUser={currentUser} />
          )}
          
          {activeTab === 'settings' && isSuperAdmin && (
            <SystemSettings currentUser={currentUser} />
          )}

          {activeTab === 'organizations' && isSuperAdmin && (
            <OrgManagement />
          )}

          {activeTab === 'departments' && canUseDepartments && (
            <DepartmentManagement currentUser={currentUser} />
          )}

          {activeTab === 'terminology' && canAccessTerminology && (
            <UnitTypeConfigurator currentUser={currentUser} />
          )}

          {activeTab === 'hierarchy' && (
            <BranchManagement currentUser={currentUser} />
          )}

          {activeTab === 'roles' && (
            <RoleManagement currentUser={currentUser} />
          )}

          {activeTab === 'permissions' && (
            <PermissionManager currentUser={currentUser} />
          )}

          {activeTab === 'bulk' && (
            <BulkUserImport currentUser={currentUser} />
          )}

          {activeTab === 'pending-users' && (
            <PendingRegistrations currentUser={currentUser} />
          )}

        </main>
      </div>
    </div>
  );
}
