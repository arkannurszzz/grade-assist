"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { QuestionAnalysis } from "@/types/analytics";

interface QuestionAnalysisChartProps {
  data: QuestionAnalysis[];
}

export function QuestionAnalysisChart({ data }: QuestionAnalysisChartProps) {
  // Sort by AI percentage (descending)
  const sortedData = [...data].sort((a, b) => b.aiPercentage - a.aiPercentage);

  const getBarColor = (percentage: number) => {
    if (percentage >= 50) return "bg-red-500";
    if (percentage >= 25) return "bg-amber-500";
    return "bg-green-500";
  };

  const getRiskBadge = (percentage: number) => {
    if (percentage >= 50)
      return (
        <Badge variant="destructive" className="text-xs">
          High Risk
        </Badge>
      );
    if (percentage >= 25)
      return (
        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Medium Risk
        </Badge>
      );
    return (
      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
        Low Risk
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Question-Level AI Detection</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Analisis penggunaan AI per soal - identify soal yang paling AI-prone
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4">
          {sortedData.map((question) => (
            <div key={question.questionNumber} className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                    <span className="font-semibold text-xs sm:text-sm shrink-0">
                      Q{question.questionNumber}
                    </span>
                    {getRiskBadge(question.aiPercentage)}
                    <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                      {question.aiDetected}/{question.totalAnswers} detected
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                    {question.questionText}...
                  </p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <div className="font-bold text-sm sm:text-base">
                    {question.aiPercentage.toFixed(1)}%
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                    Avg: {question.averageScore.toFixed(1)}/
                    {question.maxPoints}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full ${getBarColor(question.aiPercentage)} transition-all`}
                  style={{ width: `${Math.min(question.aiPercentage, 100)}%` }}
                />
              </div>
            </div>
          ))}

          {sortedData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Tidak ada data untuk ditampilkan</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
