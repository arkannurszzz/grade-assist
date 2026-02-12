"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Key, Save } from "lucide-react";

interface AppSettings {
  geminiApiKey: string;
  openaiApiKey: string;
  defaultProvider: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    geminiApiKey: "",
    openaiApiKey: "",
    defaultProvider: "gemini",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    if (res.ok) {
      const updated = await res.json();
      setSettings(updated);
      toast.success("Pengaturan berhasil disimpan");
    } else {
      toast.error("Gagal menyimpan pengaturan");
    }
    setSaving(false);
  };

  if (loading) return <p className="text-muted-foreground">Memuat...</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-muted-foreground">
          Konfigurasi API key dan provider AI
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys
          </CardTitle>
          <CardDescription>
            Masukkan API key untuk provider AI yang ingin digunakan. API key
            disimpan secara aman di database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="geminiKey">Google Gemini API Key</Label>
            <Input
              id="geminiKey"
              type="password"
              placeholder="AIza..."
              value={settings.geminiApiKey}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  geminiApiKey: e.target.value,
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Dapatkan API key gratis di{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="openaiKey">OpenAI API Key (Opsional)</Label>
            <Input
              id="openaiKey"
              type="password"
              placeholder="sk-..."
              value={settings.openaiApiKey}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  openaiApiKey: e.target.value,
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Provider</CardTitle>
          <CardDescription>
            Pilih provider AI default untuk sesi baru
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={settings.defaultProvider}
            onValueChange={(value) =>
              setSettings((prev) => ({ ...prev, defaultProvider: value }))
            }
          >
            <SelectTrigger className="w-60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini">
                Google Gemini (Gratis)
              </SelectItem>
              <SelectItem value="openai">OpenAI GPT</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        <Save className="mr-2 h-4 w-4" />
        {saving ? "Menyimpan..." : "Simpan Pengaturan"}
      </Button>
    </div>
  );
}
