import type {
  BatchGradingRequest,
  BatchAIDetectionRequest,
  QAExtractionRequest,
  StudentAnswerExtractionRequest,
} from "@/types/ai-provider";

export function QA_EXTRACTION_PROMPT(request: QAExtractionRequest): string {
  const langInstruction =
    request.language === "id"
      ? "Dokumen ini dalam Bahasa Indonesia."
      : "This document is in English.";

  return `You are an academic document parser. ${langInstruction}

Extract all question-answer pairs from the following document text. This is an answer key document containing questions and their correct answers.

Rules:
- Identify each numbered question and its corresponding correct answer.
- Preserve the original question numbering.
- If a question spans multiple lines, combine them.
- If the answer is immediately after the question (common format: question followed by "Jawaban:" or "Answer:"), extract both.
- If the document has a separate "Kunci Jawaban" / "Answer Key" section, map questions to their answers.
- Return ONLY valid JSON, no other text.

Document text:
---
${request.rawText}
---

Return JSON in this exact format:
{
  "pairs": [
    {
      "questionNumber": 1,
      "questionText": "the full question text",
      "correctAnswer": "the correct answer text"
    }
  ]
}`;
}

export function STUDENT_ANSWER_EXTRACTION_PROMPT(
  request: StudentAnswerExtractionRequest
): string {
  const lang = request.language === "id" ? "Bahasa Indonesia" : "English";

  return `You are an academic document parser. Extract the student's answers from this submission document.

Language: ${lang}
Expected question numbers: ${request.questionNumbers.join(", ")}

Rules:
- Match each answer to its corresponding question number.
- If a student skipped a question, use empty string for answerText.
- Combine multi-line answers into a single text block.
- Return ONLY valid JSON.

Student submission text:
---
${request.rawText}
---

Return JSON:
{
  "answers": [
    {
      "questionNumber": 1,
      "answerText": "the student's answer text"
    }
  ]
}`;
}

export function BATCH_GRADING_PROMPT(request: BatchGradingRequest): string {
  const strictnessGuide = {
    lenient:
      "Be generous. Accept answers that show understanding even if wording differs significantly. Partial credit is encouraged.",
    moderate:
      "Accept answers that demonstrate understanding. Minor errors in terminology or incomplete answers receive partial credit.",
    strict:
      "Require precise, complete answers. Deduct for missing key points, incorrect terminology, or incomplete reasoning.",
  };

  const lang = request.language === "id" ? "Bahasa Indonesia" : "English";

  const questionsBlock = request.questions
    .map(
      (q) => `
--- Question ${q.questionNumber} ---
Question: ${q.questionText}
Correct Answer: ${q.correctAnswer}
Student Answer: ${q.studentAnswer}`
    )
    .join("\n");

  return `You are an academic grading assistant. Grade ALL of the following questions for one student.

Strictness: ${request.strictness} - ${strictnessGuide[request.strictness]}
Language: ${lang}

${questionsBlock}

For each question, evaluate the student's answer against the correct answer and provide:
1. A score from 0.0 to 1.0 (0 = completely wrong, 1 = perfectly correct)
2. Brief feedback explaining the score (in ${lang})

CRITICAL: In "feedback" field, use plain text WITHOUT quotes or apostrophes to avoid JSON parsing errors.

Return ONLY valid JSON:
{
  "results": [
    {
      "questionNumber": 1,
      "score": 0.85,
      "feedback": "explanation here"
    }
  ]
}`;
}

export function BATCH_AI_DETECTION_PROMPT(
  request: BatchAIDetectionRequest
): string {
  const lang = request.language === "id" ? "Bahasa Indonesia" : "English";

  const itemsBlock = request.items
    .map(
      (item) => `
--- Answer ${item.questionNumber} ---
Question: ${item.questionText}
Student Answer: ${item.studentAnswer}`
    )
    .join("\n");

  return `You are an academic integrity analyst specializing in AI-generated content detection. Your goal is to detect PATTERNS that indicate AI usage, NOT to judge writing quality.

Language context: ${lang}

${itemsBlock}

CRITICAL PRINCIPLE: Focus on STRUCTURAL PATTERNS across answers, NOT formality level or writing quality. A well-written formal answer is NOT automatically AI. A casual informal answer is NOT automatically human.

**PRIMARY AI Indicators (Cross-Answer Pattern Analysis):**

1. **IDENTICAL STRUCTURAL TEMPLATE** (STRONGEST indicator)
   - ALL answers follow the exact same format (e.g., definition → bullet points → example)
   - ALL answers use identical heading patterns (e.g., "• Pentingnya:", "• Cara:", "• Manfaat:")
   - ALL answers have the same number of sections or paragraphs
   - Example: If 7 answers all start with definition, then bullet points, then conclusion - HIGH SUSPICION

2. **FORMATTING CONSISTENCY** (STRONG indicator)
   - ALL answers use bullet points with identical symbols/style
   - Perfect alignment and spacing that's consistent across ALL answers
   - Technical terms CONSISTENTLY in parentheses: "(frontend)", "(backend)" - ChatGPT signature
   - Example: Every answer has 3 bullet points with "•" symbol - SUSPICIOUS

3. **ZERO VARIATION** (STRONG indicator)
   - No stylistic differences between answers (tone, structure, approach)
   - All answers roughly same length (within 20% variance)
   - No question gets a shorter/longer treatment based on difficulty
   - Example: Simple question gets same detail level as complex question - SUSPICIOUS

4. **UNNATURAL PERFECTION** (MODERATE indicator when combined with others)
   - Zero typos across ALL answers (not per answer, but across the set)
   - Zero colloquialisms or personal expression across ALL answers
   - No informal transitional phrases ("jadi", "nah", "terus", "soalnya")

**HUMAN Indicators (Override AI suspicion):**

1. **STRUCTURAL VARIATION** (STRONGEST human indicator)
   - Different approaches to different questions
   - Some answers use bullets, some use paragraphs, some use analogies
   - Inconsistent formatting (different spacing, heading styles, organization)
   - Example: Q1 has bullets, Q2 is paragraph, Q3 has analogy - LIKELY HUMAN

2. **STYLISTIC INCONSISTENCY**
   - Tone varies between answers (some formal, some casual)
   - Answer length proportional to question complexity
   - Personal voice or examples ("menurut saya", "pengalaman saya", "seperti yang saya tahu")

3. **NATURAL IMPERFECTIONS**
   - Minor typos, missing words, or unclear phrasing (even 1-2 across all answers)
   - Informal language mixed with formal ("jadi intinya adalah...", "pada dasarnya sih...")
   - Conversational connectors ("nah", "terus", "makanya", "soalnya")

**IMPORTANT: Language Style Does NOT Indicate AI:**
- Formal academic Indonesian = CAN BE human (many students write formally)
- Informal slang Indonesian = CAN BE AI (AI can be prompted to write casually)
- Good grammar = NOT AI indicator (good students exist!)
- Technical vocabulary = NOT AI indicator (students can be knowledgeable)

**Copy-Paste Indicators:**
- Sudden formatting shift mid-document
- References to sources not available to students
- Content beyond question scope

**Decision Framework:**
- Focus on PATTERN across ALL answers, not individual answer quality
- isAIGenerated: true ONLY if 2+ PRIMARY indicators present
- confidence >= 0.8: Clear repetitive pattern across answers
- confidence 0.5-0.7: Some patterns but with variations
- confidence < 0.4: Natural variation between answers

**CRITICAL - JSON FORMAT RULES:**
- Return ONLY valid JSON, no markdown blocks
- In "analysis" and "reason" fields: Use simple plain text WITHOUT quotes or apostrophes
- Replace apostrophes with nothing or rephrase without them
- Keep text concise and avoid complex punctuation that breaks JSON

Return JSON:
{
  "results": [
    {
      "questionNumber": 1,
      "isAIGenerated": false,
      "confidence": 0.3,
      "isCopyPasted": false,
      "similarityScore": 0.1,
      "suspectedParts": [
        {
          "start": 0,
          "end": 150,
          "text": "the suspected text snippet",
          "reason": "reason for suspicion in ${lang}"
        }
      ],
      "analysis": "Detailed analysis in ${lang}"
    }
  ]
}`;
}
