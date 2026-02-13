"use client";

import { useState, useEffect } from "react";
import { Download, Settings2, Check, Loader2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  createDefaultTemplate,
  createEssentialTemplate,
  createMinimalTemplate,
  PRESET_TEMPLATES,
  type ExportColumnConfig,
} from "@/types/export-template";
import { ColumnToggleList } from "./ColumnToggleList";
import { ExportPreviewTable } from "./ExportPreviewTable";

interface ExportTemplateDialogProps {
  sessionId: string;
  sessionName: string;
  questionCount: number;
  onExport: (columns: ExportColumnConfig[]) => void | Promise<void>;
}

export function ExportTemplateDialog({
  sessionId,
  sessionName,
  questionCount,
  onExport,
}: ExportTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [columns, setColumns] = useState<ExportColumnConfig[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Initialize with default template
  useEffect(() => {
    if (open && columns.length === 0) {
      setColumns(createDefaultTemplate(questionCount));
    }
  }, [open, questionCount, columns.length]);

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
    toast.success(`Template "${PRESET_TEMPLATES[preset as keyof typeof PRESET_TEMPLATES].name}" diterapkan`);
  };

  const handleExport = async () => {
    const enabledColumns = columns.filter((col) => col.enabled);

    if (enabledColumns.length === 0) {
      toast.error("Pilih minimal satu kolom untuk export");
      return;
    }

    setIsExporting(true);
    try {
      await onExport(columns);
      setOpen(false);
      toast.success("Export berhasil!");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export gagal");
    } finally {
      setIsExporting(false);
    }
  };

  const enabledCount = columns.filter((col) => col.enabled).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings2 className="mr-2 h-4 w-4" />
          Customize Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col p-0 sm:p-6">
        <DialogHeader className="px-6 pt-6 pb-2 sm:px-0 sm:pt-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl sm:text-2xl">
                Customize Excel Export
              </DialogTitle>
              <DialogDescription className="mt-2">
                Pilih kolom yang ingin di-export dan atur urutannya
              </DialogDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="default" className="text-base font-semibold px-3 py-1">
                {enabledCount} / {columns.length}
              </Badge>
              <p className="text-xs text-muted-foreground">kolom aktif</p>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="customize" className="w-full flex-1 flex flex-col overflow-hidden px-6 sm:px-0">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="customize" className="gap-2">
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Customize</span>
              <span className="sm:hidden">Custom</span>
            </TabsTrigger>
            <TabsTrigger value="presets" className="gap-2">
              <Check className="h-4 w-4" />
              <span className="hidden sm:inline">Quick Presets</span>
              <span className="sm:hidden">Presets</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customize" className="flex-1 overflow-hidden mt-0">
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 h-full">
              {/* Left: Column Editor - Takes 3 columns on XL screens */}
              <div className="xl:col-span-3 space-y-3 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    Pilih & Atur Kolom
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const allEnabled = columns.every((col) => col.enabled);
                      setColumns(
                        columns.map((col) => ({ ...col, enabled: !allEnabled }))
                      );
                    }}
                    className="text-xs h-7"
                  >
                    {columns.every((col) => col.enabled) ? "Uncheck All" : "Check All"}
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 -mr-2 scroll-smooth">
                  <ColumnToggleList
                    columns={columns}
                    onColumnsChange={setColumns}
                  />
                </div>
              </div>

              {/* Right: Live Preview - Takes 2 columns on XL screens */}
              <div className="xl:col-span-2 space-y-3 overflow-hidden flex flex-col bg-muted/30 rounded-lg p-4 border">
                <h3 className="text-sm font-semibold flex items-center gap-2 shrink-0">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Live Preview
                </h3>
                <div className="flex-1 overflow-auto">
                  <ExportPreviewTable columns={columns} />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="presets" className="space-y-4 mt-0">
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pilih template yang sudah jadi untuk cepat export
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(PRESET_TEMPLATES).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => handlePresetSelect(key)}
                  className="group relative overflow-hidden text-left p-5 rounded-xl border-2 hover:border-primary hover:shadow-lg transition-all duration-200 bg-card hover:bg-accent"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150" />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-base">{preset.name}</h4>
                      <Check className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {preset.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-3 px-6 pb-6 pt-4 sm:px-0 sm:pb-0 border-t mt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-medium truncate max-w-50">{sessionName}</span>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isExporting}
                className="flex-1 sm:flex-none"
              >
                Batal
              </Button>
              <Button
                onClick={handleExport}
                disabled={isExporting || enabledCount === 0}
                className="flex-1 sm:flex-none min-w-35"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export Excel
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
