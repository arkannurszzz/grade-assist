import Link from "next/link";
import { Award } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TopSessionsProps {
  sessions: Array<{
    id: string;
    name: string;
    courseName: string | null;
    averageScore: number;
    totalStudents: number;
  }>;
}

export function TopSessions({ sessions }: TopSessionsProps) {
  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Sesi Terbaik</CardTitle>
          <CardDescription>Sesi dengan nilai rata-rata tertinggi</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Belum ada data sesi yang selesai
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 5 Sesi Terbaik</CardTitle>
        <CardDescription>Sesi dengan nilai rata-rata tertinggi</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sessions.map((session, idx) => (
            <Link
              key={session.id}
              href={`/sessions/${session.id}`}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary shrink-0">
                #{idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{session.name}</p>
                {session.courseName && (
                  <p className="text-xs text-muted-foreground truncate">
                    {session.courseName}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {session.totalStudents} mahasiswa
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Award className="h-4 w-4 text-yellow-500" />
                <span className="font-bold">
                  {session.averageScore.toFixed(1)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
