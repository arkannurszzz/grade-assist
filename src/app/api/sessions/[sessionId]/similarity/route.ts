import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface SimilarityMatch {
  questionNumber: number;
  questionText: string;
  similarityScore: number;
  students: {
    studentId: string;
    studentName: string;
    answerText: string;
    isAIGenerated: boolean;
    confidence: number;
  }[];
}

interface SimilarityGroup {
  questionNumber: number;
  questionText: string;
  groupId: string;
  similarityScore: number;
  studentCount: number;
  students: {
    studentId: string;
    studentName: string;
    answerText: string;
    isAIGenerated: boolean;
  }[];
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await context.params;

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

    // Group answers by question
    const answersByQuestion = new Map<
      number,
      {
        questionText: string;
        answers: {
          studentId: string;
          studentName: string;
          answerText: string;
          isAIGenerated: boolean;
          confidence: number;
        }[];
      }
    >();

    for (const submission of session.submissions) {
      for (const answer of submission.answers) {
        const qNum = answer.question.questionNumber;

        if (!answersByQuestion.has(qNum)) {
          answersByQuestion.set(qNum, {
            questionText: answer.question.questionText,
            answers: [],
          });
        }

        answersByQuestion.get(qNum)!.answers.push({
          studentId: submission.id,
          studentName: submission.studentName,
          answerText: answer.answerText,
          isAIGenerated: answer.aiDetection?.isAIGenerated || false,
          confidence: answer.aiDetection?.confidence || 0,
        });
      }
    }

    // Find similar answer groups for each question
    const similarityGroups: SimilarityGroup[] = [];

    for (const [qNum, data] of answersByQuestion) {
      const answers = data.answers.filter((a) => a.answerText.trim().length > 20);

      if (answers.length < 2) continue;

      // Compare all pairs
      const compared = new Set<string>();
      const groups: SimilarityMatch[] = [];

      for (let i = 0; i < answers.length; i++) {
        for (let j = i + 1; j < answers.length; j++) {
          const pairKey = `${answers[i].studentId}-${answers[j].studentId}`;
          if (compared.has(pairKey)) continue;

          const similarity = calculateSimilarity(
            answers[i].answerText,
            answers[j].answerText
          );

          // Threshold: 70% similarity is suspicious
          if (similarity >= 0.7) {
            compared.add(pairKey);

            // Find existing group or create new
            let existingGroup = groups.find(
              (g) =>
                g.students.some((s) => s.studentId === answers[i].studentId) ||
                g.students.some((s) => s.studentId === answers[j].studentId)
            );

            if (existingGroup) {
              // Add to existing group
              if (!existingGroup.students.find((s) => s.studentId === answers[i].studentId)) {
                existingGroup.students.push(answers[i]);
              }
              if (!existingGroup.students.find((s) => s.studentId === answers[j].studentId)) {
                existingGroup.students.push(answers[j]);
              }
              existingGroup.similarityScore = Math.max(
                existingGroup.similarityScore,
                similarity
              );
            } else {
              // Create new group
              groups.push({
                questionNumber: qNum,
                questionText: data.questionText,
                similarityScore: similarity,
                students: [answers[i], answers[j]],
              });
            }
          }
        }
      }

      // Convert to final format
      for (const group of groups) {
        similarityGroups.push({
          questionNumber: group.questionNumber,
          questionText: group.questionText,
          groupId: `q${group.questionNumber}-${group.students[0].studentId}`,
          similarityScore: group.similarityScore,
          studentCount: group.students.length,
          students: group.students,
        });
      }
    }

    // Sort by similarity score descending
    similarityGroups.sort((a, b) => b.similarityScore - a.similarityScore);

    // Calculate summary stats
    const totalGroups = similarityGroups.length;
    const totalStudentsInvolved = new Set(
      similarityGroups.flatMap((g) => g.students.map((s) => s.studentId))
    ).size;
    const aiGeneratedMatches = similarityGroups.filter((g) =>
      g.students.some((s) => s.isAIGenerated)
    ).length;

    return NextResponse.json({
      summary: {
        totalGroups,
        totalStudentsInvolved,
        aiGeneratedMatches,
        highRiskGroups: similarityGroups.filter((g) => g.similarityScore >= 0.85)
          .length,
      },
      groups: similarityGroups,
    });
  } catch (error) {
    console.error("Similarity detection error:", error);
    return NextResponse.json(
      { error: "Failed to analyze similarity" },
      { status: 500 }
    );
  }
}

// Simple similarity calculation using Jaccard similarity on word sets
function calculateSimilarity(text1: string, text2: string): number {
  const normalize = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2);

  const words1 = new Set(normalize(text1));
  const words2 = new Set(normalize(text2));

  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return union.size === 0 ? 0 : intersection.size / union.size;
}
