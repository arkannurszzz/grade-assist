import { useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Download,
  AlertTriangle,
  RefreshCw,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GradingConfigDialog, type GradingConfig } from "./GradingConfigDialog";
import type { Session, GradingProgress } from "@/types/session";

interface GradingTabProps {
  session: Session;
  sessionId: string;
  isGrading: boolean;
  gradingProgress: GradingProgress | null;
  onStartGrading: (config: GradingConfig) => void;
  onResetGrading?: () => void;
}

export function GradingTab({
  session,
  sessionId,
  isGrading,
  gradingProgress,
  onStartGrading,
  onResetGrading,
}: GradingTabProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter graded submissions based on search
  const gradedSubmissions = session.submissions
    .filter((s) => s.status === "graded")
    .sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0));

  const filteredResults = gradedSubmissions.filter((sub) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      sub.studentName.toLowerCase().includes(searchLower) ||
      sub.fileName.toLowerCase().includes(searchLower)
    );
  });

  const handleResetSettings = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/settings/reset`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success(
          "Settings berhasil direset ke default values. Silakan refresh halaman.",
        );
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error("Gagal reset settings");
      }
    } catch {
      toast.error("Koneksi gagal");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Mulai Penilaian</CardTitle>
          <CardDescription>
            AI akan menilai semua jawaban mahasiswa berdasarkan kunci jawaban
            dan mendeteksi penggunaan AI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!session.answerKey ? (
            <p className="text-sm text-destructive">
              Upload kunci jawaban terlebih dahulu
            </p>
          ) : session.submissions.length === 0 ? (
            <p className="text-sm text-destructive">
              Upload jawaban mahasiswa terlebih dahulu
            </p>
          ) : isGrading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="font-medium text-lg">Sedang menilai...</span>
                </div>
                {onResetGrading && (
                  <Button variant="outline" size="sm" onClick={onResetGrading}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset Status
                  </Button>
                )}
              </div>
              {gradingProgress && (
                <div className="space-y-3">
                  {/* Progress Bar with Percentage */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        Progress: {gradingProgress.gradedSubmissions} /{" "}
                        {gradingProgress.totalSubmissions} mahasiswa
                      </span>
                      <span className="font-bold text-primary">
                        {Math.round(gradingProgress.progress)}%
                      </span>
                    </div>
                    <Progress value={gradingProgress.progress} className="h-3" />
                  </div>

                  {/* Current Student Being Graded */}
                  {gradingProgress.currentStudent && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            Sedang menilai:
                          </p>
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            {gradingProgress.currentStudent}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Estimated Time Remaining */}
                  {gradingProgress.gradedSubmissions > 0 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Estimasi waktu tersisa:</span>
                      <span className="font-medium">
                        {(() => {
                          const remaining =
                            gradingProgress.totalSubmissions -
                            gradingProgress.gradedSubmissions;
                          const avgTimePerStudent = 8; // seconds per student (estimate)
                          const totalSeconds = remaining * avgTimePerStudent;
                          const minutes = Math.floor(totalSeconds / 60);
                          const seconds = totalSeconds % 60;
                          return minutes > 0
                            ? `~${minutes} menit ${seconds} detik`
                            : `~${seconds} detik`;
                        })()}
                      </span>
                    </div>
                  )}

                  {/* Errors */}
                  {gradingProgress.errorSubmissions > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          <strong>{gradingProgress.errorSubmissions}</strong>{" "}
                          submission gagal dinilai
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Info Message */}
                  <p className="text-xs text-muted-foreground text-center">
                    Jangan tutup halaman ini sampai proses selesai
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="rounded-md bg-muted p-4 text-sm">
                  <p>
                    <strong>Soal:</strong> {session.answerKey.questions.length}{" "}
                    soal
                  </p>
                  <p>
                    <strong>Mahasiswa:</strong> {session.submissions.length}{" "}
                    submission
                  </p>
                  <p>
                    <strong>Deteksi AI:</strong>{" "}
                    {session.settings?.enableAIDetection ? "Aktif" : "Nonaktif"}
                  </p>
                  <p>
                    <strong>Penalti AI:</strong>{" "}
                    {session.settings?.aiPenaltyPercent ?? 50}%
                  </p>
                </div>

                {(session.settings?.aiPenaltyPercent === 0 ||
                  session.settings?.copyPenaltyPercent === 0) && (
                  <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                      <div className="space-y-2 flex-1">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          <strong>Perhatian:</strong> Penalty AI terdeteksi 0%.
                          Ini akan membuat AI detection tidak berfungsi!
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetSettings}
                          className="bg-white dark:bg-gray-900"
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Reset Settings ke Default (Penalty 50%)
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <GradingConfigDialog
                defaultConfig={{
                  strictness:
                    (session.settings?.gradingStrictness as
                      | "lenient"
                      | "moderate"
                      | "strict") ?? "moderate",
                  enableAIDetection:
                    session.settings?.enableAIDetection ?? true,
                  aiPenaltyPercent: session.settings?.aiPenaltyPercent || 50,
                  copyPenaltyPercent:
                    session.settings?.copyPenaltyPercent || 30,
                  aiDetectionThreshold:
                    session.settings?.aiDetectionThreshold || 0.7,
                  language: (session.settings?.language as "id" | "en") ?? "id",
                }}
                onStart={onStartGrading}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {session.status === "completed" && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div>
                <CardTitle>
                  Hasil Penilaian
                  {filteredResults.length !== gradedSubmissions.length && (
                    <span className="ml-2 text-sm text-primary font-normal">
                      ({filteredResults.length} dari {gradedSubmissions.length})
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Ringkasan hasil penilaian mahasiswa
                </CardDescription>
              </div>
              {/* Search Input */}
              {gradedSubmissions.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama mahasiswa atau file..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-9"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Tidak ada mahasiswa yang sesuai dengan pencarian.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredResults.map((sub, idx) => (
                  <Link
                    key={sub.id}
                    href={`/sessions/${sessionId}/students/${sub.id}`}
                    className="flex items-center justify-between rounded-md border px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-medium">{sub.studentName}</p>
                        <p className="text-xs text-muted-foreground">
                          {sub.fileName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm">
                        {sub.totalScore?.toFixed(1)} /{" "}
                        {sub.maxScore?.toFixed(1)}
                      </span>
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
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {filteredResults.length > 0 && (
              <div className="flex gap-3">
                <Link href={`/sessions/${sessionId}/results`}>
                  <Button variant="outline">Lihat Detail Lengkap</Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => {
                    window.open(`/api/sessions/${sessionId}/export-xlsx`, "_blank");
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Excel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
