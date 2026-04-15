import { User, UserProgress } from '../types';
import { TrendingUp, Clock, Target, Award, Calendar, Zap, Trophy, BarChart3 } from 'lucide-react';

interface UserProgressDashboardProps {
  user: User;
}

export default function UserProgressDashboard({ user }: UserProgressDashboardProps) {
  // Mock progress data - in production, this would come from API/database
  const progress: UserProgress = user.progress || {
    totalChallengesCompleted: 12,
    totalChallengesAvailable: 45,
    completionRate: 26.7,
    averageScore: 85,
    totalTimeSpent: 240,
    currentStreak: 5,
    longestStreak: 12,
    lastActive: new Date(),
    categoryProgress: [
      { category: 'phishing', completed: 5, total: 10, averageScore: 88, timeSpent: 60 },
      { category: 'malware', completed: 3, total: 8, averageScore: 82, timeSpent: 45 },
      { category: 'password', completed: 2, total: 7, averageScore: 90, timeSpent: 30 },
      { category: 'social-engineering', completed: 2, total: 10, averageScore: 78, timeSpent: 50 },
      { category: 'incident-response', completed: 0, total: 5, averageScore: 0, timeSpent: 0 },
      { category: 'general', completed: 0, total: 5, averageScore: 0, timeSpent: 0 },
    ],
    weeklyActivity: [
      { week: 'Week 1', challengesCompleted: 3, xpEarned: 450, timeSpent: 60 },
      { week: 'Week 2', challengesCompleted: 5, xpEarned: 750, timeSpent: 90 },
      { week: 'Week 3', challengesCompleted: 2, xpEarned: 300, timeSpent: 40 },
      { week: 'Week 4', challengesCompleted: 2, xpEarned: 300, timeSpent: 50 },
    ],
    milestones: [
      {
        id: '1',
        title: 'First Steps',
        description: 'Complete 5 challenges',
        target: 5,
        current: 12,
        completed: true,
        completedAt: new Date('2024-01-15'),
        reward: { xp: 100, reputation: 10 }
      },
      {
        id: '2',
        title: 'Rising Star',
        description: 'Complete 25 challenges',
        target: 25,
        current: 12,
        completed: false,
        reward: { xp: 500, reputation: 50 }
      },
      {
        id: '3',
        title: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        target: 7,
        current: 5,
        completed: false,
        reward: { xp: 200, reputation: 20 }
      },
    ],
    recentAchievements: user.achievements.slice(0, 3)
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl p-6 text-white">
        <h2 className="text-3xl font-bold mb-2">Your Progress</h2>
        <p className="text-emerald-100">Track your learning journey and achievements</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <Target className="text-emerald-600" size={24} />
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              {progress.completionRate.toFixed(1)}%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{progress.totalChallengesCompleted}</h3>
          <p className="text-sm text-gray-600">Challenges Completed</p>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-emerald-600 h-2 rounded-full transition-all"
              style={{ width: `${progress.completionRate}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="text-blue-600" size={24} />
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              AVG
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{progress.averageScore}%</h3>
          <p className="text-sm text-gray-600">Average Score</p>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress.averageScore}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <Clock className="text-purple-600" size={24} />
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
              TIME
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{formatTime(progress.totalTimeSpent)}</h3>
          <p className="text-sm text-gray-600">Total Time Spent</p>
          <p className="text-xs text-gray-500 mt-1">≈ {Math.round(progress.totalTimeSpent / progress.totalChallengesCompleted)}m per challenge</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <Zap className="text-orange-600" size={24} />
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
              🔥 {progress.currentStreak}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{progress.longestStreak}</h3>
          <p className="text-sm text-gray-600">Longest Streak</p>
          <p className="text-xs text-gray-500 mt-1">Current: {progress.currentStreak} days</p>
        </div>
      </div>

      {/* Category Progress */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Trophy className="text-emerald-600" size={24} />
          Progress by Category
        </h3>
        <div className="space-y-4">
          {progress.categoryProgress.map((cat) => (
            <div key={cat.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700 capitalize">
                    {cat.category.replace('-', ' ')}
                  </span>
                  <span className="text-xs text-gray-500">
                    {cat.completed}/{cat.total} completed
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-600">
                    Score: <span className="font-bold text-emerald-600">{cat.averageScore}%</span>
                  </span>
                  <span className="text-xs text-gray-600">
                    Time: <span className="font-bold">{formatTime(cat.timeSpent)}</span>
                  </span>
                </div>
              </div>
              <div className="bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all flex items-center justify-end pr-2"
                  style={{ width: `${(cat.completed / cat.total) * 100}%` }}
                >
                  {cat.completed > 0 && (
                    <span className="text-xs font-bold text-white">
                      {Math.round((cat.completed / cat.total) * 100)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Award className="text-purple-600" size={24} />
          Milestones
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {progress.milestones.map((milestone) => (
            <div 
              key={milestone.id}
              className={`p-4 rounded-lg border-2 ${
                milestone.completed 
                  ? 'bg-emerald-50 border-emerald-300' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold text-gray-900">{milestone.title}</h4>
                {milestone.completed && (
                  <Trophy className="text-emerald-600" size={20} />
                )}
              </div>
              <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-bold text-gray-900">
                    {milestone.current}/{milestone.target}
                  </span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      milestone.completed ? 'bg-emerald-600' : 'bg-purple-600'
                    }`}
                    style={{ width: `${Math.min((milestone.current / milestone.target) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                  <span>Reward:</span>
                  <span className="font-bold text-emerald-600">+{milestone.reward.xp} XP</span>
                  <span className="font-bold text-blue-600">+{milestone.reward.reputation} Rep</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="text-blue-600" size={24} />
          Weekly Activity
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {progress.weeklyActivity.map((week, index) => (
            <div key={index} className="text-center">
              <div className="bg-gray-100 rounded-lg p-4 mb-2">
                <div 
                  className="bg-gradient-to-t from-emerald-600 to-emerald-400 rounded mx-auto transition-all"
                  style={{ 
                    height: `${Math.max(week.challengesCompleted * 20, 20)}px`,
                    width: '40px'
                  }}
                ></div>
              </div>
              <p className="text-xs font-bold text-gray-900">{week.week}</p>
              <p className="text-xs text-gray-600">{week.challengesCompleted} challenges</p>
              <p className="text-xs text-emerald-600 font-bold">+{week.xpEarned} XP</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Achievements */}
      {progress.recentAchievements.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="text-lime-600" size={24} />
            Recent Achievements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {progress.recentAchievements.map((achievement) => (
              <div key={achievement.id} className="bg-gradient-to-br from-lime-50 to-emerald-50 rounded-lg p-4 border-2 border-lime-200">
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <h4 className="font-bold text-gray-900 mb-1">{achievement.title}</h4>
                <p className="text-sm text-gray-600">{achievement.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
