import { memo } from "react";
import Link from "next/link";
import { Download, Trash2, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface Session {
  id: string;
  name: string;
  courseName: string | null;
  status: string;
  createdAt: string;
  _count: { submissions: number };
}

interface SessionCardProps {
  session: Session;
  statusLabel: string;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export const SessionCard = memo(function SessionCard({
  session,
  statusLabel,
  onDelete,
  isDeleting,
}: SessionCardProps) {
  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Link href={`/sessions/${session.id}`} className="flex-1">
            <CardTitle className="text-lg hover:text-primary">
              {session.name}
            </CardTitle>
            {session.courseName && (
              <p className="mt-1 text-sm text-muted-foreground">
                {session.courseName}
              </p>
            )}
          </Link>
          <div className="flex items-center gap-1">
            {session.status === "completed" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  window.open(
                    `/api/sessions/${session.id}/export-xlsx`,
                    "_blank",
                  );
                }}
                title="Download Excel"
              >
                <Download className="h-4 w-4 text-green-600" />
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isDeleting}>
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-destructive" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus Sesi?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Semua data termasuk kunci jawaban, submission, dan hasil
                    penilaian akan dihapus permanen.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(session.id)}>
                    Hapus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {session._count.submissions} mahasiswa
          </span>
          <Badge variant="secondary">{statusLabel}</Badge>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {new Date(session.createdAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </CardContent>
    </Card>
  );
});
