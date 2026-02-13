"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Users, FileText, TrendingUp } from "lucide-react";
import type { AnalyticsOverview } from "@/types/analytics";

interface AIDetectionOverviewProps {
  data: AnalyticsOverview;
}

export function AIDetectionOverview({ data }: AIDetectionOverviewProps) {
  const getRiskLevel = (percentage: number) => {
    if (percentage >= 50) return "high";
    if (percentage >= 25) return "medium";
    return "low";
  };

  const riskLevel = getRiskLevel(data.aiUsagePercentage);
  const riskColors = {
    high: "text-red-600 dark:text-red-400",
    medium: "text-amber-600 dark:text-amber-400",
    low: "text-green-600 dark:text-green-400",
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total AI Detection */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">AI Detection Rate</CardTitle>
          <AlertTriangle className={`h-4 w-4 ${riskColors[riskLevel]}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${riskColors[riskLevel]}`}>
            {data.aiUsagePercentage.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {data.aiDetectedAnswers} dari {data.totalAnswers} jawaban
          </p>
        </CardContent>
      </Card>

      {/* Students with AI */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Mahasiswa Pakai AI
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.studentsWithAI}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {data.studentsWithAIPercentage.toFixed(1)}% dari{" "}
            {data.gradedSubmissions} mahasiswa
          </p>
        </CardContent>
      </Card>

      {/* Average Confidence */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Avg Confidence Score
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(data.averageConfidence * 100).toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Tingkat kepercayaan AI detection
          </p>
        </CardContent>
      </Card>

      {/* Total Submissions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Dinilai</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.gradedSubmissions}</div>
          <p className="text-xs text-muted-foreground mt-1">
            dari {data.totalSubmissions} submission
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
