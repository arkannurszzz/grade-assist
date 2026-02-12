export interface GradeScaleItem {
  grade: string;
  min: number;
  max: number;
  color: "default" | "secondary" | "destructive";
  description: string;
}

export interface Question {
  id: string;
  questionNumber: number;
  questionText: string;
  correctAnswer: string;
  weight: number;
}

export interface AnswerKey {
  id: string;
  fileName: string;
  questions: Question[];
  aiDetectionConfidence: number | null;
  aiDetectionWarning: string | null;
}

export interface Submission {
  id: string;
  studentName: string;
  fileName: string;
  status: string;
  totalScore: number | null;
  maxScore: number | null;
  percentage: number | null;
  errorMessage: string | null;
}

export interface SessionSettings {
  id: string;
  gradingStrictness: string;
  enableAIDetection: boolean;
  aiPenaltyPercent: number;
  copyPenaltyPercent: number;
  aiDetectionThreshold: number;
  language: string;
  gradingScale?: GradeScaleItem[];
}

export interface Session {
  id: string;
  name: string;
  courseName: string | null;
  description: string | null;
  status: string;
  answerKey: AnswerKey | null;
  submissions: Submission[];
  settings: SessionSettings | null;
}

export interface GradingProgress {
  status: string;
  totalSubmissions: number;
  gradedSubmissions: number;
  errorSubmissions: number;
  currentStudent: string | null;
  progress: number;
}

export const statusLabels: Record<string, string> = {
  draft: "Draft",
  answer_key_uploaded: "Kunci Jawaban Terupload",
  ready: "Siap Dinilai",
  grading: "Sedang Menilai...",
  completed: "Selesai",
};
