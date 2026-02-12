"use client";

import Link from "next/link";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Query hooks
import { useDashboardStatsQuery } from "@/lib/queries/dashboard";
import { useSessionsQuery } from "@/lib/queries/sessions";

// Feature components
import { OverviewStats } from "@/components/features/dashboard/OverviewStats";
import { ActivityStats } from "@/components/features/dashboard/ActivityStats";
import { GradeCharts } from "@/components/features/dashboard/GradeCharts";
import { TopSessions } from "@/components/features/dashboard/TopSessions";
import { RecentSessions } from "@/components/features/dashboard/RecentSessions";
import { QuickActions } from "@/components/features/dashboard/QuickActions";

export default function DashboardPage() {
  // TanStack Query - Remote State with auto caching & refetching
  const { data: stats, isLoading: statsLoading } = useDashboardStatsQuery();
  const { data: sessions = [], isLoading: sessionsLoading } = useSessionsQuery();

  const isLoading = statsLoading || sessionsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Selamat datang di GradeAssist
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-lg font-medium">Memuat statistik dashboard...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Mengumpulkan data dari semua sesi penilaian
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Selamat datang di GradeAssist</p>
        </div>
        <Link href="/sessions/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Buat Sesi Baru
          </Button>
        </Link>
      </div>

      {/* Overview Stats - 4 main cards */}
      {stats && <OverviewStats stats={stats.overview} />}

      {/* Activity & Status Distribution */}
      {stats && (
        <ActivityStats
          activity={stats.activity}
          statusDistribution={stats.statusDistribution}
        />
      )}

      {/* Grade Distribution Charts */}
      {stats && <GradeCharts gradeDistribution={stats.gradeDistribution} />}

      {/* Top Sessions & Recent Sessions */}
      <div className="grid gap-4 md:grid-cols-2">
        {stats && <TopSessions sessions={stats.topSessions} />}
        <RecentSessions sessions={sessions} />
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}
