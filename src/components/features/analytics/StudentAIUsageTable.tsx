"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    if (percentage >= 50)
      return <Badge variant="destructive">High Risk</Badge>;
    if (percentage >= 25)
      return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Medium
        </Badge>
      );
    if (percentage > 0)
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
          Low
        </Badge>
      );
    return <Badge variant="outline">Clean</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Per-Student AI Usage</CardTitle>
        <CardDescription>
          Mahasiswa dengan penggunaan AI tertinggi ke terendah
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Nama Mahasiswa</TableHead>
                <TableHead className="text-center">AI Detected</TableHead>
                <TableHead className="text-center">AI %</TableHead>
                <TableHead className="text-center">Risk Level</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(0, 10).map((student, idx) => (
                <TableRow key={student.studentId}>
                  <TableCell className="font-medium">{idx + 1}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{student.studentName}</p>
                      <p className="text-xs text-muted-foreground">
                        {student.aiDetectedAnswers}/{student.totalAnswers}{" "}
                        answers
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {student.aiDetectedAnswers}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold">
                      {student.aiPercentage.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {getRiskBadge(student.aiPercentage)}
                  </TableCell>
                  <TableCell className="text-center">
                    {student.percentage !== null
                      ? `${student.percentage.toFixed(1)}%`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Link href={`/sessions/${sessionId}/students/${student.studentId}`}>
                      <Button variant="outline" size="sm">
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
            <p>Tidak ada data mahasiswa</p>
          </div>
        )}

        {data.length > 10 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Menampilkan 10 dari {data.length} mahasiswa
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
