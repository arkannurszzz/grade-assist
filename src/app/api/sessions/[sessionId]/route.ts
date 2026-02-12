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
        orderBy: { createdAt: "asc" },
        include: {
          _count: {
            select: { answers: true },
          },
        },
      },
      settings: true,
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json(session);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const body = await req.json();

  // Handle question weight updates
  if (body.weights && typeof body.weights === "object") {
    const updates = Object.entries(body.weights as Record<string, number>);
    for (const [questionId, weight] of updates) {
      await prisma.question.update({
        where: { id: questionId },
        data: { weight: weight as number },
      });
    }
    return NextResponse.json({ success: true });
  }

  // Handle session info update
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.courseName !== undefined) data.courseName = body.courseName;
  if (body.description !== undefined) data.description = body.description;

  const session = await prisma.gradingSession.update({
    where: { id: sessionId },
    data,
  });

  return NextResponse.json(session);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  await prisma.gradingSession.delete({
    where: { id: sessionId },
  });

  return NextResponse.json({ success: true });
}
