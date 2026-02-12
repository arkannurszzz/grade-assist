import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Session, Question } from "@/types/session";

export function useWeightsManager(session: Session | null) {
  const [weights, setWeights] = useState<Record<string, number>>({});

  // Initialize weights from session data
  useEffect(() => {
    if (session?.answerKey?.questions) {
      const w: Record<string, number> = {};
      session.answerKey.questions.forEach((q: Question) => {
        w[q.id] = q.weight;
      });
      setWeights(w);
    }
  }, [session]);

  const handleWeightChange = (questionId: string, value: number) => {
    setWeights((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleAutoFillWeights = () => {
    if (!session?.answerKey?.questions) return;

    const questionCount = session.answerKey.questions.length;
    const equalWeight = Math.round((100 / questionCount) * 10) / 10;

    const newWeights: Record<string, number> = {};
    session.answerKey.questions.forEach((q) => {
      newWeights[q.id] = equalWeight;
    });

    setWeights(newWeights);
    toast.success(
      `Bobot otomatis diisi: ${equalWeight} per soal (${questionCount} soal)`,
    );
  };

  return {
    weights,
    handleWeightChange,
    handleAutoFillWeights,
  };
}
