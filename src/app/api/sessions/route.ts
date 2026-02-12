import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sessions = await prisma.gradingSession.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { submissions: true } },
      answerKey: { select: { id: true, _count: { select: { questions: true } } } },
    },
  });

  return NextResponse.json(sessions);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, courseName, description } = body;

  // Validate session name
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Session name is required" }, { status: 400 });
  }

  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    return NextResponse.json({ error: "Session name cannot be empty" }, { status: 400 });
  }

  if (trimmedName.length > 255) {
    return NextResponse.json({ error: "Session name too long (max 255 characters)" }, { status: 400 });
  }

  // Validate optional fields
  if (courseName && typeof courseName === "string" && courseName.length > 255) {
    return NextResponse.json({ error: "Course name too long (max 255 characters)" }, { status: 400 });
  }

  if (description && typeof description === "string" && description.length > 5000) {
    return NextResponse.json({ error: "Description too long (max 5000 characters)" }, { status: 400 });
  }

  const session = await prisma.gradingSession.create({
    data: {
      name: trimmedName,
      courseName: courseName?.trim() || null,
      description: description?.trim() || null,
      settings: {
        create: {},
      },
    },
    include: { settings: true },
  });

  return NextResponse.json(session, { status: 201 });
}
