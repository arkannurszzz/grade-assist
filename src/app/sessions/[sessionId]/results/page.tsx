"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Download, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface AIDetection {
  isAIGenerated: boolean;
  confidence: number;
}

interface StudentAnswer {
  id: string;
  score: number | null;
  weightedScore: number | null;
  aiDetection: AIDetection | null;
  question: { questionNumber: number };
}

interface Submission {
  id: string;
  studentName: string;
  fileName: string;
  status: string;
  totalScore: number | null;
  maxScore: number | null;
  percentage: number | null;
  answers: StudentAnswer[];
}

interface SessionResult {
  id: string;
  name: string;
  courseName: string | null;
  submissions: Submission[];
  answerKey: {
    questions: Array<{ questionNumber: number; weight: number }>;
  } | null;
}

export default function ResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const [data, setData] = useState<SessionResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/results`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <p className="text-muted-foreground">Memuat...</p>;
  if (!data) return <p className="text-destructive">Data tidak ditemukan</p>;

  const gradedSubmissions = data.submissions.filter(
    (s) => s.status === "graded"
  );
  const avgPercentage =
    gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((sum, s) => sum + (s.percentage ?? 0), 0) /
        gradedSubmissions.length
      : 0;
  const highestScore = Math.max(
    ...gradedSubmissions.map((s) => s.percentage ?? 0),
    0
  );
  const lowestScore = Math.min(
    ...gradedSubmissions.map((s) => s.percentage ?? 100),
    100
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/sessions/${sessionId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Hasil Penilaian</h1>
            <p className="text-muted-foreground">
              {data.name}
              {data.courseName && ` - ${data.courseName}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(`/api/sessions/${sessionId}/export-xlsx`, "_blank")
            }
          >
            <Download className="mr-2 h-4 w-4" />
            Quick Export
          </Button>
          <Link href={`/sessions/${sessionId}/export-customize`}>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Customize Export
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Mahasiswa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {gradedSubmissions.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Rata-rata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgPercentage.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Nilai Tertinggi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {highestScore.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Nilai Terendah</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {lowestScore.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Nilai</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Nama Mahasiswa</TableHead>
                <TableHead className="text-center">Skor</TableHead>
                <TableHead className="text-center">Persentase</TableHead>
                <TableHead className="text-center">Deteksi AI</TableHead>
                <TableHead className="text-center">Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gradedSubmissions
                .sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0))
                .map((sub, idx) => {
                  const aiFlags = sub.answers.filter(
                    (a) => a.aiDetection?.isAIGenerated
                  ).length;
                  return (
                    <TableRow key={sub.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{sub.studentName}</p>
                          <p className="text-xs text-muted-foreground">
                            {sub.fileName}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {sub.totalScore?.toFixed(1)} /{" "}
                        {sub.maxScore?.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            (sub.percentage ?? 0) >= 70
                              ? "default"
                              : (sub.percentage ?? 0) >= 50
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {sub.percentage?.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {aiFlags > 0 ? (
                          <span className="inline-flex items-center gap-1 text-sm text-amber-600">
                            <AlertTriangle className="h-4 w-4" />
                            {aiFlags}
                          </span>
                        ) : (
                          <span className="text-sm text-green-600">
                            Aman
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Link
                          href={`/sessions/${sessionId}/students/${sub.id}`}
                        >
                          <Button variant="outline" size="sm">
                            Lihat
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
