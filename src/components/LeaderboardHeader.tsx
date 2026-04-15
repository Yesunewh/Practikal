import { User, Rank } from '../types';
import { Lock } from 'lucide-react';

interface LeaderboardHeaderProps {
  user: User;
}

export default function LeaderboardHeader({ user }: LeaderboardHeaderProps) {
  const ranks: Rank[] = ['beginner', 'medior', 'senior', 'professional', 'specialist', 'master', 'legend'];
  
  // Function to get date in DD/MM/YYYY format
  const formatDate = () => {
    const date = new Date();
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Leaderboard</h1>
      <p className="text-gray-500 mb-6">Your dashboard is the easiest way get insights about your online behavior across all your devices.</p>
      
      {/* Rank progression */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          {ranks.map((rank, index) => {
            const isCurrentRank = user.rank.current === rank;
            const isPastRank = ranks.indexOf(user.rank.current) > index;
            const isFutureRank = ranks.indexOf(user.rank.current) < index;
            
            return (
              <div key={rank} className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center 
                  ${isCurrentRank ? 'bg-gray-300 text-gray-700' : 'bg-gray-100'}
                  ${isPastRank ? 'bg-emerald-100 text-emerald-700' : ''}
                  ${isFutureRank ? 'bg-gray-100 text-gray-400' : ''}`}>
                  {isFutureRank ? (
                    <Lock className="w-6 h-6" />
                  ) : (
                    <div className="w-10 h-10 rounded-full border-2 border-emerald-700 flex items-center justify-center">
                      {rank.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className={`text-sm mt-2 font-medium 
                  ${isCurrentRank ? 'text-gray-700' : 'text-gray-500'}`}>
                  {rank.charAt(0).toUpperCase() + rank.slice(1)}
                </span>
                {isCurrentRank && (
                  <span className="text-xs text-gray-500">{formatDate()}</span>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Next rank card */}
        <div className="mt-6 md:mt-0 bg-emerald-50 rounded-lg p-4 w-full md:w-72">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Lock className="w-3 h-3" />
            </span>
            <h3 className="font-medium">Unlock your next rank</h3>
          </div>
          <div className="text-sm text-gray-600 mb-2">
            Earn €{user.rank.nextRankPoints} more to become {user.rank.next.charAt(0).toUpperCase() + user.rank.next.slice(1)}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`bg-emerald-400 h-2 rounded-full`}
              style={{ width: `${user.rank.progress}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Standings header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Standings</h2>
      </div>
      
      {/* Tab navigation */}
      <div className="flex border-b">
        <button className="px-4 py-2 border-b-2 border-emerald-500 text-emerald-500 font-medium">
          Your team
        </button>
        <button className="px-4 py-2 text-gray-500 font-medium">
          Your company
        </button>
        <button className="px-4 py-2 text-gray-500 font-medium">
          Worldwide
        </button>
      </div>
      
      {/* Stats navigation */}
      <div className="flex justify-between bg-emerald-900 text-white rounded-lg mt-4 p-4">
        <button className="flex items-center gap-2 px-2">
          <span>Progress</span>
        </button>
        <button className="flex items-center gap-2 px-2">
          <span>Earnings</span>
        </button>
        <button className="flex items-center gap-2 px-2">
          <span>Image</span>
        </button>
        <button className="flex items-center gap-2 px-2">
          <span>Challenges</span>
        </button>
        <button className="flex items-center gap-2 px-2">
          <span>Streak</span>
        </button>
      </div>
    </div>
  );
}
