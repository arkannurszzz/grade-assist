"use client";

import { useCallback, useState } from "react";
import {
  Upload,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface FileUploadStatus {
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
  studentName?: string;
}

interface BatchFileUploaderProps {
  accept?: string;
  onUpload: (files: File[]) => Promise<void>;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  disabled?: boolean;
}

export function BatchFileUploader({
  accept = ".pdf,.docx",
  onUpload,
  maxFiles = 50,
  maxFileSize = 10,
  disabled = false,
}: BatchFileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileStatuses, setFileStatuses] = useState<FileUploadStatus[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Extract student name from filename
  const extractStudentName = (filename: string): string => {
    // Remove extension
    const nameWithoutExt = filename.replace(/\.(pdf|docx|doc)$/i, "");

    // Try to extract from common patterns:
    // 1. NamaLengkap_NIM.pdf → NamaLengkap
    // 2. NamaLengkap-NIM.pdf → NamaLengkap
    // 3. NIM_NamaLengkap.pdf → NamaLengkap

    const parts = nameWithoutExt.split(/[_-]/);

    // If there are multiple parts, try to identify which is the name
    if (parts.length >= 2) {
      // Check if first part is likely a NIM (all numbers)
      const firstIsNumber = /^\d+$/.test(parts[0].trim());
      if (firstIsNumber) {
        return parts.slice(1).join(" ").trim();
      }
      // Otherwise, first part is likely the name
      return parts[0].trim();
    }

    return nameWithoutExt;
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFiles = useCallback(
    (files: File[]): { valid: FileUploadStatus[]; errors: string[] } => {
      const validFiles: FileUploadStatus[] = [];
      const validationErrors: string[] = [];
      const maxSizeBytes = maxFileSize * 1024 * 1024;
      const acceptedExtensions = accept.split(",").map((ext) => ext.trim().toLowerCase());

      // Check for duplicates
      const existingNames = new Set(fileStatuses.map((f) => f.file.name));
      const newFileNames = new Set<string>();

      files.forEach((file) => {
        const fileName = file.name;
        const fileSize = file.size;
        const fileExtension = "." + fileName.split(".").pop()?.toLowerCase();

        // Check duplicates
        if (existingNames.has(fileName) || newFileNames.has(fileName)) {
          validationErrors.push(`${fileName}: File sudah ada dalam daftar upload.`);
          return;
        }

        // Check file type
        if (!acceptedExtensions.includes(fileExtension)) {
          validationErrors.push(
            `${fileName}: Format tidak didukung. Hanya ${accept} yang diperbolehkan.`
          );
          return;
        }

        // Check file size
        if (fileSize > maxSizeBytes) {
          validationErrors.push(
            `${fileName}: Ukuran terlalu besar. Maks ${maxFileSize}MB (ini: ${(fileSize / 1024 / 1024).toFixed(2)}MB).`
          );
          return;
        }

        // Check if empty
        if (fileSize === 0) {
          validationErrors.push(`${fileName}: File kosong atau corrupt.`);
          return;
        }

        newFileNames.add(fileName);
        validFiles.push({
          file,
          status: "pending",
          progress: 0,
          studentName: extractStudentName(fileName),
        });
      });

      return { valid: validFiles, errors: validationErrors };
    },
    [accept, maxFileSize, fileStatuses]
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      setErrors([]);

      // Check total file limit
      const currentCount = fileStatuses.length;
      const newFilesArray = Array.from(files);
      const availableSlots = maxFiles - currentCount;

      if (newFilesArray.length > availableSlots) {
        setErrors([
          `Tidak bisa menambahkan ${newFilesArray.length} file. Maksimal ${maxFiles} file total (saat ini: ${currentCount}).`,
        ]);
        return;
      }

      const { valid, errors: validationErrors } = validateFiles(newFilesArray);

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
      }

      if (valid.length > 0) {
        setFileStatuses((prev) => [...prev, ...valid]);
      }
    },
    [maxFiles, fileStatuses, validateFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
    },
    [handleFiles]
  );

  const removeFile = (index: number) => {
    setFileStatuses((prev) => prev.filter((_, i) => i !== index));
    if (fileStatuses.length === 1) {
      setErrors([]);
    }
  };

  const removeAllFiles = () => {
    setFileStatuses([]);
    setErrors([]);
  };

  const retryFile = async (index: number) => {
    const fileStatus = fileStatuses[index];
    if (!fileStatus) return;

    setFileStatuses((prev) =>
      prev.map((f, i) =>
        i === index ? { ...f, status: "uploading", progress: 0, error: undefined } : f
      )
    );

    try {
      await onUpload([fileStatus.file]);
      setFileStatuses((prev) =>
        prev.map((f, i) => (i === index ? { ...f, status: "success", progress: 100 } : f))
      );
    } catch (error) {
      setFileStatuses((prev) =>
        prev.map((f, i) =>
          i === index
            ? {
                ...f,
                status: "error",
                error: error instanceof Error ? error.message : "Upload gagal",
              }
            : f
        )
      );
    }
  };

  const handleUploadAll = async () => {
    if (fileStatuses.length === 0) return;

    setUploading(true);
    setErrors([]);

    // Mark all as uploading
    setFileStatuses((prev) =>
      prev.map((f) => ({ ...f, status: "uploading" as const, progress: 0 }))
    );

    try {
      // Simulate progress for UX (real progress would come from API)
      const progressInterval = setInterval(() => {
        setFileStatuses((prev) =>
          prev.map((f) =>
            f.status === "uploading" && f.progress < 90
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          )
        );
      }, 200);

      // Upload all files
      await onUpload(fileStatuses.map((f) => f.file));

      clearInterval(progressInterval);

      // Mark all as success
      setFileStatuses((prev) =>
        prev.map((f) => ({ ...f, status: "success" as const, progress: 100 }))
      );

      // Clear after success
      setTimeout(() => {
        setFileStatuses([]);
      }, 2000);
    } catch (error) {
      // Mark all as error
      setFileStatuses((prev) =>
        prev.map((f) => ({
          ...f,
          status: "error" as const,
          error: error instanceof Error ? error.message : "Upload gagal",
        }))
      );
      setErrors([error instanceof Error ? error.message : "Upload gagal"]);
    } finally {
      setUploading(false);
    }
  };

  const pendingCount = fileStatuses.filter((f) => f.status === "pending").length;
  const uploadingCount = fileStatuses.filter((f) => f.status === "uploading").length;
  const successCount = fileStatuses.filter((f) => f.status === "success").length;
  const errorCount = fileStatuses.filter((f) => f.status === "error").length;

  return (
    <div className="space-y-4">
      {/* Errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-1">Beberapa file bermasalah:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Drop Zone */}
      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
          disabled || uploading
            ? "cursor-not-allowed border-muted bg-muted/30 opacity-60"
            : dragActive
            ? "cursor-pointer border-primary bg-primary/5"
            : "cursor-pointer border-muted-foreground/25 hover:border-primary/50"
        )}
        onDragEnter={disabled || uploading ? undefined : handleDrag}
        onDragLeave={disabled || uploading ? undefined : handleDrag}
        onDragOver={disabled || uploading ? undefined : handleDrag}
        onDrop={disabled || uploading ? undefined : handleDrop}
      >
        <input
          type="file"
          accept={accept}
          multiple
          onChange={handleChange}
          disabled={disabled || uploading}
          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground font-medium">
          {uploading
            ? "Uploading files..."
            : "Drag & drop file atau klik untuk upload"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70 text-center">
          Format: {accept} • Maks {maxFiles} file • {maxFileSize}MB per file
          <br />
          <span className="font-medium">
            {fileStatuses.length}/{maxFiles} file dipilih
          </span>
        </p>
      </div>

      {/* File List */}
      {fileStatuses.length > 0 && (
        <div className="space-y-3">
          {/* Summary Bar */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-4 text-sm">
              <span className="font-medium">{fileStatuses.length} file</span>
              {pendingCount > 0 && (
                <Badge variant="outline">{pendingCount} pending</Badge>
              )}
              {uploadingCount > 0 && (
                <Badge className="bg-blue-600">{uploadingCount} uploading</Badge>
              )}
              {successCount > 0 && (
                <Badge className="bg-green-600">{successCount} success</Badge>
              )}
              {errorCount > 0 && (
                <Badge variant="destructive">{errorCount} error</Badge>
              )}
            </div>
            <div className="flex gap-2">
              {errorCount === 0 && successCount === 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeAllFiles}
                  disabled={uploading}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
              {pendingCount > 0 && (
                <Button
                  size="sm"
                  onClick={handleUploadAll}
                  disabled={uploading || disabled}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    `Upload ${pendingCount} File${pendingCount > 1 ? "s" : ""}`
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* File Items */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {fileStatuses.map((fileStatus, idx) => {
              const fileSizeInMB = fileStatus.file.size / 1024 / 1024;
              const fileSizeDisplay =
                fileSizeInMB >= 1
                  ? `${fileSizeInMB.toFixed(2)} MB`
                  : `${(fileStatus.file.size / 1024).toFixed(1)} KB`;

              return (
                <div
                  key={`${fileStatus.file.name}-${idx}`}
                  className={cn(
                    "rounded-lg border p-3 transition-colors",
                    fileStatus.status === "success" && "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30",
                    fileStatus.status === "error" && "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30",
                    fileStatus.status === "uploading" && "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-1">
                        {fileStatus.status === "success" ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : fileStatus.status === "error" ? (
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        ) : fileStatus.status === "uploading" ? (
                          <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                        ) : (
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {fileStatus.file.name}
                          </p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            ({fileSizeDisplay})
                          </span>
                        </div>
                        {fileStatus.studentName && (
                          <p className="text-xs text-muted-foreground">
                            Student: {fileStatus.studentName}
                          </p>
                        )}
                        {fileStatus.status === "error" && fileStatus.error && (
                          <p className="text-xs text-red-600 mt-1">
                            {fileStatus.error}
                          </p>
                        )}
                        {fileStatus.status === "uploading" && (
                          <Progress value={fileStatus.progress} className="mt-2 h-1" />
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {fileStatus.status === "error" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => retryFile(idx)}
                          disabled={uploading}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      {fileStatus.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(idx)}
                          disabled={uploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
