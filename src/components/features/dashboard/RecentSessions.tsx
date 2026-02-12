import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Session {
  id: string;
  name: string;
  courseName: string | null;
  status: string;
  _count: { submissions: number };
}

interface RecentSessionsProps {
  sessions: Session[];
}

const statusLabels: Record<string, string> = {
  draft: "Draft",
  answer_key_uploaded: "Kunci Jawaban Terupload",
  ready: "Siap Dinilai",
  grading: "Sedang Menilai...",
  completed: "Selesai",
};

export function RecentSessions({ sessions }: RecentSessionsProps) {
  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sesi Terbaru</CardTitle>
          <CardDescription>Daftar sesi penilaian terakhir</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-3 py-8">
            <FileText className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Belum ada sesi penilaian
            </p>
            <Link href="/sessions/new">
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Buat Sesi Pertama
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sesi Terbaru</CardTitle>
        <CardDescription>Daftar sesi penilaian terakhir</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sessions.slice(0, 5).map((session) => (
            <Link
              key={session.id}
              href={`/sessions/${session.id}`}
              className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-muted/50"
            >
              <div>
                <p className="font-medium text-sm">{session.name}</p>
                {session.courseName && (
                  <p className="text-xs text-muted-foreground">
                    {session.courseName}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {session._count.submissions} mhs
                </span>
                <Badge variant="secondary" className="text-xs">
                  {statusLabels[session.status] || session.status}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
