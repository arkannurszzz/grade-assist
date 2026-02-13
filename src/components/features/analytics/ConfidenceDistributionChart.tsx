"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConfidenceDistribution } from "@/types/analytics";

interface ConfidenceDistributionChartProps {
  data: ConfidenceDistribution;
}

export function ConfidenceDistributionChart({
  data,
}: ConfidenceDistributionChartProps) {
  const total =
    data.low + data.mediumLow + data.medium + data.mediumHigh + data.high;

  const buckets = [
    { label: "0-50%", value: data.low, color: "bg-red-500", range: "Low" },
    {
      label: "50-70%",
      value: data.mediumLow,
      color: "bg-orange-500",
      range: "Medium-Low",
    },
    {
      label: "70-85%",
      value: data.medium,
      color: "bg-amber-500",
      range: "Medium",
    },
    {
      label: "85-95%",
      value: data.mediumHigh,
      color: "bg-lime-500",
      range: "Medium-High",
    },
    { label: "95-100%", value: data.high, color: "bg-green-500", range: "High" },
  ];

  const maxValue = Math.max(...buckets.map((b) => b.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Confidence Score Distribution</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Distribusi tingkat kepercayaan AI detection ({total} total detections)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4">
          {buckets.map((bucket) => {
            const percentage =
              total > 0 ? ((bucket.value / total) * 100).toFixed(1) : "0.0";
            const barWidth =
              maxValue > 0 ? (bucket.value / maxValue) * 100 : 0;

            return (
              <div key={bucket.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                    <div
                      className={`w-2 h-2 sm:w-3 sm:h-3 rounded shrink-0 ${bucket.color}`}
                    />
                    <span className="font-medium text-xs sm:text-sm shrink-0">{bucket.label}</span>
                    <span className="text-muted-foreground text-[10px] sm:text-xs truncate">
                      ({bucket.range})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <span className="text-muted-foreground text-xs sm:text-sm">
                      {bucket.value}
                    </span>
                    <span className="font-semibold w-10 sm:w-12 text-right text-xs sm:text-sm">
                      {percentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2 sm:h-3 overflow-hidden">
                  <div
                    className={`h-full ${bucket.color} transition-all`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}

          {total === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-xs sm:text-sm">Tidak ada AI detection ditemukan</p>
            </div>
          )}
        </div>

        <div className="mt-4 sm:mt-6 p-2.5 sm:p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-[10px] sm:text-xs text-blue-900 dark:text-blue-100">
            <strong>Insight:</strong> High confidence scores (85-100%) indicate
            strong AI detection. Low scores may need manual review.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
