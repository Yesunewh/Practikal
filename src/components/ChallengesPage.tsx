import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChallenges } from '../context/ChallengeContext';
import { Shield, Trophy, Clock, Star, ChevronRight } from 'lucide-react';
import ActiveChallenge from './ActiveChallenge';

function ChallengesPage() {
  const { user } = useAuth();
  const { challenges } = useChallenges();
  const [activeChallenge, setActiveChallenge] = useState<string | null>(null);

  useEffect(() => {
    const focus = sessionStorage.getItem('practikal-focus-challenge');
    if (focus && challenges.some((c) => c.id === focus)) {
      setActiveChallenge(focus);
      sessionStorage.removeItem('practikal-focus-challenge');
    }
  }, [challenges]);

  const difficultyColors = {
    beginner: 'bg-emerald-100 text-emerald-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800'
  };

  const handleChallengeComplete = (success: boolean) => {
    if (success) {
      // In a real app, this would update the backend
      console.log('Challenge completed successfully!');
    }
  };

  const currentChallenge = challenges.find(c => c.id === activeChallenge);

  if (currentChallenge) {
    return (
      <ActiveChallenge
        challenge={currentChallenge}
        onComplete={handleChallengeComplete}
        onExit={() => setActiveChallenge(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-auto">
      {/* Header */}
      <div className="bg-emerald-900 text-white py-8">
        <div className="px-8">
          <h1 className="text-3xl font-bold mb-4">Security Challenges</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-emerald-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Trophy size={24} className="text-yellow-400" />
                <span className="text-lg font-semibold">Your Progress</span>
              </div>
              <p className="text-emerald-100">
                {user?.completedChallenges.length || 0} of {challenges.length} challenges completed
              </p>
            </div>
            <div className="bg-emerald-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Star size={24} className="text-yellow-400" />
                <span className="text-lg font-semibold">XP Earned</span>
              </div>
              <p className="text-emerald-100">{user?.xp || 0} XP</p>
            </div>
            <div className="bg-emerald-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Shield size={24} className="text-yellow-400" />
                <span className="text-lg font-semibold">Current Level</span>
              </div>
              <p className="text-emerald-100 capitalize">{user?.level || 'Beginner'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Challenges Grid */}
      <div className="px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer tap-highlight"
              onClick={() => {
                if (!challenge.steps || challenge.steps.length === 0) {
                  alert('This challenge has no steps yet. Please contact an administrator.');
                  return;
                }
                setActiveChallenge(challenge.id);
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">{challenge.title}</h3>
                <span className={`px-3 py-1 rounded-full text-sm ${difficultyColors[challenge.difficulty]}`}>
                  {challenge.difficulty}
                </span>
              </div>
              <p className="text-gray-600 mb-6">{challenge.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock size={16} />
                    <span>{challenge.duration} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={16} />
                    <span>{challenge.xpReward} XP</span>
                  </div>
                </div>
                <ChevronRight className="text-emerald-600" size={20} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ChallengesPage;