import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import { statusLabels } from "@/types/session";

interface SessionDetailHeaderProps {
  name: string;
  courseName: string | null;
  status: string;
  sessionId: string;
}

export function SessionDetailHeader({
  name,
  courseName,
  status,
  sessionId,
}: SessionDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">{name}</h1>
        {courseName && <p className="text-muted-foreground">{courseName}</p>}
      </div>
      <div className="flex items-center gap-3">
        {status === "completed" && (
          <Link href={`/sessions/${sessionId}/analytics`}>
            <Button variant="outline" size="sm">
              <BarChart3 className="mr-2 h-4 w-4" />
              AI Analytics
            </Button>
          </Link>
        )}
        <Badge variant="secondary">
          {statusLabels[status] || status}
        </Badge>
      </div>
    </div>
  );
}
