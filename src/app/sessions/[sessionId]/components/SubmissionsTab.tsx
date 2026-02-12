import { useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileUploader } from "@/components/shared/FileUploader";
import { SubmissionItem } from "./SubmissionItem";
import type { Session } from "@/types/session";

interface SubmissionsTabProps {
  session: Session;
  uploadingSubmissions: boolean;
  isGrading: boolean;
  deletingSubmission: string | null;
  onSubmissionsUpload: (files: File[]) => void;
  onDeleteSubmission: (submissionId: string) => void;
}

export function SubmissionsTab({
  session,
  uploadingSubmissions,
  isGrading,
  deletingSubmission,
  onSubmissionsUpload,
  onDeleteSubmission,
}: SubmissionsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter submissions based on search
  const filteredSubmissions = session.submissions.filter((sub) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      sub.studentName.toLowerCase().includes(searchLower) ||
      sub.fileName.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Upload Jawaban Mahasiswa</CardTitle>
          <CardDescription>
            Upload file jawaban mahasiswa (batch). Nama mahasiswa akan diambil
            dari nama file.
            <br />
            Format nama file: NamaLengkap_NIM.docx atau NamaLengkap_NIM.pdf
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!session.answerKey ? (
            <p className="text-sm text-destructive">
              Upload kunci jawaban terlebih dahulu
            </p>
          ) : uploadingSubmissions ? (
            <div className="space-y-3">
              <div className="flex flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-blue-700 dark:text-blue-300">
                      Mengupload dan memparse dokumen...
                    </p>
                    <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                      Memproses file jawaban mahasiswa
                    </p>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="space-y-2 border-t border-blue-200 dark:border-blue-800 pt-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                    <span className="text-blue-700 dark:text-blue-300">
                      Upload file ke server
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                    <span className="text-blue-700 dark:text-blue-300">
                      Ekstrak teks dari dokumen
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                    <span className="text-blue-700 dark:text-blue-300">
                      Menyimpan submission
                    </span>
                  </div>
                </div>

                <div className="text-xs text-blue-600/70 dark:text-blue-400/70">
                  💡 <strong>Tips:</strong> Proses akan lebih cepat jika jumlah
                  file &lt; 20 dan ukuran file &lt; 5MB per file
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                ⚠️ Jangan tutup atau refresh halaman ini
              </p>
            </div>
          ) : (
            <FileUploader
              onFilesSelected={onSubmissionsUpload}
              multiple
              maxFiles={50}
              label="Drag & drop file jawaban mahasiswa (maks. 50 file)"
              disabled={session.status === "grading" || isGrading}
            />
          )}
        </CardContent>
      </Card>

      {session.submissions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <CardTitle>
                Daftar Submission ({session.submissions.length})
                {filteredSubmissions.length !== session.submissions.length && (
                  <span className="ml-2 text-sm text-primary font-normal">
                    (menampilkan {filteredSubmissions.length})
                  </span>
                )}
              </CardTitle>
              {/* Search Input */}
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
            </div>
          </CardHeader>
          <CardContent>
            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Tidak ada submission yang sesuai dengan pencarian.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSubmissions.map((sub) => (
                  <SubmissionItem
                    key={sub.id}
                    submission={sub}
                    isGrading={isGrading}
                    isDeleting={deletingSubmission === sub.id}
                    onDelete={onDeleteSubmission}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
