import { AlertTriangle } from "lucide-react";

interface AIDetectionWarningProps {
  warning: string;
}

export function AIDetectionWarning({ warning }: AIDetectionWarningProps) {
  return (
    <div className="mx-6 mb-4 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/30">
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-orange-900 dark:text-orange-100">
            ⚠️ Kunci Jawaban Terdeteksi AI-Generated
          </p>
          <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
            {warning}
          </p>
          <p className="mt-2 text-xs text-orange-600 dark:text-orange-400">
            <strong>Rekomendasi:</strong> Untuk hasil grading yang lebih
            akurat dan fair, sebaiknya tulis ulang kunci jawaban dengan gaya
            Anda sendiri. Kunci jawaban yang authentic akan memberikan
            referensi yang lebih baik untuk penilaian.
          </p>
        </div>
      </div>
    </div>
  );
}
