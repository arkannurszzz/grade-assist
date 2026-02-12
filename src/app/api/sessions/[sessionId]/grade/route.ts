import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gradeSession } from "@/lib/grading/grader";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const session = await prisma.gradingSession.findUnique({
    where: { id: sessionId },
    include: {
      answerKey: true,
      submissions: true,
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (!session.answerKey) {
    return NextResponse.json(
      { error: "Upload answer key first" },
      { status: 400 }
    );
  }

  if (session.submissions.length === 0) {
    return NextResponse.json(
      { error: "No submissions to grade" },
      { status: 400 }
    );
  }

  if (session.status === "grading") {
    return NextResponse.json(
      { error: "Grading already in progress" },
      { status: 409 }
    );
  }

  // Clear previous grading results
  for (const sub of session.submissions) {
    await prisma.studentAnswer.deleteMany({
      where: { submissionId: sub.id },
    });
    await prisma.submission.update({
      where: { id: sub.id },
      data: {
        status: "parsed",
        totalScore: null,
        maxScore: null,
        percentage: null,
        gradedAt: null,
        errorMessage: null,
      },
    });
  }

  // Start grading in background
  gradeSession(sessionId).catch((error) => {
    console.error("Grading failed:", error);
    prisma.gradingSession
      .update({
        where: { id: sessionId },
        data: { status: "ready" },
      })
      .catch(console.error);
  });

  return NextResponse.json({
    success: true,
    message: "Grading started",
    status: "grading",
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const session = await prisma.gradingSession.findUnique({
    where: { id: sessionId },
    include: {
      submissions: {
        select: { id: true, status: true, studentName: true },
      },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const total = session.submissions.length;
  const graded = session.submissions.filter((s) => s.status === "graded").length;
  const errors = session.submissions.filter((s) => s.status === "error").length;
  const currentlyGrading = session.submissions.find((s) => s.status === "grading");

  return NextResponse.json({
    status: session.status,
    totalSubmissions: total,
    gradedSubmissions: graded,
    errorSubmissions: errors,
    currentStudent: currentlyGrading?.studentName ?? null,
    progress: total > 0 ? Math.round((graded / total) * 100) : 0,
  });
}
