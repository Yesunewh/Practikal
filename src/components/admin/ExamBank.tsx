import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { User, Challenge, ChallengeStep } from '../../types';
import { RootState } from '../../store';
import { Search, Edit, Trash2, PlusCircle, ChevronDown, FileText, Clock, Award } from 'lucide-react';
import { useGamificationApi } from '../../config/gamification';
import {
  useGetGamificationChallengesQuery,
  useDeleteGamificationChallengeMutation,
} from '../../store/apiSlice/practikalApi';

interface ExamBankProps {
  currentUser: User;
  /** In combined hub: switch to authoring tab instead of navigating */
  onRequestAuthoring?: () => void;
  /** When false, hide create/edit/delete (exam-bank–only viewers) */
  canAuthorChallenges?: boolean;
}

const GAMIFICATION_ADMINS = ['SUPERADMIN', 'ORG_ADMIN', 'DEPT_ADMIN'];

/** Matches learner pass threshold in ActiveChallenge */
const DEFAULT_PASSING_SCORE = 70;

const GRADABLE_STEP_TYPES = new Set<ChallengeStep['type']>([
  'question',
  'scenario',
  'password-create',
  'sequential',
  'image-verification',
  'simulation',
  'phishing-inbox',
  'video-check',
  'policy-attestation',
]);

function countGradableSteps(steps: ChallengeStep[]): number {
  return steps.filter((s) => GRADABLE_STEP_TYPES.has(s.type)).length;
}

type ExamStatus = 'active' | 'archived';

interface ExamRow {
  id: string;
  title: string;
  description: string;
  duration: number;
  totalQuestions: number;
  passingScore: number;
  difficulty: Challenge['difficulty'];
  category: string;
  status: ExamStatus;
  updatedLabel: string;
  attempts: number;
  scopeLabel: string;
  challengeType: string;
}

function scopeLabelFromChallenge(ch: Challenge): string {
  if (!ch.orgId && !ch.deptId) return 'Platform';
  if (ch.deptId) return `Dept · ${String(ch.deptId).slice(0, 8)}…`;
  return 'Organization';
}

function challengeToExamRow(ch: Challenge): ExamRow {
  const isActive = ch.isActive !== false;
  return {
    id: ch.id,
    title: ch.title,
    description: ch.description || '',
    duration: ch.duration ?? 0,
    totalQuestions: countGradableSteps(ch.steps || []),
    passingScore: DEFAULT_PASSING_SCORE,
    difficulty: ch.difficulty,
    category: ch.category,
    status: isActive ? 'active' : 'archived',
    updatedLabel: ch.updatedAt ? new Date(ch.updatedAt).toLocaleDateString() : '—',
    attempts: typeof ch.attemptCount === 'number' ? ch.attemptCount : 0,
    scopeLabel: scopeLabelFromChallenge(ch),
    challengeType: ch.type,
  };
}

export default function ExamBank({
  currentUser,
  onRequestAuthoring,
  canAuthorChallenges = true,
}: ExamBankProps) {
  const navigate = useNavigate();
  const canManageApi =
    GAMIFICATION_ADMINS.includes(currentUser.user_type || '') ||
    (!!currentUser.deptId &&
      currentUser.role === 'admin' &&
      (currentUser.user_type == null || currentUser.user_type === ''));
  const reduxChallenges = useSelector((s: RootState) => s.challenges.challenges);

  const [scopeOrgId, setScopeOrgId] = useState(currentUser.orgId || '');
  const [scopeDeptId, setScopeDeptId] = useState(
    currentUser.user_type === 'ORG_ADMIN' ? '' : currentUser.deptId || '',
  );

  useEffect(() => {
    if (currentUser.user_type === 'DEPT_ADMIN') {
      setScopeOrgId(currentUser.orgId || '');
      setScopeDeptId(currentUser.deptId || '');
    }
  }, [currentUser.user_type, currentUser.orgId, currentUser.deptId]);

  const examBankQueryArg = useMemo(() => {
    const base: { for_exam_bank: true; org_id?: string; dept_id?: string } = { for_exam_bank: true };
    if (currentUser.user_type === 'SUPERADMIN') {
      if (scopeOrgId.trim()) base.org_id = scopeOrgId.trim();
      if (scopeDeptId.trim()) base.dept_id = scopeDeptId.trim();
    }
    return base;
  }, [currentUser.user_type, scopeOrgId, scopeDeptId]);

  const { data: examBankRes, isFetching, isError, refetch } = useGetGamificationChallengesQuery(examBankQueryArg, {
    skip: !useGamificationApi || !canManageApi,
  });

  const [deleteChallengeApi] = useDeleteGamificationChallengeMutation();

  const exams: ExamRow[] = useMemo(() => {
    if (useGamificationApi && canManageApi && examBankRes?.challenges?.length) {
      return (examBankRes.challenges as Challenge[]).map(challengeToExamRow);
    }
    if (!useGamificationApi || !canManageApi) {
      return reduxChallenges.map((ch) =>
        challengeToExamRow({
          ...ch,
          isActive: true,
          attemptCount: 0,
        }),
      );
    }
    return [];
  }, [useGamificationApi, canManageApi, examBankRes?.challenges, reduxChallenges]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDifficulty = filterDifficulty === 'all' || exam.difficulty === filterDifficulty;
    const matchesStatus = filterStatus === 'all' || exam.status === filterStatus;

    return matchesSearch && matchesDifficulty && matchesStatus;
  });

  const handleDeleteExam = async (examId: string) => {
    if (!confirm('Archive this exam (challenge)? Learners will no longer see it.')) return;
    try {
      if (useGamificationApi && canManageApi) {
        await deleteChallengeApi(examId).unwrap();
        await refetch();
      }
    } catch {
      alert('Could not archive exam. Check permissions and try again.');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-700 bg-green-100';
      case 'intermediate':
        return 'text-yellow-700 bg-yellow-100';
      case 'advanced':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-700 bg-green-100';
      case 'archived':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Exam Bank</h2>
          <p className="text-sm text-gray-500 mt-1">
            Learning challenges in the database (same catalog as Challenge Management), with completion attempts.
          </p>
        </div>
        {canAuthorChallenges && (
          <button
            type="button"
            onClick={() => (onRequestAuthoring ? onRequestAuthoring() : navigate('/admin/challenges'))}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center"
          >
            <PlusCircle size={16} className="mr-2" />
            Create / edit challenges
          </button>
        )}
      </div>

      {useGamificationApi && canManageApi && currentUser.user_type === 'SUPERADMIN' && (
        <div className="px-6 py-4 border-b bg-amber-50/80 text-sm space-y-2">
          <p className="font-medium text-amber-900">Filter scope (SUPERADMIN)</p>
          <div className="flex flex-col md:flex-row gap-2 md:gap-4">
            <input
              className="flex-1 border rounded px-3 py-2"
              placeholder="Organization UUID (empty = all visible)"
              value={scopeOrgId}
              onChange={(e) => setScopeOrgId(e.target.value)}
            />
            <input
              className="flex-1 border rounded px-3 py-2"
              placeholder="Department UUID (optional)"
              value={scopeDeptId}
              onChange={(e) => setScopeDeptId(e.target.value)}
            />
          </div>
        </div>
      )}

      {useGamificationApi && !canManageApi && (
        <div className="px-6 py-3 border-b text-sm text-amber-800 bg-amber-50">
          You need admin access to load the exam bank from the server.
        </div>
      )}

      {!useGamificationApi && (
        <div className="px-6 py-3 border-b text-sm text-amber-800 bg-amber-50">
          API off — showing local challenge list only (no attempt counts, active items only).
        </div>
      )}

      {isError && useGamificationApi && canManageApi && (
        <div className="px-6 py-3 border-b text-sm text-red-600">Could not load exams from the server.</div>
      )}

      {isFetching && useGamificationApi && canManageApi && (
        <div className="px-6 py-3 border-b text-sm text-gray-500">Loading exams…</div>
      )}

      <div className="p-6 border-b">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search exams..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          </div>

          <div className="relative w-full md:w-48">
            <select
              className="w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
            >
              <option value="all">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <ChevronDown size={18} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative w-full md:w-48">
            <select
              className="w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
            <ChevronDown size={18} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scope</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attempts</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredExams.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                  No exams match your filters.
                  {canAuthorChallenges ? ' Create content under Authoring.' : ''}
                </td>
              </tr>
            ) : (
              filteredExams.map((exam) => (
                <tr key={exam.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <FileText size={20} className="text-emerald-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{exam.title}</div>
                        <div className="text-xs text-gray-500">
                          {exam.category} · {exam.challengeType}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600 whitespace-nowrap">{exam.scopeLabel}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1" />
                        {exam.duration} min
                      </div>
                      <div className="flex items-center">
                        <FileText size={14} className="mr-1" />
                        {exam.totalQuestions} steps
                      </div>
                      <div className="flex items-center">
                        <Award size={14} className="mr-1" />
                        {exam.passingScore}% pass
                      </div>
                      <div className="text-xs text-gray-400">Updated {exam.updatedLabel}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getDifficultyColor(exam.difficulty)}`}
                    >
                      {exam.difficulty.charAt(0).toUpperCase() + exam.difficulty.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(exam.status)}`}
                    >
                      {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{exam.attempts.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {canAuthorChallenges && (
                        <>
                          <button
                            type="button"
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit in Authoring"
                            onClick={() =>
                              onRequestAuthoring ? onRequestAuthoring() : navigate('/admin/challenges')
                            }
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExam(exam.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Archive exam"
                            disabled={!useGamificationApi || !canManageApi}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{filteredExams.length}</span> of <span className="font-medium">{exams.length}</span>{' '}
          exams
        </div>
      </div>
    </div>
  );
}
