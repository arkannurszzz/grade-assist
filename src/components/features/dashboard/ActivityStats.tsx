import { TrendingUp, Clock, BarChart3, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ActivityStatsProps {
  activity: {
    recentSessions: number;
    recentlyGraded: number;
    gradingTrend: number;
  };
  statusDistribution: Array<{
    status: string;
    label: string;
    count: number;
  }>;
}

function getTrendIcon(trend: number) {
  if (trend > 0) return <ArrowUpRight className="h-4 w-4 text-green-500" />;
  if (trend < 0) return <ArrowDownRight className="h-4 w-4 text-red-500" />;
  return null;
}

export function ActivityStats({ activity, statusDistribution }: ActivityStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Sesi Baru</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activity.recentSessions}</div>
          <p className="text-xs text-muted-foreground mt-1">7 hari terakhir</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Baru Dinilai</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activity.recentlyGraded}</div>
          <div className="flex items-center gap-1 mt-1">
            {getTrendIcon(activity.gradingTrend)}
            <p className="text-xs text-muted-foreground">
              {activity.gradingTrend >= 0 ? "+" : ""}
              {activity.gradingTrend.toFixed(0)}% vs minggu lalu
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card className="col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Status Sesi</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {statusDistribution.map((status) => (
              <div key={status.status} className="flex items-center gap-2">
                <div className="flex-1 text-xs text-muted-foreground">
                  {status.label}
                </div>
                <div className="font-medium">{status.count}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
