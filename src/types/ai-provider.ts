export interface GradingRequest {
  questionText: string;
  correctAnswer: string;
  studentAnswer: string;
  strictness: "lenient" | "moderate" | "strict";
  language: "id" | "en";
}

export interface GradingResponse {
  score: number;
  feedback: string;
}

export interface BatchGradingRequest {
  questions: Array<{
    questionNumber: number;
    questionText: string;
    correctAnswer: string;
    studentAnswer: string;
  }>;
  strictness: "lenient" | "moderate" | "strict";
  language: "id" | "en";
}

export interface BatchGradingResponse {
  results: Array<{
    questionNumber: number;
    score: number;
    feedback: string;
  }>;
}

export interface AIDetectionRequest {
  questionText: string;
  studentAnswer: string;
  language: "id" | "en";
}

export interface AIDetectionResponse {
  isAIGenerated: boolean;
  confidence: number;
  isCopyPasted: boolean;
  similarityScore: number;
  suspectedParts: Array<{
    start: number;
    end: number;
    text: string;
    reason: string;
  }>;
  analysis: string;
}

export interface BatchAIDetectionRequest {
  items: Array<{
    questionNumber: number;
    questionText: string;
    studentAnswer: string;
  }>;
  language: "id" | "en";
}

export interface BatchAIDetectionResponse {
  results: Array<{
    questionNumber: number;
    isAIGenerated: boolean;
    confidence: number;
    isCopyPasted: boolean;
    similarityScore: number;
    suspectedParts: Array<{
      start: number;
      end: number;
      text: string;
      reason: string;
    }>;
    analysis: string;
  }>;
}

export interface QAExtractionRequest {
  rawText: string;
  language: "id" | "en";
}

export interface QAExtractionResponse {
  pairs: Array<{
    questionNumber: number;
    questionText: string;
    correctAnswer: string;
  }>;
}

export interface StudentAnswerExtractionRequest {
  rawText: string;
  questionNumbers: number[];
  language: "id" | "en";
}

export interface StudentAnswerExtractionResponse {
  answers: Array<{
    questionNumber: number;
    answerText: string;
  }>;
}

export interface AIProvider {
  readonly name: string;
  readonly modelName: string;

  gradeAnswers(request: BatchGradingRequest): Promise<BatchGradingResponse>;
  detectAI(request: BatchAIDetectionRequest): Promise<BatchAIDetectionResponse>;
  extractQAPairs(request: QAExtractionRequest): Promise<QAExtractionResponse>;
  extractStudentAnswers(
    request: StudentAnswerExtractionRequest
  ): Promise<StudentAnswerExtractionResponse>;
}
