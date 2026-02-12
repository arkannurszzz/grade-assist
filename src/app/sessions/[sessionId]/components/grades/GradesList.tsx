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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daftar Nilai Mahasiswa</CardTitle>
              <CardDescription>
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
                className="flex items-center justify-between rounded-md border px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 min-w-8">
                    {idx < 3 && (
                      <Award
                        className={`h-4 w-4 ${
                          idx === 0
                            ? "text-yellow-500"
                            : idx === 1
                              ? "text-gray-400"
                              : "text-orange-600"
                        }`}
                      />
                    )}
                    <span className="text-sm font-medium text-muted-foreground">
                      {idx + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{grade.studentName}</p>
                    <p className="text-xs text-muted-foreground">
                      {grade.fileName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Raw Score */}
                  <div className="text-right min-w-20">
                    <p className="text-sm text-muted-foreground">Raw</p>
                    <p className="text-sm font-mono">
                      {grade.totalScore?.toFixed(1)} /{" "}
                      {grade.maxScore?.toFixed(1)}
                    </p>
                  </div>

                  {/* Scale 100 */}
                  <div className="text-right min-w-16">
                    <p className="text-sm text-muted-foreground">Skala 100</p>
                    <p className="text-lg font-bold">{grade.scale100}</p>
                  </div>

                  {/* Percentage */}
                  <div className="text-right min-w-16">
                    <p className="text-sm text-muted-foreground">Persen</p>
                    <p className="text-sm font-medium">
                      {grade.percentage?.toFixed(1)}%
                    </p>
                  </div>

                  {/* Letter Grade */}
                  <div className="min-w-20 flex flex-col items-end gap-1">
                    <Badge
                      variant={
                        grade.letterGrade.color as
                          | "default"
                          | "secondary"
                          | "destructive"
                      }
                      className="text-lg font-bold px-3 py-1"
                    >
                      {grade.letterGrade.grade}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
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
