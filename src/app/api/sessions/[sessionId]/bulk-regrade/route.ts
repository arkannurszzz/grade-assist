import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAIProvider } from "@/lib/ai/factory";

interface BulkRegradeRequest {
  submissionIds?: string[]; // If not provided, regrade all
  onlyAIDetected?: boolean; // Only regrade submissions with AI detection
  questionNumbers?: number[]; // Only regrade specific questions
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await context.params;
    const body: BulkRegradeRequest = await req.json();

    const session = await prisma.gradingSession.findUnique({
      where: { id: sessionId },
      include: {
        answerKey: {
          include: { questions: { orderBy: { questionNumber: "asc" } } },
        },
        submissions: {
          where: body.submissionIds
            ? { id: { in: body.submissionIds } }
            : undefined,
          include: {
            answers: {
              include: {
                question: true,
                aiDetection: true,
              },
            },
          },
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

    let totalRegraded = 0;
    const results: {
      submissionId: string;
      studentName: string;
      regradedCount: number;
      success: boolean;
      error?: string;
    }[] = [];

    // Import grading function
    const { gradeSubmission } = await import("@/lib/grading/grader-single");

    for (const submission of session.submissions) {
      try {
        // Check if we should regrade this submission
        let shouldRegrade = true;

        if (body.onlyAIDetected) {
          const hasAIDetection = submission.answers.some(
            (a) => a.aiDetection?.isAIGenerated
          );
          shouldRegrade = hasAIDetection;
        }

        if (!shouldRegrade) {
          results.push({
            submissionId: submission.id,
            studentName: submission.studentName,
            regradedCount: 0,
            success: true,
          });
          continue;
        }

        // Delete existing answers and AI detections
        await prisma.studentAnswer.deleteMany({
          where: { submissionId: submission.id },
        });

        // Update status
        await prisma.submission.update({
          where: { id: submission.id },
          data: {
            status: "grading",
            errorMessage: null,
          },
        });

        const questions = session.answerKey.questions;
        const questionNumbers = questions.map((q) => q.questionNumber);

        // Regrade the entire submission
        await gradeSubmission(
          submission.id,
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

        totalRegraded++;

        results.push({
          submissionId: submission.id,
          studentName: submission.studentName,
          regradedCount: questions.length,
          success: true,
        });
      } catch (error) {
        console.error(`Error regrading submission ${submission.id}:`, error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        await prisma.submission.update({
          where: { id: submission.id },
          data: {
            status: "error",
            errorMessage,
          },
        });

        results.push({
          submissionId: submission.id,
          studentName: submission.studentName,
          regradedCount: 0,
          success: false,
          error: errorMessage,
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalRegraded,
      results,
    });
  } catch (error) {
    console.error("Bulk regrade error:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk regrade" },
      { status: 500 }
    );
  }
}
