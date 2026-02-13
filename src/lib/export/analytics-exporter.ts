import ExcelJS from "exceljs";
import type {
  AnalyticsOverview,
  QuestionAnalysis,
  ConfidenceDistribution,
  StudentAnalysis,
} from "@/types/analytics";

interface SimilarityGroup {
  questionNumber: number;
  questionText: string;
  similarityScore: number;
  studentCount: number;
  students: { studentName: string; isAIGenerated: boolean }[];
}

interface AnalyticsExportData {
  sessionName: string;
  overview: AnalyticsOverview;
  questionAnalysis: QuestionAnalysis[];
  confidenceDistribution: ConfidenceDistribution;
  studentAnalysis: StudentAnalysis[];
  similarityGroups: SimilarityGroup[];
}

export async function generateAnalyticsReport(
  data: AnalyticsExportData
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  // Sheet 1: Overview Summary
  createOverviewSheet(workbook, data.sessionName, data.overview);

  // Sheet 2: Question Analysis
  createQuestionAnalysisSheet(workbook, data.questionAnalysis);

  // Sheet 3: Student AI Usage
  createStudentAnalysisSheet(workbook, data.studentAnalysis);

  // Sheet 4: Confidence Distribution
  createConfidenceDistributionSheet(workbook, data.confidenceDistribution);

  // Sheet 5: Similarity Groups (if any)
  if (data.similarityGroups.length > 0) {
    createSimilarityGroupsSheet(workbook, data.similarityGroups);
  }

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function createOverviewSheet(
  workbook: ExcelJS.Workbook,
  sessionName: string,
  overview: AnalyticsOverview
) {
  const sheet = workbook.addWorksheet("Overview");

  // Title
  sheet.mergeCells("A1:B1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = `AI Detection Report - ${sessionName}`;
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };
  titleCell.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).height = 35;

  // Generated date
  sheet.mergeCells("A2:B2");
  const dateCell = sheet.getCell("A2");
  dateCell.value = `Generated: ${new Date().toLocaleString("id-ID")}`;
  dateCell.font = { italic: true, size: 10 };
  dateCell.alignment = { horizontal: "center" };
  sheet.getRow(2).height = 20;

  // Empty row
  sheet.getRow(3).height = 10;

  // Statistics
  const stats = [
    ["Total Submissions", overview.totalSubmissions],
    ["AI Detected Answers", overview.aiDetectedAnswers],
    ["AI Usage Rate", `${overview.aiUsagePercentage.toFixed(1)}%`],
    ["Students with AI", overview.studentsWithAI],
    ["Average Confidence", `${(overview.averageConfidence * 100).toFixed(1)}%`],
  ];

  let currentRow = 4;
  stats.forEach(([label, value]) => {
    const row = sheet.getRow(currentRow);
    row.getCell(1).value = label;
    row.getCell(2).value = value;

    // Style
    row.getCell(1).font = { bold: true };
    row.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE7E6E6" },
    };
    row.getCell(2).alignment = { horizontal: "right" };
    row.height = 25;

    // Borders
    [1, 2].forEach((col) => {
      row.getCell(col).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    currentRow++;
  });

  // Column widths
  sheet.getColumn(1).width = 25;
  sheet.getColumn(2).width = 20;
}

function createQuestionAnalysisSheet(
  workbook: ExcelJS.Workbook,
  questions: QuestionAnalysis[]
) {
  const sheet = workbook.addWorksheet("Question Analysis");

  // Headers
  const headers = [
    "Question #",
    "Question Text",
    "Total Answers",
    "AI Detected",
    "AI %",
    "Avg Confidence",
    "Risk Level",
  ];

  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height = 25;

  // Add borders to headers
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Data rows
  questions.forEach((q) => {
    const aiPercentage = q.aiPercentage;
    const riskLevel =
      aiPercentage >= 50 ? "High" : aiPercentage >= 30 ? "Medium" : "Low";

    const row = sheet.addRow([
      q.questionNumber,
      q.questionText.length > 100
        ? q.questionText.substring(0, 100) + "..."
        : q.questionText,
      q.totalAnswers,
      q.aiDetected,
      `${aiPercentage.toFixed(1)}%`,
      "-", // Average confidence not available in QuestionAnalysis
      riskLevel,
    ]);

    // Color code by risk level
    const riskCell = row.getCell(7);
    if (riskLevel === "High") {
      riskCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF6B6B" },
      };
      riskCell.font = { color: { argb: "FFFFFFFF" }, bold: true };
    } else if (riskLevel === "Medium") {
      riskCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFA94D" },
      };
    } else {
      riskCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF51CF66" },
      };
    }

    // Borders and alignment
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle" };
    });

    // Center align numeric columns
    [1, 3, 4, 5, 6, 7].forEach((col) => {
      row.getCell(col).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
    });
  });

  // Column widths
  sheet.getColumn(1).width = 12;
  sheet.getColumn(2).width = 50;
  sheet.getColumn(3).width = 15;
  sheet.getColumn(4).width = 15;
  sheet.getColumn(5).width = 12;
  sheet.getColumn(6).width = 15;
  sheet.getColumn(7).width = 12;

  // Freeze header
  sheet.views = [{ state: "frozen", ySplit: 1 }];
}

function createStudentAnalysisSheet(
  workbook: ExcelJS.Workbook,
  students: StudentAnalysis[]
) {
  const sheet = workbook.addWorksheet("Student AI Usage");

  // Headers
  const headers = [
    "Rank",
    "Student Name",
    "Total Answers",
    "AI Detected",
    "AI %",
    "Avg Confidence",
    "Risk Level",
  ];

  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height = 25;

  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Data rows (sorted by AI percentage)
  const sortedStudents = [...students].sort(
    (a, b) => b.aiPercentage - a.aiPercentage
  );

  sortedStudents.forEach((student, idx) => {
    const riskLevel =
      student.aiPercentage >= 50
        ? "High"
        : student.aiPercentage >= 30
        ? "Medium"
        : "Low";

    const row = sheet.addRow([
      idx + 1,
      student.studentName,
      student.totalAnswers,
      student.aiDetectedAnswers,
      `${student.aiPercentage.toFixed(1)}%`,
      "-", // Average confidence not available in StudentAnalysis
      riskLevel,
    ]);

    // Color code by risk level
    const riskCell = row.getCell(7);
    if (riskLevel === "High") {
      riskCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF6B6B" },
      };
      riskCell.font = { color: { argb: "FFFFFFFF" }, bold: true };
    } else if (riskLevel === "Medium") {
      riskCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFA94D" },
      };
    }

    // Borders and alignment
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle" };
    });

    // Center align numeric columns
    [1, 3, 4, 5, 6, 7].forEach((col) => {
      row.getCell(col).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
    });
  });

  // Column widths
  sheet.getColumn(1).width = 8;
  sheet.getColumn(2).width = 30;
  sheet.getColumn(3).width = 15;
  sheet.getColumn(4).width = 15;
  sheet.getColumn(5).width = 12;
  sheet.getColumn(6).width = 15;
  sheet.getColumn(7).width = 12;

  sheet.views = [{ state: "frozen", ySplit: 1 }];
}

function createConfidenceDistributionSheet(
  workbook: ExcelJS.Workbook,
  distribution: ConfidenceDistribution
) {
  const sheet = workbook.addWorksheet("Confidence Distribution");

  // Headers
  const headers = ["Confidence Range", "Count", "Percentage"];

  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height = 25;

  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Data
  const ranges = [
    ["0-50%", distribution.low],
    ["50-70%", distribution.mediumLow],
    ["70-85%", distribution.medium],
    ["85-95%", distribution.mediumHigh],
    ["95-100%", distribution.high],
  ];

  const total = ranges.reduce((sum, [, count]) => sum + (count as number), 0);

  ranges.forEach(([range, count]) => {
    const percentage = total > 0 ? ((count as number) / total) * 100 : 0;
    const row = sheet.addRow([range, count, `${percentage.toFixed(1)}%`]);

    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle" };
    });

    [2, 3].forEach((col) => {
      row.getCell(col).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
    });
  });

  sheet.getColumn(1).width = 20;
  sheet.getColumn(2).width = 15;
  sheet.getColumn(3).width = 15;

  sheet.views = [{ state: "frozen", ySplit: 1 }];
}

function createSimilarityGroupsSheet(
  workbook: ExcelJS.Workbook,
  groups: SimilarityGroup[]
) {
  const sheet = workbook.addWorksheet("Similarity Groups");

  // Headers
  const headers = [
    "Question #",
    "Question Text",
    "Similarity %",
    "Student Count",
    "Students",
    "AI Detected",
  ];

  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFF6B6B" },
  };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height = 25;

  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Data rows
  groups.forEach((group) => {
    const studentNames = group.students.map((s) => s.studentName).join(", ");
    const hasAI = group.students.some((s) => s.isAIGenerated);

    const row = sheet.addRow([
      group.questionNumber,
      group.questionText.length > 80
        ? group.questionText.substring(0, 80) + "..."
        : group.questionText,
      `${(group.similarityScore * 100).toFixed(0)}%`,
      group.studentCount,
      studentNames,
      hasAI ? "Yes" : "No",
    ]);

    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle" };
    });

    [1, 3, 4, 6].forEach((col) => {
      row.getCell(col).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
    });

    // Highlight high similarity
    if (group.similarityScore >= 0.9) {
      row.getCell(3).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF6B6B" },
      };
      row.getCell(3).font = { color: { argb: "FFFFFFFF" }, bold: true };
    }
  });

  sheet.getColumn(1).width = 12;
  sheet.getColumn(2).width = 45;
  sheet.getColumn(3).width = 15;
  sheet.getColumn(4).width = 15;
  sheet.getColumn(5).width = 40;
  sheet.getColumn(6).width = 12;

  sheet.views = [{ state: "frozen", ySplit: 1 }];
}
