"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIDetectionOverview } from "@/components/features/analytics/AIDetectionOverview";
import { QuestionAnalysisChart } from "@/components/features/analytics/QuestionAnalysisChart";
import { ConfidenceDistributionChart } from "@/components/features/analytics/ConfidenceDistributionChart";
import { StudentAIUsageTable } from "@/components/features/analytics/StudentAIUsageTable";
import { SimilarityDetection } from "@/components/features/analytics/SimilarityDetection";
import { BulkOperations } from "@/components/features/analytics/BulkOperations";
import { QuestionInsights } from "@/components/features/analytics/QuestionInsights";
import type { AnalyticsData } from "@/types/analytics";

export default function AnalyticsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionName, setSessionName] = useState<string>("");
  const [exporting, setExporting] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch(`/api/sessions/${sessionId}/analytics`).then((res) => res.json()),
      fetch(`/api/sessions/${sessionId}`).then((res) => res.json()),
    ])
      .then(([analyticsData, sessionData]) => {
        setData(analyticsData);
        setSessionName(sessionData.name);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">Data tidak ditemukan</p>
      </div>
    );
  }

  const handleExportReport = async () => {
    setExporting(true);
    try {
      const response = await fetch(
        `/api/sessions/${sessionId}/analytics/export`
      );

      if (!response.ok) {
        throw new Error("Failed to export report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `AI-Analytics-${sessionName.replace(/[^a-z0-9]/gi, "-")}-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export report. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href={`/sessions/${sessionId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">AI Detection Analytics</h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{sessionName}</p>
          </div>
        </div>
        <Button
          onClick={handleExportReport}
          variant="outline"
          disabled={exporting}
          size="sm"
          className="w-full sm:w-auto shrink-0"
        >
          {exporting ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              <span className="text-xs sm:text-sm">Exporting...</span>
            </>
          ) : (
            <>
              <Download className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Export Report</span>
            </>
          )}
        </Button>
      </div>

      {/* Overview Cards */}
      <AIDetectionOverview data={data.overview} />

      {/* Bulk Operations */}
      <BulkOperations
        sessionId={sessionId}
        totalSubmissions={data.overview.totalSubmissions}
        aiDetectedCount={data.overview.studentsWithAI}
        onSuccess={fetchData}
      />

      {/* Charts Grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <QuestionAnalysisChart data={data.questionAnalysis} />
        <ConfidenceDistributionChart data={data.confidenceDistribution} />
      </div>

      {/* Student Table */}
      <StudentAIUsageTable data={data.studentAnalysis} sessionId={sessionId} />

      {/* Similarity Detection */}
      <SimilarityDetection sessionId={sessionId} />

      {/* Question Quality Insights */}
      <QuestionInsights questions={data.questionAnalysis} />
    </div>
  );
}
