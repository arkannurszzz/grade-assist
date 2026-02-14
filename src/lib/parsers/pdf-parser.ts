export async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    // Validate buffer
    if (!buffer || buffer.length === 0) {
      throw new Error("PDF buffer is empty or invalid");
    }

    // Dynamically import unpdf (pure JS, works in serverless)
    const { extractText } = await import("unpdf");

    // Extract text from PDF
    const { text } = await extractText(buffer, {
      mergePages: true, // Combine all pages into single text
    });

    // Validate result
    if (!text || text.trim().length === 0) {
      throw new Error(
        "PDF contains no readable text. It might be image-based or corrupted."
      );
    }

    return text.trim();
  } catch (error) {
    // Provide detailed error message
    if (error instanceof Error) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
    throw new Error("PDF parsing failed due to an unknown error");
  }
}
