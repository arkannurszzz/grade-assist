import ExcelJS from "exceljs";
import type { ExportColumnConfig } from "@/types/export-template";
import { createDefaultTemplate } from "@/types/export-template";

interface QuestionScore {
  questionNumber: number;
  score: number;
  feedback: string;
  aiDetected: boolean;
}

interface ExportRow {
  studentName: string;
  fileName: string;
  totalScore: number | null;
  maxScore: number | null;
  percentage: number | null;
  scale100: number | null;
  letterGrade: string;
  status: string;
  aiDetectionFlags: number;
  gradedAt: string | null;
  questionScores: QuestionScore[];
}

/**
 * Generate Excel file with custom column template
 */
export async function generateXLSXWithTemplate(
  rows: ExportRow[],
  questionCount: number,
  sessionName: string,
  template?: ExportColumnConfig[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Hasil Penilaian");

  // Use provided template or create default
  const columns = template || createDefaultTemplate(questionCount);

  // Filter enabled columns and sort by order
  const enabledColumns = columns
    .filter((col) => col.enabled)
    .sort((a, b) => a.order - b.order);

  // Build headers from template
  const headers = enabledColumns.map((col) => col.label);

  // Add header row
  const headerRow = worksheet.addRow(headers);

  // Style headers
  headerRow.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 25;

  // Apply colors and borders
  enabledColumns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: col.color || "4472C4" },
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Add data rows
  rows.forEach((row, rowIdx) => {
    const rowData = enabledColumns.map((col) => {
      return getCellValue(col, row, rowIdx);
    });

    const excelRow = worksheet.addRow(rowData);

    // Add borders to all cells
    excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle" };

      // Center align specific column types
      const column = enabledColumns[colNumber - 1];
      if (
        column &&
        (column.id === "no" ||
          column.id === "letterGrade" ||
          column.id === "scale100" ||
          column.id === "percentage" ||
          column.type === "question_score" ||
          column.type === "ai_flag")
      ) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }
    });
  });

  // Auto-size columns based on content
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell!({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = Math.min(Math.max(maxLength + 2, 12), 50); // Min 12, max 50
  });

  // Freeze the header row
  worksheet.views = [{ state: "frozen", ySplit: 1 }];

  // Add a title row at the top
  worksheet.spliceRows(1, 0, [sessionName]);
  const titleRow = worksheet.getRow(1);
  titleRow.font = { bold: true, size: 16, color: { argb: "FF000000" } };
  titleRow.height = 30;
  titleRow.alignment = { vertical: "middle", horizontal: "center" };

  // Merge title cells
  worksheet.mergeCells(1, 1, 1, headers.length);
  const titleCell = titleRow.getCell(1);
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE7E6E6" },
  };
  titleCell.border = {
    top: { style: "medium" },
    left: { style: "medium" },
    bottom: { style: "medium" },
    right: { style: "medium" },
  };

  // Update freeze to account for title row
  worksheet.views = [{ state: "frozen", ySplit: 2 }];

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Get cell value based on column configuration
 */
function getCellValue(
  column: ExportColumnConfig,
  row: ExportRow,
  rowIndex: number
): string | number {
  switch (column.id) {
    case "no":
      return rowIndex + 1;

    case "studentName":
      return row.studentName;

    case "letterGrade":
      return row.letterGrade;

    case "scale100":
      return row.scale100?.toFixed(1) ?? "-";

    case "percentage":
      return row.percentage?.toFixed(1) ?? "-";

    case "totalScore":
      return row.totalScore?.toFixed(1) ?? "-";

    case "maxScore":
      return row.maxScore?.toFixed(1) ?? "-";

    case "aiDetectionCount":
      return row.aiDetectionFlags > 0 ? `${row.aiDetectionFlags} soal` : "Tidak";

    case "status":
      return row.status === "graded" ? "Selesai" : row.status;

    case "gradedAt":
      return row.gradedAt
        ? new Date(row.gradedAt).toLocaleDateString("id-ID")
        : "-";

    case "fileName":
      return row.fileName;

    default:
      // Handle question scores and AI flags
      if (column.type === "question_score" && column.questionNumber) {
        const qScore = row.questionScores.find(
          (q) => q.questionNumber === column.questionNumber
        );
        return qScore?.score.toFixed(1) ?? "-";
      }

      if (column.type === "ai_flag" && column.questionNumber) {
        const qScore = row.questionScores.find(
          (q) => q.questionNumber === column.questionNumber
        );
        return qScore?.aiDetected ? "✓" : "";
      }

      return "-";
  }
}
