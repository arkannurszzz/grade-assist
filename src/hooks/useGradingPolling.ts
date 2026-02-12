import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useGradingProgressQuery } from "@/lib/queries/session-detail";

interface UseGradingPollingOptions {
  sessionId: string;
  isGrading: boolean;
  onComplete: () => void;
}

export function useGradingPolling({
  sessionId,
  isGrading,
  onComplete,
}: UseGradingPollingOptions) {
  const pollCountRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  const hasCompletedRef = useRef(false);
  const hasSeenGradingRef = useRef(false); // Track if we've seen "grading" status
  const MAX_POLLS = 300; // 15 minutes max (300 * 3 seconds)

  // Keep onComplete ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Enable polling only when grading
  const { data: gradingProgress } = useGradingProgressQuery(
    sessionId,
    isGrading,
  );

  // Reset poll count when grading starts/stops
  useEffect(() => {
    if (!isGrading) {
      pollCountRef.current = 0;
      hasCompletedRef.current = false;
      hasSeenGradingRef.current = false;
    }
  }, [isGrading]);

  // Check grading progress
  useEffect(() => {
    if (!isGrading || !gradingProgress || hasCompletedRef.current) return;

    // Increment poll count
    pollCountRef.current += 1;

    console.log('[Polling]', {
      count: pollCountRef.current,
      status: gradingProgress.status,
      hasSeenGrading: hasSeenGradingRef.current,
    });

    // Check timeout
    if (pollCountRef.current >= MAX_POLLS) {
      hasCompletedRef.current = true;
      toast.error(
        "Grading timeout setelah 15 menit. Silakan refresh halaman atau hubungi admin.",
        { duration: 10000 },
      );
      onCompleteRef.current();
      return;
    }

    // Track when we see "grading" status
    if (gradingProgress.status === "grading") {
      hasSeenGradingRef.current = true;
    }

    // Check if grading is done - only trigger if we've seen "grading" status
    if (gradingProgress.status === "completed" && hasSeenGradingRef.current) {
      hasCompletedRef.current = true;
      toast.success("Penilaian selesai!");
      onCompleteRef.current();
    }
  }, [gradingProgress, isGrading]);

  return { gradingProgress };
}
