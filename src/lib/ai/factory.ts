import type { AIProvider } from "@/types/ai-provider";
import { GeminiProvider } from "./gemini";

export function getAIProvider(
  provider: string = "gemini",
  apiKey: string,
  modelName?: string
): AIProvider {
  switch (provider) {
    case "gemini":
      return new GeminiProvider(apiKey, modelName ?? "gemini-2.0-flash");
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}
