import { Loader2, Calculator } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUploader } from "@/components/shared/FileUploader";
import { AIDetectionWarning } from "./AIDetectionWarning";
import { GuidelinesCard } from "./GuidelinesCard";
import type { Session } from "@/types/session";

interface AnswerKeyTabProps {
  session: Session;
  uploading: boolean;
  uploadStep: string;
  weights: Record<string, number>;
  onAnswerKeyUpload: (files: File[]) => void;
  onWeightChange: (questionId: string, value: number) => void;
  onSaveWeights: () => void;
  onAutoFillWeights: () => void;
}

export function AnswerKeyTab({
  session,
  uploading,
  uploadStep,
  weights,
  onAnswerKeyUpload,
  onWeightChange,
  onSaveWeights,
  onAutoFillWeights,
}: AnswerKeyTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            Upload Kunci Jawaban
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Upload file PDF atau DOCX berisi soal dan jawaban benar. AI akan
            otomatis mengekstrak soal dan jawaban.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uploading ? (
            <div className="space-y-3">
              <div className="flex flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 sm:p-4 dark:border-blue-800 dark:bg-blue-950/30">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-blue-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                      {uploadStep || "Memproses..."}
                    </p>
                    <p className="text-[10px] sm:text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                      Proses ini mungkin membutuhkan waktu beberapa menit
                    </p>
                  </div>
                </div>

                {/* Progress Steps Indicator */}
                <div className="space-y-2 border-t border-blue-200 dark:border-blue-800 pt-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <div
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        uploadStep?.includes("Upload") ||
                        uploadStep?.includes("Ekstrak") ||
                        uploadStep?.includes("Deteksi")
                          ? "bg-blue-600 animate-pulse"
                          : "bg-blue-300"
                      }`}
                    />
                    <span className="text-blue-700 dark:text-blue-300 truncate">
                      Upload & Ekstrak Dokumen
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <div
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        uploadStep?.includes("AI") ||
                        uploadStep?.includes("Menganalisis")
                          ? "bg-blue-600 animate-pulse"
                          : "bg-blue-300"
                      }`}
                    />
                    <span className="text-blue-700 dark:text-blue-300 truncate">
                      Analisis dengan AI
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <div
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        uploadStep?.includes("Menyimpan")
                          ? "bg-blue-600 animate-pulse"
                          : "bg-blue-300"
                      }`}
                    />
                    <span className="text-blue-700 dark:text-blue-300 truncate">
                      Menyimpan ke Database
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] sm:text-xs text-center text-muted-foreground">
                ⚠️ Jangan tutup atau refresh halaman ini
              </p>
            </div>
          ) : (
            <FileUploader
              onFilesSelected={onAnswerKeyUpload}
              label="Upload kunci jawaban (PDF/DOCX)"
            />
          )}
        </CardContent>
      </Card>

      <GuidelinesCard />

      {session.answerKey && session.answerKey.questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Soal & Jawaban ({session.answerKey.questions.length} soal)
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Review dan edit soal/jawaban. Atur bobot per soal.
              <br />
              File: {session.answerKey.fileName}
            </CardDescription>
          </CardHeader>

          {session.answerKey.aiDetectionWarning && (
            <AIDetectionWarning
              warning={session.answerKey.aiDetectionWarning}
            />
          )}

          <CardContent>
            <div className="space-y-4">
              {session.answerKey.questions.map((q) => (
                <div
                  key={q.id}
                  className="rounded-lg border p-3 sm:p-4 space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm">
                        Soal {q.questionNumber}
                      </p>
                      <p className="mt-1 text-xs sm:text-sm wrap-break-word">
                        {q.questionText}
                      </p>
                      <p className="mt-2 text-xs sm:text-sm text-green-700 dark:text-green-400 wrap-break-word">
                        Jawaban: {q.correctAnswer}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Label className="text-xs whitespace-nowrap">
                        Bobot:
                      </Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        className="w-16 sm:w-20 text-center text-xs sm:text-sm"
                        value={weights[q.id] ?? q.weight}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (!isNaN(value) && value >= 0.1 && value <= 100) {
                            onWeightChange(q.id, value);
                          } else if (value > 100) {
                            toast.error("Bobot maksimal adalah 100");
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={onAutoFillWeights}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Calculator className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">Auto-fill Merata</span>
                </Button>
                <Button
                  onClick={onSaveWeights}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <span className="text-xs sm:text-sm">Simpan Bobot</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
