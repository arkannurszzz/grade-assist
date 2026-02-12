import { CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function GuidelinesCard() {
  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-blue-600" />
          Panduan Menulis Kunci Jawaban yang Baik
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            ✅ Tips untuk Kunci Jawaban Berkualitas:
          </p>
          <ul className="space-y-1.5 text-blue-800 dark:text-blue-200">
            <li>
              • <strong>Tulis dengan gaya sendiri</strong> - Gunakan kata-kata
              dan penjelasan yang natural untuk Anda
            </li>
            <li>
              • <strong>Variasi struktur</strong> - Tidak semua jawaban harus
              punya format yang sama persis
            </li>
            <li>
              • <strong>Sesuaikan detail</strong> - Soal mudah bisa lebih
              ringkas, soal susah lebih detail
            </li>
            <li>
              • <strong>Tambahkan contoh personal</strong> - Referensi dari
              pengalaman mengajar atau kasus nyata
            </li>
            <li>
              • <strong>Gunakan bahasa natural</strong> - Boleh campur formal
              dan informal sesuai konteks
            </li>
          </ul>
        </div>

        <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
          <p className="font-medium text-orange-900 dark:text-orange-100 mb-2">
            ⚠️ Hindari:
          </p>
          <ul className="space-y-1.5 text-orange-800 dark:text-orange-200">
            <li>• Generate semua jawaban dengan AI (ChatGPT, Gemini, dll)</li>
            <li>• Copy-paste langsung dari sumber online tanpa modifikasi</li>
            <li>• Format yang terlalu sempurna dan seragam di semua soal</li>
            <li>• Jawaban yang terlalu generic tanpa konteks mata kuliah</li>
          </ul>
        </div>

        <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            <strong>💡 Tip:</strong> Jika menggunakan AI sebagai referensi,
            pastikan untuk menulis ulang dengan kata-kata sendiri dan sesuaikan
            dengan konteks mata kuliah Anda. Kunci jawaban yang authentic akan
            memberikan hasil grading yang lebih akurat.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
