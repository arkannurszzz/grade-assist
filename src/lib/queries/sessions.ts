import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, mutateWithToast } from "@/lib/api-client";

// Types
interface Session {
  id: string;
  name: string;
  courseName: string | null;
  status: string;
  createdAt: string;
  _count: { submissions: number };
}

// Query Keys
export const sessionKeys = {
  all: ["sessions"] as const,
  lists: () => [...sessionKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...sessionKeys.lists(), filters] as const,
  details: () => [...sessionKeys.all, "detail"] as const,
  detail: (id: string) => [...sessionKeys.details(), id] as const,
};

// Queries
export function useSessionsQuery() {
  return useQuery({
    queryKey: sessionKeys.lists(),
    queryFn: () => apiClient.get<Session[]>("/api/sessions"),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useSessionQuery(sessionId: string) {
  return useQuery({
    queryKey: sessionKeys.detail(sessionId),
    queryFn: () => apiClient.get(`/api/sessions/${sessionId}`),
    enabled: !!sessionId,
  });
}

// Mutations
export function useDeleteSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      mutateWithToast(
        () => apiClient.delete(`/api/sessions/${id}`),
        {
          loading: "Menghapus sesi...",
          success: "Sesi berhasil dihapus",
          error: "Gagal menghapus sesi",
        }
      ),
    // Optimistic update - instant feedback!
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: sessionKeys.lists() });

      // Snapshot the previous value
      const previousSessions = queryClient.getQueryData<Session[]>(
        sessionKeys.lists()
      );

      // Optimistically update to remove the session
      queryClient.setQueryData<Session[]>(sessionKeys.lists(), (old) =>
        old ? old.filter((session) => session.id !== deletedId) : []
      );

      // Return context with previous data for rollback
      return { previousSessions };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousSessions) {
        queryClient.setQueryData(sessionKeys.lists(), context.previousSessions);
      }
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
    },
  });
}

export function useCreateSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; courseName?: string }) =>
      apiClient.post("/api/sessions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
    },
  });
}
