"use client";

import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export interface StudentFilterOptions {
  search: string;
  grades: string[];
  statuses: string[];
  aiDetected: boolean | null;
}

interface StudentSearchFilterProps {
  filters: StudentFilterOptions;
  onFiltersChange: (filters: StudentFilterOptions) => void;
  availableGrades?: string[];
  availableStatuses?: string[];
  showAIFilter?: boolean;
  showStatusFilter?: boolean;
}

export function StudentSearchFilter({
  filters,
  onFiltersChange,
  availableGrades = ["A", "B", "C", "D", "E"],
  availableStatuses = ["graded", "pending", "error"],
  showAIFilter = true,
  showStatusFilter = true,
}: StudentSearchFilterProps) {
  const hasActiveFilters =
    filters.grades.length > 0 ||
    filters.statuses.length > 0 ||
    filters.aiDetected !== null;

  const clearFilters = () => {
    onFiltersChange({
      search: filters.search,
      grades: [],
      statuses: [],
      aiDetected: null,
    });
  };

  const toggleGrade = (grade: string) => {
    const newGrades = filters.grades.includes(grade)
      ? filters.grades.filter((g) => g !== grade)
      : [...filters.grades, grade];
    onFiltersChange({ ...filters, grades: newGrades });
  };

  const toggleStatus = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onFiltersChange({ ...filters, statuses: newStatuses });
  };

  const statusLabels: Record<string, string> = {
    graded: "Sudah Dinilai",
    pending: "Menunggu",
    error: "Error",
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari nama mahasiswa atau file..."
          value={filters.search}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          className="pl-9 pr-9"
        />
        {filters.search && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => onFiltersChange({ ...filters, search: "" })}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filter Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="mr-2 h-4 w-4" />
            Filter
            {hasActiveFilters && (
              <Badge
                variant="destructive"
                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
              >
                {filters.grades.length +
                  filters.statuses.length +
                  (filters.aiDetected !== null ? 1 : 0)}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Filter</h4>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-auto p-1 text-xs"
                >
                  Reset
                </Button>
              )}
            </div>

            {/* Grade Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Huruf Mutu</Label>
              <div className="flex flex-wrap gap-2">
                {availableGrades.map((grade) => (
                  <Button
                    key={grade}
                    variant={
                      filters.grades.includes(grade) ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => toggleGrade(grade)}
                    className="h-8 w-10"
                  >
                    {grade}
                  </Button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            {showStatusFilter && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <div className="space-y-2">
                  {availableStatuses.map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={filters.statuses.includes(status)}
                        onCheckedChange={() => toggleStatus(status)}
                      />
                      <label
                        htmlFor={`status-${status}`}
                        className="text-sm cursor-pointer"
                      >
                        {statusLabels[status] || status}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Detection Filter */}
            {showAIFilter && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Deteksi AI</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ai-detected-yes"
                      checked={filters.aiDetected === true}
                      onCheckedChange={(checked) =>
                        onFiltersChange({
                          ...filters,
                          aiDetected: checked ? true : null,
                        })
                      }
                    />
                    <label
                      htmlFor="ai-detected-yes"
                      className="text-sm cursor-pointer"
                    >
                      Terdeteksi AI
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ai-detected-no"
                      checked={filters.aiDetected === false}
                      onCheckedChange={(checked) =>
                        onFiltersChange({
                          ...filters,
                          aiDetected: checked ? false : null,
                        })
                      }
                    />
                    <label
                      htmlFor="ai-detected-no"
                      className="text-sm cursor-pointer"
                    >
                      Tidak Terdeteksi AI
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
