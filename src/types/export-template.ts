export type ExportColumnType = "main" | "question_score" | "ai_flag" | "computed";

export interface ExportColumnConfig {
  id: string; // Unique identifier for this column
  enabled: boolean;
  order: number;
  label: string; // Display name in Excel header
  type: ExportColumnType;
  questionNumber?: number; // For question-specific columns
  color?: string; // Header background color
}

export interface ExportTemplate {
  id?: string;
  sessionId?: string | null;
  name: string;
  isDefault?: boolean;
  columns: ExportColumnConfig[];
  createdAt?: Date;
}

// Available column definitions
export const AVAILABLE_COLUMNS = {
  // Main columns
  no: {
    id: "no",
    label: "No",
    type: "main" as const,
    color: "4472C4", // Blue
  },
  studentName: {
    id: "studentName",
    label: "Nama Mahasiswa",
    type: "main" as const,
    color: "4472C4",
  },
  letterGrade: {
    id: "letterGrade",
    label: "Huruf Mutu",
    type: "main" as const,
    color: "4472C4",
  },
  scale100: {
    id: "scale100",
    label: "Skala 100",
    type: "main" as const,
    color: "4472C4",
  },
  percentage: {
    id: "percentage",
    label: "Persentase (%)",
    type: "main" as const,
    color: "4472C4",
  },
  totalScore: {
    id: "totalScore",
    label: "Total Skor",
    type: "main" as const,
    color: "4472C4",
  },
  maxScore: {
    id: "maxScore",
    label: "Skor Maksimal",
    type: "main" as const,
    color: "4472C4",
  },
  aiDetectionCount: {
    id: "aiDetectionCount",
    label: "Deteksi AI",
    type: "main" as const,
    color: "4472C4",
  },
  status: {
    id: "status",
    label: "Status",
    type: "main" as const,
    color: "4472C4",
  },
  gradedAt: {
    id: "gradedAt",
    label: "Tanggal Dinilai",
    type: "main" as const,
    color: "4472C4",
  },
  fileName: {
    id: "fileName",
    label: "Nama File",
    type: "main" as const,
    color: "7030A0", // Purple
  },
};

// Preset templates
export const PRESET_TEMPLATES = {
  ALL: {
    name: "Semua Kolom",
    description: "Export semua kolom yang tersedia",
  },
  ESSENTIAL: {
    name: "Kolom Penting",
    description: "Hanya kolom penting (Nama, Nilai, Total Skor)",
  },
  MINIMAL: {
    name: "Minimal",
    description: "Nama dan Huruf Mutu saja",
  },
  DETAILED: {
    name: "Detail Lengkap",
    description: "Semua kolom termasuk skor per soal dan AI detection",
  },
};

// Helper to create default template
export function createDefaultTemplate(questionCount: number): ExportColumnConfig[] {
  const columns: ExportColumnConfig[] = [];
  let order = 0;

  // Main columns
  columns.push({ ...AVAILABLE_COLUMNS.no, enabled: true, order: order++ });
  columns.push({ ...AVAILABLE_COLUMNS.studentName, enabled: true, order: order++ });
  columns.push({ ...AVAILABLE_COLUMNS.letterGrade, enabled: true, order: order++ });
  columns.push({ ...AVAILABLE_COLUMNS.scale100, enabled: true, order: order++ });
  columns.push({ ...AVAILABLE_COLUMNS.percentage, enabled: true, order: order++ });
  columns.push({ ...AVAILABLE_COLUMNS.totalScore, enabled: true, order: order++ });
  columns.push({ ...AVAILABLE_COLUMNS.maxScore, enabled: true, order: order++ });
  columns.push({ ...AVAILABLE_COLUMNS.aiDetectionCount, enabled: true, order: order++ });
  columns.push({ ...AVAILABLE_COLUMNS.status, enabled: true, order: order++ });
  columns.push({ ...AVAILABLE_COLUMNS.gradedAt, enabled: true, order: order++ });

  // Question scores
  for (let i = 1; i <= questionCount; i++) {
    columns.push({
      id: `q${i}_score`,
      label: `Q${i} Skor`,
      type: "question_score",
      enabled: true,
      order: order++,
      questionNumber: i,
      color: "70AD47", // Green
    });
  }

  // AI flags
  for (let i = 1; i <= questionCount; i++) {
    columns.push({
      id: `q${i}_ai`,
      label: `Q${i} AI`,
      type: "ai_flag",
      enabled: true,
      order: order++,
      questionNumber: i,
      color: "FFC000", // Orange
    });
  }

  columns.push({ ...AVAILABLE_COLUMNS.fileName, enabled: true, order: order++ });

  return columns;
}

// Helper to create essential template
export function createEssentialTemplate(questionCount: number): ExportColumnConfig[] {
  const columns: ExportColumnConfig[] = [];
  let order = 0;

  columns.push({ ...AVAILABLE_COLUMNS.no, enabled: true, order: order++ });
  columns.push({ ...AVAILABLE_COLUMNS.studentName, enabled: true, order: order++ });
  columns.push({ ...AVAILABLE_COLUMNS.letterGrade, enabled: true, order: order++ });
  columns.push({ ...AVAILABLE_COLUMNS.percentage, enabled: true, order: order++ });
  columns.push({ ...AVAILABLE_COLUMNS.totalScore, enabled: true, order: order++ });

  // Add question scores (but no AI flags)
  for (let i = 1; i <= questionCount; i++) {
    columns.push({
      id: `q${i}_score`,
      label: `Q${i} Skor`,
      type: "question_score",
      enabled: true,
      order: order++,
      questionNumber: i,
      color: "70AD47",
    });
  }

  return columns;
}

// Helper to create minimal template
export function createMinimalTemplate(): ExportColumnConfig[] {
  return [
    { ...AVAILABLE_COLUMNS.no, enabled: true, order: 0 },
    { ...AVAILABLE_COLUMNS.studentName, enabled: true, order: 1 },
    { ...AVAILABLE_COLUMNS.letterGrade, enabled: true, order: 2 },
  ];
}
