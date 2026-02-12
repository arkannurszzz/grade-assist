import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDocument, getFileType, extractStudentName } from "@/lib/parsers";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const session = await prisma.gradingSession.findUnique({
    where: { id: sessionId },
    include: { answerKey: true },
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

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const results = [];

  for (const file of files) {
    try {
      const fileType = getFileType(file.name);
      const buffer = Buffer.from(await file.arrayBuffer());
      const rawText = await parseDocument(buffer, fileType);
      const studentName = extractStudentName(file.name);

      const submission = await prisma.submission.create({
        data: {
          sessionId,
          studentName,
          fileName: file.name,
          fileType,
          rawText,
          status: "parsed",
        },
      });

      results.push({ success: true, submission });
    } catch (error) {
      results.push({
        success: false,
        fileName: file.name,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Update session status
  const successCount = results.filter((r) => r.success).length;
  if (successCount > 0) {
    await prisma.gradingSession.update({
      where: { id: sessionId },
      data: { status: "ready" },
    });
  }

  return NextResponse.json({
    total: files.length,
    success: successCount,
    failed: files.length - successCount,
    results,
  });
}
