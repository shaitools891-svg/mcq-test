/**
 * Question data types for MCQ Test
 * Supports multiple question formats including stems and multi-part options
 */

export interface Question {
  /** Unique question ID */
  id: number;
  /** Question text in Bengali */
  question: string;
  /** Array of 4 option strings */
  options: string[];
  /** Index of correct answer (0-3) */
  correct_index: number;
  /** Question category/topic */
  category?: string;
  /** Stem text description (e.g., "নিচের উদ্দীপকটি লক্ষ কর...") */
  stem?: string;
  /** Stem image filename (e.g., "heart_conduction_system.png") */
  stem_image?: string;
  /** Multi-part options as array of strings (e.g., ["i. ...", "ii. ...", "iii. ..."]) */
  multi_options?: string[];
  /** Explanations - can be object with keys or simple string */
  explanations?: Record<string, string> | string;
  /** Board name */
  board?: string;
  /** Year of the exam */
  year?: number;
}

export interface QuestionSet {
  board: string;
  year: number;
  subject: string;
  paper: string;
  questions: Question[];
}
