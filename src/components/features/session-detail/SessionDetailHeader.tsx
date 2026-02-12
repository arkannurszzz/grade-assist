import { Badge } from "@/components/ui/badge";
import { statusLabels } from "@/types/session";

interface SessionDetailHeaderProps {
  name: string;
  courseName: string | null;
  status: string;
}

export function SessionDetailHeader({
  name,
  courseName,
  status,
}: SessionDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">{name}</h1>
        {courseName && <p className="text-muted-foreground">{courseName}</p>}
      </div>
      <Badge variant="secondary">
        {statusLabels[status] || status}
      </Badge>
    </div>
  );
}
