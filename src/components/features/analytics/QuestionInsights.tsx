"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import type { QuestionAnalysis } from "@/types/analytics";

interface QuestionInsight {
  questionNumber: number;
  questionText: string;
  insights: string[];
  recommendations: string[];
  healthScore: number; // 0-100
  status: "excellent" | "good" | "needs-attention" | "critical";
  metrics: {
    difficulty: "too-easy" | "easy" | "moderate" | "hard" | "too-hard";
    aiRisk: "low" | "medium" | "high" | "critical";
    discrimination: "poor" | "fair" | "good" | "excellent";
  };
}

interface QuestionInsightsProps {
  questions: QuestionAnalysis[];
}

export function QuestionInsights({ questions }: QuestionInsightsProps) {
  // Analyze each question
  const insights = questions.map((q) => analyzeQuestion(q));

  // Overall health
  const avgHealthScore =
    insights.reduce((sum, i) => sum + i.healthScore, 0) / insights.length;
  const criticalCount = insights.filter((i) => i.status === "critical").length;
  const needsAttentionCount = insights.filter(
    (i) => i.status === "needs-attention"
  ).length;

  const getStatusIcon = (status: QuestionInsight["status"]) => {
    switch (status) {
      case "excellent":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "good":
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      case "needs-attention":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusBadge = (status: QuestionInsight["status"]) => {
    switch (status) {
      case "excellent":
        return <Badge className="bg-green-600">Excellent</Badge>;
      case "good":
        return <Badge className="bg-blue-600">Good</Badge>;
      case "needs-attention":
        return (
          <Badge className="bg-orange-600 hover:bg-orange-700">
            Needs Attention
          </Badge>
        );
      case "critical":
        return (
          <Badge variant="destructive" className="bg-red-600">
            Critical
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Question Quality Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Health Score */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Overall Question Health</p>
              <p className="text-xs text-muted-foreground">
                Based on difficulty, AI risk, and discrimination
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {avgHealthScore.toFixed(0)}
                <span className="text-lg text-muted-foreground">/100</span>
              </div>
              <p className="text-xs text-muted-foreground">health score</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="text-center p-3 border rounded">
              <div className="text-2xl font-bold text-red-600">
                {criticalCount}
              </div>
              <p className="text-xs text-muted-foreground">Critical</p>
            </div>
            <div className="text-center p-3 border rounded">
              <div className="text-2xl font-bold text-orange-600">
                {needsAttentionCount}
              </div>
              <p className="text-xs text-muted-foreground">Needs Attention</p>
            </div>
            <div className="text-center p-3 border rounded">
              <div className="text-2xl font-bold text-green-600">
                {insights.length - criticalCount - needsAttentionCount}
              </div>
              <p className="text-xs text-muted-foreground">Good/Excellent</p>
            </div>
          </div>

          {/* Key Recommendations */}
          {(criticalCount > 0 || needsAttentionCount > 0) && (
            <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>Key Recommendations</AlertTitle>
              <AlertDescription className="space-y-1 mt-2">
                {criticalCount > 0 && (
                  <p>
                    • <strong>{criticalCount} critical issues</strong> require
                    immediate attention (high AI risk or poor design)
                  </p>
                )}
                {needsAttentionCount > 0 && (
                  <p>
                    • <strong>{needsAttentionCount} questions</strong> could be
                    improved for better assessment quality
                  </p>
                )}
                <p className="text-xs mt-2 text-muted-foreground">
                  Scroll down for detailed insights per question
                </p>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Per-Question Insights */}
      <div className="space-y-3">
        {insights.map((insight) => (
          <Card
            key={insight.questionNumber}
            className={
              insight.status === "critical"
                ? "border-red-200 dark:border-red-800"
                : insight.status === "needs-attention"
                ? "border-orange-200 dark:border-orange-800"
                : ""
            }
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(insight.status)}
                    <h4 className="font-semibold">
                      Question {insight.questionNumber}
                    </h4>
                    {getStatusBadge(insight.status)}
                    <Badge variant="outline" className="text-xs">
                      Health: {insight.healthScore}/100
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {insight.questionText}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-muted/30 rounded">
                  <p className="text-xs text-muted-foreground">Difficulty</p>
                  <p className="text-sm font-medium capitalize">
                    {insight.metrics.difficulty.replace("-", " ")}
                  </p>
                </div>
                <div className="text-center p-2 bg-muted/30 rounded">
                  <p className="text-xs text-muted-foreground">AI Risk</p>
                  <p
                    className={`text-sm font-medium capitalize ${
                      insight.metrics.aiRisk === "critical" ||
                      insight.metrics.aiRisk === "high"
                        ? "text-red-600"
                        : ""
                    }`}
                  >
                    {insight.metrics.aiRisk}
                  </p>
                </div>
                <div className="text-center p-2 bg-muted/30 rounded">
                  <p className="text-xs text-muted-foreground">Discrimination</p>
                  <p className="text-sm font-medium capitalize">
                    {insight.metrics.discrimination}
                  </p>
                </div>
              </div>

              {/* Insights */}
              {insight.insights.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Insights:
                  </p>
                  {insight.insights.map((item, idx) => (
                    <p key={idx} className="text-sm flex items-start gap-2">
                      <Minus className="h-3 w-3 mt-1 shrink-0" />
                      <span>{item}</span>
                    </p>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {insight.recommendations.length > 0 && (
                <div className="space-y-1 p-3 bg-blue-50 dark:bg-blue-950 rounded">
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                    💡 Recommendations:
                  </p>
                  {insight.recommendations.map((item, idx) => (
                    <p
                      key={idx}
                      className="text-sm flex items-start gap-2 text-blue-900 dark:text-blue-100"
                    >
                      <span>•</span>
                      <span>{item}</span>
                    </p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function analyzeQuestion(q: QuestionAnalysis): QuestionInsight {
  const insights: string[] = [];
  const recommendations: string[] = [];
  let healthScore = 100;

  // Calculate difficulty based on average score
  const scorePercentage = (q.averageScore / q.maxPoints) * 100;
  let difficulty: QuestionInsight["metrics"]["difficulty"];

  if (scorePercentage >= 90) {
    difficulty = "too-easy";
    insights.push(`Very high average score (${scorePercentage.toFixed(1)}%)`);
    recommendations.push(
      "Consider adding complexity or requiring more specific details"
    );
    healthScore -= 15;
  } else if (scorePercentage >= 75) {
    difficulty = "easy";
    insights.push(`Above average scores (${scorePercentage.toFixed(1)}%)`);
  } else if (scorePercentage >= 50) {
    difficulty = "moderate";
    insights.push(`Moderate difficulty (${scorePercentage.toFixed(1)}%)`);
  } else if (scorePercentage >= 30) {
    difficulty = "hard";
    insights.push(`Below average scores (${scorePercentage.toFixed(1)}%)`);
    recommendations.push(
      "Consider providing clearer instructions or partial credit opportunities"
    );
    healthScore -= 10;
  } else {
    difficulty = "too-hard";
    insights.push(`Very low scores (${scorePercentage.toFixed(1)}%)`);
    recommendations.push(
      "Review question clarity - may be too difficult or poorly worded"
    );
    healthScore -= 20;
  }

  // AI Risk Analysis
  let aiRisk: QuestionInsight["metrics"]["aiRisk"];
  const aiPercentage = q.aiPercentage;

  if (aiPercentage >= 70) {
    aiRisk = "critical";
    insights.push(`Critical AI usage: ${aiPercentage.toFixed(0)}% of answers`);
    recommendations.push(
      "HIGH PRIORITY: Redesign to require specific knowledge or critical thinking"
    );
    recommendations.push(
      "Consider asking for real-world examples or personal analysis"
    );
    healthScore -= 40;
  } else if (aiPercentage >= 50) {
    aiRisk = "high";
    insights.push(`High AI usage: ${aiPercentage.toFixed(0)}% of answers`);
    recommendations.push("Make question more specific to course context");
    recommendations.push("Require examples from class materials or discussions");
    healthScore -= 25;
  } else if (aiPercentage >= 30) {
    aiRisk = "medium";
    insights.push(`Moderate AI usage: ${aiPercentage.toFixed(0)}% of answers`);
    recommendations.push(
      "Consider adding constraints that require course-specific knowledge"
    );
    healthScore -= 10;
  } else {
    aiRisk = "low";
    insights.push(`Low AI usage: ${aiPercentage.toFixed(0)}%`);
  }

  // Discrimination (how well it separates strong from weak students)
  // Based on combination of difficulty and AI risk
  let discrimination: QuestionInsight["metrics"]["discrimination"];

  if (
    (difficulty === "moderate" || difficulty === "hard") &&
    aiPercentage < 30
  ) {
    discrimination = "excellent";
  } else if (difficulty === "moderate" && aiPercentage < 50) {
    discrimination = "good";
  } else if (difficulty === "easy" || aiPercentage >= 50) {
    discrimination = "fair";
    healthScore -= 5;
  } else {
    discrimination = "poor";
    insights.push("Question may not effectively distinguish student ability");
    healthScore -= 15;
  }

  // Overall Status
  let status: QuestionInsight["status"];
  if (healthScore >= 80) status = "excellent";
  else if (healthScore >= 60) status = "good";
  else if (healthScore >= 40) status = "needs-attention";
  else status = "critical";

  return {
    questionNumber: q.questionNumber,
    questionText: q.questionText,
    insights,
    recommendations,
    healthScore: Math.max(0, healthScore),
    status,
    metrics: {
      difficulty,
      aiRisk,
      discrimination,
    },
  };
}
