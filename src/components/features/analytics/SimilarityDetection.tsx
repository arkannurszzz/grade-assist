"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, AlertTriangle, Shield } from "lucide-react";

interface SimilarityStudent {
  studentId: string;
  studentName: string;
  answerText: string;
  isAIGenerated: boolean;
}

interface SimilarityGroup {
  questionNumber: number;
  questionText: string;
  groupId: string;
  similarityScore: number;
  studentCount: number;
  students: SimilarityStudent[];
}

interface SimilaritySummary {
  totalGroups: number;
  totalStudentsInvolved: number;
  aiGeneratedMatches: number;
  highRiskGroups: number;
}

interface SimilarityData {
  summary: SimilaritySummary;
  groups: SimilarityGroup[];
}

interface SimilarityDetectionProps {
  sessionId: string;
}

export function SimilarityDetection({ sessionId }: SimilarityDetectionProps) {
  const [data, setData] = useState<SimilarityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/similarity`)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Similarity Detection</CardTitle>
          <CardDescription>Analyzing answer patterns...</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Similarity Detection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Failed to load similarity data</p>
        </CardContent>
      </Card>
    );
  }

  const getRiskBadge = (score: number) => {
    if (score >= 0.9)
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Critical ({(score * 100).toFixed(0)}%)
        </Badge>
      );
    if (score >= 0.8)
      return (
        <Badge
          variant="secondary"
          className="gap-1 bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200"
        >
          <AlertTriangle className="h-3 w-3" />
          High ({(score * 100).toFixed(0)}%)
        </Badge>
      );
    return (
      <Badge
        variant="secondary"
        className="gap-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
      >
        Medium ({(score * 100).toFixed(0)}%)
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm flex items-center gap-2 min-w-0">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">Similar Groups</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {data.summary.totalGroups}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              detected
            </p>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm truncate min-w-0">
              Students Involved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {data.summary.totalStudentsInvolved}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              unique students
            </p>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm truncate min-w-0">
              AI + Similarity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-orange-600">
              {data.summary.aiGeneratedMatches}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              groups with AI
            </p>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm min-w-0">
              High Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-destructive">
              {data.summary.highRiskGroups}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              ≥85% similarity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Groups List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            Similar Answer Groups
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Mahasiswa dengan jawaban yang sangat mirip (≥70% similarity)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.groups.length === 0 ? (
            <Alert>
              <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
              <AlertDescription className="text-xs sm:text-sm">
                Tidak ada grup jawaban yang mirip terdeteksi. Semua jawaban
                unik.
              </AlertDescription>
            </Alert>
          ) : (
            data.groups.map((group) => (
              <div
                key={group.groupId}
                className="border rounded-lg overflow-hidden"
              >
                <div
                  className="p-3 sm:p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() =>
                    setExpandedGroup(
                      expandedGroup === group.groupId ? null : group.groupId,
                    )
                  }
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                        <h4 className="font-semibold text-xs sm:text-sm">
                          Soal {group.questionNumber}
                        </h4>
                        {getRiskBadge(group.similarityScore)}
                        <Badge variant="outline" className="text-xs">
                          {group.studentCount} students
                        </Badge>
                        {group.students.some((s) => s.isAIGenerated) && (
                          <Badge
                            variant="secondary"
                            className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 text-xs"
                          >
                            AI Detected
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                        {group.questionText}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedGroup(
                          expandedGroup === group.groupId
                            ? null
                            : group.groupId,
                        );
                      }}
                      className="text-xs shrink-0"
                    >
                      {expandedGroup === group.groupId ? "Hide" : "Show"}
                    </Button>
                  </div>
                </div>

                {expandedGroup === group.groupId && (
                  <div className="p-3 sm:p-4 space-y-3">
                    {group.students.map((student) => (
                      <div
                        key={student.studentId}
                        className="border rounded p-2 sm:p-3 space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs sm:text-sm truncate">
                              {student.studentName}
                            </p>
                            {student.isAIGenerated && (
                              <Badge
                                variant="destructive"
                                className="text-[10px] sm:text-xs mt-1"
                              >
                                AI Generated
                              </Badge>
                            )}
                          </div>
                          <Link
                            href={`/sessions/${sessionId}/students/${student.studentId}`}
                            className="w-full sm:w-auto"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs w-full sm:w-auto"
                            >
                              View Detail
                            </Button>
                          </Link>
                        </div>
                        <div className="bg-muted/50 p-2 rounded">
                          <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">
                            Answer:
                          </p>
                          <p className="text-xs sm:text-sm whitespace-pre-wrap wrap-break-word">
                            {student.answerText}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
