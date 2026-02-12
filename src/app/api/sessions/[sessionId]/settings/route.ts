import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const body = await req.json();

  try {
    // Validate input
    const updates: Record<string, unknown> = {};

    if (body.gradingStrictness !== undefined) {
      if (!["lenient", "moderate", "strict"].includes(body.gradingStrictness)) {
        return NextResponse.json(
          { error: "Invalid grading strictness value" },
          { status: 400 }
        );
      }
      updates.gradingStrictness = body.gradingStrictness;
    }

    if (body.enableAIDetection !== undefined) {
      updates.enableAIDetection = Boolean(body.enableAIDetection);
    }

    if (body.aiPenaltyPercent !== undefined) {
      const val = Number(body.aiPenaltyPercent);
      if (isNaN(val) || val < 0 || val > 100) {
        return NextResponse.json(
          { error: "AI penalty must be a valid number between 0-100" },
          { status: 400 }
        );
      }
      // Clamp and round to integer
      updates.aiPenaltyPercent = Math.max(0, Math.min(100, Math.round(val)));
    }

    if (body.copyPenaltyPercent !== undefined) {
      const val = Number(body.copyPenaltyPercent);
      if (isNaN(val) || val < 0 || val > 100) {
        return NextResponse.json(
          { error: "Copy penalty must be a valid number between 0-100" },
          { status: 400 }
        );
      }
      // Clamp and round to integer
      updates.copyPenaltyPercent = Math.max(0, Math.min(100, Math.round(val)));
    }

    if (body.aiDetectionThreshold !== undefined) {
      const val = Number(body.aiDetectionThreshold);
      if (isNaN(val) || val < 0 || val > 1) {
        return NextResponse.json(
          { error: "AI detection threshold must be a valid number between 0.0-1.0" },
          { status: 400 }
        );
      }
      // Clamp and round to 2 decimal places
      updates.aiDetectionThreshold = Math.max(0, Math.min(1, Math.round(val * 100) / 100));
    }

    if (body.language !== undefined) {
      if (!["id", "en"].includes(body.language)) {
        return NextResponse.json(
          { error: "Language must be 'id' or 'en'" },
          { status: 400 }
        );
      }
      updates.language = body.language;
    }

    if (body.gradingScale !== undefined) {
      // Validate grading scale structure
      if (!Array.isArray(body.gradingScale)) {
        return NextResponse.json(
          { error: "Grading scale must be an array" },
          { status: 400 }
        );
      }

      // Validate each grade item
      for (const item of body.gradingScale) {
        if (!item.grade || typeof item.grade !== "string") {
          return NextResponse.json(
            { error: "Each grade must have a valid grade string" },
            { status: 400 }
          );
        }
        if (typeof item.min !== "number" || typeof item.max !== "number") {
          return NextResponse.json(
            { error: "Each grade must have valid min and max numbers" },
            { status: 400 }
          );
        }
        if (item.min < 0 || item.max > 100 || item.min > item.max) {
          return NextResponse.json(
            { error: "Invalid min/max range (must be 0-100, min <= max)" },
            { status: 400 }
          );
        }
        if (!["default", "secondary", "destructive"].includes(item.color)) {
          return NextResponse.json(
            { error: "Invalid color value" },
            { status: 400 }
          );
        }
      }

      updates.gradingScale = body.gradingScale;
    }

    // Update or create settings
    const settings = await prisma.sessionSettings.upsert({
      where: { sessionId },
      update: updates,
      create: {
        sessionId,
        ...updates,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const settings = await prisma.sessionSettings.findUnique({
    where: { sessionId },
  });

  if (!settings) {
    return NextResponse.json(
      { error: "Settings not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(settings);
}
