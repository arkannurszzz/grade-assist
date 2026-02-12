"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

export default function NewSessionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Nama sesi wajib diisi");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, courseName, description }),
    });

    if (res.ok) {
      const session = await res.json();
      toast.success("Sesi berhasil dibuat");
      router.push(`/sessions/${session.id}`);
    } else {
      toast.error("Gagal membuat sesi");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Buat Sesi Penilaian Baru</h1>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Sesi</CardTitle>
          <CardDescription>
            Isi detail sesi penilaian. Setelah dibuat, Anda bisa upload kunci
            jawaban dan jawaban mahasiswa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Sesi *</Label>
              <Input
                id="name"
                placeholder="Contoh: UTS Algoritma 2024"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="courseName">Mata Kuliah</Label>
              <Input
                id="courseName"
                placeholder="Contoh: Algoritma & Pemrograman"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                placeholder="Deskripsi opsional untuk sesi ini..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Membuat..." : "Buat Sesi"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Batal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
