import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { selectPassedChallengeIds } from '../store/slices/progressSlice';
import { User, Mail, Building2, Calendar, Trophy, Target, Flame } from 'lucide-react';

export default function Profile() {
  const user = useSelector((state: RootState) => state.auth.user);
  const passedIds = useSelector(selectPassedChallengeIds(user?.id || ''));

  if (!user) return null;

  const levelProgress =
    user.xpToNextLevel > 0 ? Math.min(100, (user.xp / user.xpToNextLevel) * 100) : 100;

  return (
    <div className="min-h-screen bg-gray-50 overflow-auto">
      {/* Header */}
      <div className="bg-emerald-900 text-white py-8">
        <div className="px-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-emerald-700 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">{user.name}</h1>
              <p className="text-emerald-200 text-lg capitalize">{user.level} Level</p>
              <p className="text-emerald-300">{user.organization}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stats Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Learning Progress</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Level Progress</span>
                    <span>{user.xp} / {user.xpToNextLevel} XP</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-emerald-500 h-3 rounded-full transition-all"
                      style={{ width: `${levelProgress}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Trophy className="text-yellow-500" size={20} />
                      <span className="text-2xl font-bold">{passedIds.size}</span>
                    </div>
                    <p className="text-sm text-gray-600">Challenges Completed</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Target className="text-emerald-500" size={20} />
                      <span className="text-2xl font-bold">{user.reputation}%</span>
                    </div>
                    <p className="text-sm text-gray-600">Reputation</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Flame className="text-orange-500" size={20} />
                      <span className="text-2xl font-bold">{user.streak}</span>
                    </div>
                    <p className="text-sm text-gray-600">Day Streak</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Achievements */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Recent Achievements</h2>
              <div className="space-y-3">
                {user.achievements.length > 0 ? (
                  user.achievements.slice(0, 3).map((achievement) => (
                    <div key={achievement.id} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                      <Trophy className="text-yellow-500" size={24} />
                      <div>
                        <h3 className="font-medium">{achievement.title}</h3>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Complete challenges to unlock achievements!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{user.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Organization</p>
                    <p className="font-medium">{user.organization}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="font-medium">January 2024</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}