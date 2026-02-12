import { Search, X, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";

interface SessionFilters {
  search: string;
  status: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy: string;
}

interface SessionFiltersProps {
  filters: SessionFilters;
  onFiltersChange: (filters: Partial<SessionFilters>) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  resultsCount?: number;
  totalCount?: number;
}

export function SessionFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  hasActiveFilters,
  resultsCount,
  totalCount,
}: SessionFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama sesi atau mata kuliah..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              className="pl-9 pr-9"
            />
            {filters.search && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => onFiltersChange({ search: "" })}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-3">
            {/* Status Filter */}
            <div className="flex-1 min-w-45">
              <Label className="text-xs mb-1.5 block">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => onFiltersChange({ status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="ready">Siap Dinilai</SelectItem>
                  <SelectItem value="grading">Sedang Menilai</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="flex-1 min-w-45">
              <Label className="text-xs mb-1.5 block">Dari Tanggal</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFrom ? (
                      filters.dateFrom.toLocaleDateString("id-ID")
                    ) : (
                      <span className="text-muted-foreground">
                        Pilih tanggal
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => onFiltersChange({ dateFrom: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
            <div className="flex-1 min-w-45">
              <Label className="text-xs mb-1.5 block">Sampai Tanggal</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateTo ? (
                      filters.dateTo.toLocaleDateString("id-ID")
                    ) : (
                      <span className="text-muted-foreground">
                        Pilih tanggal
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => onFiltersChange({ dateTo: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Sort */}
            <div className="flex-1 min-w-45">
              <Label className="text-xs mb-1.5 block">Urutkan</Label>
              <Select
                value={filters.sortBy}
                onValueChange={(value) => onFiltersChange({ sortBy: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Terbaru</SelectItem>
                  <SelectItem value="oldest">Terlama</SelectItem>
                  <SelectItem value="name-asc">Nama A-Z</SelectItem>
                  <SelectItem value="name-desc">Nama Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearFilters}
                  className="h-9"
                >
                  <X className="mr-2 h-4 w-4" />
                  Reset Filter
                </Button>
              </div>
            )}
          </div>

          {/* Results Count */}
          {resultsCount !== undefined &&
            totalCount !== undefined &&
            resultsCount !== totalCount && (
              <p className="text-sm text-muted-foreground">
                Menampilkan {resultsCount} dari {totalCount} sesi
              </p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
