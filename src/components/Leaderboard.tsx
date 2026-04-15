import { useAuth } from '../context/AuthContext';
import { teamLeaderboard, companyLeaderboard, worldwideLeaderboard } from '../data/leaderboardData';
import LeaderboardHeader from './LeaderboardHeader';
import LeaderboardTable from './LeaderboardTable';

export default function Leaderboard() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <LeaderboardHeader user={user} />
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <LeaderboardTable 
          teamData={teamLeaderboard}
          companyData={companyLeaderboard}
          worldwideData={worldwideLeaderboard}
          userId={user.id}
        />
      </div>
    </div>
  );
}