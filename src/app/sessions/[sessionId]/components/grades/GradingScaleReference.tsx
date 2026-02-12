import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GradeScaleItem } from "@/types/session";
import { GradingScaleDialog } from "../GradingScaleDialog";

interface GradingScaleReferenceProps {
  sessionId: string;
  gradingScale: GradeScaleItem[];
  onUpdate: () => void;
}

export function GradingScaleReference({
  sessionId,
  gradingScale,
  onUpdate,
}: GradingScaleReferenceProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Skala Penilaian</CardTitle>
            <CardDescription>
              Acuan konversi nilai ke huruf mutu
            </CardDescription>
          </div>
          <GradingScaleDialog
            sessionId={sessionId}
            currentScale={gradingScale}
            onUpdate={onUpdate}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {gradingScale.map((scale) => (
            <div key={scale.grade} className="rounded-lg border p-3 space-y-2">
              <Badge
                variant={
                  scale.color as "default" | "secondary" | "destructive"
                }
                className="text-xl font-bold w-full justify-center py-2"
              >
                {scale.grade}
              </Badge>
              <div className="text-center">
                <p className="text-sm font-medium">{scale.description}</p>
                <p className="text-xs text-muted-foreground">
                  {scale.min} - {scale.max}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
