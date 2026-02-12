import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Reset session settings to default values
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const session = await prisma.gradingSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Delete old settings and create fresh ones with defaults
  await prisma.sessionSettings.delete({
    where: { sessionId },
  }).catch(() => {
    // Ignore error if settings don't exist
  });

  const settings = await prisma.sessionSettings.create({
    data: {
      sessionId,
      gradingStrictness: "moderate",
      enableAIDetection: true,
      aiPenaltyPercent: 50,
      copyPenaltyPercent: 30,
      aiDetectionThreshold: 0.7,
      language: "id",
      aiProvider: "gemini",
      modelName: "gemma-3n-e4b-it",
      gradingScale: [
        { grade: "A", min: 85, max: 100, color: "default", description: "Sangat Baik" },
        { grade: "B", min: 70, max: 84, color: "secondary", description: "Baik" },
        { grade: "C", min: 60, max: 69, color: "secondary", description: "Cukup" },
        { grade: "D", min: 50, max: 59, color: "destructive", description: "Kurang" },
        { grade: "E", min: 0, max: 49, color: "destructive", description: "Sangat Kurang" },
      ],
    },
  });

  return NextResponse.json({
    success: true,
    message: "Settings reset to default values",
    settings,
  });
}
