export async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    // Validate buffer
    if (!buffer || buffer.length === 0) {
      throw new Error("PDF buffer is empty or invalid");
    }

    // Dynamically import pdf-parse
    const { PDFParse } = await import("pdf-parse");

    // Parse PDF
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();

    // Validate result
    if (!result || !result.text) {
      throw new Error("Failed to extract text from PDF. The PDF might be empty or corrupted.");
    }

    const text = result.text.trim();

    // Check if extracted text is meaningful
    if (text.length === 0) {
      throw new Error("PDF contains no readable text. It might be image-based or corrupted.");
    }

    return text;
  } catch (error) {
    // Provide detailed error message
    if (error instanceof Error) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
    throw new Error("PDF parsing failed due to an unknown error");
  }
}
