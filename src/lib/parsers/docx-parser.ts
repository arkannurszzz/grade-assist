import mammoth from "mammoth";

export async function parseDocx(buffer: Buffer): Promise<string> {
  try {
    // Validate buffer
    if (!buffer || buffer.length === 0) {
      throw new Error("DOCX buffer is empty or invalid");
    }

    // Extract text from DOCX
    const result = await mammoth.extractRawText({ buffer });

    // Validate result
    if (!result || result.value === undefined || result.value === null) {
      throw new Error("Failed to extract text from DOCX. The file might be corrupted.");
    }

    const text = result.value.trim();

    // Check if extracted text is meaningful
    if (text.length === 0) {
      throw new Error("DOCX contains no readable text. It might be empty or corrupted.");
    }

    // Log warnings from mammoth if any
    if (result.messages && result.messages.length > 0) {
      console.warn("DOCX parsing warnings:", result.messages);
    }

    return text;
  } catch (error) {
    // Provide detailed error message
    if (error instanceof Error) {
      throw new Error(`DOCX parsing failed: ${error.message}`);
    }
    throw new Error("DOCX parsing failed due to an unknown error");
  }
}
