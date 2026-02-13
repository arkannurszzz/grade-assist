"use client";

import { AlertTriangle, Info, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface SuspectedPart {
  start: number;
  end: number;
  text: string;
  reason: string;
}

interface AIDetection {
  isAIGenerated: boolean;
  confidence: number;
  isCopyPasted: boolean;
  similarityScore: number;
  suspectedParts: SuspectedPart[] | null;
  analysis: string | null;
  penaltyApplied: number;
}

interface AIDetectionEvidenceProps {
  detection: AIDetection;
  answerText: string;
}

export function AIDetectionEvidence({
  detection,
  answerText,
}: AIDetectionEvidenceProps) {
  if (!detection.isAIGenerated) {
    return (
      <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold text-green-900 dark:text-green-100">
              Clean - No AI Detected
            </h4>
            <p className="text-sm text-green-800 dark:text-green-200 mt-1">
              Jawaban ini tidak terdeteksi menggunakan AI. Confidence score:{" "}
              {(detection.confidence * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    );
  }

  const confidencePercentage = detection.confidence * 100;
  const getRiskLevel = () => {
    if (confidencePercentage >= 85) return { label: "Very High", color: "red" };
    if (confidencePercentage >= 70) return { label: "High", color: "orange" };
    if (confidencePercentage >= 50) return { label: "Medium", color: "amber" };
    return { label: "Low", color: "yellow" };
  };

  const risk = getRiskLevel();

  return (
    <div className="space-y-4">
      {/* Alert Header */}
      <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-red-900 dark:text-red-100">
                AI-Generated Content Detected
              </h4>
              <Badge variant="destructive">
                {risk.label} Risk
              </Badge>
            </div>
            <p className="text-sm text-red-800 dark:text-red-200">
              Jawaban ini terdeteksi menggunakan AI dengan tingkat kepercayaan tinggi.
            </p>
          </div>
        </div>
      </div>

      {/* Confidence Score */}
      <div className="p-4 bg-card border rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Confidence Score</h4>
          <span className="text-2xl font-bold">
            {confidencePercentage.toFixed(1)}%
          </span>
        </div>
        <Progress value={confidencePercentage} className="h-3" />
        <p className="text-xs text-muted-foreground">
          Semakin tinggi confidence score, semakin yakin sistem bahwa ini AI-generated.
        </p>
      </div>

      {/* Penalty Applied */}
      {detection.penaltyApplied > 0 && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-900 dark:text-amber-100">
            <strong>Penalty Applied:</strong> -{detection.penaltyApplied.toFixed(1)}%
            dari skor asli
          </p>
        </div>
      )}

      {/* AI Analysis */}
      {detection.analysis && (
        <div className="p-4 bg-card border rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h4 className="text-sm font-semibold">Why AI Detected?</h4>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {detection.analysis}
          </p>
        </div>
      )}

      {/* Suspected Parts */}
      {detection.suspectedParts && detection.suspectedParts.length > 0 && (
        <div className="p-4 bg-card border rounded-lg space-y-3">
          <h4 className="text-sm font-semibold">
            Suspected AI-Generated Sections ({detection.suspectedParts.length})
          </h4>
          <div className="space-y-3">
            {detection.suspectedParts.map((part, idx) => (
              <div
                key={idx}
                className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg space-y-2"
              >
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="shrink-0">
                    Part {idx + 1}
                  </Badge>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    {part.reason}
                  </p>
                </div>
                <p className="text-sm bg-white dark:bg-slate-900 p-2 rounded border italic">
                  "{part.text}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Copy-Paste Detection */}
      {detection.isCopyPasted && (
        <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <p className="text-sm text-purple-900 dark:text-purple-100">
            <strong>⚠️ Copy-Paste Detected:</strong> Similarity score{" "}
            {(detection.similarityScore * 100).toFixed(1)}%
          </p>
        </div>
      )}

      {/* Full Answer for Context */}
      <details className="p-4 bg-card border rounded-lg">
        <summary className="text-sm font-semibold cursor-pointer">
          View Full Answer
        </summary>
        <div className="mt-3 p-3 bg-muted rounded text-sm">
          {answerText}
        </div>
      </details>
    </div>
  );
}
