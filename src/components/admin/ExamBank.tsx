import { useMemo, useState, useEffect, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { User, Challenge, ChallengeStep } from '../../types';
import { RootState } from '../../store';
import { Search, Edit, Trash2, PlusCircle, ChevronDown, FileText, Clock, Award } from 'lucide-react';
import { useGamificationApi } from '../../config/gamification';
import { useI18n } from '../../i18n/I18nContext';
import { interpolate, type Messages } from '../../i18n/messages';
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

type ExamBankCopy = Messages['admin']['challengesHub']['examBank'];

function scopeLabelFromChallenge(ch: Challenge, b: ExamBankCopy): string {
  if (!ch.orgId && !ch.deptId) return b.scopePlatform;
  if (ch.deptId) return interpolate(b.scopeDept, { idPrefix: String(ch.deptId).slice(0, 8) });
  return b.scopeOrg;
}

function challengeToExamRow(ch: Challenge, b: ExamBankCopy): ExamRow {
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
    updatedLabel: ch.updatedAt ? new Date(ch.updatedAt).toLocaleDateString() : b.emDash,
    attempts: typeof ch.attemptCount === 'number' ? ch.attemptCount : 0,
    scopeLabel: scopeLabelFromChallenge(ch, b),
    challengeType: ch.type,
  };
}

export default function ExamBank({
  currentUser,
  onRequestAuthoring,
  canAuthorChallenges = true,
}: ExamBankProps) {
  const { messages } = useI18n();
  const b = messages.admin.challengesHub.examBank;
  const navigate = useNavigate();
  const canManageApi =
    GAMIFICATION_ADMINS.includes(currentUser.user_type || '') ||
    (!!currentUser.deptId &&
      currentUser.role === 'admin' &&
      (currentUser.user_type == null || currentUser.user_type === ''));
  const reduxChallenges = useSelector((s: RootState) => s.challenges.challenges);
  const scopeOrgInputId = useId();
  const scopeDeptInputId = useId();
  const catalogSearchId = useId();

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
      return (examBankRes.challenges as Challenge[]).map((ch) => challengeToExamRow(ch, b));
    }
    if (!useGamificationApi || !canManageApi) {
      return reduxChallenges.map((ch) =>
        challengeToExamRow(
          {
            ...ch,
            isActive: true,
            attemptCount: 0,
          },
          b,
        ),
      );
    }
    return [];
  }, [useGamificationApi, canManageApi, examBankRes?.challenges, reduxChallenges, b]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterDifficulty, filterStatus]);

  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDifficulty = filterDifficulty === 'all' || exam.difficulty === filterDifficulty;
    const matchesStatus = filterStatus === 'all' || exam.status === filterStatus;

    return matchesSearch && matchesDifficulty && matchesStatus;
  });

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredExams.length / ITEMS_PER_PAGE);
  const paginatedExams = filteredExams.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDeleteExam = async (examId: string) => {
    if (!confirm(b.confirmArchive)) return;
    try {
      if (useGamificationApi && canManageApi) {
        await deleteChallengeApi(examId).unwrap();
        await refetch();
      }
    } catch {
      alert(b.archiveError);
    }
  };

  const difficultyLabel: Record<string, string> = {
    beginner: b.diffBeginner,
    intermediate: b.diffIntermediate,
    advanced: b.diffAdvanced,
  };
  const statusLabel: Record<string, string> = {
    active: b.statusActive,
    archived: b.statusArchived,
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
        return 'text-neutral-700 bg-neutral-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-700 bg-green-100';
      case 'archived':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-neutral-700 bg-neutral-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h2 className="text-lg font-semibold text-neutral-800">{b.title}</h2>
        </div>
        {canAuthorChallenges && (
          <button
            type="button"
            onClick={() => (onRequestAuthoring ? onRequestAuthoring() : navigate('/admin/challenges'))}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center"
          >
            <PlusCircle size={16} className="mr-2" />
            {b.createEditCta}
          </button>
        )}
      </div>



      {useGamificationApi && !canManageApi && (
        <div className="px-6 py-3 border-b text-sm text-amber-800 bg-amber-50">
          {b.needAdminBanner}
        </div>
      )}

      {!useGamificationApi && (
        <div className="px-6 py-3 border-b text-sm text-amber-800 bg-amber-50">
          {b.apiOffBanner}
        </div>
      )}

      {isError && useGamificationApi && canManageApi && (
        <div className="px-6 py-3 border-b text-sm text-red-600">{b.loadError}</div>
      )}

      {isFetching && useGamificationApi && canManageApi && (
        <div className="px-6 py-3 border-b text-sm text-neutral-500">{b.loading}</div>
      )}

      <div className="p-6 border-b">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative w-full md:w-64">
            <label htmlFor={catalogSearchId} className="sr-only">
              {b.searchSrOnly}
            </label>
            <input
              id={catalogSearchId}
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={18} className="absolute left-3 top-2.5 text-neutral-400 pointer-events-none" aria-hidden />
          </div>

          <div className="relative w-full md:w-48">
            <select
              className="w-full pl-4 pr-10 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
            >
              <option value="all">{b.diffAll}</option>
              <option value="beginner">{b.diffBeginner}</option>
              <option value="intermediate">{b.diffIntermediate}</option>
              <option value="advanced">{b.diffAdvanced}</option>
            </select>
            <ChevronDown size={18} className="absolute right-3 top-2.5 text-neutral-400 pointer-events-none" />
          </div>

          <div className="relative w-full md:w-48">
            <select
              className="w-full pl-4 pr-10 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">{b.statusAll}</option>
              <option value="active">{b.statusActive}</option>
              <option value="archived">{b.statusArchived}</option>
            </select>
            <ChevronDown size={18} className="absolute right-3 top-2.5 text-neutral-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">{b.thChallenge}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">{b.thScope}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">{b.thDetails}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">{b.thDifficulty}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">{b.thStatus}</th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                title={b.thAttemptsTitle}
              >
                {b.thAttempts}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{b.thActions}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {paginatedExams.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-neutral-500">
                  {b.emptyFilters}
                  {canAuthorChallenges ? b.emptyHintAuthoring : ''}
                </td>
              </tr>
            ) : (
              paginatedExams.map((exam) => (
                <tr key={exam.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <FileText size={20} className="text-emerald-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-neutral-900">{exam.title}</div>
                        <div className="text-xs text-neutral-500">
                          {exam.category} · {exam.challengeType}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-neutral-600 whitespace-nowrap">{exam.scopeLabel}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1" />
                        {interpolate(b.detailsMin, { n: exam.duration })}
                      </div>
                      <div className="flex items-center">
                        <FileText size={14} className="mr-1" />
                        {interpolate(b.detailsSteps, { n: exam.totalQuestions })}
                      </div>
                      <div className="flex items-center">
                        <Award size={14} className="mr-1" />
                        {interpolate(b.detailsPass, { n: exam.passingScore })}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {b.updatedPrefix} {exam.updatedLabel}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getDifficultyColor(exam.difficulty)}`}
                    >
                      {(difficultyLabel[exam.difficulty] ??
                        exam.difficulty.charAt(0).toUpperCase() + exam.difficulty.slice(1))}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(exam.status)}`}
                    >
                      {(statusLabel[exam.status] ??
                        exam.status.charAt(0).toUpperCase() + exam.status.slice(1))}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900">{exam.attempts.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {canAuthorChallenges && (
                        <>
                          <button
                            type="button"
                            className="text-blue-600 hover:text-blue-900"
                            title={b.editInAuthoring}
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
                            title={b.archiveChallenge}
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

      <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-neutral-700">
          {interpolate(b.showingCount, { shown: paginatedExams.length, total: filteredExams.length })}
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-neutral-200 rounded-md text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <div className="flex items-center px-4 text-sm font-medium text-neutral-700">
            {currentPage} / {totalPages || 1}
          </div>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages || 1, p + 1))}
            disabled={currentPage === (totalPages || 1)}
            className="px-4 py-2 border border-neutral-200 rounded-md text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
