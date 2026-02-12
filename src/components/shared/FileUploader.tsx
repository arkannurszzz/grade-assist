"use client";

import { useCallback, useState } from "react";
import { Upload, X, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FileUploaderProps {
  accept?: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  label?: string;
  disabled?: boolean;
}

export function FileUploader({
  accept = ".pdf,.docx",
  multiple = false,
  onFilesSelected,
  maxFiles = 50,
  maxFileSize = 10, // 10MB default
  label = "Drag & drop file atau klik untuk upload",
  disabled = false,
}: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

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
    (files: File[]): { valid: File[]; errors: string[] } => {
      const validFiles: File[] = [];
      const validationErrors: string[] = [];
      const maxSizeBytes = maxFileSize * 1024 * 1024; // Convert MB to bytes
      const acceptedExtensions = accept.split(",").map((ext) => ext.trim().toLowerCase());

      files.forEach((file) => {
        const fileName = file.name;
        const fileSize = file.size;
        const fileExtension = "." + fileName.split(".").pop()?.toLowerCase();

        // Check file type
        if (!acceptedExtensions.includes(fileExtension)) {
          validationErrors.push(
            `${fileName}: Format file tidak didukung. Hanya ${accept} yang diperbolehkan.`
          );
          return;
        }

        // Check file size
        if (fileSize > maxSizeBytes) {
          validationErrors.push(
            `${fileName}: Ukuran file terlalu besar. Maksimal ${maxFileSize}MB (file ini: ${(fileSize / 1024 / 1024).toFixed(2)}MB).`
          );
          return;
        }

        // Check if file size is 0
        if (fileSize === 0) {
          validationErrors.push(`${fileName}: File kosong atau corrupt.`);
          return;
        }

        validFiles.push(file);
      });

      return { valid: validFiles, errors: validationErrors };
    },
    [accept, maxFileSize]
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      setErrors([]); // Clear previous errors

      const fileArray = Array.from(files).slice(0, maxFiles);

      // Validate files
      const { valid, errors: validationErrors } = validateFiles(fileArray);

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
      }

      if (valid.length > 0) {
        setSelectedFiles(valid);
        onFilesSelected(valid);
      } else if (validationErrors.length > 0) {
        // No valid files but there are errors
        setSelectedFiles([]);
      }
    },
    [maxFiles, onFilesSelected, validateFiles]
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
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
    // Clear errors when removing files
    if (newFiles.length === 0) {
      setErrors([]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Validation Errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-1">Beberapa file gagal divalidasi:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
          disabled
            ? "cursor-not-allowed border-muted bg-muted/30 opacity-60"
            : dragActive
            ? "cursor-pointer border-primary bg-primary/5"
            : "cursor-pointer border-muted-foreground/25 hover:border-primary/50"
        )}
        onDragEnter={disabled ? undefined : handleDrag}
        onDragLeave={disabled ? undefined : handleDrag}
        onDragOver={disabled ? undefined : handleDrag}
        onDrop={disabled ? undefined : handleDrop}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {disabled ? "Upload disabled saat grading" : label}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Format: PDF, DOCX {multiple && `(maks. ${maxFiles} file)`}
          <br />
          Ukuran maksimal: {maxFileSize}MB per file
        </p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          {selectedFiles.map((file, idx) => {
            const fileSizeInMB = file.size / 1024 / 1024;
            const fileSizeDisplay =
              fileSizeInMB >= 1
                ? `${fileSizeInMB.toFixed(2)} MB`
                : `${(file.size / 1024).toFixed(1)} KB`;

            return (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between rounded-md border bg-background px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({fileSizeDisplay})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(idx)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
