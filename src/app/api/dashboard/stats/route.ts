import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get all sessions with related data
    const sessions = await prisma.gradingSession.findMany({
      include: {
        submissions: {
          include: {
            answers: {
              include: {
                aiDetection: true,
              },
            },
          },
        },
        answerKey: {
          include: {
            questions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate comprehensive statistics
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(
      (s) => s.status === "completed"
    ).length;
    const totalSubmissions = sessions.reduce(
      (sum, s) => sum + s.submissions.length,
      0
    );
    const gradedSubmissions = sessions.reduce(
      (sum, s) =>
        sum + s.submissions.filter((sub) => sub.status === "graded").length,
      0
    );

    // AI Detection statistics
    const totalAnswers = sessions.reduce(
      (sum, s) =>
        sum + s.submissions.reduce((subSum, sub) => subSum + sub.answers.length, 0),
      0
    );
    const aiDetectedAnswers = sessions.reduce(
      (sum, s) =>
        sum +
        s.submissions.reduce(
          (subSum, sub) =>
            subSum +
            sub.answers.filter((a) => a.aiDetection?.isAIGenerated).length,
          0
        ),
      0
    );
    const aiDetectionRate =
      totalAnswers > 0 ? (aiDetectedAnswers / totalAnswers) * 100 : 0;

    // Average score statistics
    const completedSubmissions = sessions
      .flatMap((s) => s.submissions)
      .filter((sub) => sub.percentage !== null);
    const avgScore =
      completedSubmissions.length > 0
        ? completedSubmissions.reduce(
            (sum, sub) => sum + (sub.percentage || 0),
            0
          ) / completedSubmissions.length
        : 0;

    // Grade distribution (using default scale)
    const DEFAULT_GRADING_SCALE = [
      { grade: "A", min: 85, max: 100, color: "#22c55e" },
      { grade: "B", min: 70, max: 84, color: "#3b82f6" },
      { grade: "C", min: 60, max: 69, color: "#f59e0b" },
      { grade: "D", min: 50, max: 59, color: "#ef4444" },
      { grade: "E", min: 0, max: 49, color: "#991b1b" },
    ];

    const gradeDistribution = DEFAULT_GRADING_SCALE.map((scale) => {
      const count = completedSubmissions.filter(
        (sub) =>
          sub.percentage !== null &&
          sub.percentage >= scale.min &&
          sub.percentage <= scale.max
      ).length;
      return {
        grade: scale.grade,
        count,
        percentage:
          completedSubmissions.length > 0
            ? (count / completedSubmissions.length) * 100
            : 0,
        color: scale.color,
      };
    });

    // Session status distribution
    const statusDistribution = [
      {
        status: "draft",
        label: "Draft",
        count: sessions.filter((s) => s.status === "draft").length,
      },
      {
        status: "ready",
        label: "Siap Dinilai",
        count: sessions.filter((s) => s.status === "ready").length,
      },
      {
        status: "grading",
        label: "Sedang Menilai",
        count: sessions.filter((s) => s.status === "grading").length,
      },
      {
        status: "completed",
        label: "Selesai",
        count: sessions.filter((s) => s.status === "completed").length,
      },
    ];

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSessions = sessions.filter(
      (s) => new Date(s.createdAt) >= sevenDaysAgo
    );
    const recentlyGraded = sessions
      .flatMap((s) => s.submissions)
      .filter(
        (sub) => sub.gradedAt && new Date(sub.gradedAt) >= sevenDaysAgo
      );

    // Trending stats (comparing last 7 days vs previous 7 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const previousWeekGraded = sessions
      .flatMap((s) => s.submissions)
      .filter(
        (sub) =>
          sub.gradedAt &&
          new Date(sub.gradedAt) >= fourteenDaysAgo &&
          new Date(sub.gradedAt) < sevenDaysAgo
      );

    const gradingTrend =
      previousWeekGraded.length > 0
        ? ((recentlyGraded.length - previousWeekGraded.length) /
            previousWeekGraded.length) *
          100
        : recentlyGraded.length > 0
          ? 100
          : 0;

    // Top performing sessions
    const topSessions = sessions
      .filter((s) => s.status === "completed")
      .map((s) => {
        const submissions = s.submissions.filter(
          (sub) => sub.percentage !== null
        );
        const avg =
          submissions.length > 0
            ? submissions.reduce((sum, sub) => sum + (sub.percentage || 0), 0) /
              submissions.length
            : 0;
        return {
          id: s.id,
          name: s.name,
          courseName: s.courseName,
          averageScore: avg,
          totalStudents: s.submissions.length,
        };
      })
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 5);

    return NextResponse.json({
      overview: {
        totalSessions,
        completedSessions,
        totalSubmissions,
        gradedSubmissions,
        avgScore: Math.round(avgScore * 10) / 10,
        aiDetectionRate: Math.round(aiDetectionRate * 10) / 10,
      },
      gradeDistribution,
      statusDistribution,
      activity: {
        recentSessions: recentSessions.length,
        recentlyGraded: recentlyGraded.length,
        gradingTrend: Math.round(gradingTrend * 10) / 10,
      },
      topSessions,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
