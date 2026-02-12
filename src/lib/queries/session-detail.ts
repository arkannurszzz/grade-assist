import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, mutateWithToast } from "@/lib/api-client";
import type { Session, GradingProgress } from "@/types/session";
import type { GradingConfig } from "@/app/sessions/[sessionId]/components/GradingConfigDialog";

// Query Keys
export const sessionDetailKeys = {
  all: ["session-detail"] as const,
  detail: (id: string) => [...sessionDetailKeys.all, id] as const,
  gradingProgress: (id: string) =>
    [...sessionDetailKeys.all, id, "grading-progress"] as const,
};

// Queries
export function useSessionDetailQuery(sessionId: string) {
  return useQuery({
    queryKey: sessionDetailKeys.detail(sessionId),
    queryFn: () => apiClient.get<Session>(`/api/sessions/${sessionId}`),
    staleTime: 10 * 1000, // 10 seconds - detail page needs fresher data
  });
}

export function useGradingProgressQuery(sessionId: string, enabled: boolean) {
  return useQuery({
    queryKey: sessionDetailKeys.gradingProgress(sessionId),
    queryFn: () =>
      apiClient.get<GradingProgress>(`/api/sessions/${sessionId}/grade`),
    enabled,
    refetchInterval: enabled ? 3000 : false, // Poll every 3 seconds when enabled
    staleTime: 0, // Always fetch fresh
    gcTime: 0, // Immediately cleanup when no observers - prevent background polling
  });
}

// Mutations
export function useAnswerKeyUploadMutation(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiClient.post(`/api/sessions/${sessionId}/answer-key`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sessionDetailKeys.detail(sessionId),
      });
    },
  });
}

export function useSubmissionsUploadMutation(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      return apiClient.post(
        `/api/sessions/${sessionId}/submissions`,
        formData,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sessionDetailKeys.detail(sessionId),
      });
    },
  });
}

export function useStartGradingMutation(sessionId: string) {
  return useMutation({
    mutationFn: async (config: GradingConfig) => {
      try {
        // Update settings first
        await apiClient.put(`/api/sessions/${sessionId}/settings`, {
          gradingStrictness: config.strictness,
          enableAIDetection: config.enableAIDetection,
          aiPenaltyPercent: config.aiPenaltyPercent,
          copyPenaltyPercent: config.copyPenaltyPercent,
          aiDetectionThreshold: config.aiDetectionThreshold,
          language: config.language,
        });

        // Start grading
        return apiClient.post(`/api/sessions/${sessionId}/grade`);
      } catch (error) {
        // Add context to error message
        const err = error as { message?: string };
        throw new Error(
          err.message?.includes("settings")
            ? "Gagal update settings: " + err.message
            : err.message?.includes("grade")
              ? "Settings tersimpan, tapi gagal start grading: " + err.message
              : err.message || "Gagal memulai penilaian"
        );
      }
    },
    // Don't invalidate immediately - let polling handle status updates
    // This prevents race condition where UI shows "completed" before grading starts
  });
}

export function useUpdateWeightsMutation(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (weights: Record<string, number>) =>
      mutateWithToast(
        () => apiClient.put(`/api/sessions/${sessionId}`, { weights }),
        {
          loading: "Menyimpan bobot...",
          success: "Bobot berhasil disimpan",
          error: "Gagal menyimpan bobot",
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sessionDetailKeys.detail(sessionId),
      });
    },
  });
}

export function useDeleteSubmissionMutation(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (submissionId: string) =>
      mutateWithToast(
        () =>
          apiClient.delete(
            `/api/sessions/${sessionId}/submissions/${submissionId}`,
          ),
        {
          loading: "Menghapus submission...",
          success: "Submission berhasil dihapus",
          error: "Gagal menghapus submission",
        },
      ),
    // Optimistic update - instant feedback!
    onMutate: async (deletedSubmissionId) => {
      await queryClient.cancelQueries({
        queryKey: sessionDetailKeys.detail(sessionId),
      });

      const previousSession = queryClient.getQueryData<Session>(
        sessionDetailKeys.detail(sessionId),
      );

      // Optimistically remove submission
      queryClient.setQueryData<Session>(
        sessionDetailKeys.detail(sessionId),
        (old) =>
          old
            ? {
                ...old,
                submissions: old.submissions.filter(
                  (s) => s.id !== deletedSubmissionId,
                ),
              }
            : old,
      );

      return { previousSession };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousSession) {
        queryClient.setQueryData(
          sessionDetailKeys.detail(sessionId),
          context.previousSession,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: sessionDetailKeys.detail(sessionId),
      });
    },
  });
}

export function useResetGradingMutation(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      mutateWithToast(
        () => apiClient.post(`/api/sessions/${sessionId}/reset`),
        {
          loading: "Mereset status...",
          success: "Status berhasil direset. Silakan coba grading ulang.",
          error: "Gagal reset status",
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sessionDetailKeys.detail(sessionId),
      });
    },
  });
}
