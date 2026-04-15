import { useState } from 'react';
import { LeaderboardEntry } from '../data/leaderboardData';
import { Award, DollarSign, Image, Target, Flame } from 'lucide-react';

interface LeaderboardTableProps {
  teamData: LeaderboardEntry[];
  companyData: LeaderboardEntry[];
  worldwideData: LeaderboardEntry[];
  userId: string;
}

type ViewType = 'team' | 'company' | 'worldwide';
type SortField = 'progress' | 'earnings' | 'image' | 'challenges' | 'streak';

export default function LeaderboardTable({ 
  teamData, 
  companyData, 
  worldwideData,
  userId 
}: LeaderboardTableProps) {
  const [view, setView] = useState<ViewType>('team');
  const [sortField, setSortField] = useState<SortField>('progress');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  const teamDepartments = [...new Set(teamData.map((e) => e.department))].sort();

  const getActiveData = (): LeaderboardEntry[] => {
    let base: LeaderboardEntry[];
    switch (view) {
      case 'team':
        base = teamData;
        break;
      case 'company':
        base = companyData;
        break;
      case 'worldwide':
        base = worldwideData;
        break;
      default:
        base = teamData;
    }
    if (view === 'team' && departmentFilter !== 'all') {
      return base.filter((e) => e.department === departmentFilter);
    }
    return base;
  };

  return (
    <div>
      {/* Tab navigation */}
      <div className="flex border-b mb-4">
        <button 
          className={`px-4 py-2 font-medium ${view === 'team' ? 'border-b-2 border-emerald-500 text-emerald-500' : 'text-gray-500'}`}
          onClick={() => setView('team')}
        >
          Your team
        </button>
        <button 
          className={`px-4 py-2 font-medium ${view === 'company' ? 'border-b-2 border-emerald-500 text-emerald-500' : 'text-gray-500'}`}
          onClick={() => setView('company')}
        >
          Your company
        </button>
        <button 
          className={`px-4 py-2 font-medium ${view === 'worldwide' ? 'border-b-2 border-emerald-500 text-emerald-500' : 'text-gray-500'}`}
          onClick={() => setView('worldwide')}
        >
          Worldwide
        </button>
      </div>

      {view === 'team' && teamDepartments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <span className="text-sm text-gray-500 mr-2">Department:</span>
          <button
            type="button"
            className={`px-3 py-1 rounded-full text-sm ${departmentFilter === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setDepartmentFilter('all')}
          >
            All
          </button>
          {teamDepartments.map((d) => (
            <button
              key={d}
              type="button"
              className={`px-3 py-1 rounded-full text-sm ${departmentFilter === d ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setDepartmentFilter(d)}
            >
              {d}
            </button>
          ))}
        </div>
      )}
      
      {/* Stats navigation */}
      <div className="flex justify-between bg-emerald-900 text-white rounded-lg mb-4 p-4">
        <button 
          className={`flex items-center gap-2 px-2 ${sortField === 'progress' ? 'font-bold' : ''}`}
          onClick={() => setSortField('progress')}
        >
          <Target className="w-5 h-5" />
          <span>Progress</span>
        </button>
        <button 
          className={`flex items-center gap-2 px-2 ${sortField === 'earnings' ? 'font-bold' : ''}`}
          onClick={() => setSortField('earnings')}
        >
          <DollarSign className="w-5 h-5" />
          <span>Earnings</span>
        </button>
        <button 
          className={`flex items-center gap-2 px-2 ${sortField === 'image' ? 'font-bold' : ''}`}
          onClick={() => setSortField('image')}
        >
          <Image className="w-5 h-5" />
          <span>Image</span>
        </button>
        <button 
          className={`flex items-center gap-2 px-2 ${sortField === 'challenges' ? 'font-bold' : ''}`}
          onClick={() => setSortField('challenges')}
        >
          <Award className="w-5 h-5" />
          <span>Challenges</span>
        </button>
        <button 
          className={`flex items-center gap-2 px-2 ${sortField === 'streak' ? 'font-bold' : ''}`}
          onClick={() => setSortField('streak')}
        >
          <Flame className="w-5 h-5" />
          <span>Streak</span>
        </button>
      </div>
      
      {/* Leaderboard table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name / Dept
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {sortField === 'progress' && 'Progress'}
                {sortField === 'earnings' && 'Earnings'}
                {sortField === 'image' && 'Image'}
                {sortField === 'challenges' && 'Challenges'}
                {sortField === 'streak' && 'Streak'}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {getActiveData()
              .sort((a, b) => b[sortField] - a[sortField])
              .map((entry) => (
                <tr 
                  key={entry.id} 
                  className={`${entry.id === userId ? 'bg-emerald-50' : ''} hover:bg-gray-50`}
                >
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.position}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{entry.name}</div>
                        <div className="text-sm text-gray-500">{entry.organization}</div>
                        <div className="text-xs text-gray-400">{entry.department}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {entry.rank.charAt(0).toUpperCase() + entry.rank.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {sortField === 'progress' && `${entry.progress}%`}
                    {sortField === 'earnings' && `€${entry.earnings}`}
                    {sortField === 'image' && `${entry.image}%`}
                    {sortField === 'challenges' && entry.challenges}
                    {sortField === 'streak' && (
                      <span className="flex items-center justify-end">
                        {entry.streak} <Flame className="w-4 h-4 ml-1 text-orange-500" />
                      </span>
                    )}
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
