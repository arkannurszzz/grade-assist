import { FileText, Users, Award, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface OverviewStatsProps {
  stats: {
    totalSessions: number;
    completedSessions: number;
    totalSubmissions: number;
    gradedSubmissions: number;
    avgScore: number;
    aiDetectionRate: number;
  };
}

export function OverviewStats({ stats }: OverviewStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Sesi</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalSessions}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.completedSessions} selesai
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Mahasiswa</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.gradedSubmissions} telah dinilai
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Rata-rata Nilai</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.avgScore.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Dari semua submission
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">AI Detection</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.aiDetectionRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Jawaban terdeteksi AI
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
