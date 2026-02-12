import { prisma } from "@/lib/prisma";
import { getAIProvider } from "@/lib/ai/factory";
import { calculateScore, calculateTotalScore } from "./scorer";
import type { AIProvider } from "@/types/ai-provider";

export async function gradeSession(sessionId: string) {
  const session = await prisma.gradingSession.findUnique({
    where: { id: sessionId },
    include: {
      answerKey: { include: { questions: { orderBy: { questionNumber: "asc" } } } },
      submissions: true,
      settings: true,
    },
  });

  if (!session || !session.answerKey) {
    throw new Error("Session or answer key not found");
  }

  const settings = session.settings;
  const apiKey = settings?.aiProvider === "gemini"
    ? process.env.GEMINI_API_KEY
    : process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // Try from AppSettings
    const appSettings = await prisma.appSettings.findUnique({ where: { id: "default" } });
    if (!appSettings?.geminiApiKey) {
      throw new Error("API key not configured");
    }
  }

  const finalApiKey = apiKey || (await prisma.appSettings.findUnique({ where: { id: "default" } }))?.geminiApiKey || "";
  const provider = getAIProvider(
    settings?.aiProvider ?? "gemini",
    finalApiKey,
    settings?.modelName
  );

  await prisma.gradingSession.update({
    where: { id: sessionId },
    data: { status: "grading" },
  });

  const questions = session.answerKey.questions;
  const questionNumbers = questions.map((q) => q.questionNumber);

  for (const submission of session.submissions) {
    try {
      await gradeSubmission(
        submission.id,
        submission.rawText,
        questions,
        questionNumbers,
        provider,
        settings?.gradingStrictness as "lenient" | "moderate" | "strict" ?? "moderate",
        settings?.language as "id" | "en" ?? "id",
        settings?.enableAIDetection ?? true,
        settings?.aiPenaltyPercent ?? 50,
        settings?.copyPenaltyPercent ?? 30,
        settings?.aiDetectionThreshold ?? 0.7
      );
    } catch (error) {
      console.error(`Error grading submission ${submission.id}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      await prisma.submission.update({
        where: { id: submission.id },
        data: {
          status: "error",
          errorMessage: errorMessage,
        },
      });
    }
  }

  await prisma.gradingSession.update({
    where: { id: sessionId },
    data: { status: "completed" },
  });
}

async function gradeSubmission(
  submissionId: string,
  rawText: string,
  questions: Array<{
    id: string;
    questionNumber: number;
    questionText: string;
    correctAnswer: string;
    weight: number;
  }>,
  questionNumbers: number[],
  provider: AIProvider,
  strictness: "lenient" | "moderate" | "strict",
  language: "id" | "en",
  enableAIDetection: boolean,
  aiPenaltyPercent: number,
  copyPenaltyPercent: number,
  aiDetectionThreshold: number
) {
  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: "grading" },
  });

  // Extract student answers using AI
  const extractedAnswers = await provider.extractStudentAnswers({
    rawText,
    questionNumbers,
    language,
  });

  // Grade all answers in batch
  const gradingRequest = questions.map((q) => {
    const studentAnswer = extractedAnswers.answers.find(
      (a) => a.questionNumber === q.questionNumber
    );
    return {
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      correctAnswer: q.correctAnswer,
      studentAnswer: studentAnswer?.answerText ?? "",
    };
  });

  const gradingResult = await provider.gradeAnswers({
    questions: gradingRequest,
    strictness,
    language,
  });

  // AI Detection (if enabled)
  let aiDetectionResult = null;
  if (enableAIDetection) {
    const detectionItems = questions.map((q) => {
      const studentAnswer = extractedAnswers.answers.find(
        (a) => a.questionNumber === q.questionNumber
      );
      return {
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        studentAnswer: studentAnswer?.answerText ?? "",
      };
    });

    aiDetectionResult = await provider.detectAI({ items: detectionItems, language });
  }

  // Prepare grading data
  const scoreResults: Array<{
    weightedScore: number;
    penaltyApplied: number;
    adjustedWeightedScore: number;
  }> = [];
  const weights: number[] = [];
  const answerData: Array<{
    question: typeof questions[number];
    studentAnswer: { questionNumber: number; answerText: string } | undefined;
    gradeResult: { questionNumber: number; score: number; feedback: string } | undefined;
    detectionRes:
      | {
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
        }
      | undefined;
    scoreInput: {
      weightedScore: number;
      penaltyApplied: number;
      adjustedWeightedScore: number;
    };
  }> = [];

  for (const question of questions) {
    const gradeResult = gradingResult.results.find(
      (r) => r.questionNumber === question.questionNumber
    );
    const detectionRes = aiDetectionResult?.results.find(
      (r) => r.questionNumber === question.questionNumber
    );
    const studentAnswer = extractedAnswers.answers.find(
      (a) => a.questionNumber === question.questionNumber
    );

    const scoreInput = calculateScore({
      score: gradeResult?.score ?? 0,
      weight: question.weight,
      aiDetected: detectionRes?.isAIGenerated ?? false,
      aiConfidence: detectionRes?.confidence ?? 0,
      isCopyPasted: detectionRes?.isCopyPasted ?? false,
      aiPenaltyPercent,
      copyPenaltyPercent,
      aiDetectionThreshold,
    });

    scoreResults.push(scoreInput);
    weights.push(question.weight);

    answerData.push({
      question,
      studentAnswer,
      gradeResult,
      detectionRes,
      scoreInput,
    });
  }

  const { totalScore, maxScore, percentage } = calculateTotalScore(
    scoreResults,
    weights
  );

  // Save all results in a single transaction to ensure data consistency
  // If any operation fails, all changes are rolled back
  // Increase timeout to 30s to handle large submissions with many questions
  await prisma.$transaction(async (tx) => {
    // Save all student answers and AI detections
    for (const data of answerData) {
      const savedAnswer = await tx.studentAnswer.create({
        data: {
          submissionId,
          questionId: data.question.id,
          answerText: data.studentAnswer?.answerText ?? "",
          score: data.gradeResult?.score ?? 0,
          weightedScore: data.scoreInput.adjustedWeightedScore,
          feedback: data.gradeResult?.feedback ?? "",
        },
      });

      if (data.detectionRes) {
        await tx.aIDetection.create({
          data: {
            studentAnswerId: savedAnswer.id,
            isAIGenerated: data.detectionRes.isAIGenerated,
            confidence: data.detectionRes.confidence,
            isCopyPasted: data.detectionRes.isCopyPasted,
            similarityScore: data.detectionRes.similarityScore,
            suspectedParts: data.detectionRes.suspectedParts,
            analysis: data.detectionRes.analysis,
            penaltyApplied: data.scoreInput.penaltyApplied,
          },
        });
      }
    }

    // Update submission with final scores
    await tx.submission.update({
      where: { id: submissionId },
      data: {
        status: "graded",
        totalScore,
        maxScore,
        percentage,
        gradedAt: new Date(),
      },
    });
  }, { timeout: 30000 }); // 30 seconds timeout for large submissions
}
