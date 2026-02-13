import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateXLSX } from "@/lib/export/xlsx-exporter";
import { generateXLSXWithTemplate } from "@/lib/export/xlsx-exporter-v2";
import type { ExportColumnConfig } from "@/types/export-template";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;

  const session = await prisma.gradingSession.findUnique({
    where: { id: sessionId },
    include: {
      answerKey: {
        include: { questions: true },
      },
      submissions: {
        orderBy: { studentName: "asc" },
        include: {
          answers: {
            include: {
              aiDetection: true,
              question: true,
            },
          },
        },
      },
      settings: true,
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Get grading scale from settings or use default
  const DEFAULT_GRADING_SCALE = [
    { grade: "A", min: 85, max: 100 },
    { grade: "B", min: 70, max: 84 },
    { grade: "C", min: 60, max: 69 },
    { grade: "D", min: 50, max: 59 },
    { grade: "E", min: 0, max: 49 },
  ];

  // Type assertion to handle Json field until Prisma types are regenerated
  const gradingScale =
    ((session.settings as any)?.gradingScale as Array<{
      grade: string;
      min: number;
      max: number;
    }> | null) || DEFAULT_GRADING_SCALE;

  // Helper to get letter grade
  const getLetterGrade = (percentage: number | null): string => {
    if (percentage === null) return "-";
    const scale = gradingScale.find(
      (s) => percentage >= s.min && percentage <= s.max,
    );
    return scale?.grade || gradingScale[gradingScale.length - 1].grade;
  };

  // Helper to convert to scale 100
  const convertToScale100 = (
    totalScore: number | null,
    maxScore: number | null,
  ): number | null => {
    if (totalScore === null || maxScore === null || maxScore === 0) return null;
    return Math.round((totalScore / maxScore) * 100 * 10) / 10;
  };

  const questionCount = session.answerKey?.questions.length ?? 0;

  const rows = session.submissions.map((sub) => ({
    studentName: sub.studentName,
    fileName: sub.fileName,
    totalScore: sub.totalScore,
    maxScore: sub.maxScore,
    percentage: sub.percentage,
    scale100: convertToScale100(sub.totalScore, sub.maxScore),
    letterGrade: getLetterGrade(sub.percentage),
    status: sub.status,
    aiDetectionFlags: sub.answers.filter((a) => a.aiDetection?.isAIGenerated)
      .length,
    gradedAt: sub.gradedAt?.toISOString() ?? null,
    questionScores: sub.answers.map((ans) => ({
      questionNumber: ans.question.questionNumber,
      score: ans.score ?? 0,
      feedback: ans.feedback ?? "",
      aiDetected: ans.aiDetection?.isAIGenerated ?? false,
    })),
  }));

  const buffer = await generateXLSX(rows, questionCount, session.name);

  // Sanitize filename and encode properly for international characters
  const sanitizedName = session.name
    .replace(/[^a-zA-Z0-9\s\-_]/g, "")
    .substring(0, 100);
  const filename = `${sanitizedName || "session"}_results.xlsx`;
  const encodedFilename = encodeURIComponent(filename);

  // Convert Buffer to Uint8Array for NextResponse compatibility
  const uint8Array = new Uint8Array(buffer);

  return new NextResponse(uint8Array, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      // Use RFC 5987 encoding for proper Unicode support
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`,
    },
  });
}

// POST /api/sessions/[sessionId]/export-xlsx
// Export with custom template
export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const body = await req.json();
  const { template } = body as { template?: ExportColumnConfig[] };

  const session = await prisma.gradingSession.findUnique({
    where: { id: sessionId },
    include: {
      answerKey: {
        include: { questions: true },
      },
      submissions: {
        orderBy: { studentName: "asc" },
        include: {
          answers: {
            include: {
              aiDetection: true,
              question: true,
            },
          },
        },
      },
      settings: true,
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Get grading scale from settings or use default
  const DEFAULT_GRADING_SCALE = [
    { grade: "A", min: 85, max: 100 },
    { grade: "B", min: 70, max: 84 },
    { grade: "C", min: 60, max: 69 },
    { grade: "D", min: 50, max: 59 },
    { grade: "E", min: 0, max: 49 },
  ];

  const gradingScale =
    ((session.settings as any)?.gradingScale as Array<{
      grade: string;
      min: number;
      max: number;
    }> | null) || DEFAULT_GRADING_SCALE;

  const getLetterGrade = (percentage: number | null): string => {
    if (percentage === null) return "-";
    const scale = gradingScale.find(
      (s) => percentage >= s.min && percentage <= s.max,
    );
    return scale?.grade || gradingScale[gradingScale.length - 1].grade;
  };

  const convertToScale100 = (
    totalScore: number | null,
    maxScore: number | null,
  ): number | null => {
    if (totalScore === null || maxScore === null || maxScore === 0) return null;
    return Math.round((totalScore / maxScore) * 100 * 10) / 10;
  };

  const questionCount = session.answerKey?.questions.length ?? 0;

  const rows = session.submissions.map((sub) => ({
    studentName: sub.studentName,
    fileName: sub.fileName,
    totalScore: sub.totalScore,
    maxScore: sub.maxScore,
    percentage: sub.percentage,
    scale100: convertToScale100(sub.totalScore, sub.maxScore),
    letterGrade: getLetterGrade(sub.percentage),
    status: sub.status,
    aiDetectionFlags: sub.answers.filter((a) => a.aiDetection?.isAIGenerated)
      .length,
    gradedAt: sub.gradedAt?.toISOString() ?? null,
    questionScores: sub.answers.map((ans) => ({
      questionNumber: ans.question.questionNumber,
      score: ans.score ?? 0,
      feedback: ans.feedback ?? "",
      aiDetected: ans.aiDetection?.isAIGenerated ?? false,
    })),
  }));

  // Use new template-based generator
  const buffer = await generateXLSXWithTemplate(
    rows,
    questionCount,
    session.name,
    template
  );

  const sanitizedName = session.name
    .replace(/[^a-zA-Z0-9\s\-_]/g, "")
    .substring(0, 100);
  const filename = `${sanitizedName || "session"}_results.xlsx`;
  const encodedFilename = encodeURIComponent(filename);

  const uint8Array = new Uint8Array(buffer);

  return new NextResponse(uint8Array, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`,
    },
  });
}
