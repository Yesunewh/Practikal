import React from 'react';
import { Award, Lock, CheckCircle2, Target, Flame, Key, Shield, Users, Clock, BarChart3, Trophy, Printer } from 'lucide-react';
import { Achievement } from '../types';
import { useAuth } from '../context/AuthContext';
import { useChallenges } from '../context/ChallengeContext';
import { useProgress } from '../context/ProgressContext';

const mockAchievements: Achievement[] = [
  {
    id: '1',
    title: 'Security Novice',
    description: 'Complete your first cybersecurity challenge',
    icon: 'award',
    unlockedAt: new Date('2024-01-15'),
    progress: 1,
    total: 1
  },
  {
    id: '2',
    title: 'Password Master',
    description: 'Complete all password security challenges',
    icon: 'key',
    progress: 2,
    total: 3
  },
  {
    id: '3',
    title: 'Phishing Detective',
    description: 'Successfully identify 10 phishing attempts',
    icon: 'shield',
    progress: 7,
    total: 10
  },
  {
    id: '4',
    title: 'Streak Champion',
    description: 'Maintain a 30-day learning streak',
    icon: 'flame',
    progress: 12,
    total: 30
  },
  {
    id: '5',
    title: 'Team Player',
    description: 'Help 5 colleagues complete challenges',
    icon: 'users',
    progress: 0,
    total: 5
  },
  {
    id: '6',
    title: 'Speed Learner',
    description: 'Complete 5 challenges in under 2 minutes each',
    icon: 'clock',
    progress: 1,
    total: 5
  },
  {
    id: '7',
    title: 'Security Expert',
    description: 'Reach Advanced level in cybersecurity',
    icon: 'target',
    progress: 0,
    total: 1
  }
];

export default function Achievements() {
  const { user } = useAuth();
  const { challenges } = useChallenges();
  const { calculateProgress } = useProgress();

  const userProgress = user ? calculateProgress(user.id, challenges) : null;
  
  const getIcon = (iconName: string, isUnlocked: boolean) => {
    const iconProps = {
      size: 32,
      className: isUnlocked ? 'text-yellow-500' : 'text-gray-400'
    };

    switch (iconName) {
      case 'award': return <Award {...iconProps} />;
      case 'key': return <Key {...iconProps} />;
      case 'shield': return <Shield {...iconProps} />;
      case 'flame': return <Flame {...iconProps} />;
      case 'users': return <Users {...iconProps} />;
      case 'clock': return <Clock {...iconProps} />;
      case 'target': return <Target {...iconProps} />;
      default: return <Award {...iconProps} />;
    }
  };

  const isUnlocked = (achievement: Achievement) => {
    return achievement.unlockedAt !== undefined;
  };

  const getProgressPercentage = (achievement: Achievement) => {
    if (!achievement.progress || !achievement.total) return 0;
    return Math.min((achievement.progress / achievement.total) * 100, 100);
  };

  const unlockedCount = mockAchievements.filter(isUnlocked).length;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <>
    <div className="print:hidden min-h-screen bg-gray-50 overflow-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white py-8">
        <div className="px-8">
          <h1 className="text-3xl font-bold mb-6">Achievements & Progress</h1>
          
          {/* Progress Stats */}
          {userProgress && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy size={20} className="text-lime-300" />
                  <span className="text-sm font-medium text-emerald-100">Challenges</span>
                </div>
                <p className="text-2xl font-bold">{userProgress.totalChallengesCompleted}</p>
                <p className="text-xs text-emerald-200">{userProgress.completionRate.toFixed(0)}% complete</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 size={20} className="text-lime-300" />
                  <span className="text-sm font-medium text-emerald-100">Avg Score</span>
                </div>
                <p className="text-2xl font-bold">{userProgress.averageScore}%</p>
                <p className="text-xs text-emerald-200">Overall performance</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={20} className="text-lime-300" />
                  <span className="text-sm font-medium text-emerald-100">Time Spent</span>
                </div>
                <p className="text-2xl font-bold">{formatTime(userProgress.totalTimeSpent)}</p>
                <p className="text-xs text-emerald-200">Learning time</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Flame size={20} className="text-orange-300" />
                  <span className="text-sm font-medium text-emerald-100">Streak</span>
                </div>
                <p className="text-2xl font-bold">🔥 {userProgress.currentStreak}</p>
                <p className="text-xs text-emerald-200">Best: {userProgress.longestStreak} days</p>
              </div>
            </div>
          )}
          
          {/* Achievement Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 size={24} className="text-yellow-300" />
                <span className="text-lg font-semibold">Unlocked</span>
              </div>
              <p className="text-2xl font-bold">
                {unlockedCount} of {mockAchievements.length}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Target size={24} className="text-yellow-300" />
                <span className="text-lg font-semibold">Progress</span>
              </div>
              <p className="text-2xl font-bold">
                {Math.round((unlockedCount / mockAchievements.length) * 100)}%
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Award size={24} className="text-yellow-300" />
                <span className="text-lg font-semibold">Next Goal</span>
              </div>
              <p className="text-emerald-100">Password Master</p>
            </div>
          </div>
        </div>
        {user && (
          <div className="px-8 pb-4">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 rounded-lg text-sm font-medium border border-white/30"
            >
              <Printer size={18} />
              Print learning summary
            </button>
            <p className="text-xs text-emerald-200/90 mt-2 max-w-xl">
              Opens your browser print dialog — save as PDF if you prefer. The printable page shows your summary only.
            </p>
          </div>
        )}
      </div>

      {/* Achievements Grid */}
      <div className="px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockAchievements.map((achievement) => {
            const unlocked = isUnlocked(achievement);
            const progress = getProgressPercentage(achievement);
            
            return (
              <div
                key={achievement.id}
                className={`bg-white rounded-xl p-6 shadow-sm transition-all hover:shadow-md ${
                  unlocked ? 'ring-2 ring-yellow-200' : ''
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-full ${unlocked ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                    {unlocked ? (
                      getIcon(achievement.icon, true)
                    ) : (
                      <Lock className="text-gray-400" size={32} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-1 ${unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                      {achievement.title}
                    </h3>
                    <p className={`text-sm ${unlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                      {achievement.description}
                    </p>
                  </div>
                </div>

                {achievement.progress !== undefined && achievement.total && (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="text-gray-600">
                        {achievement.progress}/{achievement.total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          unlocked ? 'bg-yellow-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {unlocked && achievement.unlockedAt && (
                  <div className="flex items-center gap-2 text-sm text-yellow-600">
                    <CheckCircle2 size={16} />
                    <span>Unlocked {achievement.unlockedAt.toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>

    <div
      id="practikal-certificate"
      className="hidden print:block bg-white text-gray-900 p-10 max-w-3xl mx-auto min-h-screen"
    >
      <h1 className="text-2xl font-bold border-b pb-4 mb-6">Practikal — learning summary</h1>
      {user && (
        <>
          <p className="text-sm text-gray-600 mb-6">
            Generated {new Date().toLocaleDateString()} · {user.name} · {user.organization}
          </p>
          {userProgress && (
            <ul className="space-y-3 text-base">
              <li>
                <strong>Challenges completed:</strong> {userProgress.totalChallengesCompleted} /{' '}
                {userProgress.totalChallengesAvailable}
              </li>
              <li>
                <strong>Completion rate:</strong> {userProgress.completionRate.toFixed(0)}%
              </li>
              <li>
                <strong>Average score:</strong> {userProgress.averageScore}%
              </li>
              <li>
                <strong>Learning streak (days):</strong> {userProgress.currentStreak} (best{' '}
                {userProgress.longestStreak})
              </li>
              <li>
                <strong>Total learning time:</strong> {formatTime(userProgress.totalTimeSpent)}
              </li>
            </ul>
          )}
          <p className="mt-10 text-sm text-gray-500">
            This document was produced from your local training record for awareness purposes only.
          </p>
        </>
      )}
    </div>
    </>
  );
}