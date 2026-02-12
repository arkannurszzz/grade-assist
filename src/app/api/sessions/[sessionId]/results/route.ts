import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const session = await prisma.gradingSession.findUnique({
    where: { id: sessionId },
    include: {
      answerKey: {
        include: {
          questions: { orderBy: { questionNumber: "asc" } },
        },
      },
      submissions: {
        orderBy: { studentName: "asc" },
        include: {
          answers: {
            include: {
              question: true,
              aiDetection: true,
            },
            orderBy: {
              question: { questionNumber: "asc" },
            },
          },
        },
      },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json(session);
}
