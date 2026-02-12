import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDocument, getFileType } from "@/lib/parsers";
import { getAIProvider } from "@/lib/ai/factory";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    // Parse document
    let rawText: string;
    try {
      const fileType = getFileType(file.name);
      const buffer = Buffer.from(await file.arrayBuffer());
      rawText = await parseDocument(buffer, fileType);
    } catch (parseError) {
      const msg = parseError instanceof Error ? parseError.message : "Unknown error";
      return NextResponse.json(
        { error: `Gagal membaca file: ${msg}` },
        { status: 400 }
      );
    }

    if (!rawText.trim()) {
      return NextResponse.json(
        { error: "Tidak bisa mengekstrak teks dari file. Pastikan file berisi teks, bukan scan/gambar." },
        { status: 400 }
      );
    }

    // Get API key
    const appSettings = await prisma.appSettings.findUnique({
      where: { id: "default" },
    });
    const apiKey = process.env.GEMINI_API_KEY || appSettings?.geminiApiKey || "";

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key belum dikonfigurasi. Buka menu Pengaturan untuk menambahkan Gemini API key." },
        { status: 400 }
      );
    }

    const session = await prisma.gradingSession.findUnique({
      where: { id: sessionId },
      include: { settings: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
    }

    const provider = getAIProvider(
      session.settings?.aiProvider ?? "gemini",
      apiKey,
      session.settings?.modelName
    );

    // Extract Q&A pairs using AI
    let extracted;
    let rawGeminiResponse = "";
    try {
      const language = (session.settings?.language as "id" | "en") ?? "id";
      console.log("=== SENDING TO GEMINI ===");
      console.log("Model:", session.settings?.modelName || "gemma-3n-e4b-it");
      console.log("Raw Text Length:", rawText.length, "chars");
      console.log("=== END ===");

      extracted = await provider.extractQAPairs({ rawText, language });
      rawGeminiResponse = (extracted as { _raw?: string })._raw || "";
    } catch (aiError) {
      // Log semua error terlebih dahulu
      console.error("=== GEMINI ERROR ===");
      console.error("Error object:", aiError);
      console.error("Error type:", typeof aiError);
      console.error("Error keys:", Object.keys(aiError || {}));
      if (aiError instanceof Error) {
        console.error("Error message:", aiError.message);
        console.error("Error stack:", aiError.stack);
      }
      console.error("Full error JSON:", JSON.stringify(aiError, null, 2));
      console.error("=== END ERROR ===");

      const status = (aiError as { status?: number }).status;
      if (status === 429) {
        return NextResponse.json(
          {
            error: "Kuota API Gemini habis. Coba lagi dalam beberapa menit atau ganti API key.",
            debug: {
              errorDetails: aiError instanceof Error ? aiError.message : String(aiError),
              errorType: typeof aiError,
              status
            }
          },
          { status: 429 }
        );
      }
      const msg = aiError instanceof Error ? aiError.message : "Unknown error";
      return NextResponse.json(
        {
          error: `Gagal menganalisis dokumen dengan AI: ${msg}`,
          debug: {
            errorDetails: msg,
            fullError: String(aiError)
          }
        },
        { status: 500 }
      );
    }

    if (!extracted.pairs || extracted.pairs.length === 0) {
      return NextResponse.json(
        {
          error: "AI tidak bisa menemukan soal dalam dokumen. Pastikan format dokumen berisi soal dan jawaban yang jelas.",
          debug: {
            rawGeminiResponse,
            rawTextLength: rawText.length,
            rawTextPreview: rawText.substring(0, 500)
          }
        },
        { status: 400 }
      );
    }

    // Run AI detection on answer key
    let aiDetectionConfidence: number | null = null;
    let aiDetectionWarning: string | null = null;

    try {
      const language = (session.settings?.language as "id" | "en") ?? "id";
      const detectionItems = extracted.pairs.map((pair) => ({
        questionNumber: pair.questionNumber,
        questionText: pair.questionText,
        studentAnswer: pair.correctAnswer,
      }));

      const detectionResult = await provider.detectAI({
        items: detectionItems,
        language,
      });

      // Calculate average confidence
      const confidences = detectionResult.results.map((r) => r.confidence);
      const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
      aiDetectionConfidence = avgConfidence;

      // Check if any answer is detected as AI
      const aiDetectedCount = detectionResult.results.filter(
        (r) => r.isAIGenerated
      ).length;

      if (aiDetectedCount > 0 || avgConfidence > 0.6) {
        aiDetectionWarning =
          aiDetectedCount > 0
            ? `${aiDetectedCount} dari ${extracted.pairs.length} jawaban terdeteksi AI-generated (confidence: ${(avgConfidence * 100).toFixed(0)}%). Disarankan untuk menulis ulang kunci jawaban secara manual agar lebih authentic.`
            : `Kunci jawaban memiliki confidence score ${(avgConfidence * 100).toFixed(0)}%. Meskipun tidak terdeteksi sebagai AI, disarankan untuk review manual.`;
      }
    } catch (detectionError) {
      console.warn("AI detection failed for answer key:", detectionError);
      // Continue anyway - detection failure should not block upload
    }

    // Delete existing answer key if any
    const existing = await prisma.answerKey.findUnique({
      where: { sessionId },
    });
    if (existing) {
      await prisma.answerKey.delete({ where: { id: existing.id } });
    }

    // Create answer key with questions and AI detection results
    const fileType = getFileType(file.name);
    const answerKey = await prisma.answerKey.create({
      data: {
        sessionId,
        fileName: file.name,
        fileType,
        rawText,
        parsedAt: new Date(),
        aiDetectionConfidence,
        aiDetectionWarning,
        questions: {
          create: extracted.pairs.map((pair) => ({
            questionNumber: pair.questionNumber,
            questionText: pair.questionText,
            correctAnswer: pair.correctAnswer,
            weight: 1.0,
          })),
        },
      },
      include: {
        questions: { orderBy: { questionNumber: "asc" } },
      },
    });

    await prisma.gradingSession.update({
      where: { id: sessionId },
      data: { status: "answer_key_uploaded" },
    });

    return NextResponse.json({
      ...answerKey,
      aiDetection: {
        confidence: aiDetectionConfidence,
        warning: aiDetectionWarning,
        hasWarning: aiDetectionWarning !== null,
      },
      debug: {
        rawGeminiResponse,
        modelUsed: session.settings?.modelName || "gemma-3n-e4b-it",
        promptLength: rawText.length,
        questionsExtracted: extracted.pairs.length
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Answer key upload error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Coba lagi." },
      { status: 500 }
    );
  }
}
