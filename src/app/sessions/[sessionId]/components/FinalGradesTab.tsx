import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Session } from "@/types/session";
import {
  DEFAULT_GRADING_SCALE,
  getLetterGrade,
  convertToScale100,
} from "@/lib/utils/grading";

// Split components
import { GradeStatistics } from "./grades/GradeStatistics";
import { GradesList } from "./grades/GradesList";
import { GradingScaleReference } from "./grades/GradingScaleReference";

interface FinalGradesTabProps {
  session: Session;
  sessionId: string;
  onRefresh: () => void;
}

export function FinalGradesTab({
  session,
  sessionId,
  onRefresh,
}: FinalGradesTabProps) {
  // Get grading scale from settings or use default
  const gradingScale =
    session.settings?.gradingScale || DEFAULT_GRADING_SCALE;

  // Calculate grades with letter grades
  const gradesWithDetails = useMemo(() => {
    const gradedSubmissions = session.submissions.filter(
      (s) => s.status === "graded",
    );

    const grades = gradedSubmissions.map((s) => {
      const scale100 = convertToScale100(s.totalScore || 0, s.maxScore || 100);
      const letterGrade = getLetterGrade(s.percentage || 0, gradingScale);

      return {
        ...s,
        scale100,
        letterGrade,
      };
    });

    // Sort by percentage descending
    return grades.sort((a, b) => (b.percentage || 0) - (a.percentage || 0));
  }, [session.submissions, gradingScale]);

  // Calculate average percentage
  const avgPercentage = useMemo(() => {
    if (gradesWithDetails.length === 0) return 0;
    return (
      gradesWithDetails.reduce((sum, g) => sum + (g.percentage || 0), 0) /
      gradesWithDetails.length
    );
  }, [gradesWithDetails]);

  // Show message if not completed
  if (session.status !== "completed") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nilai Akhir & Huruf Mutu</CardTitle>
          <CardDescription>
            Konversi nilai ke skala 100 dan huruf mutu akan tersedia setelah
            grading selesai
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Silakan selesaikan proses penilaian terlebih dahulu di tab
            &quot;Penilaian & Hasil&quot;
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics Card */}
      <GradeStatistics
        grades={gradesWithDetails}
        avgPercentage={avgPercentage}
        gradingScale={gradingScale}
      />

      {/* Grades Table with Search/Filter */}
      <GradesList
        sessionId={sessionId}
        grades={gradesWithDetails}
        gradingScale={gradingScale}
      />

      {/* Grading Scale Reference */}
      <GradingScaleReference
        sessionId={sessionId}
        gradingScale={gradingScale}
        onUpdate={onRefresh}
      />
    </div>
  );
}
