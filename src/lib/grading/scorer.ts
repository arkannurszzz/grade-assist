interface ScoreInput {
  score: number;
  weight: number;
  aiDetected: boolean;
  aiConfidence: number;
  isCopyPasted: boolean;
  aiPenaltyPercent: number;
  copyPenaltyPercent: number;
  aiDetectionThreshold: number;
}

interface ScoreResult {
  weightedScore: number;
  penaltyApplied: number;
  adjustedWeightedScore: number;
}

export function calculateScore(input: ScoreInput): ScoreResult {
  // Ensure weight is positive to avoid NaN
  const safeWeight = Math.max(input.weight, 0.1);
  const weightedScore = input.score * safeWeight;
  let penaltyApplied = 0;

  // Sum penalties (both can apply if both conditions are met)
  if (input.aiDetected && input.aiConfidence >= input.aiDetectionThreshold) {
    penaltyApplied += input.aiPenaltyPercent / 100;
  }

  if (input.isCopyPasted) {
    penaltyApplied += input.copyPenaltyPercent / 100;
  }

  // Cap penalty at 100% (1.0) to avoid negative scores
  penaltyApplied = Math.min(penaltyApplied, 1.0);

  const adjustedWeightedScore = weightedScore * (1 - penaltyApplied);

  return {
    weightedScore,
    penaltyApplied,
    adjustedWeightedScore,
  };
}

export function calculateTotalScore(
  scores: ScoreResult[],
  weights: number[]
): { totalScore: number; maxScore: number; percentage: number } {
  // Validate that scores and weights arrays match in length
  if (scores.length !== weights.length) {
    console.warn(
      `Score/weight mismatch: ${scores.length} scores vs ${weights.length} weights. Using available data.`
    );
  }

  const totalScore = scores.reduce((sum, s) => sum + s.adjustedWeightedScore, 0);
  const maxScore = weights.reduce((sum, w) => sum + w, 0);

  // Prevent division by zero
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  return { totalScore, maxScore, percentage };
}
