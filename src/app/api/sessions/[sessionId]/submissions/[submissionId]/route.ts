import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ sessionId: string; submissionId: string }> }
) {
  const { sessionId, submissionId } = await params;

  // Verify session exists
  const session = await prisma.gradingSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Verify submission exists and belongs to this session
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

  // Delete submission (cascade will delete related StudentAnswer and AIDetection records)
  await prisma.submission.delete({
    where: { id: submissionId },
  });

  // Check if there are any remaining submissions
  const remainingSubmissions = await prisma.submission.count({
    where: { sessionId },
  });

  // Update session status if no more submissions
  if (remainingSubmissions === 0) {
    await prisma.gradingSession.update({
      where: { id: sessionId },
      data: { status: "answer_key_uploaded" },
    });
  }

  return NextResponse.json({
    success: true,
    message: "Submission deleted successfully",
  });
}
