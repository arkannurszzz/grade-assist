import { memo } from "react";
import Link from "next/link";
import { Plus, Filter, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SessionCard } from "./SessionCard";
import { SessionCardSkeleton } from "@/components/shared/LoadingSkeleton";

interface Session {
  id: string;
  name: string;
  courseName: string | null;
  status: string;
  createdAt: string;
  _count: { submissions: number };
}

interface SessionsListProps {
  sessions: Session[];
  isLoading: boolean;
  isEmpty: boolean;
  isFiltered: boolean;
  statusLabels: Record<string, string>;
  onDelete: (id: string) => void;
  onClearFilters: () => void;
  isDeletingId?: string;
}

export const SessionsList = memo(function SessionsList({
  sessions,
  isLoading,
  isEmpty,
  isFiltered,
  statusLabels,
  onDelete,
  onClearFilters,
  isDeletingId,
}: SessionsListProps) {
  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SessionCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state - no sessions at all
  if (isEmpty) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12">
          <p className="text-muted-foreground">Belum ada sesi penilaian</p>
          <Link href="/sessions/new">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Buat Sesi Pertama
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Filtered but no results
  if (isFiltered && sessions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12">
          <Filter className="h-12 w-12 text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground font-medium">
            Tidak ada sesi yang sesuai dengan filter
          </p>
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            <X className="mr-2 h-4 w-4" />
            Reset Filter
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Sessions grid
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          statusLabel={statusLabels[session.status] || session.status}
          onDelete={onDelete}
          isDeleting={isDeletingId === session.id}
        />
      ))}
    </div>
  );
});
