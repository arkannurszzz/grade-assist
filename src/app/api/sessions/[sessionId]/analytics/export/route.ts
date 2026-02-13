import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAnalyticsReport } from "@/lib/export/analytics-exporter";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await context.params;

    // Fetch session with all data
    const session = await prisma.gradingSession.findUnique({
      where: { id: sessionId },
      include: {
        submissions: {
          include: {
            answers: {
              include: {
                question: true,
                aiDetection: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Fetch analytics data
    const analyticsResponse = await fetch(
      `${req.nextUrl.origin}/api/sessions/${sessionId}/analytics`
    );
    const analyticsData = await analyticsResponse.json();

    // Fetch similarity data
    const similarityResponse = await fetch(
      `${req.nextUrl.origin}/api/sessions/${sessionId}/similarity`
    );
    const similarityData = await similarityResponse.json();

    // Prepare export data
    const exportData = {
      sessionName: session.name,
      overview: analyticsData.overview,
      questionAnalysis: analyticsData.questionAnalysis,
      confidenceDistribution: analyticsData.confidenceDistribution,
      studentAnalysis: analyticsData.studentAnalysis,
      similarityGroups: similarityData.groups || [],
    };

    // Generate Excel report
    const buffer = await generateAnalyticsReport(exportData);

    // Return as download
    const filename = `AI-Analytics-${session.name.replace(/[^a-z0-9]/gi, "-")}-${new Date().toISOString().split("T")[0]}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Analytics export error:", error);
    return NextResponse.json(
      { error: "Failed to export analytics report" },
      { status: 500 }
    );
  }
}
