"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface SuspectedPart {
  start: number;
  end: number;
  text: string;
  reason: string;
}

interface AIDetection {
  isAIGenerated: boolean;
  confidence: number;
  isCopyPasted: boolean;
  similarityScore: number;
  suspectedParts: SuspectedPart[] | null;
  analysis: string | null;
  penaltyApplied: number;
}

interface Answer {
  id: string;
  answerText: string;
  score: number | null;
  weightedScore: number | null;
  feedback: string | null;
  aiDetection: AIDetection | null;
  question: {
    questionNumber: number;
    questionText: string;
    correctAnswer: string;
    weight: number;
  };
}

interface SubmissionDetail {
  id: string;
  studentName: string;
  fileName: string;
  totalScore: number | null;
  maxScore: number | null;
  percentage: number | null;
  answers: Answer[];
}

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string; studentId: string }>;
}) {
  const { sessionId, studentId } = use(params);
  const [data, setData] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/results`)
      .then((res) => res.json())
      .then((session) => {
        const submission = session.submissions?.find(
          (s: SubmissionDetail) => s.id === studentId
        );
        setData(submission || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sessionId, studentId]);

  if (loading) return <p className="text-muted-foreground">Memuat...</p>;
  if (!data) return <p className="text-destructive">Data tidak ditemukan</p>;

  const aiDetectedCount = data.answers.filter(
    (a) => a.aiDetection?.isAIGenerated
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/sessions/${sessionId}/results`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{data.studentName}</h1>
          <p className="text-sm text-muted-foreground">{data.fileName}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Nilai</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.totalScore?.toFixed(1)} / {data.maxScore?.toFixed(1)}
            </div>
            <Badge
              className="mt-1"
              variant={
                (data.percentage ?? 0) >= 70
                  ? "default"
                  : (data.percentage ?? 0) >= 50
                  ? "secondary"
                  : "destructive"
              }
            >
              {data.percentage?.toFixed(1)}%
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Soal Dijawab</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.answers.filter((a) => a.answerText.trim()).length} /{" "}
              {data.answers.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Deteksi AI</CardTitle>
          </CardHeader>
          <CardContent>
            {aiDetectedCount > 0 ? (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-2xl font-bold">{aiDetectedCount}</span>
                <span className="text-sm">jawaban terdeteksi</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-lg font-medium">Aman</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-question breakdown */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Breakdown Per Soal</h2>

        {data.answers
          .sort(
            (a, b) => a.question.questionNumber - b.question.questionNumber
          )
          .map((answer) => (
            <Card key={answer.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Soal {answer.question.questionNumber}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      (bobot: {answer.question.weight})
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {answer.aiDetection?.isAIGenerated && (
                      <Badge variant="destructive" className="gap-1">
                        <ShieldAlert className="h-3 w-3" />
                        AI Terdeteksi ({(answer.aiDetection.confidence * 100).toFixed(0)}%)
                      </Badge>
                    )}
                    <Badge
                      variant={
                        (answer.score ?? 0) >= 0.7
                          ? "default"
                          : (answer.score ?? 0) >= 0.4
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {((answer.score ?? 0) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Pertanyaan:
                  </p>
                  <p className="text-sm">{answer.question.questionText}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    Jawaban Benar:
                  </p>
                  <p className="text-sm">
                    {answer.question.correctAnswer}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    Jawaban Mahasiswa:
                  </p>
                  <p className="text-sm">
                    {answer.answerText || (
                      <span className="italic text-muted-foreground">
                        Tidak dijawab
                      </span>
                    )}
                  </p>
                </div>

                {answer.feedback && (
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-sm font-medium">Feedback:</p>
                    <p className="text-sm">{answer.feedback}</p>
                  </div>
                )}

                <div className="text-sm">
                  <span className="text-muted-foreground">Skor: </span>
                  <span className="font-medium">
                    {answer.weightedScore?.toFixed(2)} / {answer.question.weight}
                  </span>
                  {answer.aiDetection &&
                    answer.aiDetection.penaltyApplied > 0 && (
                      <span className="ml-2 text-destructive">
                        (penalti {(answer.aiDetection.penaltyApplied * 100).toFixed(0)}%)
                      </span>
                    )}
                </div>

                {/* AI Detection Detail */}
                {answer.aiDetection && answer.aiDetection.isAIGenerated && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-amber-600" />
                        <p className="text-sm font-medium text-amber-600">
                          Analisis Deteksi AI
                        </p>
                      </div>

                      <div className="grid gap-2 md:grid-cols-2">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Confidence AI
                          </p>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={answer.aiDetection.confidence * 100}
                              className="h-2"
                            />
                            <span className="text-xs font-medium">
                              {(answer.aiDetection.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        {answer.aiDetection.isCopyPasted && (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Copy-Paste Terdeteksi
                            </p>
                            <Badge variant="outline" className="mt-1">
                              Similarity: {(answer.aiDetection.similarityScore * 100).toFixed(0)}%
                            </Badge>
                          </div>
                        )}
                      </div>

                      {answer.aiDetection.analysis && (
                        <div className="rounded-md bg-amber-50 p-3 dark:bg-amber-950/30">
                          <p className="text-sm">
                            {answer.aiDetection.analysis}
                          </p>
                        </div>
                      )}

                      {answer.aiDetection.suspectedParts &&
                        (answer.aiDetection.suspectedParts as SuspectedPart[]).length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">
                              Bagian yang Dicurigai:
                            </p>
                            {(answer.aiDetection.suspectedParts as SuspectedPart[]).map(
                              (part, idx) => (
                                <div
                                  key={idx}
                                  className="rounded border-l-2 border-amber-400 bg-amber-50/50 p-2 dark:bg-amber-950/20"
                                >
                                  <p className="text-sm italic">
                                    &quot;{part.text}&quot;
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {part.reason}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
