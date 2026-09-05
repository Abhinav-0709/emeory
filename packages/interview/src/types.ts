export type InterviewDifficulty =
  | 'basic'
  | 'technical'
  | 'architecture'
  | 'failure_scenario'
  | 'scaling';

export interface InterviewQuestion {
  id: string;
  difficulty: InterviewDifficulty;
  question: string;
  expectedKeyPoints: string[];
  referencedComponents?: string[];
  referencedDecisions?: string[];
}

export interface EvaluationScore {
  technicalAccuracy: number; // 0-10
  depth: number; // 0-10
  architectureUnderstanding: number; // 0-10
  overallScore: number; // 0-10
}

export interface AnswerEvaluation {
  questionId: string;
  scores: EvaluationScore;
  verdict: 'Excellent' | 'Good' | 'Needs Improvement' | 'Unsatisfactory';
  feedback: string;
  missingPoints: string[];
  strengths: string[];
  suggestedImprovement: string;
}

export interface InterviewSessionState {
  id: string;
  projectName: string;
  timestamp: string;
  currentQuestionIndex: number;
  questions: InterviewQuestion[];
  evaluations: AnswerEvaluation[];
  totalScore: number;
}
