import { useState } from "react";
import { Play } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";

export interface GradingConfig {
  strictness: "lenient" | "moderate" | "strict";
  enableAIDetection: boolean;
  aiPenaltyPercent: number;
  copyPenaltyPercent: number;
  aiDetectionThreshold: number;
  language: "id" | "en";
}

interface GradingConfigDialogProps {
  defaultConfig: GradingConfig;
  onStart: (config: GradingConfig) => void;
  disabled?: boolean;
}

export function GradingConfigDialog({
  defaultConfig,
  onStart,
  disabled,
}: GradingConfigDialogProps) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<GradingConfig>(defaultConfig);

  // Validation & sanitization helpers
  const clampPercentage = (value: number): number => {
    const num = parseFloat(value.toString());
    if (isNaN(num)) return 0;
    return Math.max(0, Math.min(100, Math.round(num)));
  };

  const clampThreshold = (value: number): number => {
    const num = parseFloat(value.toString());
    if (isNaN(num)) return 0.7;
    return Math.max(0, Math.min(1, Math.round(num * 100) / 100)); // 2 decimal places max
  };

  // Format input value (strip leading zeros, validate format)
  const formatPercentageInput = (input: string): string => {
    // Remove non-numeric characters
    let cleaned = input.replace(/[^\d]/g, '');

    // Remove leading zeros unless it's just "0"
    cleaned = cleaned.replace(/^0+(\d)/, '$1');

    // Limit to max 3 digits (max 100)
    cleaned = cleaned.slice(0, 3);

    // Parse and clamp
    const num = parseInt(cleaned || '0', 10);
    if (num > 100) return '100';

    return cleaned;
  };

  const formatThresholdInput = (input: string): string => {
    // Allow only digits and one decimal point
    let cleaned = input.replace(/[^\d.]/g, '');

    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }

    // Remove leading zeros before decimal
    if (!cleaned.startsWith('0.')) {
      cleaned = cleaned.replace(/^0+(\d)/, '$1');
    }

    // Limit to 1.XX format (max 4 chars)
    if (cleaned.includes('.')) {
      const [whole, decimal] = cleaned.split('.');
      cleaned = (whole.slice(0, 1) || '0') + '.' + (decimal?.slice(0, 2) || '');
    } else {
      cleaned = cleaned.slice(0, 1);
    }

    // Clamp to max 1.0
    const num = parseFloat(cleaned || '0');
    if (num > 1) return '1';

    return cleaned;
  };

  const handleStart = () => {
    // Final validation before submit
    const sanitizedConfig: GradingConfig = {
      ...config,
      aiPenaltyPercent: clampPercentage(config.aiPenaltyPercent),
      copyPenaltyPercent: clampPercentage(config.copyPenaltyPercent),
      aiDetectionThreshold: clampThreshold(config.aiDetectionThreshold),
    };
    onStart(sanitizedConfig);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <Play className="mr-2 h-4 w-4" />
          Mulai Penilaian
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Konfigurasi Penilaian</DialogTitle>
          <DialogDescription>
            Atur parameter penilaian sebelum memulai proses grading otomatis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Strictness */}
          <div className="space-y-2">
            <Label>Tingkat Ketatnya Penilaian</Label>
            <Select
              value={config.strictness}
              onValueChange={(value: "lenient" | "moderate" | "strict") =>
                setConfig({ ...config, strictness: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lenient">
                  Lenient - Lebih toleran, fokus pemahaman
                </SelectItem>
                <SelectItem value="moderate">
                  Moderate - Seimbang antara akurasi & pemahaman
                </SelectItem>
                <SelectItem value="strict">
                  Strict - Ketat, butuh jawaban lengkap & presisi
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label>Bahasa Penilaian</Label>
            <Select
              value={config.language}
              onValueChange={(value: "id" | "en") =>
                setConfig({ ...config, language: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="id">Bahasa Indonesia</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* AI Detection Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Deteksi Penggunaan AI</Label>
              <p className="text-xs text-muted-foreground">
                Analisis jawaban untuk mendeteksi AI-generated content
              </p>
            </div>
            <Switch
              checked={config.enableAIDetection}
              onCheckedChange={(checked) =>
                setConfig({ ...config, enableAIDetection: checked })
              }
            />
          </div>

          {/* AI Penalty */}
          {config.enableAIDetection && (
            <>
              <div className="space-y-2">
                <Label>Penalti AI-Generated (%)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="50"
                  value={config.aiPenaltyPercent.toString()}
                  onChange={(e) => {
                    const formatted = formatPercentageInput(e.target.value);
                    const value = parseInt(formatted || '0', 10);
                    setConfig({
                      ...config,
                      aiPenaltyPercent: value,
                    });
                  }}
                  onBlur={() => {
                    // Ensure valid value on blur
                    const value = clampPercentage(config.aiPenaltyPercent);
                    setConfig({
                      ...config,
                      aiPenaltyPercent: value,
                    });
                  }}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <p className="text-xs text-muted-foreground">
                  Pengurangan nilai jika terdeteksi menggunakan AI (0-100%)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Threshold Deteksi AI</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.7"
                  value={config.aiDetectionThreshold.toString()}
                  onChange={(e) => {
                    const formatted = formatThresholdInput(e.target.value);
                    const value = parseFloat(formatted || '0.7');
                    setConfig({
                      ...config,
                      aiDetectionThreshold: isNaN(value) ? 0.7 : value,
                    });
                  }}
                  onBlur={() => {
                    // Ensure valid value on blur
                    const value = clampThreshold(config.aiDetectionThreshold);
                    setConfig({
                      ...config,
                      aiDetectionThreshold: value,
                    });
                  }}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <p className="text-xs text-muted-foreground">
                  Confidence minimum untuk menerapkan penalti (0.0-1.0, default 0.7)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Penalti Copy-Paste (%)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="30"
                  value={config.copyPenaltyPercent.toString()}
                  onChange={(e) => {
                    const formatted = formatPercentageInput(e.target.value);
                    const value = parseInt(formatted || '0', 10);
                    setConfig({
                      ...config,
                      copyPenaltyPercent: value,
                    });
                  }}
                  onBlur={() => {
                    // Ensure valid value on blur
                    const value = clampPercentage(config.copyPenaltyPercent);
                    setConfig({
                      ...config,
                      copyPenaltyPercent: value,
                    });
                  }}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <p className="text-xs text-muted-foreground">
                  Pengurangan nilai jika terdeteksi copy-paste (0-100%)
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleStart}>
            <Play className="mr-2 h-4 w-4" />
            Mulai Penilaian
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
