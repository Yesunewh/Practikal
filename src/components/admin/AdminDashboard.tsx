import { useState, useRef, useEffect } from 'react';
import { User } from '../../types';
import { Users, BookOpen, Settings, BarChart2, Bell, Shield, ArrowLeft, FileText, ChevronLeft, ChevronRight, TrendingUp, Megaphone } from 'lucide-react';
import UserManagement from './UserManagement';
import ChallengeManagement from './ChallengeManagement';
import SystemSettings from './SystemSettings';
import ExamBank from './ExamBank';
import UserProgressReport from './UserProgressReport';
import CampaignAssignments from './CampaignAssignments';
import { downloadCsv } from '../../utils/csv';
import { reviveAttempts } from '../../utils/progressCalculations';

interface AdminDashboardProps {
  currentUser: User;
  onBack?: () => void;
}

export default function AdminDashboard({ currentUser, onBack }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'challenges' | 'exams' | 'reports' | 'progress' | 'settings' | 'assignments'
  >('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotificationsOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);
  
  const isSuperAdmin = currentUser.role === 'superadmin';
  
  // Stats for the overview dashboard
  const stats = {
    totalUsers: 1254,
    activeUsers: 876,
    completedChallenges: 8721,
    averageScore: 78,
    pendingApprovals: 5
  };

  return (
    <div className="fixed inset-0 bg-gray-100 flex z-50">
      {/* Sidebar */}
      <div className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-black text-white ${isSidebarCollapsed ? 'p-3' : 'p-6'} flex flex-col fixed left-0 top-0 h-screen overflow-y-auto z-20 transition-all duration-300`}>
        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-8 bg-lime-400 text-black rounded-full p-1.5 shadow-lg hover:bg-lime-300 transition-colors z-10"
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        <div className="flex items-center gap-2 mb-8">
          <Shield size={24} className="flex-shrink-0" />
          {!isSidebarCollapsed && (
            <div>
              <h1 className="text-xl font-bold">Practikal Admin</h1>
              <p className="text-xs text-emerald-300">{currentUser.role === 'superadmin' ? 'Super Admin' : 'Admin'}</p>
            </div>
          )}
        </div>
        
        <nav className="space-y-4 flex-1">
          <button
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2 rounded-lg w-full text-left transition-colors ${activeTab === 'overview' ? 'bg-lime-300/20 text-lime-300' : 'hover:bg-white/10'}`}
            onClick={() => setActiveTab('overview')}
            title="Dashboard Overview"
          >
            <BarChart2 size={20} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span>Dashboard Overview</span>}
          </button>
          
          <button
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2 rounded-lg w-full text-left transition-colors ${activeTab === 'users' ? 'bg-lime-300/20 text-lime-300' : 'hover:bg-white/10'}`}
            onClick={() => setActiveTab('users')}
            title="User Management"
          >
            <Users size={20} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span>User Management</span>}
          </button>
          
          <button
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2 rounded-lg w-full text-left transition-colors ${activeTab === 'challenges' ? 'bg-lime-300/20 text-lime-300' : 'hover:bg-white/10'}`}
            onClick={() => setActiveTab('challenges')}
            title="Challenge Management"
          >
            <BookOpen size={20} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span>Challenge Management</span>}
          </button>
          
          <button
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2 rounded-lg w-full text-left transition-colors ${activeTab === 'exams' ? 'bg-lime-300/20 text-lime-300' : 'hover:bg-white/10'}`}
            onClick={() => setActiveTab('exams')}
            title="Exam Bank"
          >
            <FileText size={20} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span>Exam Bank</span>}
          </button>

          <button
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2 rounded-lg w-full text-left transition-colors ${activeTab === 'assignments' ? 'bg-lime-300/20 text-lime-300' : 'hover:bg-white/10'}`}
            onClick={() => setActiveTab('assignments')}
            title="Campaigns & assignments"
          >
            <Megaphone size={20} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span>Campaigns</span>}
          </button>
          
          <button
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2 rounded-lg w-full text-left transition-colors ${activeTab === 'reports' ? 'bg-lime-300/20 text-lime-300' : 'hover:bg-white/10'}`}
            onClick={() => setActiveTab('reports')}
            title="Reports & Analytics"
          >
            <BarChart2 size={20} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span>Reports & Analytics</span>}
          </button>

          <button
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2 rounded-lg w-full text-left transition-colors ${activeTab === 'progress' ? 'bg-lime-300/20 text-lime-300' : 'hover:bg-white/10'}`}
            onClick={() => setActiveTab('progress')}
            title="User Progress"
          >
            <TrendingUp size={20} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span>User Progress</span>}
          </button>
          
          {isSuperAdmin && (
            <button
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2 rounded-lg w-full text-left transition-colors ${activeTab === 'settings' ? 'bg-lime-300/20 text-lime-300' : 'hover:bg-white/10'}`}
              onClick={() => setActiveTab('settings')}
              title="System Configuration"
            >
              <Settings size={20} className="flex-shrink-0" />
              {!isSidebarCollapsed && <span>System Configuration</span>}
            </button>
          )}
        </nav>
        
        {/* Back button */}
        <div className="space-y-2">
          {onBack && (
            <button
              onClick={onBack}
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2 hover:bg-white/10 rounded-lg w-full text-left transition-colors`}
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} className="flex-shrink-0" />
              {!isSidebarCollapsed && <span>Back to Dashboard</span>}
            </button>
          )}
        </div>
      </div>
      
      {/* Main content */}
      <div className={`flex-1 overflow-auto ${isSidebarCollapsed ? 'ml-20' : 'ml-64'} transition-all duration-300`}>
        {/* Top bar */}
        <header className="bg-white border-b shadow-sm py-4 px-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'challenges' && 'Challenge Management'}
              {activeTab === 'exams' && 'Exam Bank'}
              {activeTab === 'reports' && 'Reports & Analytics'}
              {activeTab === 'progress' && 'User Progress Reports'}
              {activeTab === 'settings' && 'System Configuration'}
              {activeTab === 'assignments' && 'Campaigns & assignments'}
            </h1>
            <div className="flex items-center space-x-4">
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  className="p-2 rounded-full hover:bg-gray-100 relative"
                  onClick={() => setNotificationsOpen((o) => !o)}
                  aria-expanded={notificationsOpen}
                  aria-haspopup="true"
                >
                  <Bell size={20} className="text-gray-600" />
                  <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                    {stats.pendingApprovals}
                  </span>
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2 text-left">
                    <div className="px-4 py-2 border-b text-sm font-medium text-gray-800">Notifications (demo)</div>
                    <div className="px-4 py-3 text-sm text-gray-600 space-y-2 max-h-64 overflow-y-auto">
                      <p>New user registration pending review.</p>
                      <p>Assignment &quot;Password Security Basics&quot; due in 3 days for 12 users.</p>
                      <p className="text-xs text-gray-400">Connect a backend to deliver real notifications.</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white">
                  {currentUser.name.charAt(0)}
                </div>
                <span className="text-sm font-medium text-gray-700">{currentUser.name}</span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Dashboard content */}
        <main className="p-6">
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong>Demo mode:</strong> user counts, trends, and activity feeds below are illustrative sample data.
            Challenge attempts and campaigns use browser localStorage only.
          </div>

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
          
          {activeTab === 'challenges' && (
            <ChallengeManagement currentUser={currentUser} />
          )}
          
          {activeTab === 'exams' && (
            <ExamBank currentUser={currentUser} />
          )}
          
          {activeTab === 'reports' && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b flex flex-wrap justify-between gap-4 items-center">
                <h2 className="text-lg font-semibold text-gray-800">Reports & Analytics</h2>
                <button
                  type="button"
                  onClick={() => {
                    const raw = JSON.parse(localStorage.getItem('challengeAttempts') || '[]');
                    const attempts = reviveAttempts(raw);
                    const rows = attempts.map((a) => [
                      a.id,
                      a.userId,
                      a.challengeId,
                      a.score,
                      a.passed ? 'yes' : 'no',
                      a.completedAt ? new Date(a.completedAt).toISOString() : '',
                    ]);
                    downloadCsv(
                      ['attemptId', 'userId', 'challengeId', 'score', 'passed', 'completedAt'],
                      rows,
                      'practikal-all-attempts.csv',
                    );
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
                >
                  Download all attempts (CSV)
                </button>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  Export raw challenge attempts from this browser for analysis. For organization-wide reporting, connect a backend (see roadmap).
                </p>
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <UserProgressReport users={[currentUser]} />
          )}

          {activeTab === 'assignments' && (
            <CampaignAssignments currentUser={currentUser} />
          )}
          
          {activeTab === 'settings' && isSuperAdmin && (
            <SystemSettings currentUser={currentUser} />
          )}
        </main>
      </div>
    </div>
  );
}
