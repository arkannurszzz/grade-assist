import { GoogleGenAI } from "@google/genai";
import type {
  AIProvider,
  BatchGradingRequest,
  BatchGradingResponse,
  BatchAIDetectionRequest,
  BatchAIDetectionResponse,
  QAExtractionRequest,
  QAExtractionResponse,
  StudentAnswerExtractionRequest,
  StudentAnswerExtractionResponse,
} from "@/types/ai-provider";
import {
  BATCH_GRADING_PROMPT,
  BATCH_AI_DETECTION_PROMPT,
  QA_EXTRACTION_PROMPT,
  STUDENT_ANSWER_EXTRACTION_PROMPT,
} from "./prompts";
import { rateLimiter, withRetry } from "./rate-limiter";

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";
  readonly modelName: string;
  private client: GoogleGenAI;

  constructor(apiKey: string, modelName: string = "gemma-3n-e4b-it") {
    this.client = new GoogleGenAI({ apiKey });
    this.modelName = modelName;
  }

  private async generate<T>(prompt: string): Promise<T & { _raw?: string }> {
    await rateLimiter.acquire();
    try {
      console.log("=== CALLING GEMINI API ===");
      console.log("Model:", this.modelName);
      console.log("Prompt length:", prompt.length, "chars");
      console.log("=== END ===");

      const result = await withRetry(async () => {
        try {
          // JSON mode hanya untuk model yang support (Gemini, bukan Gemma Nano)
          const supportsJsonMode = !this.modelName.includes("gemma-3n");

          const response = await this.client.models.generateContent({
            model: this.modelName,
            contents: prompt,
            config: supportsJsonMode ? {
              responseMimeType: "application/json",
            } : {},
          });
          return response;
        } catch (error) {
          console.error("=== ERROR INSIDE GEMINI API CALL ===");
          console.error("Error:", error);
          console.error("Error message:", error instanceof Error ? error.message : String(error));
          console.error("=== END INNER ERROR ===");
          throw error;
        }
      });

      const text = result.text ?? "{}";
      console.log("=== GEMINI RAW RESPONSE ===");
      console.log("Response length:", text.length, "chars");
      console.log("Response:", text);
      console.log("=== END RAW RESPONSE ===");

      // Clean up response jika ada markdown code blocks
      let cleanText = text.trim();
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
      } else if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      // Parse JSON dengan error handling dan retry mechanism
      let parsed: T;
      try {
        parsed = JSON.parse(cleanText) as T;
      } catch (parseError) {
        console.error("=== JSON PARSE ERROR - FIRST ATTEMPT ===");
        console.error("Failed to parse, trying to fix common issues...");
        console.error("Parse error:", parseError);

        // Try to fix common JSON issues
        try {
          // Attempt 2: Try to extract JSON from the response if wrapped in text
          const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            cleanText = jsonMatch[0];
            console.log("Extracted JSON from text, retrying parse...");
            parsed = JSON.parse(cleanText) as T;
          } else {
            throw parseError;
          }
        } catch (retryError) {
          console.error("=== JSON PARSE ERROR - FINAL ===");
          console.error("Failed to parse AI response as JSON even after cleanup");
          console.error("Raw text length:", text.length);
          console.error("Cleaned text preview:", cleanText.substring(0, 500));
          console.error("Parse error:", parseError);
          console.error("=== END JSON PARSE ERROR ===");

          // For AI detection and grading, return a safe default rather than crashing
          // This allows grading to continue even if one response fails
          console.warn("⚠️ Returning safe default due to JSON parse failure");

          // Check if this is AI detection or grading based on structure
          if (cleanText.includes('"results"') && cleanText.includes('"isAIGenerated"')) {
            // AI Detection fallback - mark as uncertain
            parsed = {
              results: [{
                questionNumber: 1,
                isAIGenerated: false,
                confidence: 0.5,
                isCopyPasted: false,
                similarityScore: 0,
                suspectedParts: [],
                analysis: "Failed to parse AI detection response. Marked as uncertain."
              }]
            } as T;
          } else {
            throw new Error(
              `Failed to parse AI response as JSON. Response might be malformed. ` +
              `First 200 chars: ${cleanText.substring(0, 200)}`
            );
          }
        }
      }

      return { ...parsed, _raw: text } as T & { _raw?: string };
    } catch (error) {
      console.error("=== GEMINI GENERATE ERROR ===");
      console.error("Error in generate method:", error);
      console.error("=== END ===");
      throw error;
    } finally {
      rateLimiter.release();
    }
  }

  async gradeAnswers(
    request: BatchGradingRequest,
  ): Promise<BatchGradingResponse> {
    const prompt = BATCH_GRADING_PROMPT(request);
    return this.generate<BatchGradingResponse>(prompt);
  }

  async detectAI(
    request: BatchAIDetectionRequest,
  ): Promise<BatchAIDetectionResponse> {
    const prompt = BATCH_AI_DETECTION_PROMPT(request);
    return this.generate<BatchAIDetectionResponse>(prompt);
  }

  async extractQAPairs(
    request: QAExtractionRequest,
  ): Promise<QAExtractionResponse> {
    const prompt = QA_EXTRACTION_PROMPT(request);
    return this.generate<QAExtractionResponse>(prompt);
  }

  async extractStudentAnswers(
    request: StudentAnswerExtractionRequest,
  ): Promise<StudentAnswerExtractionResponse> {
    const prompt = STUDENT_ANSWER_EXTRACTION_PROMPT(request);
    return this.generate<StudentAnswerExtractionResponse>(prompt);
  }
}
