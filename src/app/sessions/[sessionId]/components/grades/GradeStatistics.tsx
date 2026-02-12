import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GradeScaleItem } from "@/types/session";

interface GradeWithScale {
  percentage: number | null;
}

interface GradeStatisticsProps {
  grades: GradeWithScale[];
  avgPercentage: number;
  gradingScale: GradeScaleItem[];
}

export function GradeStatistics({
  grades,
  avgPercentage,
  gradingScale,
}: GradeStatisticsProps) {
  // Sort by percentage descending for high/low
  const sortedGrades = [...grades].sort(
    (a, b) => (b.percentage || 0) - (a.percentage || 0),
  );

  // Calculate grade distribution
  const gradeDistribution = gradingScale.map((scale) => {
    const count = grades.filter(
      (g) =>
        (g.percentage || 0) >= scale.min && (g.percentage || 0) <= scale.max,
    ).length;
    return { ...scale, count };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistik Nilai</CardTitle>
        <CardDescription>
          Ringkasan distribusi nilai dan huruf mutu
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Mahasiswa</p>
            <p className="text-2xl font-bold">{grades.length}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Rata-rata</p>
            <p className="text-2xl font-bold">{avgPercentage.toFixed(1)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Tertinggi</p>
            <p className="text-2xl font-bold">
              {sortedGrades[0]?.percentage?.toFixed(1) || 0}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Terendah</p>
            <p className="text-2xl font-bold">
              {sortedGrades[sortedGrades.length - 1]?.percentage?.toFixed(1) ||
                0}
            </p>
          </div>
        </div>

        {/* Grade Distribution */}
        <div>
          <p className="text-sm font-medium mb-2">Distribusi Huruf Mutu</p>
          <div className="flex gap-2 flex-wrap">
            {gradeDistribution.map((dist) => (
              <div
                key={dist.grade}
                className="flex items-center gap-2 rounded-md border px-3 py-2"
              >
                <Badge
                  variant={
                    dist.color as "default" | "secondary" | "destructive"
                  }
                >
                  {dist.grade}
                </Badge>
                <span className="text-sm font-medium">{dist.count}</span>
                <span className="text-xs text-muted-foreground">
                  ({dist.min}-{dist.max})
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
