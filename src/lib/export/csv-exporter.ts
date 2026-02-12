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

export function generateCSV(
  rows: ExportRow[],
  questionCount: number
): string {
  // Main summary headers (more readable, important info first)
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

  // Question detail headers (grouped together)
  const questionHeaders: string[] = [];
  for (let i = 1; i <= questionCount; i++) {
    questionHeaders.push(`Q${i} Skor`);
  }

  const aiHeaders: string[] = [];
  for (let i = 1; i <= questionCount; i++) {
    aiHeaders.push(`Q${i} AI`);
  }

  const headers = [...mainHeaders, ...questionHeaders, ...aiHeaders, "Nama File"];

  const csvRows = rows.map((row, idx) => {
    // Main summary data
    const mainData = [
      idx + 1,
      escapeCSV(row.studentName),
      row.letterGrade,
      row.scale100?.toFixed(1) ?? "-",
      row.percentage?.toFixed(1) ?? "-",
      row.totalScore?.toFixed(1) ?? "-",
      row.maxScore?.toFixed(1) ?? "-",
      row.aiDetectionFlags > 0 ? `${row.aiDetectionFlags} soal` : "Tidak",
      row.status === "graded" ? "Selesai" : row.status,
      row.gradedAt ? new Date(row.gradedAt).toLocaleDateString("id-ID") : "-",
    ];

    // Question scores (grouped)
    const questionScores: (string | number)[] = [];
    for (let i = 1; i <= questionCount; i++) {
      const qScore = row.questionScores.find((q) => q.questionNumber === i);
      questionScores.push(qScore?.score.toFixed(1) ?? "-");
    }

    // AI detection flags (grouped)
    const aiFlags: string[] = [];
    for (let i = 1; i <= questionCount; i++) {
      const qScore = row.questionScores.find((q) => q.questionNumber === i);
      aiFlags.push(qScore?.aiDetected ? "✓" : "");
    }

    return [
      ...mainData,
      ...questionScores,
      ...aiFlags,
      escapeCSV(row.fileName),
    ].join(",");
  });

  return [headers.join(","), ...csvRows].join("\n");
}

function escapeCSV(value: string): string {
  // Prevent CSV formula injection by prefixing dangerous characters
  // Protects against Excel formula execution (e.g., =cmd|'/c calc'!A0)
  // Reference: https://owasp.org/www-community/attacks/CSV_Injection
  if (/^[=+\-@\t\r]/.test(value)) {
    value = "'" + value; // Prefix with single quote to prevent formula execution
  }

  // Escape CSV special characters (quotes, commas, newlines, carriage returns)
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}
