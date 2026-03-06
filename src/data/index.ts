import { comilla2023Bio2nd } from './comilla-2023-bio-2nd';
import { dhaka2023Bio2nd } from './dhaka-2023-bio-2nd';

/**
 * Question data exports
 * Import questions from here to use in the MCQ test
 */

export * from './types';
export { comilla2023Bio2nd } from './comilla-2023-bio-2nd';
export { dhaka2023Bio2nd } from './dhaka-2023-bio-2nd';
export { udvashWeeklyBio2nd } from './udvash-weekly-bio-2nd';
export { boardStandardBio2nd } from './board-standard-bio-2nd';

/**
 * Available question sets
 */
export type QuestionSetId = 'comilla-2023-bio-2nd' | 'dhaka-2023-bio-2nd';

export interface QuestionSetInfo {
  id: QuestionSetId;
  board: string;
  year: number;
  subject: string;
  paper: string;
  description: string;
}

export const questionSets: QuestionSetInfo[] = [
  {
    id: 'comilla-2023-bio-2nd',
    board: 'Comilla',
    year: 2023,
    subject: 'Biology',
    paper: '2nd Paper',
    description: 'Comilla Board 2023 - Biology 2nd Paper (MCQ)'
  },
  {
    id: 'dhaka-2023-bio-2nd',
    board: 'Dhaka',
    year: 2023,
    subject: 'Biology',
    paper: '2nd Paper',
    description: 'Dhaka Board 2023 - Biology 2nd Paper (MCQ) - With Stems'
  }
];

/**
 * Get questions by set ID
 */
export function getQuestionsBySet(setId: QuestionSetId) {
  switch (setId) {
    case 'comilla-2023-bio-2nd':
      return comilla2023Bio2nd;
    case 'dhaka-2023-bio-2nd':
      return dhaka2023Bio2nd;
    default:
      return comilla2023Bio2nd;
  }
}
