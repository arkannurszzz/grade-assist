import { useState, useMemo, memo } from "react";
import Link from "next/link";
import { Download, Award } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { GradeScaleItem } from "@/types/session";
import {
  StudentSearchFilter,
  type StudentFilterOptions,
} from "@/components/shared/StudentSearchFilter";

interface GradeWithDetails {
  id: string;
  studentName: string;
  fileName: string;
  totalScore: number | null;
  maxScore: number | null;
  percentage: number | null;
  scale100: number;
  letterGrade: GradeScaleItem;
  status: string;
  answers?: Array<{ aiDetection?: { isAIGenerated: boolean } }>;
}

interface GradesListProps {
  sessionId: string;
  grades: GradeWithDetails[];
  gradingScale: GradeScaleItem[];
}

export const GradesList = memo(function GradesList({
  sessionId,
  grades,
  gradingScale,
}: GradesListProps) {
  const [filters, setFilters] = useState<StudentFilterOptions>({
    search: "",
    grades: [],
    statuses: [],
    aiDetected: null,
  });

  // Debounce search for better performance
  const debouncedSearch = useDebounce(filters.search, 300);

  // Apply filters with memoization
  const filteredGrades = useMemo(() => {
    return grades.filter((grade) => {
    // Search filter - using debounced value
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      const nameMatch = grade.studentName.toLowerCase().includes(searchLower);
      const fileMatch = grade.fileName.toLowerCase().includes(searchLower);
      if (!nameMatch && !fileMatch) return false;
    }

    // Grade filter
    if (filters.grades.length > 0) {
      if (!filters.grades.includes(grade.letterGrade.grade)) return false;
    }

    // Status filter
    if (filters.statuses.length > 0) {
      if (!filters.statuses.includes(grade.status)) return false;
    }

    // AI Detection filter
    if (filters.aiDetected !== null && grade.answers) {
      const hasAI = grade.answers.some((a) => a.aiDetection?.isAIGenerated);
      if (filters.aiDetected && !hasAI) return false;
      if (!filters.aiDetected && hasAI) return false;
    }

    return true;
    });
  }, [grades, debouncedSearch, filters.grades, filters.statuses, filters.aiDetected]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>Daftar Nilai Mahasiswa</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Nilai dalam skala 100 dengan huruf mutu
                {filteredGrades.length !== grades.length && (
                  <span className="ml-2 text-primary font-medium">
                    ({filteredGrades.length} dari {grades.length})
                  </span>
                )}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => {
                window.open(
                  `/api/sessions/${sessionId}/export-xlsx`,
                  "_blank",
                );
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
          </div>
          <StudentSearchFilter
            filters={filters}
            onFiltersChange={setFilters}
            availableGrades={gradingScale.map((s) => s.grade)}
            showStatusFilter={false}
            showAIFilter={true}
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredGrades.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Tidak ada mahasiswa yang sesuai dengan filter.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredGrades.map((grade, idx) => (
              <Link
                key={grade.id}
                href={`/sessions/${sessionId}/students/${grade.id}`}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-md border px-3 sm:px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="flex items-center gap-2 shrink-0">
                    {idx < 3 && (
                      <Award
                        className={`h-3 w-3 sm:h-4 sm:w-4 ${
                          idx === 0
                            ? "text-yellow-500"
                            : idx === 1
                              ? "text-gray-400"
                              : "text-orange-600"
                        }`}
                      />
                    )}
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">{grade.studentName}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {grade.fileName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4 justify-between sm:justify-end">
                  {/* Raw Score - Hidden on mobile */}
                  <div className="hidden md:block text-right min-w-20">
                    <p className="text-xs text-muted-foreground">Raw</p>
                    <p className="text-xs font-mono">
                      {grade.totalScore?.toFixed(1)} / {grade.maxScore?.toFixed(1)}
                    </p>
                  </div>

                  {/* Scale 100 */}
                  <div className="text-right">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Skala 100</p>
                    <p className="text-base sm:text-lg font-bold">{grade.scale100}</p>
                  </div>

                  {/* Percentage */}
                  <div className="text-right">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Persen</p>
                    <p className="text-xs sm:text-sm font-medium">
                      {grade.percentage?.toFixed(1)}%
                    </p>
                  </div>

                  {/* Letter Grade */}
                  <div className="flex flex-col items-end gap-0.5 sm:gap-1 shrink-0">
                    <Badge
                      variant={
                        grade.letterGrade.color as
                          | "default"
                          | "secondary"
                          | "destructive"
                      }
                      className="text-sm sm:text-lg font-bold px-2 sm:px-3 py-0.5 sm:py-1"
                    >
                      {grade.letterGrade.grade}
                    </Badge>
                    <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                      {grade.letterGrade.description}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
