import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAIProvider } from "@/lib/ai/factory";

// Import gradeSubmission logic
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
  provider: any,
  strictness: "lenient" | "moderate" | "strict",
  language: "id" | "en",
  enableAIDetection: boolean,
  aiPenaltyPercent: number,
  copyPenaltyPercent: number,
  aiDetectionThreshold: number
) {
  // Import the actual implementation
  const { gradeSubmission: actualGradeSubmission } = await import("@/lib/grading/grader-single");
  return actualGradeSubmission(
    submissionId,
    rawText,
    questions,
    questionNumbers,
    provider,
    strictness,
    language,
    enableAIDetection,
    aiPenaltyPercent,
    copyPenaltyPercent,
    aiDetectionThreshold
  );
}

// POST /api/sessions/[sessionId]/submissions/[submissionId]/regrade
// Regrade a single submission
export async function POST(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ sessionId: string; submissionId: string }>;
  }
) {
  try {
    const { sessionId, submissionId } = await params;

    // Get session with settings and questions
    const session = await prisma.gradingSession.findUnique({
      where: { id: sessionId },
      include: {
        answerKey: {
          include: { questions: { orderBy: { questionNumber: "asc" } } },
        },
        settings: true,
      },
    });

    if (!session || !session.answerKey) {
      return NextResponse.json(
        { error: "Session or answer key not found" },
        { status: 404 }
      );
    }

    // Get submission
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    if (submission.sessionId !== sessionId) {
      return NextResponse.json(
        { error: "Submission does not belong to this session" },
        { status: 403 }
      );
    }

    // Get AI provider
    const settings = session.settings;
    const apiKey =
      settings?.aiProvider === "gemini"
        ? process.env.GEMINI_API_KEY
        : process.env.OPENAI_API_KEY;

    let finalApiKey = apiKey;
    if (!finalApiKey) {
      const appSettings = await prisma.appSettings.findUnique({
        where: { id: "default" },
      });
      finalApiKey =
        settings?.aiProvider === "gemini"
          ? appSettings?.geminiApiKey
          : appSettings?.openaiApiKey;
    }

    if (!finalApiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const provider = getAIProvider(
      settings?.aiProvider ?? "gemini",
      finalApiKey,
      settings?.modelName
    );

    // Update status to grading
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: "grading",
        errorMessage: null,
      },
    });

    // Delete existing answers and AI detections
    await prisma.studentAnswer.deleteMany({
      where: { submissionId },
    });

    const questions = session.answerKey.questions;
    const questionNumbers = questions.map((q) => q.questionNumber);

    // Import and use the actual gradeSubmission function
    const { gradeSubmission: actualGradeSubmission } = await import(
      "@/lib/grading/grader-single"
    );

    // Grade submission
    try {
      await actualGradeSubmission(
        submissionId,
        submission.rawText,
        questions,
        questionNumbers,
        provider,
        (settings?.gradingStrictness as "lenient" | "moderate" | "strict") ??
          "moderate",
        (settings?.language as "id" | "en") ?? "id",
        settings?.enableAIDetection ?? true,
        settings?.aiPenaltyPercent ?? 50,
        settings?.copyPenaltyPercent ?? 30,
        settings?.aiDetectionThreshold ?? 0.7
      );

      return NextResponse.json({
        success: true,
        message: "Submission regraded successfully",
      });
    } catch (error) {
      console.error(`Error regrading submission ${submissionId}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);

      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: "error",
          errorMessage: errorMessage,
        },
      });

      return NextResponse.json(
        { error: `Grading failed: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[POST Regrade] Error:", error);
    return NextResponse.json(
      { error: "Failed to regrade submission" },
      { status: 500 }
    );
  }
}
