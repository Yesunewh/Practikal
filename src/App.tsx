import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ChallengeProvider } from './context/ChallengeContext';
import { ProgressProvider } from './context/ProgressContext';
import { CampaignProvider } from './context/CampaignContext';
import { Shield, Gamepad2, Trophy, Medal, HeadphonesIcon, LogOut, Settings, ChevronLeft, ChevronRight, BookOpenCheck } from 'lucide-react';
import GameDashboard from './components/GameDashboard';
import ChallengesPage from './components/ChallengesPage';
import Leaderboard from './components/Leaderboard';
import Achievements from './components/Achievements';
import Profile from './components/Profile';
import Login from './components/Login';
import { useAuth } from './context/AuthContext';
import AdminApp from './components/admin/AdminApp';
import RemediationPage from './components/RemediationPage';
import Support from './components/Support';

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin text-emerald-600">
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderMainContent = () => {
    switch (currentPage) {
      case 'challenges':
        return <ChallengesPage />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'achievements':
        return <Achievements />;
      case 'profile':
        return <Profile />;
      case 'admin':
        return <AdminApp currentUser={user} onBack={() => setCurrentPage('dashboard')} />;
      case 'remediation':
        return <RemediationPage onNavigate={setCurrentPage} />;
      case 'support':
        return <Support />;
      default:
        return <GameDashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-black text-white ${isSidebarCollapsed ? 'p-3' : 'p-6'} flex flex-col transition-all duration-300 fixed left-0 top-0 h-screen overflow-y-auto z-20`}>
        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-8 bg-lime-400 text-black rounded-full p-1.5 shadow-lg hover:bg-lime-300 transition-colors z-10"
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        <div className="flex items-center gap-2 mb-8">
          <Shield size={24} />
          {!isSidebarCollapsed && <h1 className="text-xl font-bold">Practikal</h1>}
        </div>

        <nav className="space-y-4 flex-1">
          <button 
            onClick={() => setCurrentPage('dashboard')}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2 rounded-lg w-full text-left transition-colors ${
              currentPage === 'dashboard' ? 'bg-lime-300/20 text-lime-300' : 'hover:bg-white/10'
            }`}
            title="Dashboard"
          >
            <Gamepad2 size={20} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span>Dashboard</span>}
          </button>
          <button 
            onClick={() => setCurrentPage('challenges')}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2 rounded-lg w-full text-left transition-colors ${
              currentPage === 'challenges' ? 'bg-lime-300/20 text-lime-300' : 'hover:bg-white/10'
            }`}
            title="Challenges"
          >
            <Gamepad2 size={20} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span>Challenges</span>}
          </button>
          <button 
            onClick={() => setCurrentPage('remediation')}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2 rounded-lg w-full text-left transition-colors ${
              currentPage === 'remediation' ? 'bg-lime-300/20 text-lime-300' : 'hover:bg-white/10'
            }`}
            title="Review mistakes"
          >
            <BookOpenCheck size={20} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span>Review mistakes</span>}
          </button>
          <button 
            onClick={() => setCurrentPage('leaderboard')}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2 rounded-lg w-full text-left transition-colors ${
              currentPage === 'leaderboard' ? 'bg-lime-300/20 text-lime-300' : 'hover:bg-white/10'
            }`}
            title="Leaderboard"
          >
            <Trophy size={20} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span>Leaderboard</span>}
          </button>
          <button 
            onClick={() => setCurrentPage('achievements')}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2 rounded-lg w-full text-left transition-colors ${
              currentPage === 'achievements' ? 'bg-lime-300/20 text-lime-300' : 'hover:bg-white/10'
            }`}
            title="Achievements & Progress"
          >
            <Medal size={20} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span>Achievements & Progress</span>}
          </button>
          <button 
            onClick={() => setCurrentPage('support')}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2 rounded-lg w-full text-left transition-colors ${
              currentPage === 'support' ? 'bg-lime-300/20 text-lime-300' : 'hover:bg-white/10'
            }`}
            title="Support"
          >
            <HeadphonesIcon size={20} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span>Support</span>}
          </button>
          
          {/* Admin link - only visible to admin and superadmin users */}
          {(user.role === 'admin' || user.role === 'superadmin') && (
            <button 
              onClick={() => setCurrentPage('admin')}
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2 rounded-lg w-full text-left transition-colors ${
                currentPage === 'admin' ? 'bg-lime-300/20 text-lime-300' : 'hover:bg-white/10'
              }`}
              title="Admin Panel"
            >
              <Settings size={20} className="flex-shrink-0" />
              {!isSidebarCollapsed && <span>Admin Panel</span>}
            </button>
          )}
        </nav>

        <div className="space-y-2">
          <button 
            onClick={() => setCurrentPage('profile')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left transition-colors ${
              currentPage === 'profile' ? 'bg-lime-300/20 text-lime-300' : 'hover:bg-white/10'
            }`}
            title="Profile"
          >
            <div className="w-8 h-8 bg-emerald-700 rounded-full flex items-center justify-center">
              {user?.name.charAt(0)}
            </div>
            {!isSidebarCollapsed && (
              <div>
                <div className="font-medium">{user?.name}</div>
                <div className="text-sm text-gray-300">{user?.organization}</div>
              </div>
            )}
          </button>
          <button 
            onClick={logout}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2 hover:bg-red-500/20 rounded-lg w-full text-left text-red-300 transition-colors`}
            title="Sign Out"
          >
            <LogOut size={20} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        key={currentPage}
        className={`flex-1 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'} transition-all duration-300 motion-safe:animate-content-shift`}
      >
        {renderMainContent()}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ChallengeProvider>
        <CampaignProvider>
          <ProgressProvider>
            <AppContent />
          </ProgressProvider>
        </CampaignProvider>
      </ChallengeProvider>
    </AuthProvider>
  );
}

export default App;