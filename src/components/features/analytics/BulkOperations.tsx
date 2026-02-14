"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

interface BulkOperationsProps {
  sessionId: string;
  totalSubmissions: number;
  aiDetectedCount: number;
  onSuccess?: () => void;
}

export function BulkOperations({
  sessionId,
  totalSubmissions,
  aiDetectedCount,
  onSuccess,
}: BulkOperationsProps) {
  const [loading, setLoading] = useState(false);
  const [onlyAIDetected, setOnlyAIDetected] = useState(true);
  const [result, setResult] = useState<{
    success: boolean;
    totalRegraded: number;
    results: {
      submissionId: string;
      studentName: string;
      regradedCount: number;
      success: boolean;
      error?: string;
    }[];
  } | null>(null);

  const handleBulkRegrade = async () => {
    if (
      !confirm(
        `Are you sure you want to regrade ${
          onlyAIDetected
            ? `${aiDetectedCount} AI-detected submissions`
            : `all ${totalSubmissions} submissions`
        }? This will recalculate all scores.`
      )
    ) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        `/api/sessions/${sessionId}/bulk-regrade`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            onlyAIDetected,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        alert(`Error: ${data.error || "Failed to regrade"}`);
      }
    } catch (error) {
      console.error("Bulk regrade error:", error);
      alert("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
          Bulk Operations
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Regrade multiple submissions at once with updated AI detection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Options */}
        <div className="space-y-3 p-3 sm:p-4 border rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 sm:space-x-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="only-ai"
                checked={onlyAIDetected}
                onCheckedChange={(checked) => setOnlyAIDetected(!!checked)}
                disabled={loading}
              />
              <Label htmlFor="only-ai" className="cursor-pointer text-xs sm:text-sm">
                Only regrade AI-detected submissions
              </Label>
            </div>
            <Badge variant="secondary" className="text-xs w-fit">{aiDetectedCount} submissions</Badge>
          </div>

          <div className="text-xs sm:text-sm text-muted-foreground">
            {onlyAIDetected ? (
              <>
                Will regrade <strong>{aiDetectedCount}</strong> submissions
                with AI-detected answers
              </>
            ) : (
              <>
                Will regrade <strong>all {totalSubmissions}</strong> submissions
              </>
            )}
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleBulkRegrade}
          disabled={loading || (onlyAIDetected && aiDetectedCount === 0)}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              <span className="text-xs sm:text-sm">Regrading...</span>
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Start Bulk Regrade</span>
            </>
          )}
        </Button>

        {/* Results */}
        {result && (
          <Alert
            variant={result.success ? "default" : "destructive"}
            className="mt-4"
          >
            {result.success ? (
              <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
            ) : (
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold text-xs sm:text-sm">
                  Bulk regrade completed: {result.totalRegraded} answers
                  updated
                </p>
                <div className="space-y-1 text-[10px] sm:text-xs">
                  {result.results.map((r) => (
                    <div
                      key={r.submissionId}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="truncate">
                        {r.studentName}: {r.regradedCount} answers
                      </span>
                      {r.success ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-destructive shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Warning */}
        <Alert>
          <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
          <AlertDescription className="text-[10px] sm:text-xs">
            <strong>Warning:</strong> Bulk regrading will recalculate all
            scores using the latest AI grading model. AI-detected answers will
            automatically receive a 30% penalty. This operation cannot be
            undone.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
