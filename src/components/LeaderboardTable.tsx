import { useState } from 'react';
import { LeaderboardEntry } from '../data/leaderboardData';
import { Award, Target, Flame, Zap, Star } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

interface LeaderboardTableProps {
  teamData: LeaderboardEntry[];
  companyData: LeaderboardEntry[];
  worldwideData: LeaderboardEntry[];
  userId: string;
  /** When true, hide team/company/world tabs — data is already scoped (e.g. API org/dept/global). */
  hideScopeTabs?: boolean;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
}

type ViewType = 'team' | 'company' | 'worldwide';
type SortField = 'progress' | 'xp' | 'earnings' | 'challenges' | 'streak';

export default function LeaderboardTable({ 
  teamData, 
  companyData, 
  worldwideData,
  userId,
  hideScopeTabs = false,
  currentPage = 1,
  onPageChange,
  pageSize = 20,
}: LeaderboardTableProps) {
  const { messages } = useI18n();
  const lb = messages.leaderboard;
  const com = messages.common;
  const [view, setView] = useState<ViewType>('team');
  const [sortField, setSortField] = useState<SortField>('xp');

  const getActiveData = (): LeaderboardEntry[] => {
    if (hideScopeTabs) {
      return teamData;
    }
    switch (view) {
      case 'team': return teamData;
      case 'company': return companyData;
      case 'worldwide': return worldwideData;
      default: return teamData;
    }
  };

  const activeData = getActiveData();

  const getRankStyle = (position: number) => {
    if (position === 1) return 'bg-yellow-100 text-yellow-700 border-yellow-200 shadow-sm font-bold scale-110';
    if (position === 2) return 'bg-slate-100 text-slate-700 border-slate-200 shadow-sm font-bold scale-105';
    if (position === 3) return 'bg-orange-100 text-orange-700 border-orange-200 shadow-sm font-bold scale-105';
    if (position <= 10) return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-semibold';
    return 'bg-gray-50 text-gray-600 border-gray-100';
  };

  const getRankIcon = (position: number, rank: string) => {
    if (rank === 'group') return <Target className="w-4 h-4 text-emerald-600" />;
    if (position === 1) return <Award className="w-4 h-4 text-yellow-500" />;
    if (position === 2) return <Award className="w-4 h-4 text-slate-400" />;
    if (position === 3) return <Award className="w-4 h-4 text-orange-400" />;
    if (position <= 10) return <Star className="w-4 h-4 text-emerald-400" />;
    return null;
  };

  return (
    <div className="space-y-4">
      {!hideScopeTabs && (
        <div className="flex border-b">
          {(['team', 'company', 'worldwide'] as const).map((v) => (
            <button 
              key={v}
              className={`px-6 py-3 font-semibold transition-all duration-200 ${
                view === v ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-400 hover:text-gray-600'
              }`}
              onClick={() => setView(v)}
            >
              {v === 'team' ? lb.tableYourTeam : v === 'company' ? lb.tableYourCompany : lb.tableWorldwide}
            </button>
          ))}
        </div>
      )}

      {/* Stats navigation */}
      <div className="grid grid-cols-5 gap-2 bg-emerald-900/90 backdrop-blur-sm text-white rounded-xl p-2 shadow-lg">
        {[
          { id: 'xp', icon: Zap, label: lb.xpAbbrev },
          { id: 'earnings', icon: Star, label: lb.reputation },
          { id: 'challenges', icon: Award, label: lb.challenges },
          { id: 'streak', icon: Flame, label: lb.streak },
          { id: 'progress', icon: Target, label: com.progress },
        ].map((stat) => (
          <button 
            key={stat.id}
            className={`flex flex-col items-center justify-center py-2 rounded-lg transition-all ${
              sortField === stat.id ? 'bg-white/20 scale-105 shadow-inner' : 'hover:bg-white/10'
            }`}
            onClick={() => setSortField(stat.id as SortField)}
          >
            <stat.icon className={`w-5 h-5 mb-1 ${sortField === stat.id ? 'text-emerald-300' : 'text-emerald-100/60'}`} />
            <span className="text-[10px] uppercase tracking-wider font-bold">{stat.label}</span>
          </button>
        ))}
      </div>
      
      {/* Leaderboard table */}
      <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">{lb.position}</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">{lb.nameDept}</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">{lb.rankCol}</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">
                {sortField === 'progress' && lb.tierProgress}
                {sortField === 'xp' && lb.xpAbbrev}
                {sortField === 'earnings' && lb.reputation}
                {sortField === 'challenges' && lb.challenges}
                {sortField === 'streak' && lb.streak}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {activeData.map((entry) => (
              <tr 
                key={entry.id} 
                className={`group transition-colors ${entry.id === userId ? 'bg-emerald-50/30' : 'hover:bg-gray-50/50'}`}
              >
                <td className="px-6 py-5">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border text-xs transition-transform ${getRankStyle(entry.position)}`}>
                    {entry.position}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shadow-inner uppercase">
                      {entry.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-800">{entry.name}</span>
                        {getRankIcon(entry.position, entry.rank)}
                        {entry.id === userId && (
                          <span className="px-1.5 py-0.5 bg-emerald-600 text-[10px] text-white font-bold rounded uppercase tracking-tighter">You</span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 font-medium">
                        {entry.organization} {entry.rank !== 'group' && <>• <span className="text-gray-400">{entry.department}</span></>}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="px-2.5 py-1 text-[10px] font-black rounded-md bg-gray-100 text-gray-600 uppercase border border-gray-200">
                    {entry.rank}
                  </span>
                </td>
                <td className="px-6 py-5 text-right font-mono text-sm">
                  {sortField === 'progress' && <span className="font-bold text-emerald-600">{entry.rank === 'group' ? '—' : `${entry.progress}%`}</span>}
                  {sortField === 'xp' && <span className="font-bold text-gray-700">{entry.xp.toLocaleString()}</span>}
                  {sortField === 'earnings' && <span className="font-bold text-gray-700">{entry.rank === 'group' ? '—' : entry.earnings.toLocaleString()}</span>}
                  {sortField === 'challenges' && (
                    <span className="font-bold text-gray-700">
                      {entry.rank === 'group' ? `${entry.challenges} users` : entry.challenges}
                    </span>
                  )}
                  {sortField === 'streak' && (
                    <span className="inline-flex items-center font-bold text-orange-600">
                      {entry.rank === 'group' ? '—' : <>{entry.streak} <Flame className="w-4 h-4 ml-1 fill-current" /></>}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {onPageChange && (
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            ← Previous
          </button>
          <div className="text-sm text-gray-500 font-medium">
            Page <span className="text-gray-900 font-bold">{currentPage}</span>
          </div>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={activeData.length < pageSize}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
