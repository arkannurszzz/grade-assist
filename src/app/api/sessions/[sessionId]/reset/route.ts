import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Reset session status from 'grading' back to 'ready'
 * Useful when grading process is stuck or failed
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const session = await prisma.gradingSession.findUnique({
    where: { id: sessionId },
    include: {
      submissions: true,
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Reset session status
  await prisma.gradingSession.update({
    where: { id: sessionId },
    data: { status: "ready" },
  });

  // Reset all stuck submissions
  for (const sub of session.submissions) {
    if (sub.status === "grading") {
      await prisma.submission.update({
        where: { id: sub.id },
        data: {
          status: "parsed",
          errorMessage: "Reset manually due to stuck grading process",
        },
      });
    }
  }

  return NextResponse.json({
    success: true,
    message: "Session status reset to ready",
  });
}
