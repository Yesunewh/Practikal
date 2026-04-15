import { useState } from 'react';
import { User, ActivityLogEntry } from '../../types';
import { Award, Calendar, Activity, Download, Filter, Trophy } from 'lucide-react';
import { useChallenges } from '../../context/ChallengeContext';
import { useProgress } from '../../context/ProgressContext';
import { downloadCsv } from '../../utils/csv';
import { reviveAttempts } from '../../utils/progressCalculations';

interface UserProgressReportProps {
  users: User[];
}

export default function UserProgressReport({ users }: UserProgressReportProps) {
  const { challenges } = useChallenges();
  const { calculateProgress } = useProgress();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'score' | 'time'>('progress');

  const exportAttemptsCsv = () => {
    const raw = JSON.parse(localStorage.getItem('challengeAttempts') || '[]');
    const attempts = reviveAttempts(raw);
    const uid = selectedUser?.id;
    const filtered = uid ? attempts.filter((a) => a.userId === uid) : attempts;
    const rows = filtered.map((a) => [
      a.id,
      a.userId,
      a.challengeId,
      a.score,
      a.passed ? 'yes' : 'no',
      a.completedAt ? new Date(a.completedAt).toISOString() : '',
      a.timeSpent,
    ]);
    downloadCsv(
      ['attemptId', 'userId', 'challengeId', 'score', 'passed', 'completedAt', 'timeSpentSec'],
      rows,
      'practikal-challenge-attempts.csv',
    );
  };

  // Mock activity log
  const mockActivityLog: ActivityLogEntry[] = [
    {
      id: '1',
      userId: selectedUser?.id || '',
      type: 'challenge_completed',
      timestamp: new Date('2024-01-20T10:30:00'),
      details: {
        challengeId: 'ch1',
        challengeTitle: 'Phishing Detection 101',
        score: 95,
        timeSpent: 300,
        xpEarned: 150
      }
    },
    {
      id: '2',
      userId: selectedUser?.id || '',
      type: 'achievement_unlocked',
      timestamp: new Date('2024-01-20T10:35:00'),
      details: {
        achievementId: 'ach1',
        achievementTitle: 'First Steps'
      }
    },
    {
      id: '3',
      userId: selectedUser?.id || '',
      type: 'level_up',
      timestamp: new Date('2024-01-20T10:36:00'),
      details: {
        newLevel: 'Medior'
      }
    },
  ];

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getActivityIcon = (type: ActivityLogEntry['type']) => {
    switch (type) {
      case 'challenge_completed':
        return '✅';
      case 'achievement_unlocked':
        return '🏆';
      case 'level_up':
        return '⬆️';
      case 'streak_milestone':
        return '🔥';
      case 'login':
        return '👋';
      case 'policy_attested':
        return '📜';
      default:
        return '📌';
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    const pa = calculateProgress(a.id, challenges);
    const pb = calculateProgress(b.id, challenges);
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'progress':
        return pb.completionRate - pa.completionRate;
      case 'score':
        return pb.averageScore - pa.averageScore;
      case 'time':
        return pb.totalTimeSpent - pa.totalTimeSpent;
      default:
        return 0;
    }
  });

  const selectedLive = selectedUser ? calculateProgress(selectedUser.id, challenges) : null;
  const trainingRiskScore = selectedLive
    ? Math.min(100, Math.max(0, 100 - selectedLive.averageScore))
    : 0;

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="text-emerald-600" size={28} />
            User Progress Reports
          </h2>
          <button
            type="button"
            onClick={exportAttemptsCsv}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Download size={18} />
            Export attempts (CSV)
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-600" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'progress' | 'score' | 'time')}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
            >
              <option value="progress">Sort by Progress</option>
              <option value="score">Sort by Score</option>
              <option value="time">Sort by Time</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="phishing">Phishing</option>
            <option value="malware">Malware</option>
            <option value="password">Password Security</option>
            <option value="social-engineering">Social Engineering</option>
            <option value="incident-response">Incident Response</option>
          </select>
        </div>
      </div>

      {/* User List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Cards */}
        <div className="lg:col-span-1 space-y-3 max-h-[600px] overflow-y-auto">
          {sortedUsers.map((user) => {
            const progress = calculateProgress(user.id, challenges);

            return (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`bg-white rounded-lg p-4 cursor-pointer transition-all border-2 ${
                  selectedUser?.id === user.id
                    ? 'border-emerald-500 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{user.name}</h3>
                    <p className="text-xs text-gray-600">{user.organization}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-emerald-50 rounded p-2">
                    <p className="text-gray-600">Progress</p>
                    <p className="font-bold text-emerald-600">{progress.completionRate.toFixed(0)}%</p>
                  </div>
                  <div className="bg-blue-50 rounded p-2">
                    <p className="text-gray-600">Avg Score</p>
                    <p className="font-bold text-blue-600">{progress.averageScore}%</p>
                  </div>
                  <div className="bg-purple-50 rounded p-2">
                    <p className="text-gray-600">Time</p>
                    <p className="font-bold text-purple-600">{formatTime(progress.totalTimeSpent)}</p>
                  </div>
                  <div className="bg-orange-50 rounded p-2">
                    <p className="text-gray-600">Streak</p>
                    <p className="font-bold text-orange-600">🔥 {progress.currentStreak}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Progress View */}
        <div className="lg:col-span-2">
          {selectedUser ? (
            <div className="space-y-4">
              {/* User Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl p-6 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {selectedUser.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedUser.name}</h2>
                    <p className="text-emerald-100">{selectedUser.email}</p>
                    <p className="text-sm text-emerald-200">{selectedUser.organization}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-emerald-200 text-sm">Level</p>
                    <p className="font-bold text-lg">{selectedUser.level}</p>
                  </div>
                  <div>
                    <p className="text-emerald-200 text-sm">XP</p>
                    <p className="font-bold text-lg">{selectedUser.xp}</p>
                  </div>
                  <div>
                    <p className="text-emerald-200 text-sm">Reputation</p>
                    <p className="font-bold text-lg">{selectedUser.reputation}</p>
                  </div>
                  <div>
                    <p className="text-emerald-200 text-sm">Rank</p>
                    <p className="font-bold text-lg capitalize">{selectedUser.rank.current}</p>
                  </div>
                  <div>
                    <p className="text-emerald-200 text-sm">Training risk (demo)</p>
                    <p className="font-bold text-lg" title="Derived from 100 − average challenge score">
                      {trainingRiskScore}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Category Progress */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Trophy className="text-emerald-600" size={20} />
                  Category Progress
                </h3>
                <div className="space-y-3">
                  {selectedLive?.categoryProgress.map((cat) => (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-gray-700 capitalize">
                          {cat.category.replace('-', ' ')}
                        </span>
                        <span className="text-gray-600">
                          {cat.completed}/{cat.total} • {cat.averageScore}%
                        </span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-emerald-600 h-2 rounded-full transition-all"
                          style={{ width: `${cat.total ? (cat.completed / cat.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Log */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="text-blue-600" size={20} />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {mockActivityLog.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-900 capitalize">
                            {activity.type.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(activity.timestamp)}
                          </span>
                        </div>
                        {activity.details.challengeTitle && (
                          <p className="text-sm text-gray-700">
                            {activity.details.challengeTitle}
                            {activity.details.score && (
                              <span className="ml-2 text-emerald-600 font-bold">
                                Score: {activity.details.score}%
                              </span>
                            )}
                          </p>
                        )}
                        {activity.details.achievementTitle && (
                          <p className="text-sm text-gray-700">
                            Unlocked: {activity.details.achievementTitle}
                          </p>
                        )}
                        {activity.details.newLevel && (
                          <p className="text-sm text-gray-700">
                            Advanced to {activity.details.newLevel}
                          </p>
                        )}
                        {activity.details.xpEarned && (
                          <span className="text-xs text-emerald-600 font-bold">
                            +{activity.details.xpEarned} XP
                          </span>
                        )}
                        {activity.details.policyTitle && (
                          <p className="text-sm text-gray-700">Policy: {activity.details.policyTitle}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestones */}
              {selectedLive?.milestones && selectedLive.milestones.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Award className="text-purple-600" size={20} />
                    Milestones
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedLive.milestones.map((milestone) => (
                      <div 
                        key={milestone.id}
                        className={`p-4 rounded-lg border-2 ${
                          milestone.completed 
                            ? 'bg-emerald-50 border-emerald-300' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-gray-900 text-sm">{milestone.title}</h4>
                          {milestone.completed && (
                            <Trophy className="text-emerald-600" size={16} />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{milestone.description}</p>
                        <div className="bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${
                              milestone.completed ? 'bg-emerald-600' : 'bg-purple-600'
                            }`}
                            style={{ width: `${Math.min((milestone.current / milestone.target) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {milestone.current}/{milestone.target}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-12 shadow-sm text-center">
              <Activity className="text-gray-300 mx-auto mb-4" size={64} />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Select a User</h3>
              <p className="text-gray-600">Choose a user from the list to view their detailed progress report</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
