"use client";

import { useState, useMemo } from "react";
import { Settings, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { GradeScaleItem } from "@/types/session";

interface GradingScaleDialogProps {
  sessionId: string;
  currentScale: GradeScaleItem[];
  onUpdate: () => void;
}

const DEFAULT_GRADING_SCALE: GradeScaleItem[] = [
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

interface ValidationError {
  gradeIndex: number;
  field?: string;
  message: string;
}

export function GradingScaleDialog({
  sessionId,
  currentScale,
  onUpdate,
}: GradingScaleDialogProps) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState<GradeScaleItem[]>(currentScale);
  const [isSaving, setIsSaving] = useState(false);

  // Compute validation errors in real-time
  const validationErrors = useMemo(() => {
    return validateScaleDetailed(scale);
  }, [scale]);

  const isValid = validationErrors.length === 0;

  // Check if scale has been modified
  const hasChanges = useMemo(() => {
    return JSON.stringify(scale) !== JSON.stringify(currentScale);
  }, [scale, currentScale]);

  // Reset form when opening
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      // Reset to current scale when opening
      setScale(currentScale);
    } else if (hasChanges && !isSaving) {
      // Warn before closing if there are unsaved changes
      const confirmed = window.confirm(
        "Ada perubahan yang belum disimpan. Yakin ingin menutup?",
      );
      if (!confirmed) return;
    }
    setOpen(newOpen);
  };

  const handleReset = () => {
    setScale(DEFAULT_GRADING_SCALE);
    toast.info("Skala direset ke default");
  };

  const handleAutoFix = () => {
    // Auto-fix: distribute ranges evenly or based on current min values
    const sorted = [...scale]
      .map((item, idx) => ({ ...item, originalIndex: idx }))
      .sort((a, b) => b.min - a.min); // Sort descending by min

    const fixed: Array<GradeScaleItem & { originalIndex: number }> = [];
    let currentMax = 100;

    for (let i = 0; i < sorted.length; i++) {
      const item = sorted[i];

      if (i === 0) {
        // Highest grade: keep min, set max to 100
        const min = Math.max(0, Math.min(item.min, 100));
        fixed.push({ ...item, min, max: 100 });
        currentMax = min - 1;
      } else if (i === sorted.length - 1) {
        // Lowest grade: set min to 0, max to current position
        const max = Math.max(0, Math.min(currentMax, 100));
        fixed.push({ ...item, min: 0, max });
      } else {
        // Middle grades: set max to currentMax, keep min but ensure no overlap
        const min = Math.max(0, Math.min(item.min, currentMax));
        fixed.push({ ...item, min, max: currentMax });
        currentMax = min - 1;
      }
    }

    // Sort back to original order
    const reordered = [...scale];
    fixed.forEach((item) => {
      reordered[item.originalIndex] = {
        grade: item.grade,
        min: item.min,
        max: item.max,
        color: item.color,
        description: item.description,
      };
    });

    setScale(reordered);
    toast.success("Range otomatis disesuaikan tanpa gap/overlap");
  };

  const handleSave = async () => {
    // Validate scale
    if (!isValid) {
      toast.error(
        "Masih ada error pada konfigurasi. Silakan perbaiki terlebih dahulu.",
      );
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gradingScale: scale }),
      });

      if (res.ok) {
        toast.success("Skala penilaian berhasil diupdate");
        setOpen(false);
        onUpdate();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal update skala penilaian");
      }
    } catch {
      toast.error("Koneksi gagal");
    } finally {
      setIsSaving(false);
    }
  };

  const updateGrade = (
    index: number,
    field: keyof GradeScaleItem,
    value: unknown,
  ) => {
    const newScale = [...scale];
    newScale[index] = { ...newScale[index], [field]: value };
    setScale(newScale);
  };

  const hasError = (gradeIndex: number, field?: string) => {
    return validationErrors.some(
      (e) => e.gradeIndex === gradeIndex && (!field || e.field === field),
    );
  };

  const getErrorMessage = (gradeIndex: number) => {
    const errors = validationErrors.filter((e) => e.gradeIndex === gradeIndex);
    return errors.map((e) => e.message).join(", ");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Atur Skala
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Konfigurasi Skala Penilaian</DialogTitle>
          <DialogDescription>
            Atur threshold dan deskripsi untuk setiap huruf mutu (A-E)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Visual Range Indicator */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">
              Visual Range Coverage (0-100)
            </Label>
            <div className="relative h-8 bg-gray-100 dark:bg-gray-900 rounded-md overflow-hidden border">
              {scale
                .filter(
                  (item) =>
                    item.min >= 0 && item.max <= 100 && item.min <= item.max,
                )
                .sort((a, b) => a.min - b.min)
                .map((item, idx) => {
                  const width = ((item.max - item.min + 1) / 101) * 100;
                  const left = (item.min / 101) * 100;
                  const hasIssue = validationErrors.some(
                    (e) => e.gradeIndex === scale.indexOf(item),
                  );

                  return (
                    <div
                      key={idx}
                      className={`absolute h-full transition-all ${
                        hasIssue
                          ? "bg-red-400 dark:bg-red-600"
                          : item.color === "default"
                            ? "bg-green-500"
                            : item.color === "secondary"
                              ? "bg-gray-400"
                              : "bg-red-500"
                      }`}
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                      }}
                      title={`${item.grade}: ${item.min}-${item.max}`}
                    >
                      <div className="flex items-center justify-center h-full text-xs font-bold text-white">
                        {width > 8 && item.grade}
                      </div>
                    </div>
                  );
                })}
              {/* Scale markers */}
              <div className="absolute inset-0 pointer-events-none">
                {[0, 25, 50, 75, 100].map((mark) => (
                  <div
                    key={mark}
                    className="absolute top-0 bottom-0 border-l border-white/30"
                    style={{ left: `${(mark / 101) * 100}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>

          {/* Validation Summary */}
          {validationErrors.length > 0 ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Ditemukan {validationErrors.length} error:</strong>
                <ul className="list-disc list-inside mt-2 text-xs space-y-1">
                  {validationErrors.slice(0, 3).map((err, i) => (
                    <li key={i}>{err.message}</li>
                  ))}
                  {validationErrors.length > 3 && (
                    <li>... dan {validationErrors.length - 3} error lainnya</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Konfigurasi skala valid! Range mencakup 0-100 tanpa gap atau
                overlap.
              </AlertDescription>
            </Alert>
          )}

          {scale.map((item, idx) => {
            const itemHasError = validationErrors.some(
              (e) => e.gradeIndex === idx,
            );
            const errorMsg = getErrorMessage(idx);

            return (
              <div
                key={idx}
                className={`rounded-lg border p-4 space-y-3 transition-colors ${
                  itemHasError
                    ? "border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20"
                    : "border-gray-200 dark:border-gray-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant={item.color}
                    className="text-lg font-bold px-3 py-1"
                  >
                    {item.grade}
                  </Badge>
                  <Input
                    placeholder="Deskripsi"
                    value={item.description}
                    onChange={(e) =>
                      updateGrade(idx, "description", e.target.value)
                    }
                    className={`flex-1 ${hasError(idx, "description") ? "border-red-500" : ""}`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Nilai Minimum</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={item.min}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) {
                          updateGrade(
                            idx,
                            "min",
                            Math.max(0, Math.min(100, val)),
                          );
                        } else if (e.target.value === "") {
                          updateGrade(idx, "min", 0);
                        }
                      }}
                      onBlur={(e) => {
                        // Ensure valid value on blur
                        const val = parseInt(e.target.value);
                        if (isNaN(val) || val < 0) {
                          updateGrade(idx, "min", 0);
                        } else if (val > 100) {
                          updateGrade(idx, "min", 100);
                        }
                      }}
                      className={hasError(idx, "min") ? "border-red-500" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Nilai Maximum</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={item.max}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) {
                          updateGrade(
                            idx,
                            "max",
                            Math.max(0, Math.min(100, val)),
                          );
                        } else if (e.target.value === "") {
                          updateGrade(idx, "max", 100);
                        }
                      }}
                      onBlur={(e) => {
                        // Ensure valid value on blur
                        const val = parseInt(e.target.value);
                        if (isNaN(val) || val < 0) {
                          updateGrade(idx, "max", 0);
                        } else if (val > 100) {
                          updateGrade(idx, "max", 100);
                        }
                      }}
                      className={hasError(idx, "max") ? "border-red-500" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Warna Badge</Label>
                    <Select
                      value={item.color}
                      onValueChange={(
                        value: "default" | "secondary" | "destructive",
                      ) => updateGrade(idx, "color", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default (Green)</SelectItem>
                        <SelectItem value="secondary">
                          Secondary (Gray)
                        </SelectItem>
                        <SelectItem value="destructive">
                          Destructive (Red)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {itemHasError && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1">
                    <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </p>
                )}
              </div>
            );
          })}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex-1"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset ke Default
            </Button>
            {!isValid && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAutoFix}
                className="flex-1"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Auto-Fix Range
              </Button>
            )}
          </div>

          <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>Tips:</strong> Range nilai harus berurutan tanpa gap.
              Contoh: A (85-100), B (70-84), C (60-69), dst. Gunakan tombol
              &quot;Auto-Fix Range&quot; untuk penyesuaian otomatis.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !isValid}>
            {isSaving ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function validateScaleDetailed(scale: GradeScaleItem[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check for empty descriptions
  scale.forEach((item, idx) => {
    if (!item.description.trim()) {
      errors.push({
        gradeIndex: idx,
        field: "description",
        message: `Grade ${item.grade}: Deskripsi tidak boleh kosong`,
      });
    }
  });

  // Check for valid ranges
  scale.forEach((item, idx) => {
    if (item.min < 0 || item.max > 100) {
      errors.push({
        gradeIndex: idx,
        field: item.min < 0 ? "min" : "max",
        message: `Grade ${item.grade}: Range harus antara 0-100 (saat ini: ${item.min}-${item.max})`,
      });
    }
    if (item.min > item.max) {
      errors.push({
        gradeIndex: idx,
        field: "min",
        message: `Grade ${item.grade}: Min (${item.min}) tidak boleh > Max (${item.max})`,
      });
    }
  });

  // Sort by min value to check for gaps/overlaps
  const sorted = [...scale]
    .map((item, originalIndex) => ({
      ...item,
      originalIndex,
    }))
    .sort((a, b) => a.min - b.min);

  // Check for overlaps
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    // Overlap check: current.max should be exactly next.min - 1
    if (current.max >= next.min) {
      errors.push({
        gradeIndex: current.originalIndex,
        field: "max",
        message: `Grade ${current.grade}: Overlap dengan ${next.grade} (${current.grade} max=${current.max}, ${next.grade} min=${next.min})`,
      });
      errors.push({
        gradeIndex: next.originalIndex,
        field: "min",
        message: `Grade ${next.grade}: Overlap dengan ${current.grade}`,
      });
    }

    // Gap check: there should be no gaps between ranges
    if (current.max + 1 < next.min) {
      errors.push({
        gradeIndex: current.originalIndex,
        field: "max",
        message: `Grade ${current.grade}: Gap terdeteksi (${current.max + 1}-${next.min - 1} tidak tercakup)`,
      });
    }
  }

  // Check coverage (should cover 0-100)
  if (sorted.length > 0) {
    const lowest = sorted[0];
    const highest = sorted[sorted.length - 1];

    if (lowest.min !== 0) {
      errors.push({
        gradeIndex: lowest.originalIndex,
        field: "min",
        message: `Grade ${lowest.grade}: Skala harus dimulai dari 0 (saat ini: ${lowest.min})`,
      });
    }
    if (highest.max !== 100) {
      errors.push({
        gradeIndex: highest.originalIndex,
        field: "max",
        message: `Grade ${highest.grade}: Skala harus berakhir di 100 (saat ini: ${highest.max})`,
      });
    }
  }

  return errors;
}
