import { memo } from "react";
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Submission } from "@/types/session";

interface SubmissionItemProps {
  submission: Submission;
  isGrading: boolean;
  isDeleting: boolean;
  onDelete: (id: string) => void;
}

export const SubmissionItem = memo(function SubmissionItem({
  submission,
  isGrading,
  isDeleting,
  onDelete,
}: SubmissionItemProps) {
  return (
    <div className="flex flex-col gap-1 rounded-md border px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{submission.studentName}</p>
          <p className="text-xs text-muted-foreground">{submission.fileName}</p>
        </div>
        <div className="flex items-center gap-3">
          {submission.status === "graded" && submission.percentage !== null && (
            <span className="text-sm font-medium">
              {submission.percentage.toFixed(1)}%
            </span>
          )}
          {submission.status === "graded" && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          {submission.status === "error" && (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
          {submission.status === "grading" && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {(submission.status === "uploaded" || submission.status === "parsed") && (
            <Badge variant="outline">Menunggu</Badge>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                disabled={isDeleting || isGrading}
                title="Hapus submission"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus Submission?</AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin menghapus submission dari{" "}
                  <strong>{submission.studentName}</strong>?
                  <br />
                  <br />
                  Semua data jawaban dan hasil penilaian untuk mahasiswa ini
                  akan dihapus permanen.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(submission.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Hapus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {submission.status === "error" && submission.errorMessage && (
        <p className="text-xs text-destructive">
          <AlertTriangle className="mr-1 inline h-3 w-3" />
          {submission.errorMessage}
        </p>
      )}
    </div>
  );
});
