"use client";

import { useState } from "react";
import { Edit, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";

interface EditGradeDialogProps {
  sessionId: string;
  submissionId: string;
  answerId: string;
  questionNumber: number;
  currentScore: number;
  maxScore: number;
  currentFeedback: string;
  onSuccess?: () => void;
}

export function EditGradeDialog({
  sessionId,
  submissionId,
  answerId,
  questionNumber,
  currentScore,
  maxScore,
  currentFeedback,
  onSuccess,
}: EditGradeDialogProps) {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(currentScore.toString());
  const [feedback, setFeedback] = useState(currentFeedback);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    const numScore = parseFloat(score);

    // Validation
    if (isNaN(numScore)) {
      toast.error("Skor harus berupa angka");
      return;
    }

    if (numScore < 0) {
      toast.error("Skor tidak boleh negatif");
      return;
    }

    if (numScore > maxScore) {
      toast.error(`Skor tidak boleh lebih dari ${maxScore}`);
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.patch(
        `/api/sessions/${sessionId}/submissions/${submissionId}/answers/${answerId}`,
        {
          score: numScore,
          feedback: feedback.trim(),
        }
      );

      toast.success("Nilai berhasil diperbarui");
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to update grade:", error);
      toast.error("Gagal memperbarui nilai");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="mr-2 h-4 w-4" />
          Edit Nilai
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Nilai Soal {questionNumber}</DialogTitle>
          <DialogDescription>
            Ubah skor dan feedback untuk jawaban ini. Perubahan akan otomatis
            update total nilai mahasiswa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Score Input */}
          <div className="space-y-2">
            <Label htmlFor="score">
              Skor (Maksimal: {maxScore})
            </Label>
            <Input
              id="score"
              type="number"
              step="0.1"
              min="0"
              max={maxScore}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="Masukkan skor"
            />
            <p className="text-sm text-muted-foreground">
              Skor saat ini: {currentScore} / {maxScore}
            </p>
          </div>

          {/* Feedback Input */}
          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback</Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Berikan feedback untuk mahasiswa..."
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Preview */}
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-sm font-medium mb-1">Preview Nilai Baru:</p>
            <p className="text-2xl font-bold">
              {score || "0"} / {maxScore}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Perubahan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
