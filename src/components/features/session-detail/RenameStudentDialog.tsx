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
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";

interface RenameStudentDialogProps {
  sessionId: string;
  submissionId: string;
  currentName: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function RenameStudentDialog({
  sessionId,
  submissionId,
  currentName,
  onSuccess,
  trigger,
}: RenameStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [studentName, setStudentName] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmedName = studentName.trim();

    // Validation
    if (!trimmedName) {
      toast.error("Nama mahasiswa tidak boleh kosong");
      return;
    }

    if (trimmedName === currentName) {
      toast.info("Nama tidak berubah");
      setOpen(false);
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.patch(
        `/api/sessions/${sessionId}/submissions/${submissionId}`,
        {
          studentName: trimmedName,
        }
      );

      toast.success("Nama mahasiswa berhasil diperbarui");
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to rename student:", error);
      toast.error("Gagal memperbarui nama");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Nama Mahasiswa</DialogTitle>
          <DialogDescription>
            Ubah nama mahasiswa jika ekstraksi otomatis salah atau tidak jelas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="studentName">Nama Mahasiswa</Label>
            <Input
              id="studentName"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Masukkan nama mahasiswa"
              autoFocus
            />
            <p className="text-sm text-muted-foreground">
              Nama saat ini: <span className="font-medium">{currentName}</span>
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
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
