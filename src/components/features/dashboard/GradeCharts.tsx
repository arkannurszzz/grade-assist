import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface GradeChartsProps {
  gradeDistribution: Array<{
    grade: string;
    count: number;
    percentage: number;
    color: string;
  }>;
}

export function GradeCharts({ gradeDistribution }: GradeChartsProps) {
  const hasData = gradeDistribution.some((g) => g.count > 0);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Distribusi Nilai</CardTitle>
          <CardDescription>Jumlah mahasiswa per grade</CardDescription>
        </CardHeader>
        <CardContent>
          {hasData ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gradeDistribution}>
                <XAxis dataKey="grade" />
                <YAxis />
                <Tooltip
                  content={({ payload }) => {
                    if (payload && payload.length > 0) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="font-medium">Grade {data.grade}</div>
                          <div className="text-sm text-muted-foreground">
                            {data.count} mahasiswa ({data.percentage.toFixed(1)}
                            %)
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              Belum ada data nilai
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Proporsi Nilai</CardTitle>
          <CardDescription>Persentase distribusi huruf mutu</CardDescription>
        </CardHeader>
        <CardContent>
          {hasData ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gradeDistribution.filter((g) => g.count > 0)}
                  cx="50%"
                  cy="50%"
                  label
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="grade"
                >
                  {gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ payload }) => {
                    if (payload && payload.length > 0) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="font-medium">Grade {data.grade}</div>
                          <div className="text-sm text-muted-foreground">
                            {data.count} mahasiswa ({data.percentage.toFixed(1)}
                            %)
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              Belum ada data nilai
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
