export interface AnalyticsOverview {
  totalSubmissions: number;
  gradedSubmissions: number;
  totalAnswers: number;
  aiDetectedAnswers: number;
  aiUsagePercentage: number;
  studentsWithAI: number;
  studentsWithAIPercentage: number;
  averageConfidence: number;
}

export interface QuestionAnalysis {
  questionNumber: number;
  questionText: string;
  totalAnswers: number;
  aiDetected: number;
  aiPercentage: number;
  averageScore: number;
  maxPoints: number;
}

export interface ConfidenceDistribution {
  low: number; // 0-0.5
  mediumLow: number; // 0.5-0.7
  medium: number; // 0.7-0.85
  mediumHigh: number; // 0.85-0.95
  high: number; // 0.95-1.0
}

export interface StudentAnalysis {
  studentId: string;
  studentName: string;
  totalAnswers: number;
  aiDetectedAnswers: number;
  aiPercentage: number;
  totalScore: number | null;
  percentage: number | null;
}

export interface AnalyticsData {
  overview: AnalyticsOverview;
  questionAnalysis: QuestionAnalysis[];
  confidenceDistribution: ConfidenceDistribution;
  studentAnalysis: StudentAnalysis[];
}
