import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// Types
interface DashboardStats {
  overview: {
    totalSessions: number;
    completedSessions: number;
    totalSubmissions: number;
    gradedSubmissions: number;
    avgScore: number;
    aiDetectionRate: number;
  };
  gradeDistribution: Array<{
    grade: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  statusDistribution: Array<{
    status: string;
    label: string;
    count: number;
  }>;
  activity: {
    recentSessions: number;
    recentlyGraded: number;
    gradingTrend: number;
  };
  topSessions: Array<{
    id: string;
    name: string;
    courseName: string | null;
    averageScore: number;
    totalStudents: number;
  }>;
}

// Query Keys
export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardKeys.all, "stats"] as const,
};

// Queries
export function useDashboardStatsQuery() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => apiClient.get<DashboardStats>("/api/dashboard/stats"),
    staleTime: 2 * 60 * 1000, // 2 minutes - dashboard data changes less frequently
    refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
  });
}
