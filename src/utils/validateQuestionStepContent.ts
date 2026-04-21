import type { QuestionContent, QuestionKind, ScenarioContent } from '../types';

/** Returns an error message for learners/authors, or null if valid. */
export function validateQuestionContent(content: QuestionContent): string | null {
  const q = (content.question ?? '').trim();
  if (!q) return 'Enter a question or statement.';

  const options = content.options ?? [];
  if (options.length === 0) return 'Add at least one answer choice.';

  for (const opt of options) {
    if (!(opt.text ?? '').trim()) return 'Every answer choice needs a label.';
  }

  const kind: QuestionKind = content.questionKind ?? 'multiple_choice';
  const correctCount = options.filter((o) => o.isCorrect).length;

  if (kind === 'true_false') {
    if (options.length !== 2) return 'True/false must have exactly two choices.';
    if (correctCount !== 1) return 'True/false must have exactly one correct answer.';
    if (content.multipleAnswers) return 'True/false cannot use multiple correct answers.';
    return null;
  }

  if (kind === 'binary_verdict') {
    if (options.length !== 2) return 'Binary verdict must have exactly two choices.';
    if (correctCount !== 1) return 'Binary verdict must have exactly one correct answer.';
    if (!(content.scenarioBody ?? '').trim()) return 'Binary verdict needs the mock message body.';
    return null;
  }

  if (options.length < 2) return 'Multiple choice needs at least two options.';
  if (correctCount < 1) return 'Mark at least one correct answer.';
  if (!content.multipleAnswers && correctCount !== 1) {
    return 'Turn on “multiple correct answers” or mark exactly one correct option.';
  }

  return null;
}

export function validateScenarioContent(content: ScenarioContent): string | null {
  const situation = (content.situation ?? '').trim();
  if (!situation) return 'Scenario needs a situation description.';
  const options = content.options ?? [];
  if (options.length !== 2) return 'Scenario must have exactly two choices.';
  if (!options.every((o) => (o.text ?? '').trim())) return 'Each scenario choice needs text.';
  const correctCount = options.filter((o) => o.isCorrect).length;
  if (correctCount !== 1) return 'Mark exactly one scenario choice as correct.';
  return null;
}
