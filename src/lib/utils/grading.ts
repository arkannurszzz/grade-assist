import type { GradeScaleItem } from "@/types/session";

// Default grading scale (standar Indonesia)
export const DEFAULT_GRADING_SCALE: GradeScaleItem[] = [
  {
    grade: "A",
    min: 85,
    max: 100,
    color: "default",
    description: "Sangat Baik",
  },
  { grade: "B", min: 70, max: 84, color: "secondary", description: "Baik" },
  { grade: "C", min: 60, max: 69, color: "secondary", description: "Cukup" },
  { grade: "D", min: 50, max: 59, color: "destructive", description: "Kurang" },
  {
    grade: "E",
    min: 0,
    max: 49,
    color: "destructive",
    description: "Sangat Kurang",
  },
];

/**
 * Get letter grade from percentage score
 */
export function getLetterGrade(
  percentage: number,
  gradingScale: GradeScaleItem[],
): GradeScaleItem {
  const scale = gradingScale.find(
    (s) => percentage >= s.min && percentage <= s.max,
  );
  return scale || gradingScale[gradingScale.length - 1];
}

/**
 * Convert raw score to scale of 100
 */
export function convertToScale100(
  totalScore: number,
  maxScore: number,
): number {
  if (maxScore === 0) return 0;
  return Math.round((totalScore / maxScore) * 100 * 10) / 10; // 1 decimal place
}
