"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Download,
  Loader2,
  LayoutTemplate,
  Eye,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  createDefaultTemplate,
  createEssentialTemplate,
  createMinimalTemplate,
  PRESET_TEMPLATES,
  type ExportColumnConfig,
} from "@/types/export-template";
import { ColumnToggleList } from "@/components/features/export/ColumnToggleList";
import { ExportPreviewTable } from "@/components/features/export/ExportPreviewTable";

export default function ExportCustomizePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [columns, setColumns] = useState<ExportColumnConfig[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Fetch session data
  const { data: session, isLoading } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch session");
      return res.json();
    },
  });

  const questionCount = session?.answerKey?.questions?.length ?? 0;

  // Initialize with default template
  useEffect(() => {
    if (questionCount > 0 && columns.length === 0) {
      setColumns(createDefaultTemplate(questionCount));
      setActivePreset("ALL");
    }
  }, [questionCount, columns.length]);

  const handlePresetSelect = (preset: string) => {
    switch (preset) {
      case "ALL":
        setColumns(createDefaultTemplate(questionCount));
        break;
      case "ESSENTIAL":
        setColumns(createEssentialTemplate(questionCount));
        break;
      case "MINIMAL":
        setColumns(createMinimalTemplate());
        break;
    }
    setActivePreset(preset);
    toast.success(
      `Template "${PRESET_TEMPLATES[preset as keyof typeof PRESET_TEMPLATES].name}" diterapkan`,
    );
  };

  const handleExport = async () => {
    const enabledColumns = columns.filter((col) => col.enabled);

    if (enabledColumns.length === 0) {
      toast.error("Pilih minimal satu kolom untuk export");
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/export-xlsx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: columns }),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${session?.name || "session"}_results.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Export berhasil!");
      router.push(`/sessions/${sessionId}`);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export gagal");
    } finally {
      setIsExporting(false);
    }
  };

  const enabledCount = columns.filter((col) => col.enabled).length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background">
        <div className="container mx-auto  px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/sessions/${sessionId}`)}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold truncate">
                  Customize Excel Export
                </h1>
                <p className="text-sm text-muted-foreground truncate">
                  {session?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Badge
                variant="outline"
                className="text-sm font-semibold px-3 py-1.5"
              >
                {enabledCount} / {columns.length} kolom
              </Badge>
              <Button
                onClick={handleExport}
                disabled={isExporting || enabledCount === 0}
                size="default"
                className="gap-2"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Export Excel
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-64px)] flex">
        {/* Left - Column Editor (Compact) */}
        <div className="w-80 border-r bg-card p-4 overflow-y-auto shrink-0">
          <div className="space-y-4">
            {/* Quick Presets */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4" />
                <h2 className="font-semibold text-sm">Quick Presets</h2>
              </div>

              <div className="space-y-1">
                {Object.entries(PRESET_TEMPLATES).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => handlePresetSelect(key)}
                    className={`w-full text-left p-2 rounded-md border transition-all ${
                      activePreset === key
                        ? "border-primary bg-accent"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <h4 className="font-medium text-xs">{preset.name}</h4>
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const allEnabled = columns.every((col) => col.enabled);
                  setColumns(
                    columns.map((col) => ({ ...col, enabled: !allEnabled })),
                  );
                }}
                className="w-full h-8"
              >
                {columns.every((col) => col.enabled)
                  ? "Uncheck All"
                  : "Check All"}
              </Button>
            </div>

            <Separator />

            {/* Column Editor */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                <h2 className="font-semibold text-sm">Atur Kolom</h2>
              </div>

              <ColumnToggleList
                columns={columns}
                onColumnsChange={setColumns}
              />
            </div>
          </div>
        </div>

        {/* Right - Live Preview (MAX WIDTH - fills all remaining space) */}
        <div className="flex-1 overflow-auto bg-muted/30">
          <div className="p-6 max-w-none">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="h-5 w-5" />
                <h2 className="font-bold text-lg">Live Preview</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Preview hasil export Excel - semua perubahan langsung terlihat
              </p>
            </div>

            <div className="w-full">
              <ExportPreviewTable columns={columns} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
