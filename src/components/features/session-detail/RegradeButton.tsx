"use client";

import { useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";

interface RegradeButtonProps {
  sessionId: string;
  submissionId: string;
  studentName: string;
  onSuccess?: () => void;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
  showText?: boolean;
}

export function RegradeButton({
  sessionId,
  submissionId,
  studentName,
  onSuccess,
  variant = "outline",
  size = "sm",
  showIcon = true,
  showText = true,
}: RegradeButtonProps) {
  const [isRegrading, setIsRegrading] = useState(false);

  const handleRegrade = async () => {
    setIsRegrading(true);

    try {
      await apiClient.post(
        `/api/sessions/${sessionId}/submissions/${submissionId}/regrade`
      );

      toast.success(`Penilaian ulang untuk ${studentName} berhasil!`);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to regrade submission:", error);
      toast.error("Gagal melakukan penilaian ulang");
    } finally {
      setIsRegrading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isRegrading}
        >
          {isRegrading ? (
            <>
              <Loader2 className={showText ? "mr-2 h-4 w-4 animate-spin" : "h-4 w-4 animate-spin"} />
              {showText && "Menilai ulang..."}
            </>
          ) : (
            <>
              {showIcon && <RefreshCw className={showText ? "mr-2 h-4 w-4" : "h-4 w-4"} />}
              {showText && "Nilai Ulang"}
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Nilai Ulang Submission?</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menilai ulang submission dari{" "}
            <strong>{studentName}</strong>?
            <br />
            <br />
            Proses ini akan:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Menghapus semua nilai dan feedback yang ada</li>
              <li>Melakukan ekstraksi jawaban ulang menggunakan AI</li>
              <li>Memberikan nilai baru berdasarkan pengaturan saat ini</li>
              <li>Mendeteksi ulang AI-generated content (jika diaktifkan)</li>
            </ul>
            <br />
            <strong className="text-amber-600">Perubahan manual yang sudah dilakukan akan hilang.</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRegrading}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRegrade}
            disabled={isRegrading}
            className="bg-primary"
          >
            {isRegrading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ya, Nilai Ulang
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
