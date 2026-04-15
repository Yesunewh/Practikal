import type { QuestionKind } from '../types';

export const QUESTION_KIND_OPTIONS: {
  value: QuestionKind;
  label: string;
  description: string;
}[] = [
  {
    value: 'multiple_choice',
    label: 'Multiple choice',
    description: 'Several answers; mark one or more as correct. Best for knowledge checks.',
  },
  {
    value: 'true_false',
    label: 'True / false',
    description: 'A single statement; learner chooses True or False.',
  },
  {
    value: 'binary_verdict',
    label: 'Binary verdict',
    description: 'Mock email or message with two opposite actions (e.g. phishing vs legitimate).',
  },
];

export function questionKindLabel(kind: QuestionKind | undefined): string {
  if (!kind) return 'Multiple choice';
  const row = QUESTION_KIND_OPTIONS.find((o) => o.value === kind);
  return row?.label ?? kind;
}
