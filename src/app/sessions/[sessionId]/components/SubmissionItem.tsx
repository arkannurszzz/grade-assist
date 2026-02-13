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
import { RenameStudentDialog } from "@/components/features/session-detail/RenameStudentDialog";
import { RegradeButton } from "@/components/features/session-detail/RegradeButton";
import type { Submission } from "@/types/session";

interface SubmissionItemProps {
  submission: Submission;
  sessionId: string;
  isGrading: boolean;
  isDeleting: boolean;
  onDelete: (id: string) => void;
  onRename?: () => void;
}

export const SubmissionItem = memo(function SubmissionItem({
  submission,
  sessionId,
  isGrading,
  isDeleting,
  onDelete,
  onRename,
}: SubmissionItemProps) {
  return (
    <div className="flex flex-col gap-2 rounded-md border px-3 sm:px-4 py-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm sm:text-base truncate">{submission.studentName}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{submission.fileName}</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {submission.status === "graded" && submission.percentage !== null && (
            <span className="text-xs sm:text-sm font-medium shrink-0">
              {submission.percentage.toFixed(1)}%
            </span>
          )}
          {submission.status === "graded" && (
            <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 shrink-0" />
          )}
          {submission.status === "error" && (
            <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-destructive shrink-0" />
          )}
          {submission.status === "grading" && (
            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin shrink-0" />
          )}
          {(submission.status === "uploaded" || submission.status === "parsed") && (
            <Badge variant="outline" className="text-xs shrink-0">Menunggu</Badge>
          )}
          <RenameStudentDialog
            sessionId={sessionId}
            submissionId={submission.id}
            currentName={submission.studentName}
            onSuccess={onRename}
          />
          {(submission.status === "graded" || submission.status === "error") && (
            <RegradeButton
              sessionId={sessionId}
              submissionId={submission.id}
              studentName={submission.studentName}
              onSuccess={onRename}
              variant="ghost"
              size="icon"
              showText={false}
            />
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive shrink-0"
                disabled={isDeleting || isGrading}
                title="Hapus submission"
              >
                {isDeleting ? (
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
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
