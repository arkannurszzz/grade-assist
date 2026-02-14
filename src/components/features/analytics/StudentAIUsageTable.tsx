"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StudentAnalysis } from "@/types/analytics";

interface StudentAIUsageTableProps {
  data: StudentAnalysis[];
  sessionId: string;
}

export function StudentAIUsageTable({
  data,
  sessionId,
}: StudentAIUsageTableProps) {
  const getRiskBadge = (percentage: number) => {
    if (percentage >= 50) return <Badge variant="destructive">High Risk</Badge>;
    if (percentage >= 25)
      return (
        <Badge
          variant="secondary"
          className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
        >
          Medium
        </Badge>
      );
    if (percentage > 0)
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
        >
          Low
        </Badge>
      );
    return <Badge variant="outline">Clean</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">
          Per-Student AI Usage
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Mahasiswa dengan penggunaan AI tertinggi ke terendah
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8 sm:w-12 text-xs sm:text-sm">
                  #
                </TableHead>
                <TableHead className="text-xs sm:text-sm">
                  Nama Mahasiswa
                </TableHead>
                <TableHead className="text-center text-xs sm:text-sm">
                  AI Detected
                </TableHead>
                <TableHead className="text-center text-xs sm:text-sm">
                  AI %
                </TableHead>
                <TableHead className="text-center text-xs sm:text-sm">
                  Risk Level
                </TableHead>
                <TableHead className="text-center text-xs sm:text-sm">
                  Score
                </TableHead>
                <TableHead className="text-center text-xs sm:text-sm">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(0, 10).map((student, idx) => (
                <TableRow key={student.studentId}>
                  <TableCell className="font-medium text-xs sm:text-sm">
                    {idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate max-w-37.5 sm:max-w-none">
                        {student.studentName}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {student.aiDetectedAnswers}/{student.totalAnswers}{" "}
                        answers
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-xs sm:text-sm">
                    {student.aiDetectedAnswers}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-xs sm:text-sm">
                      {student.aiPercentage.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      {getRiskBadge(student.aiPercentage)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-xs sm:text-sm">
                    {student.percentage !== null
                      ? `${student.percentage.toFixed(1)}%`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Link
                      href={`/sessions/${sessionId}/students/${student.studentId}`}
                    >
                      <Button variant="outline" size="sm" className="text-xs">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {data.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-xs sm:text-sm">Tidak ada data mahasiswa</p>
          </div>
        )}

        {data.length > 10 && (
          <div className="mt-4 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Menampilkan 10 dari {data.length} mahasiswa
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
