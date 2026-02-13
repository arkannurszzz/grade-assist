"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ExportColumnConfig } from "@/types/export-template";

interface SampleData {
  studentName: string;
  letterGrade: string;
  scale100: number;
  percentage: number;
  totalScore: number;
  maxScore: number;
  aiDetectionCount: number;
  status: string;
  gradedAt: string;
  fileName: string;
  questionScores: Array<{
    questionNumber: number;
    score: number;
    aiDetected: boolean;
  }>;
}

interface ExportPreviewTableProps {
  columns: ExportColumnConfig[];
  sampleData?: SampleData[];
}

// Default sample data if none provided
const DEFAULT_SAMPLE_DATA: SampleData[] = [
  {
    studentName: "Ahmad Rizki",
    letterGrade: "A",
    scale100: 92.5,
    percentage: 92.5,
    totalScore: 37,
    maxScore: 40,
    aiDetectionCount: 0,
    status: "graded",
    gradedAt: "2024-02-15",
    fileName: "ahmad_rizki.pdf",
    questionScores: [
      { questionNumber: 1, score: 0.9, aiDetected: false },
      { questionNumber: 2, score: 0.95, aiDetected: false },
      { questionNumber: 3, score: 0.85, aiDetected: false },
    ],
  },
  {
    studentName: "Siti Nurhaliza",
    letterGrade: "B",
    scale100: 78.0,
    percentage: 78.0,
    totalScore: 31.2,
    maxScore: 40,
    aiDetectionCount: 1,
    status: "graded",
    gradedAt: "2024-02-15",
    fileName: "siti_nurhaliza.pdf",
    questionScores: [
      { questionNumber: 1, score: 0.75, aiDetected: false },
      { questionNumber: 2, score: 0.8, aiDetected: true },
      { questionNumber: 3, score: 0.8, aiDetected: false },
    ],
  },
  {
    studentName: "Budi Santoso",
    letterGrade: "C",
    scale100: 65.5,
    percentage: 65.5,
    totalScore: 26.2,
    maxScore: 40,
    aiDetectionCount: 0,
    status: "graded",
    gradedAt: "2024-02-15",
    fileName: "budi_santoso.pdf",
    questionScores: [
      { questionNumber: 1, score: 0.6, aiDetected: false },
      { questionNumber: 2, score: 0.7, aiDetected: false },
      { questionNumber: 3, score: 0.65, aiDetected: false },
    ],
  },
];

export function ExportPreviewTable({
  columns,
  sampleData = DEFAULT_SAMPLE_DATA,
}: ExportPreviewTableProps) {
  // Filter enabled columns and sort by order
  const enabledColumns = columns
    .filter((col) => col.enabled)
    .sort((a, b) => a.order - b.order);

  if (enabledColumns.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border rounded-lg">
        <p>Pilih minimal satu kolom untuk melihat preview</p>
      </div>
    );
  }

  // Get cell value for a column
  const getCellValue = (
    column: ExportColumnConfig,
    row: SampleData,
    rowIndex: number
  ): string | number => {
    switch (column.id) {
      case "no":
        return rowIndex + 1;
      case "studentName":
        return row.studentName;
      case "letterGrade":
        return row.letterGrade;
      case "scale100":
        return row.scale100.toFixed(1);
      case "percentage":
        return `${row.percentage.toFixed(1)}%`;
      case "totalScore":
        return row.totalScore.toFixed(1);
      case "maxScore":
        return row.maxScore.toFixed(1);
      case "aiDetectionCount":
        return row.aiDetectionCount > 0 ? `${row.aiDetectionCount} soal` : "Tidak";
      case "status":
        return row.status === "graded" ? "Selesai" : row.status;
      case "gradedAt":
        return row.gradedAt;
      case "fileName":
        return row.fileName;
      default:
        // Handle question scores and AI flags
        if (column.type === "question_score" && column.questionNumber) {
          const qScore = row.questionScores.find(
            (q) => q.questionNumber === column.questionNumber
          );
          return qScore ? qScore.score.toFixed(1) : "-";
        }
        if (column.type === "ai_flag" && column.questionNumber) {
          const qScore = row.questionScores.find(
            (q) => q.questionNumber === column.questionNumber
          );
          return qScore?.aiDetected ? "✓" : "";
        }
        return "-";
    }
  };

  // Get header background color
  const getHeaderColor = (color?: string) => {
    if (!color) return "bg-primary";

    const colorMap: Record<string, string> = {
      "4472C4": "bg-[#4472C4]", // Blue
      "70AD47": "bg-[#70AD47]", // Green
      "FFC000": "bg-[#FFC000]", // Orange
      "7030A0": "bg-[#7030A0]", // Purple
    };

    return colorMap[color] || "bg-primary";
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {enabledColumns.length}
          </Badge>
          <p className="text-xs text-muted-foreground">
            kolom akan di-export
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          3 baris sample
        </Badge>
      </div>

      <div className="border rounded-lg overflow-hidden shadow-sm bg-background">
        <div className="overflow-x-auto overflow-y-auto max-h-100 scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {enabledColumns.map((column) => (
                  <TableHead
                    key={column.id}
                    className={`text-white font-bold text-center whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 ${getHeaderColor(
                      column.color
                    )}`}
                  >
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleData.slice(0, 3).map((row, rowIdx) => (
                <TableRow key={rowIdx} className="hover:bg-muted/50 transition-colors">
                  {enabledColumns.map((column) => (
                    <TableCell
                      key={column.id}
                      className={`text-center whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 py-2 ${
                        column.type === "question_score" || column.type === "ai_flag"
                          ? "font-mono font-medium"
                          : ""
                      }`}
                    >
                      {getCellValue(column, row, rowIdx)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs">
        <div className="flex items-start gap-2">
          <svg className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-blue-900 dark:text-blue-100 leading-relaxed">
            Preview menampilkan 3 baris sample. File Excel yang di-export akan berisi <strong>semua data mahasiswa</strong> dengan format yang sama.
          </p>
        </div>
      </div>
    </div>
  );
}
