"use client";

import { useMemo } from "react";
import { useSessionsQuery, useDeleteSessionMutation } from "@/lib/queries/sessions";
import { useSessionStore } from "@/stores/session-store";

// Feature components
import { SessionsHeader } from "@/components/features/sessions/SessionsHeader";
import { SessionFilters } from "@/components/features/sessions/SessionFilters";
import { SessionsList } from "@/components/features/sessions/SessionsList";

const statusLabels: Record<string, string> = {
  draft: "Draft",
  answer_key_uploaded: "Kunci Jawaban Terupload",
  ready: "Siap Dinilai",
  grading: "Sedang Menilai...",
  completed: "Selesai",
};

export default function SessionsPage() {
  // TanStack Query - Remote State
  const { data: sessions = [], isLoading } = useSessionsQuery();
  const deleteMutation = useDeleteSessionMutation();

  // Zustand - Global State for filters
  const { filters, setFilters, clearFilters } = useSessionStore();

  // Computed: Filter and sort sessions
  const filteredSessions = useMemo(() => {
    return sessions
      .filter((session) => {
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const nameMatch = session.name.toLowerCase().includes(searchLower);
          const courseMatch = session.courseName
            ?.toLowerCase()
            .includes(searchLower);
          if (!nameMatch && !courseMatch) return false;
        }

        // Status filter
        if (filters.status !== "all" && session.status !== filters.status) {
          return false;
        }

        // Date range filter
        const sessionDate = new Date(session.createdAt);
        if (filters.dateFrom && sessionDate < filters.dateFrom) return false;
        if (filters.dateTo) {
          const dateToEnd = new Date(filters.dateTo);
          dateToEnd.setHours(23, 59, 59, 999);
          if (sessionDate > dateToEnd) return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case "newest":
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          case "oldest":
            return (
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          case "name-asc":
            return a.name.localeCompare(b.name);
          case "name-desc":
            return b.name.localeCompare(a.name);
          default:
            return 0;
        }
      });
  }, [sessions, filters]);

  const hasActiveFilters =
    filters.status !== "all" || !!filters.dateFrom || !!filters.dateTo;

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <SessionsHeader />

      {/* Search and Filter Controls */}
      {!isLoading && sessions.length > 0 && (
        <SessionFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          resultsCount={filteredSessions.length}
          totalCount={sessions.length}
        />
      )}

      {/* Sessions List */}
      <SessionsList
        sessions={filteredSessions}
        isLoading={isLoading}
        isEmpty={sessions.length === 0}
        isFiltered={hasActiveFilters || filters.search !== ""}
        statusLabels={statusLabels}
        onDelete={handleDelete}
        onClearFilters={clearFilters}
        isDeletingId={
          deleteMutation.isPending ? deleteMutation.variables : undefined
        }
      />
    </div>
  );
}
