import { parseDocx } from "./docx-parser";
import { parsePdf } from "./pdf-parser";

export async function parseDocument(
  buffer: Buffer,
  fileType: string
): Promise<string> {
  switch (fileType) {
    case "docx":
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return parseDocx(buffer);
    case "pdf":
    case "application/pdf":
      return parsePdf(buffer);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

export function getFileType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "pdf";
    case "docx":
      return "docx";
    default:
      throw new Error(`Unsupported file extension: ${ext}`);
  }
}

export function extractStudentName(fileName: string): string {
  // Remove file extension
  const nameWithoutExt = fileName.replace(/\.(pdf|docx)$/i, "");

  // Remove common suffixes like "FINAL", "v1", "v2", "copy", etc.
  const withoutSuffixes = nameWithoutExt
    .replace(/[_-](final|v\d+|copy|draft|updated|rev\d*|backup)$/gi, "")
    .trim();

  // Replace underscores and hyphens with spaces
  let cleaned = withoutSuffixes.replace(/[_-]/g, " ").trim();

  // Remove multiple consecutive spaces
  cleaned = cleaned.replace(/\s+/g, " ");

  // Validate: Must have at least 3 characters and not be all numbers
  if (cleaned.length < 3 || /^\d+$/.test(cleaned)) {
    throw new Error(
      `Invalid filename format: "${fileName}". ` +
      `Expected format: "NamaLengkap_NIM.pdf" or "NamaLengkap_NIM.docx"`
    );
  }

  // Validate: Should not be just special characters
  if (/^[^a-zA-Z0-9]+$/.test(cleaned)) {
    throw new Error(
      `Invalid filename: "${fileName}". ` +
      `Filename must contain alphanumeric characters.`
    );
  }

  return cleaned;
}
