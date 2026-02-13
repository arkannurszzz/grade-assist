import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/sessions/[sessionId]/submissions/[submissionId]/answers/[answerId]
// Update individual answer score and feedback (manual override)
export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ sessionId: string; submissionId: string; answerId: string }>;
  }
) {
  try {
    const { sessionId, submissionId, answerId } = await params;
    const body = await req.json();
    const { score, feedback } = body;

    // Validate input
    if (typeof score !== "number" || score < 0) {
      return NextResponse.json(
        { error: "Invalid score value" },
        { status: 400 }
      );
    }

    // Get the answer with question weight
    const answer = await prisma.studentAnswer.findUnique({
      where: { id: answerId },
      include: {
        question: true,
        submission: {
          include: {
            answers: {
              include: {
                question: true,
              },
            },
          },
        },
      },
    });

    if (!answer) {
      return NextResponse.json({ error: "Answer not found" }, { status: 404 });
    }

    // Validate that answer belongs to this submission and session
    if (answer.submission.id !== submissionId) {
      return NextResponse.json(
        { error: "Answer does not belong to this submission" },
        { status: 400 }
      );
    }

    if (answer.submission.sessionId !== sessionId) {
      return NextResponse.json(
        { error: "Submission does not belong to this session" },
        { status: 400 }
      );
    }

    // Calculate weighted score
    const weight = answer.question.weight;
    const weightedScore = score * weight;

    // Update the answer with manual override flag
    await prisma.studentAnswer.update({
      where: { id: answerId },
      data: {
        score,
        weightedScore,
        feedback: feedback || answer.feedback,
        // Note: Add isManuallyGraded field in next migration
      },
    });

    // Recalculate submission totals
    const allAnswers = answer.submission.answers;
    const updatedAnswers = allAnswers.map((a) =>
      a.id === answerId
        ? { ...a, score, weightedScore }
        : a
    );

    const totalScore = updatedAnswers.reduce(
      (sum, a) => sum + (a.weightedScore || 0),
      0
    );

    const maxScore = updatedAnswers.reduce(
      (sum, a) => sum + (a.question.weight || 0),
      0
    );

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    // Update submission with new totals
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        totalScore,
        maxScore,
        percentage,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Grade updated successfully",
      data: {
        score,
        weightedScore,
        totalScore,
        percentage,
      },
    });
  } catch (error) {
    console.error("[PATCH Answer] Error:", error);
    return NextResponse.json(
      { error: "Failed to update grade" },
      { status: 500 }
    );
  }
}
