import { useSelector } from 'react-redux';
import { RootState } from '../store';
import type { Challenge, Assignment, LearningPath } from '../types';
import { learningPaths, pathCompletedCount } from '../data/learningPaths';
import { getWeakestCategory } from '../utils/progressCalculations';
import { 
  Shield, 
  CheckCircle2, 
  Target, 
  Route, 
  Sparkles,
  Trophy,
  Zap,
  Star,
  ChevronRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { interpolate } from '../i18n/messages';
import {
  selectUserProgress,
  selectPassedChallengeIds,
} from '../store/slices/progressSlice';
import { mergeApiOrLocalProgression } from '../utils/challengeProgression';
import { assignmentsForUser } from '../store/slices/campaignsSlice';
import { ModuleCard } from './modules/ModuleCard';

interface GameDashboardProps {
  onNavigate: (page: string) => void;
}

function GameDashboard({ onNavigate }: GameDashboardProps) {
  const { messages } = useI18n();
  const user = useSelector((state: RootState) => state.auth.user);
  const challenges = useSelector((state: RootState) => state.challenges.challenges);
  const assignments = useSelector((state: RootState) => state.campaigns.assignments);
  const uid = user?.id || '';
  const progress = useSelector(selectUserProgress(uid, challenges));
  const completedIds = useSelector(selectPassedChallengeIds(uid));

  if (!user) return null;

  const t = messages.dashboard;
  const mine = assignmentsForUser(assignments, user.id);
  const weakest = getWeakestCategory(progress);

  const weekSlot = Math.floor(Date.now() / (7 * 86400000));
  const spotlight = challenges.length > 0 ? challenges[weekSlot % challenges.length] : null;

  // Curated "Continue Learning" challenges (limit to 4)
  const continueLearning = challenges
    .filter((c: Challenge) => !completedIds.has(c.id))
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <div className="bg-neutral-50/50 border-b border-neutral-100">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
                {interpolate(t.welcomeBack, { name: user.name.split(' ')[0] })}
              </h1>
              <p className="mt-2 text-neutral-500 font-medium max-w-2xl text-base">
                {interpolate(t.completedCountMessage, { count: completedIds.size })}
              </p>
            </div>
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto">
              <StatItem 
                icon={<Zap size={18} className="text-amber-500 fill-amber-500" />} 
                label={t.streakLabel} 
                value={`${progress.currentStreak}d`} 
              />
              <StatItem 
                icon={<Star size={18} className="text-emerald-500 fill-emerald-500" />} 
                label={t.reputationLabel} 
                value={`${user.reputation}%`} 
              />
              <StatItem 
                icon={<Trophy size={18} className="text-blue-500 fill-blue-500" />} 
                label={t.totalXpLabel} 
                value={user.xp || 0} 
              />
              <StatItem 
                icon={<TrendingUp size={18} className="text-purple-500" />} 
                label={t.completionLabel} 
                value={`${Math.round((completedIds.size / (challenges.length || 1)) * 100)}%`} 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-8">
        
        {/* Priority Action Center */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
              <Zap size={22} className="text-amber-500 fill-amber-500" />
              {t.focusTodayTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Assignments or Weakest Category */}
            <div className="lg:col-span-2 space-y-4">
              {mine.length > 0 ? (
                mine.map((a: Assignment) => {
                  const due = new Date(a.dueDate);
                  const days = Math.ceil((due.getTime() - Date.now()) / 86400000);
                  const overdue = days < 0;
                  return (
                    <div 
                      key={a.id} 
                      className={`group relative overflow-hidden rounded-2xl border-2 p-6 transition-all hover:shadow-lg ${
                        overdue ? 'border-red-100 bg-red-50/30' : 'border-neutral-100 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                              overdue ? 'bg-red-500 text-white' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {overdue ? t.overdue : t.assignment}
                            </span>
                            <span className="text-xs font-semibold text-neutral-400">
                              {t.due} {a.dueDate}
                            </span>
                          </div>
                          <h3 className="text-xl font-semibold text-neutral-900">{a.title}</h3>
                          <p className="text-sm text-neutral-500 font-medium">
                            {t.assignmentDescription}
                          </p>
                        </div>
                        <button 
                          onClick={() => onNavigate('challenges')}
                          className="shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-neutral-900 text-white transition-transform group-hover:scale-110"
                        >
                          <ChevronRight size={24} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : weakest && weakest.total > 0 ? (
                <div className="group relative overflow-hidden rounded-2xl border-2 border-amber-100 bg-amber-50/30 p-6 transition-all hover:shadow-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold uppercase tracking-wider">
                          {t.recommendedLabel}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-neutral-900">
                        {interpolate(t.improveScoreIn, { category: weakest.category })}
                      </h3>
                      <p className="text-sm text-neutral-500 font-medium">
                        {interpolate(t.practiceMoreIn, {
                          category: weakest.category,
                          score: weakest.averageScore,
                        })}
                      </p>
                    </div>
                    <button 
                      onClick={() => onNavigate('challenges')}
                      className="shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-amber-600 text-white transition-transform group-hover:scale-110 shadow-md shadow-amber-600/20"
                    >
                      <Target size={24} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 rounded-2xl border-2 border-dashed border-neutral-100 bg-neutral-50/30">
                  <div className="bg-white p-3 rounded-full shadow-sm text-neutral-300">
                    <CheckCircle2 size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-neutral-900">{t.allCaughtUpTitle}</p>
                    <p className="text-sm text-neutral-400 font-medium">{t.allCaughtUpDescription}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Spotlight Card */}
            <div className="relative overflow-hidden rounded-2xl bg-emerald-950 p-6 text-white shadow-xl shadow-emerald-900/20">
              <div className="absolute -right-4 -top-4 opacity-10">
                <Sparkles size={120} />
              </div>
              <div className="relative z-10 h-full flex flex-col">
                <div className="mb-4">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                    {t.weeklySpotlightTitle}
                  </span>
                </div>
                {spotlight ? (
                  <>
                    <h3 className="text-xl font-semibold mb-2">{spotlight.title}</h3>
                    <p className="text-emerald-100/70 text-sm font-medium mb-6 line-clamp-3">
                      {spotlight.description}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs font-semibold text-emerald-400">
                        <span className="flex items-center gap-1"><Clock size={14} /> {spotlight.duration}m</span>
                        <span className="flex items-center gap-1"><Trophy size={14} /> {spotlight.xpReward} XP</span>
                      </div>
                      <button 
                        onClick={() => onNavigate('challenges')}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold text-xs rounded-lg transition-colors"
                      >
                        {t.start}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-emerald-100/50 italic text-sm">{t.loadingSpotlight}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Learning Paths Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
              <Route size={22} className="text-emerald-600" />
              {t.pathsTitle}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {learningPaths.map((path: LearningPath) => {
              const done = pathCompletedCount(path, completedIds);
              const total = path.stepChallengeIds.length;
              const progressPct = Math.round((done / total) * 100);
              return (
                <div key={path.id} className="group bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-neutral-900">{path.title}</h3>
                      <p className="text-xs text-neutral-500 font-medium line-clamp-1">{path.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-neutral-900">{progressPct}%</div>
                      <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">{t.progressLabel}</div>
                    </div>
                  </div>
                  
                  {/* Mini Progress Dots */}
                  <div className="flex gap-1.5 mb-4">
                    {path.stepChallengeIds.map((cid: string, idx: number) => {
                      const isDone = completedIds.has(cid);
                      const isLocked = idx > 0 && !completedIds.has(path.stepChallengeIds[idx-1]);
                      return (
                        <div 
                          key={cid} 
                          className={`h-1.5 flex-1 rounded-full ${
                            isDone ? 'bg-emerald-500' : isLocked ? 'bg-neutral-100' : 'bg-amber-400'
                          }`}
                        />
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {path.stepChallengeIds.slice(0, 3).map((cid) => (
                        <div key={cid} className="w-6 h-6 rounded-full bg-neutral-100 border-2 border-white flex items-center justify-center">
                          <Shield size={10} className="text-neutral-400" />
                        </div>
                      ))}
                      {path.stepChallengeIds.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-neutral-50 border-2 border-white flex items-center justify-center text-[8px] font-bold text-neutral-500">
                          +{path.stepChallengeIds.length - 3}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => onNavigate('challenges')}
                      className="text-emerald-600 font-semibold text-xs hover:underline flex items-center gap-1"
                    >
                      {t.viewPathLink} <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Continue Training Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
              <Trophy size={22} className="text-emerald-600" />
              {t.continueTrainingTitle}
            </h2>
            <button 
              onClick={() => onNavigate('challenges')}
              className="text-emerald-600 font-semibold text-sm hover:underline flex items-center gap-1"
            >
              {t.browseAllLink} <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {continueLearning.map((challenge: Challenge, idx: number) => {
              const lockInfo = mergeApiOrLocalProgression(challenge, challenges, completedIds);
              return (
                <ModuleCard 
                  key={challenge.id}
                  challenge={challenge}
                  index={idx}
                  isDone={completedIds.has(challenge.id)}
                  progressionLocked={lockInfo.progressionLocked}
                  progressionLockReason={lockInfo.progressionLockReason}
                  onClick={() => onNavigate('challenges')}
                />
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-3 shadow-sm flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider leading-none mb-1">{label}</div>
        <div className="text-base font-semibold text-neutral-900 leading-none">{value}</div>
      </div>
    </div>
  );
}

export default GameDashboard;
