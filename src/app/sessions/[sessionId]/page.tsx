"use client";

import { use, useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Upload, Play, Award } from "lucide-react";
import { toast } from "sonner";

// Components
import { SessionDetailHeader } from "@/components/features/session-detail/SessionDetailHeader";
import { AnswerKeyTab } from "./components/AnswerKeyTab";
import { SubmissionsTab } from "./components/SubmissionsTab";
import { GradingTab } from "./components/GradingTab";
import { FinalGradesTab } from "./components/FinalGradesTab";

// Hooks & Queries
import {
  useSessionDetailQuery,
  useAnswerKeyUploadMutation,
  useSubmissionsUploadMutation,
  useStartGradingMutation,
  useUpdateWeightsMutation,
  useDeleteSubmissionMutation,
  useResetGradingMutation,
} from "@/lib/queries/session-detail";
import { useGradingPolling } from "@/hooks/useGradingPolling";
import { useWeightsManager } from "@/hooks/useWeightsManager";

// Types
import type { GradingConfig } from "./components/GradingConfigDialog";

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);

  // TanStack Query - Remote State
  const {
    data: session,
    isLoading,
    refetch: refetchSession,
  } = useSessionDetailQuery(sessionId);

  // Mutations
  const answerKeyMutation = useAnswerKeyUploadMutation(sessionId);
  const submissionsMutation = useSubmissionsUploadMutation(sessionId);
  const startGradingMutation = useStartGradingMutation(sessionId);
  const updateWeightsMutation = useUpdateWeightsMutation(sessionId);
  const deleteSubmissionMutation = useDeleteSubmissionMutation(sessionId);
  const resetGradingMutation = useResetGradingMutation(sessionId);

  // Local UI state
  const [uploadStep, setUploadStep] = useState("");
  const [isGrading, setIsGrading] = useState(false);

  // Custom hooks
  const { weights, handleWeightChange, handleAutoFillWeights } =
    useWeightsManager(session ?? null);

  const handleGradingComplete = useCallback(() => {
    setIsGrading(false);
    refetchSession();
  }, [refetchSession]);

  const { gradingProgress } = useGradingPolling({
    sessionId,
    isGrading: session?.status === "grading" || isGrading,
    onComplete: handleGradingComplete,
  });

  // Event Handlers
  const handleAnswerKeyUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setUploadStep("Mengupload file...");

    try {
      await new Promise((r) => setTimeout(r, 100));
      setUploadStep("Membaca dokumen dan mengekstrak teks...");
      await new Promise((r) => setTimeout(r, 100));
      setUploadStep(
        "Menganalisis soal dengan AI (mungkin butuh 10-30 detik)...",
      );

      const result = await answerKeyMutation.mutateAsync(files[0]);
      const questions = (result as { questions?: unknown[] }).questions;
      toast.success(`Berhasil! ${questions?.length ?? 0} soal ditemukan.`);
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err.message || "Gagal upload kunci jawaban", {
        duration: 8000,
      });
    } finally {
      setUploadStep("");
    }
  };

  const handleSubmissionsUpload = async (files: File[]) => {
    if (files.length === 0) return;

    try {
      const result = await submissionsMutation.mutateAsync(files);
      const data = result as { success: number; total: number; failed: number };
      toast.success(`${data.success} dari ${data.total} file berhasil diupload`);
      if (data.failed > 0) {
        toast.error(`${data.failed} file gagal diproses`);
      }
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err.message || "Gagal upload jawaban mahasiswa");
    }
  };

  const handleStartGrading = async (config: GradingConfig) => {
    setIsGrading(true);

    try {
      await startGradingMutation.mutateAsync(config);
      toast.success("Penilaian dimulai...");
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err.message || "Gagal memulai penilaian");
      setIsGrading(false);
    }
  };

  const handleSaveWeights = () => {
    updateWeightsMutation.mutate(weights);
  };

  const handleDeleteSubmission = (submissionId: string) => {
    deleteSubmissionMutation.mutate(submissionId);
  };

  const handleResetGrading = () => {
    resetGradingMutation.mutate();
    setIsGrading(false);
  };

  // Loading & Error States
  if (isLoading) {
    return <p className="text-muted-foreground">Memuat...</p>;
  }

  if (!session) {
    return <p className="text-destructive">Sesi tidak ditemukan</p>;
  }

  const grading = session.status === "grading" || isGrading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <SessionDetailHeader
        name={session.name}
        courseName={session.courseName}
        status={session.status}
        sessionId={sessionId}
      />

      {/* Tabs */}
      <Tabs defaultValue="answer-key">
        <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
          <TabsList className="w-full md:w-auto inline-flex">
            <TabsTrigger value="answer-key" className="text-xs sm:text-sm whitespace-nowrap">
              <FileText className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Kunci Jawaban
            </TabsTrigger>
            <TabsTrigger value="submissions" className="text-xs sm:text-sm whitespace-nowrap">
              <Upload className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Jawaban Mahasiswa
            </TabsTrigger>
            <TabsTrigger value="grading" className="text-xs sm:text-sm whitespace-nowrap">
              <Play className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Penilaian & Hasil
            </TabsTrigger>
            <TabsTrigger value="final-grades" className="text-xs sm:text-sm whitespace-nowrap">
              <Award className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Nilai Akhir & Huruf Mutu
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="answer-key">
          <AnswerKeyTab
            session={session}
            uploading={answerKeyMutation.isPending}
            uploadStep={uploadStep}
            weights={weights}
            onAnswerKeyUpload={handleAnswerKeyUpload}
            onWeightChange={handleWeightChange}
            onSaveWeights={handleSaveWeights}
            onAutoFillWeights={handleAutoFillWeights}
          />
        </TabsContent>

        <TabsContent value="submissions">
          <SubmissionsTab
            session={session}
            sessionId={sessionId}
            uploadingSubmissions={submissionsMutation.isPending}
            isGrading={grading}
            deletingSubmission={
              deleteSubmissionMutation.isPending
                ? deleteSubmissionMutation.variables
                : null
            }
            onSubmissionsUpload={handleSubmissionsUpload}
            onDeleteSubmission={handleDeleteSubmission}
            onRefresh={refetchSession}
          />
        </TabsContent>

        <TabsContent value="grading">
          <GradingTab
            session={session}
            sessionId={sessionId}
            isGrading={grading}
            gradingProgress={gradingProgress ?? null}
            onStartGrading={handleStartGrading}
            onResetGrading={handleResetGrading}
          />
        </TabsContent>

        <TabsContent value="final-grades">
          <FinalGradesTab
            session={session}
            sessionId={sessionId}
            onRefresh={refetchSession}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
