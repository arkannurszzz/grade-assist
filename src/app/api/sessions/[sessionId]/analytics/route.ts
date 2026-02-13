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
        include: { questions: true },
      },
      submissions: {
        include: {
          answers: {
            include: {
              aiDetection: true,
              question: true,
            },
          },
        },
      },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Calculate overall statistics
  const totalSubmissions = session.submissions.length;
  const gradedSubmissions = session.submissions.filter(
    (s) => s.status === "graded"
  );

  const totalAnswers = gradedSubmissions.reduce(
    (sum, sub) => sum + sub.answers.length,
    0
  );

  const aiDetectedAnswers = gradedSubmissions.reduce(
    (sum, sub) =>
      sum + sub.answers.filter((a) => a.aiDetection?.isAIGenerated).length,
    0
  );

  const studentsWithAI = gradedSubmissions.filter((sub) =>
    sub.answers.some((a) => a.aiDetection?.isAIGenerated)
  ).length;

  const aiUsagePercentage =
    totalAnswers > 0 ? (aiDetectedAnswers / totalAnswers) * 100 : 0;
  const studentsWithAIPercentage =
    totalSubmissions > 0 ? (studentsWithAI / totalSubmissions) * 100 : 0;

  // Calculate average confidence score
  const aiDetections = gradedSubmissions.flatMap((sub) =>
    sub.answers
      .filter((a) => a.aiDetection?.isAIGenerated)
      .map((a) => a.aiDetection!)
  );

  const avgConfidence =
    aiDetections.length > 0
      ? aiDetections.reduce((sum, d) => sum + d.confidence, 0) /
        aiDetections.length
      : 0;

  // Question-level analysis
  const questionAnalysis =
    session.answerKey?.questions.map((question) => {
      const answers = gradedSubmissions.flatMap((sub) =>
        sub.answers.filter((a) => a.question.id === question.id)
      );

      const aiDetected = answers.filter(
        (a) => a.aiDetection?.isAIGenerated
      ).length;
      const total = answers.length;
      const percentage = total > 0 ? (aiDetected / total) * 100 : 0;

      const avgScore =
        answers.length > 0
          ? answers.reduce((sum, a) => sum + (a.score || 0), 0) / answers.length
          : 0;

      return {
        questionNumber: question.questionNumber,
        questionText: question.questionText.substring(0, 100),
        totalAnswers: total,
        aiDetected,
        aiPercentage: percentage,
        averageScore: avgScore,
        maxPoints: question.weight,
      };
    }) || [];

  // Confidence distribution (buckets: 0-0.5, 0.5-0.7, 0.7-0.85, 0.85-0.95, 0.95-1.0)
  const confidenceBuckets = {
    low: 0, // 0-0.5
    mediumLow: 0, // 0.5-0.7
    medium: 0, // 0.7-0.85
    mediumHigh: 0, // 0.85-0.95
    high: 0, // 0.95-1.0
  };

  aiDetections.forEach((detection) => {
    const conf = detection.confidence;
    if (conf < 0.5) confidenceBuckets.low++;
    else if (conf < 0.7) confidenceBuckets.mediumLow++;
    else if (conf < 0.85) confidenceBuckets.medium++;
    else if (conf < 0.95) confidenceBuckets.mediumHigh++;
    else confidenceBuckets.high++;
  });

  // Per-student AI usage
  const studentAnalysis = gradedSubmissions.map((sub) => {
    const aiAnswers = sub.answers.filter(
      (a) => a.aiDetection?.isAIGenerated
    ).length;
    const totalAnswers = sub.answers.length;
    const percentage = totalAnswers > 0 ? (aiAnswers / totalAnswers) * 100 : 0;

    return {
      studentId: sub.id,
      studentName: sub.studentName,
      totalAnswers,
      aiDetectedAnswers: aiAnswers,
      aiPercentage: percentage,
      totalScore: sub.totalScore,
      percentage: sub.percentage,
    };
  });

  // Sort by AI usage
  studentAnalysis.sort((a, b) => b.aiPercentage - a.aiPercentage);

  return NextResponse.json({
    overview: {
      totalSubmissions,
      gradedSubmissions: gradedSubmissions.length,
      totalAnswers,
      aiDetectedAnswers,
      aiUsagePercentage,
      studentsWithAI,
      studentsWithAIPercentage,
      averageConfidence: avgConfidence,
    },
    questionAnalysis,
    confidenceDistribution: confidenceBuckets,
    studentAnalysis,
  });
}
