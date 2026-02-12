import ExcelJS from "exceljs";

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

export async function generateXLSX(
  rows: ExportRow[],
  questionCount: number,
  sessionName: string
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Hasil Penilaian");

  // Define colors
  const colors = {
    mainHeader: "4472C4", // Blue
    questionHeader: "70AD47", // Green
    aiHeader: "FFC000", // Orange
    fileHeader: "7030A0", // Purple
  };

  // Build headers
  const mainHeaders = [
    "No",
    "Nama Mahasiswa",
    "Huruf Mutu",
    "Skala 100",
    "Persentase (%)",
    "Total Skor",
    "Skor Maksimal",
    "Deteksi AI",
    "Status",
    "Tanggal Dinilai",
  ];

  const questionHeaders: string[] = [];
  for (let i = 1; i <= questionCount; i++) {
    questionHeaders.push(`Q${i} Skor`);
  }

  const aiHeaders: string[] = [];
  for (let i = 1; i <= questionCount; i++) {
    aiHeaders.push(`Q${i} AI`);
  }

  const allHeaders = [
    ...mainHeaders,
    ...questionHeaders,
    ...aiHeaders,
    "Nama File",
  ];

  // Add header row
  const headerRow = worksheet.addRow(allHeaders);

  // Style headers
  headerRow.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 25;

  // Apply colors to different sections
  let colIndex = 1;

  // Main headers (blue)
  for (let i = 0; i < mainHeaders.length; i++) {
    const cell = headerRow.getCell(colIndex++);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: colors.mainHeader },
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  }

  // Question headers (green)
  for (let i = 0; i < questionHeaders.length; i++) {
    const cell = headerRow.getCell(colIndex++);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: colors.questionHeader },
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  }

  // AI headers (orange)
  for (let i = 0; i < aiHeaders.length; i++) {
    const cell = headerRow.getCell(colIndex++);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: colors.aiHeader },
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  }

  // File header (purple)
  const fileCell = headerRow.getCell(colIndex);
  fileCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: colors.fileHeader },
  };
  fileCell.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  // Add data rows
  rows.forEach((row, idx) => {
    // Main data
    const mainData = [
      idx + 1,
      row.studentName,
      row.letterGrade,
      row.scale100?.toFixed(1) ?? "-",
      row.percentage?.toFixed(1) ?? "-",
      row.totalScore?.toFixed(1) ?? "-",
      row.maxScore?.toFixed(1) ?? "-",
      row.aiDetectionFlags > 0 ? `${row.aiDetectionFlags} soal` : "Tidak",
      row.status === "graded" ? "Selesai" : row.status,
      row.gradedAt ? new Date(row.gradedAt).toLocaleDateString("id-ID") : "-",
    ];

    // Question scores
    const questionScores: (string | number)[] = [];
    for (let i = 1; i <= questionCount; i++) {
      const qScore = row.questionScores.find((q) => q.questionNumber === i);
      questionScores.push(qScore?.score.toFixed(1) ?? "-");
    }

    // AI detection flags
    const aiFlags: string[] = [];
    for (let i = 1; i <= questionCount; i++) {
      const qScore = row.questionScores.find((q) => q.questionNumber === i);
      aiFlags.push(qScore?.aiDetected ? "✓" : "");
    }

    const rowData = [...mainData, ...questionScores, ...aiFlags, row.fileName];
    const excelRow = worksheet.addRow(rowData);

    // Add borders to all cells
    excelRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle" };
    });

    // Center align specific columns
    excelRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" }; // No
    excelRow.getCell(3).alignment = { horizontal: "center", vertical: "middle" }; // Huruf Mutu
    excelRow.getCell(4).alignment = { horizontal: "center", vertical: "middle" }; // Skala 100
    excelRow.getCell(5).alignment = { horizontal: "center", vertical: "middle" }; // Persentase

    // Center align question scores and AI flags
    for (let i = mainHeaders.length + 1; i <= allHeaders.length - 1; i++) {
      excelRow.getCell(i).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
    }
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

  // Add a title row at the top (optional, but nice for context)
  worksheet.spliceRows(1, 0, [sessionName]);
  const titleRow = worksheet.getRow(1);
  titleRow.font = { bold: true, size: 16, color: { argb: "FF000000" } };
  titleRow.height = 30;
  titleRow.alignment = { vertical: "middle", horizontal: "center" };

  // Merge title cells
  worksheet.mergeCells(1, 1, 1, allHeaders.length);
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
