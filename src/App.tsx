import { useState, useEffect, useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Provider } from 'react-redux';
import { store } from './store';
import {
  Shield,
  Gamepad2,
  Trophy,
  Medal,
  LogOut,
  BookOpenCheck,
  Users,
  FileUp,
  BarChart3,
  Library,
  CalendarDays,
  GitBranch,
  UserCog,
  Lock,
  Building2,
  FileStack,
  Layers,
  X,
  ClipboardCheck,
} from 'lucide-react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import GameDashboard from './components/GameDashboard';
import ChallengesPage from './components/ChallengesPage';
import Leaderboard from './components/Leaderboard';
import Achievements from './components/Achievements';
import Profile from './components/Profile';
import Login from './components/Login';
import AdminApp from './components/admin/AdminApp';
import RemediationPage from './components/RemediationPage';
import Support from './components/Support';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from './store';
import {
  logout as logoutAction,
  mergeGamificationFromApi,
  setCompletedChallengesFromIds,
} from './store/slices/authSlice';
import { initializeChallenges, setChallenges } from './store/slices/challengesSlice';
import { setRemoteChallengeAttempts } from './store/slices/progressSlice';
import {
  useGetGamificationChallengesQuery,
  useGetGamificationProgressMeQuery,
  useGetGamificationMyAssignmentsQuery,
} from './store/apiSlice/practikalApi';
import { useGamificationApi } from './config/gamification';
import {
  mapGamificationAttemptsToChallengeAttempts,
  uniquePassedChallengeIds,
} from './utils/gamificationApi';
import { initializeCampaigns, setAssignments } from './store/slices/campaignsSlice';
import { initializeProgress } from './store/slices/progressSlice';
import { AppShellTopBar } from './components/AppShellTopBar';

type SidebarMenuItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  /** Single permission (used when `permissionsAny` is absent) */
  permission?: string;
  /** Show item if the user has any of these permissions */
  permissionsAny?: string[];
};

const MENU_GROUPS: { title: string; items: SidebarMenuItem[] }[] = [
  {
    title: 'Learning',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Gamepad2, path: '/', permission: 'VIEW_DASHBOARD' },
      { id: 'challenges', label: 'Challenges', icon: Library, path: '/challenges', permission: 'VIEW_CHALLENGES' },
      { id: 'remediation', label: 'Review Mistakes', icon: BookOpenCheck, path: '/remediation', permission: 'VIEW_REMEDIATION' },
    ],
  },
  {
    title: 'Competition',
    items: [
      { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, path: '/leaderboard', permission: 'VIEW_LEADERBOARD' },
      { id: 'achievements', label: 'Achievements', icon: Medal, path: '/achievements', permission: 'VIEW_ACHIEVEMENTS' },
    ],
  },
  {
    title: 'Personnel',
    items: [
      { id: 'admin-users', label: 'User management', icon: Users, path: '/admin/users', permission: 'MANAGE_USERS' },
      {
        id: 'admin-pending-users',
        label: 'Pending registrations',
        icon: ClipboardCheck,
        path: '/admin/pending-users',
        permission: 'MANAGE_USERS',
      },
      { id: 'admin-import', label: 'Bulk Import', icon: FileUp, path: '/admin/import', permission: 'IMPORT_USERS' },
      { id: 'admin-reports', label: 'Training reports', icon: BarChart3, path: '/admin/reports', permission: 'VIEW_REPORTS' },
    ],
  },
  {
    title: 'Content',
    items: [
      {
        id: 'admin-challenges',
        label: 'Learning challenges',
        icon: FileStack,
        path: '/admin/challenges',
        permissionsAny: ['MANAGE_EXAMS', 'MANAGE_CHALLENGES'],
      },
      { id: 'admin-campaigns', label: 'Campaigns', icon: CalendarDays, path: '/admin/campaigns', permission: 'MANAGE_CAMPAIGNS' },
    ],
  },
  {
    title: 'Hierarchy & Rules',
    items: [
      { id: 'admin-terminology', label: 'Terminology', icon: UserCog, path: '/admin/terminology', permission: 'MANAGE_TERMINOLOGY' },
      { id: 'admin-hierarchy', label: 'Branch Tree', icon: GitBranch, path: '/admin/hierarchy', permission: 'MANAGE_HIERARCHY' },
      { id: 'admin-roles', label: 'Role Builder', icon: Shield, path: '/admin/roles', permission: 'MANAGE_ROLES' },
      { id: 'admin-permissions', label: 'Permissions', icon: Lock, path: '/admin/permissions', permission: 'MANAGE_PERMISSIONS' },
    ],
  },
  {
    title: 'System',
    items: [
      { id: 'admin-organizations', label: 'Tenants', icon: Building2, path: '/admin/organizations', permission: 'MANAGE_TENANTS' },
      { id: 'admin-departments', label: 'Departments & teams', icon: Layers, path: '/admin/departments', permission: 'MANAGE_DEPARTMENTS' },
    ],
  },
];

function pageTitleFromNav(pageId: string): string {
  for (const g of MENU_GROUPS) {
    const it = g.items.find((i) => i.id === pageId);
    if (it) return it.label;
  }
  if (pageId === 'admin-overview') return 'Overview';
  if (pageId === 'profile') return 'Profile';
  return 'Dashboard';
}

function AppContent() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);
  const loading = useSelector((state: RootState) => state.auth.loading);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileNavOpen]);

  const { data: gamificationChallengesRes, isSuccess: gamificationChallengesOk } =
    useGetGamificationChallengesQuery(undefined, {
      skip: !useGamificationApi || !user,
    });
  const { data: gamificationProgressRes, isSuccess: gamificationProgressOk } =
    useGetGamificationProgressMeQuery(undefined, {
      skip: !useGamificationApi || !user,
    });
  const { data: gamificationAssignmentsRes, isSuccess: gamificationAssignmentsOk } =
    useGetGamificationMyAssignmentsQuery(undefined, {
      skip: !useGamificationApi || !user,
    });

  // Determine current page from URL
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'dashboard';
    if (path.startsWith('/challenges')) return 'challenges';
    if (path.startsWith('/leaderboard')) return 'leaderboard';
    if (path.startsWith('/achievements')) return 'achievements';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/remediation')) return 'remediation';
    if (path.startsWith('/support')) return 'support';
    
    // Admin Sub-routes
    if (path === '/admin') return 'admin-overview';
    if (path === '/admin/users') return 'admin-users';
    if (path === '/admin/pending-users') return 'admin-pending-users';
    if (path === '/admin/import') return 'admin-import';
    if (path === '/admin/reports') return 'admin-reports';
    if (path === '/admin/exams' || path === '/admin/challenges') return 'admin-challenges';
    if (path === '/admin/campaigns') return 'admin-campaigns';
    if (path === '/admin/terminology') return 'admin-terminology';
    if (path === '/admin/hierarchy') return 'admin-hierarchy';
    if (path === '/admin/roles') return 'admin-roles';
    if (path === '/admin/permissions') return 'admin-permissions';
    if (path === '/admin/organizations') return 'admin-organizations';
    if (path === '/admin/departments') return 'admin-departments';
    if (path === '/admin/settings') return 'admin-settings';
    
    return 'dashboard';
  };

  const currentPage = getCurrentPage();
  const pageTitle = useMemo(() => pageTitleFromNav(currentPage), [currentPage]);
  const isSuperAdminUser = user?.role === 'superadmin' || user?.user_type === 'SUPERADMIN';

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.user_type === 'SUPERADMIN') return true;
    const legacyDeptHead =
      user.role === 'admin' &&
      !!user.deptId &&
      (user.user_type == null || user.user_type === '');
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
    return user.permissions?.includes(permission);
  };

  // Initialize data from localStorage on mount
  useEffect(() => {
    dispatch(initializeChallenges());
    dispatch(initializeCampaigns());
    dispatch(initializeProgress());
  }, [dispatch]);

  useEffect(() => {
    if (!useGamificationApi || !user?.id || !gamificationChallengesOk) return;
    const list = gamificationChallengesRes?.challenges;
    dispatch(setChallenges(Array.isArray(list) ? list : []));
  }, [useGamificationApi, user?.id, gamificationChallengesOk, gamificationChallengesRes, dispatch]);

  useEffect(() => {
    if (!useGamificationApi || !user?.id || !gamificationProgressOk || !gamificationProgressRes?.user) return;
    dispatch(mergeGamificationFromApi(gamificationProgressRes.user));
    const mapped = mapGamificationAttemptsToChallengeAttempts(gamificationProgressRes.attempts ?? []);
    dispatch(setRemoteChallengeAttempts(mapped));
    dispatch(setCompletedChallengesFromIds(uniquePassedChallengeIds(mapped)));
  }, [useGamificationApi, user?.id, gamificationProgressOk, gamificationProgressRes, dispatch]);

  useEffect(() => {
    if (!useGamificationApi || !user?.id || !gamificationAssignmentsOk) return;
    const list = gamificationAssignmentsRes?.assignments;
    dispatch(setAssignments(Array.isArray(list) ? list : []));
  }, [useGamificationApi, user?.id, gamificationAssignmentsOk, gamificationAssignmentsRes, dispatch]);

  const handleLogout = () => {
    dispatch(logoutAction());
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin text-emerald-600">
          <Shield size={40} />
        </div>
      </div>
    );
  }

  if (!user && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  if (location.pathname === '/login' && user) {
    return <Navigate to="/" replace />;
  }

  if (location.pathname === '/login') {
    return <Login />;
  }

  const navItemLayout = (compact: boolean) =>
    compact ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2';

  return (
    <div className="flex min-h-[100dvh] bg-gray-100">
      {/* Mobile overlay */}
      <button
        type="button"
        aria-label="Close menu"
        className={`md:hidden fixed inset-0 z-30 bg-black/45 transition-opacity duration-200 ${
          mobileNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileNavOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-40 flex h-svh min-h-0 w-[min(18rem,88vw)] flex-col bg-black text-white shadow-xl
          transition-[transform,width,padding] duration-300 ease-out
          max-md:pt-[env(safe-area-inset-top,0px)] max-md:pb-[env(safe-area-inset-bottom,0px)]
          md:shadow-none
          ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          ${isSidebarCollapsed ? 'md:w-20 md:px-2 md:py-4' : 'md:w-64 md:p-5'}
          p-4
        `}
      >
        <button
          type="button"
          className="md:hidden absolute right-3 top-4 rounded-lg p-2 text-gray-300 hover:bg-white/10 hover:text-white"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close menu"
        >
          <X size={22} />
        </button>

        <div
          className={`flex shrink-0 items-center gap-2 ${isSidebarCollapsed ? 'md:justify-center md:mb-4' : 'mb-4 md:mb-6'} pr-10 md:pr-0`}
        >
          <Shield className="h-[22px] w-[22px] shrink-0 text-lime-400 md:h-6 md:w-6" />
          <span
            className={`text-lg font-bold tracking-tight md:text-xl ${isSidebarCollapsed ? 'md:sr-only' : ''} truncate`}
          >
            Practikal
          </span>
        </div>

        <nav className="sidebar-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-0.5 -mr-0.5">
          {MENU_GROUPS.map((group, groupIdx) => {
            const visibleItems = group.items.filter((item) => {
              if (item.id === 'admin-departments' && isSuperAdminUser) return false;
              if (item.permissionsAny?.length) {
                return item.permissionsAny.some((p) => hasPermission(p));
              }
              if (item.permission) return hasPermission(item.permission);
              return false;
            });
            if (visibleItems.length === 0) return null;

            return (
              <div key={groupIdx} className="mb-4 last:mb-2">
                <div
                  className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 ${
                    isSidebarCollapsed ? 'md:sr-only' : ''
                  }`}
                >
                  {group.title}
                </div>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const compact = isSidebarCollapsed;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigate(item.path)}
                        className={`flex w-full items-center rounded-xl text-left transition-all duration-200 group relative ${navItemLayout(
                          compact,
                        )} ${
                          currentPage === item.id
                            ? 'bg-lime-400 font-semibold text-black shadow-md shadow-lime-400/15'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                        title={item.label}
                      >
                        <item.icon
                          size={20}
                          className={`shrink-0 ${currentPage === item.id ? 'text-black' : 'group-hover:scale-105 transition-transform'}`}
                        />
                        <span
                          className={`min-w-0 flex-1 truncate text-sm ${compact ? 'max-md:inline md:hidden' : ''}`}
                        >
                          {item.label}
                        </span>
                        {compact && currentPage === item.id && (
                          <span className="absolute left-0 top-1/2 hidden h-6 w-1 -translate-y-1/2 rounded-r-full bg-lime-400 md:block" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="shrink-0 space-y-1 border-t border-white/10 pt-2 mt-1 pb-[env(safe-area-inset-bottom,0px)]">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors md:px-3 ${
              currentPage === 'profile' ? 'bg-lime-300/20 text-lime-300' : 'hover:bg-white/10'
            } ${isSidebarCollapsed ? 'md:justify-center' : ''}`}
            title="Profile"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-medium">
              {user?.name?.charAt(0) ?? '?'}
            </div>
            <div className={`min-w-0 flex-1 ${isSidebarCollapsed ? 'max-md:block md:hidden' : ''}`}>
              <div className="truncate text-sm font-medium leading-tight">{user?.name}</div>
              <div className="truncate text-[11px] leading-tight text-gray-400">{user?.organization || '—'}</div>
            </div>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className={`flex w-full items-center rounded-lg px-2 py-2 text-left text-red-300/95 transition-colors hover:bg-red-500/15 md:px-3 ${
              isSidebarCollapsed ? 'justify-center md:justify-center' : 'gap-2'
            }`}
            title="Sign Out"
          >
            <LogOut size={18} className="shrink-0" />
            <span className={`text-sm ${isSidebarCollapsed ? 'max-md:inline md:hidden' : ''}`}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`flex min-h-[100dvh] min-w-0 flex-1 flex-col motion-safe:animate-content-shift transition-[margin] duration-300 ${
          isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {user && (
          <AppShellTopBar
            onOpenMobileNav={() => setMobileNavOpen(true)}
            onToggleSidebarCollapse={() => setIsSidebarCollapsed((c) => !c)}
            sidebarCollapsed={isSidebarCollapsed}
            title={pageTitle}
            userName={user.name}
            userOrg={user.organization}
            userInitial={user.name?.charAt(0) ?? '?'}
            xp={user.xp ?? 0}
            levelLabel={user.level || user.rank?.current || '—'}
            onProfileClick={() => navigate('/profile')}
            adminNotificationCount={
              (user.role === 'admin' || user.role === 'superadmin') &&
              location.pathname.startsWith('/admin')
                ? 5
                : undefined
            }
          />
        )}

        <div className="min-h-0 flex-1">
        <Routes>
          <Route path="/" element={<GameDashboard onNavigate={navigate} />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/profile" element={<Profile />} />
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                <AdminApp currentUser={user!} onBack={() => navigate('/')} />
              </ProtectedRoute>
            } 
          />
          <Route path="/remediation" element={<RemediationPage onNavigate={navigate} />} />
          <Route path="/support" element={<Support />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;