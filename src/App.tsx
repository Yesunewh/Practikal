import { useState, useEffect, useMemo, useRef } from 'react';
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
  LayoutDashboard,

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
import { CHALLENGE_LAYOUT_EVENT } from './constants/challengeLayoutEvents';
import {
  mapGamificationAttemptsToChallengeAttempts,
  uniquePassedChallengeIds,
} from './utils/gamificationApi';
import { initializeCampaigns, setAssignments } from './store/slices/campaignsSlice';
import { initializeProgress } from './store/slices/progressSlice';
import { AppShellTopBar } from './components/AppShellTopBar';
import { useI18n } from './i18n/I18nContext';
import type { Messages } from './i18n/messages';
import type { User } from './types';
import { isSuperAdminUser } from './utils/authIdentity';

/** Subtitle line: department · organization (department from DB when set). */
function userContextSubtitle(u: User | null | undefined): string {
  if (!u) return '';
  const d = u.departmentName?.trim();
  const o = u.organization?.trim();
  if (d && o) return `${d} · ${o}`;
  return d || o || '';
}

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

type NavLabelKey = keyof Messages['nav']['items'];
type NavGroupKey = keyof Messages['nav']['groups'];

type NavItemDef = {
  id: string;
  labelKey: NavLabelKey;
  icon: LucideIcon;
  path: string;
  permission?: string;
  permissionsAny?: string[];
};

type NavGroupDef = { groupKey: NavGroupKey; items: NavItemDef[] };

const NAV_STRUCTURE: NavGroupDef[] = [
  {
    groupKey: 'learning',
    items: [
      { id: 'dashboard', labelKey: 'dashboard', icon: Gamepad2, path: '/', permission: 'VIEW_DASHBOARD' },
      { id: 'challenges', labelKey: 'challenges', icon: Library, path: '/challenges', permission: 'VIEW_CHALLENGES' },
      {
        id: 'remediation',
        labelKey: 'remediation',
        icon: BookOpenCheck,
        path: '/remediation',
        permission: 'VIEW_REMEDIATION',
      },
    ],
  },
  {
    groupKey: 'competition',
    items: [
      {
        id: 'leaderboard',
        labelKey: 'leaderboard',
        icon: Trophy,
        path: '/leaderboard',
        permission: 'VIEW_LEADERBOARD',
      },
      {
        id: 'achievements',
        labelKey: 'achievements',
        icon: Medal,
        path: '/achievements',
        permission: 'VIEW_ACHIEVEMENTS',
      },
    ],
  },
  {
    groupKey: 'personnel',
    items: [
      {
        id: 'admin-overview',
        labelKey: 'adminOverview',
        icon: LayoutDashboard,
        path: '/admin',
        permissionsAny: [
          'VIEW_REPORTS',
          'MANAGE_USERS',
          'IMPORT_USERS',
          'MANAGE_CAMPAIGNS',
          'MANAGE_TENANTS',
          'MANAGE_HIERARCHY',
          'MANAGE_ROLES',
          'MANAGE_PERMISSIONS',
          'MANAGE_DEPARTMENTS',
          'MANAGE_TERMINOLOGY',
          'MANAGE_CHALLENGES',
          'MANAGE_EXAMS',
        ],
      },
      { id: 'admin-users', labelKey: 'adminUsers', icon: Users, path: '/admin/users', permission: 'MANAGE_USERS' },
      {
        id: 'admin-pending-users',
        labelKey: 'adminPendingUsers',
        icon: ClipboardCheck,
        path: '/admin/pending-users',
        permission: 'MANAGE_TENANTS',
      },
      { id: 'admin-import', labelKey: 'adminImport', icon: FileUp, path: '/admin/import', permission: 'IMPORT_USERS' },
      {
        id: 'admin-reports',
        labelKey: 'adminReports',
        icon: BarChart3,
        path: '/admin/reports',
        permission: 'VIEW_REPORTS',
      },
    ],
  },
  {
    groupKey: 'content',
    items: [
      {
        id: 'admin-challenges',
        labelKey: 'adminChallenges',
        icon: FileStack,
        path: '/admin/challenges',
        permissionsAny: ['MANAGE_EXAMS', 'MANAGE_CHALLENGES'],
      },
      {
        id: 'admin-campaigns',
        labelKey: 'adminCampaigns',
        icon: CalendarDays,
        path: '/admin/campaigns',
        permission: 'MANAGE_CAMPAIGNS',
      },
      {
        id: 'admin-categories',
        labelKey: 'adminCategories',
        icon: Layers,
        path: '/admin/categories',
        permission: 'MANAGE_TENANTS',
      },
    ],
  },
  {
    groupKey: 'hierarchyRules',
    items: [
      {
        id: 'admin-terminology',
        labelKey: 'adminTerminology',
        icon: UserCog,
        path: '/admin/terminology',
        permission: 'MANAGE_TERMINOLOGY',
      },
      {
        id: 'admin-hierarchy',
        labelKey: 'adminHierarchy',
        icon: GitBranch,
        path: '/admin/hierarchy',
        permission: 'MANAGE_HIERARCHY',
      },
      {
        id: 'admin-departments',
        labelKey: 'adminDepartments',
        icon: Layers,
        path: '/admin/departments',
        permission: 'MANAGE_DEPARTMENTS',
      },
      { id: 'admin-roles', labelKey: 'adminRoles', icon: Shield, path: '/admin/roles', permission: 'MANAGE_ROLES' },
      {
        id: 'admin-permissions',
        labelKey: 'adminPermissions',
        icon: Lock,
        path: '/admin/permissions',
        permission: 'MANAGE_PERMISSIONS',
      },
    ],
  },
  {
    groupKey: 'system',
    items: [
      {
        id: 'admin-organizations',
        labelKey: 'adminOrganizations',
        icon: Building2,
        path: '/admin/organizations',
        permission: 'MANAGE_TENANTS',
      },
    ],
  },
];

function buildMenuGroups(nav: Messages['nav']): { title: string; items: SidebarMenuItem[] }[] {
  return NAV_STRUCTURE.map((g) => ({
    title: nav.groups[g.groupKey],
    items: g.items.map((it) => ({
      id: it.id,
      label: nav.items[it.labelKey],
      icon: it.icon,
      path: it.path,
      permission: it.permission,
      permissionsAny: it.permissionsAny,
    })),
  }));
}

function pageTitleFromNav(pageId: string, m: Messages): string {
  if (pageId === 'profile') return m.pageTitles.profile;
  if (pageId === 'admin-settings') return m.pageTitles.adminSettings;
  for (const g of NAV_STRUCTURE) {
    const it = g.items.find((i) => i.id === pageId);
    if (it) return m.nav.items[it.labelKey];
  }
  return m.pageTitles.fallback;
}

function AppContent() {
  const { messages } = useI18n();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);
  const loading = useSelector((state: RootState) => state.auth.loading);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const sidebarCollapsedRef = useRef(isSidebarCollapsed);
  sidebarCollapsedRef.current = isSidebarCollapsed;
  const preChallengeSidebarRef = useRef<boolean | null>(null);

  useEffect(() => {
    const onChallengeLayout = (e: Event) => {
      const phase = (e as CustomEvent<{ phase?: string }>).detail?.phase;
      if (phase === 'challenge-questions') {
        if (preChallengeSidebarRef.current === null) {
          preChallengeSidebarRef.current = sidebarCollapsedRef.current;
        }
        setIsSidebarCollapsed(true);
      } else if (phase === 'challenge-end') {
        const saved = preChallengeSidebarRef.current;
        preChallengeSidebarRef.current = null;
        if (saved !== null) setIsSidebarCollapsed(saved);
      }
    };
    window.addEventListener(CHALLENGE_LAYOUT_EVENT, onChallengeLayout);
    return () => window.removeEventListener(CHALLENGE_LAYOUT_EVENT, onChallengeLayout);
  }, []);

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
    if (path === '/admin/categories') return 'admin-categories';
    if (path === '/admin/settings') return 'admin-settings';

    return 'dashboard';
  };

  const currentPage = getCurrentPage();
  const MENU_GROUPS = useMemo(() => buildMenuGroups(messages.nav), [messages]);
  const pageTitle = useMemo(() => pageTitleFromNav(currentPage, messages), [currentPage, messages]);

  const hasPermission = (permission: string) => {
    if (!user) return false;

    const isSuperAdmin = isSuperAdminUser(user);
    if (isSuperAdmin) return true;

    if (user.permissions?.includes(permission)) {
      return true;
    }

    const legacyDeptHead =
      user.role === 'admin' &&
      !!user.deptId &&
      (user.user_type == null || user.user_type === '');
    const isOrgAdmin = user.user_type === 'ORG_ADMIN' || (user.role === 'admin' && user.orgId && !user.user_type && !legacyDeptHead && !isSuperAdmin);
    const isDeptHead = user.user_type === 'DEPT_ADMIN' || legacyDeptHead;
    const isBranchAdmin = user.user_type === 'UNIT_ADMIN';

    // System
    if (['MANAGE_TENANTS', 'MANAGE_SYSTEM'].includes(permission)) {
      return false;
    }

    // Personnel & Intelligence
    if (['MANAGE_USERS', 'IMPORT_USERS', 'VIEW_REPORTS'].includes(permission)) {
      return isOrgAdmin || isDeptHead || isBranchAdmin;
    }
    if (permission === 'MANAGE_DEPARTMENTS') {
      return isOrgAdmin;
    }

    // Content & Training
    if (permission === 'MANAGE_EXAMS') {
      return isOrgAdmin || isDeptHead;
    }
    if (['MANAGE_CAMPAIGNS', 'MANAGE_CHALLENGES'].includes(permission)) {
      return isOrgAdmin || isDeptHead || isBranchAdmin;
    }

    // Structure & Rules
    if (['MANAGE_TERMINOLOGY', 'MANAGE_ROLES', 'MANAGE_PERMISSIONS', 'MANAGE_HIERARCHY'].includes(permission)) {
      return isOrgAdmin;
    }

    // Learner
    if (['VIEW_DASHBOARD', 'VIEW_CHALLENGES', 'PLAY_CHALLENGES', 'VIEW_REMEDIATION', 'VIEW_LEADERBOARD', 'VIEW_ACHIEVEMENTS', 'VIEW_SUPPORT'].includes(permission)) {
      return true;
    }

    return false;
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
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin text-emerald-600">
          <Shield size={40} />
        </div>
      </div>
    );
  }

  if (!user && location.pathname !== '/login') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (location.pathname === '/login' && user) {
    const from = location.state?.from || '/';
    return <Navigate to={from} replace />;
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
        aria-label={messages.common.closeMenu}
        className={`md:hidden fixed inset-0 z-30 bg-black/45 transition-opacity duration-200 ${mobileNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
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
          className="absolute p-2 text-gray-300 rounded-lg md:hidden right-3 top-4 hover:bg-white/10 hover:text-white"
          onClick={() => setMobileNavOpen(false)}
          aria-label={messages.common.closeMenu}
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
            {messages.common.brand}
          </span>
        </div>

        <nav className="sidebar-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-0.5 -mr-0.5">
          {MENU_GROUPS.map((group, groupIdx) => {
            const visibleItems = group.items.filter((item) => {
              // Departments and terminology are org-scoped; hide from super admins
              const isSuperAdmin = user ? isSuperAdminUser(user) : false;
              const superAdminHidden = ['MANAGE_DEPARTMENTS', 'MANAGE_TERMINOLOGY', 'MANAGE_HIERARCHY', 'IMPORT_USERS', 'VIEW_REPORTS'];
              if (isSuperAdmin && superAdminHidden.includes(item.permission ?? '')) {
                return false;
              }
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
                  className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 ${isSidebarCollapsed ? 'md:sr-only' : ''
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
                        )} ${currentPage === item.id
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
                          <span className="absolute left-0 hidden w-1 h-6 -translate-y-1/2 rounded-r-full top-1/2 bg-lime-400 md:block" />
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
            className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors md:px-3 ${currentPage === 'profile' ? 'bg-lime-300/20 text-lime-300' : 'hover:bg-white/10'
              } ${isSidebarCollapsed ? 'md:justify-center' : ''}`}
            title={messages.common.profile}
          >
            <div className="flex items-center justify-center w-8 h-8 text-sm font-medium rounded-full shrink-0 bg-emerald-700">
              {user?.name?.charAt(0) ?? '?'}
            </div>
            <div className={`min-w-0 flex-1 ${isSidebarCollapsed ? 'max-md:block md:hidden' : ''}`}>
              <div className="text-sm font-medium leading-tight truncate">{user?.name}</div>
              <div className="truncate text-[11px] leading-tight text-gray-400">
                {userContextSubtitle(user) || messages.common.dash}
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className={`flex w-full items-center rounded-lg px-2 py-2 text-left text-red-300/95 transition-colors hover:bg-red-500/15 md:px-3 ${isSidebarCollapsed ? 'justify-center md:justify-center' : 'gap-2'
              }`}
            title={messages.common.signOut}
          >
            <LogOut size={18} className="shrink-0" />
            <span className={`text-sm ${isSidebarCollapsed ? 'max-md:inline md:hidden' : ''}`}>
              {messages.common.signOut}
            </span>
          </button>
        </div>
      </aside>



      {/* Main Content */}
      <div
        className={`flex min-h-[100dvh] min-w-0 flex-1 flex-col motion-safe:animate-content-shift transition-[margin] duration-300 relative z-50 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
          }`}
      >
        {user && (
          <AppShellTopBar
            onOpenMobileNav={() => setMobileNavOpen(true)}
            onToggleSidebarCollapse={() => setIsSidebarCollapsed((c) => !c)}
            sidebarCollapsed={isSidebarCollapsed}
            title={location.pathname === '/admin' ? '' : pageTitle}
            userName={user.name}
            userSubtitle={userContextSubtitle(user)}
            userInitial={user.name?.charAt(0) ?? '?'}
            xp={user.xp ?? 0}
            levelLabel={user.level || user.rank?.current || '—'}
            onProfileClick={() => navigate('/profile')}
          />
        )}

        <div className="flex-1 min-h-0">
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