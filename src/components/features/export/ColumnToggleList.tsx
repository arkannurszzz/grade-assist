"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { GripVertical, Edit2, Check, X, ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { ExportColumnConfig } from "@/types/export-template";
import { Badge } from "@/components/ui/badge";

interface ColumnToggleListProps {
  columns: ExportColumnConfig[];
  onColumnsChange: (columns: ExportColumnConfig[]) => void;
}

export function ColumnToggleList({
  columns,
  onColumnsChange,
}: ColumnToggleListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  // Sort by order
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  const handleToggle = (id: string) => {
    onColumnsChange(
      columns.map((col) =>
        col.id === id ? { ...col, enabled: !col.enabled } : col
      )
    );
  };

  const handleMoveUp = (id: string) => {
    const index = sortedColumns.findIndex((col) => col.id === id);
    if (index === 0) return;

    const newColumns = [...columns];
    const currentCol = newColumns.find((col) => col.id === id);
    const prevCol = newColumns.find((col) => col.id === sortedColumns[index - 1].id);

    if (currentCol && prevCol) {
      const tempOrder = currentCol.order;
      currentCol.order = prevCol.order;
      prevCol.order = tempOrder;
    }

    onColumnsChange(newColumns);
  };

  const handleMoveDown = (id: string) => {
    const index = sortedColumns.findIndex((col) => col.id === id);
    if (index === sortedColumns.length - 1) return;

    const newColumns = [...columns];
    const currentCol = newColumns.find((col) => col.id === id);
    const nextCol = newColumns.find((col) => col.id === sortedColumns[index + 1].id);

    if (currentCol && nextCol) {
      const tempOrder = currentCol.order;
      currentCol.order = nextCol.order;
      nextCol.order = tempOrder;
    }

    onColumnsChange(newColumns);
  };

  const handleStartEdit = (column: ExportColumnConfig) => {
    setEditingId(column.id);
    setEditLabel(column.label);
  };

  const handleSaveEdit = (id: string) => {
    onColumnsChange(
      columns.map((col) =>
        col.id === id ? { ...col, label: editLabel.trim() } : col
      )
    );
    setEditingId(null);
    setEditLabel("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditLabel("");
  };

  // Group columns by type
  const mainColumns = sortedColumns.filter((col) => col.type === "main");
  const questionColumns = sortedColumns.filter((col) => col.type === "question_score");
  const aiColumns = sortedColumns.filter((col) => col.type === "ai_flag");

  const renderColumn = (column: ExportColumnConfig, index: number) => {
    const isEditing = editingId === column.id;

    return (
      <div
        key={column.id}
        className={`group flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border transition-all duration-200 ${
          column.enabled
            ? "bg-background border-border hover:border-primary/50 hover:shadow-sm"
            : "bg-muted/30 border-muted opacity-60 hover:opacity-100"
        }`}
      >
        {/* Drag handle */}
        <div className="cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Checkbox */}
        <Checkbox
          id={column.id}
          checked={column.enabled}
          onCheckedChange={() => handleToggle(column.id)}
          className="shrink-0"
        />

        {/* Label */}
        <div className="flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                className="h-8"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit(column.id);
                  if (e.key === "Escape") handleCancelEdit();
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => handleSaveEdit(column.id)}
              >
                <Check className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={handleCancelEdit}
              >
                <X className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Label
                htmlFor={column.id}
                className={`cursor-pointer ${
                  !column.enabled && "text-muted-foreground"
                }`}
              >
                {column.label}
              </Label>
              {column.questionNumber && (
                <Badge variant="outline" className="text-xs">
                  Q{column.questionNumber}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isEditing && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-primary/10"
              onClick={() => handleStartEdit(column)}
              title="Edit label"
            >
              <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          )}
          <div className="flex flex-col sm:flex-row gap-0">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-primary/10"
              onClick={() => handleMoveUp(column.id)}
              disabled={index === 0}
              title="Move up"
            >
              <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-primary/10"
              onClick={() => handleMoveDown(column.id)}
              disabled={index === sortedColumns.length - 1}
              title="Move down"
            >
              <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Main Columns */}
      {mainColumns.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#4472C4] flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#4472C4] shadow-sm" />
              Kolom Utama
            </h3>
            <Badge variant="secondary" className="text-xs">
              {mainColumns.filter((c) => c.enabled).length}/{mainColumns.length}
            </Badge>
          </div>
          <div className="space-y-1.5">
            {mainColumns.map((col) => renderColumn(col, sortedColumns.indexOf(col)))}
          </div>
        </div>
      )}

      {/* Question Scores */}
      {questionColumns.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#70AD47] flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#70AD47] shadow-sm" />
              Skor Per Soal
            </h3>
            <Badge variant="secondary" className="text-xs">
              {questionColumns.filter((c) => c.enabled).length}/{questionColumns.length}
            </Badge>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 scroll-smooth">
            {questionColumns.map((col) => renderColumn(col, sortedColumns.indexOf(col)))}
          </div>
        </div>
      )}

      {/* AI Flags */}
      {aiColumns.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#FFC000] flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FFC000] shadow-sm" />
              AI Detection
            </h3>
            <Badge variant="secondary" className="text-xs">
              {aiColumns.filter((c) => c.enabled).length}/{aiColumns.length}
            </Badge>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 scroll-smooth">
            {aiColumns.map((col) => renderColumn(col, sortedColumns.indexOf(col)))}
          </div>
        </div>
      )}
    </div>
  );
}
