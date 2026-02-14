export async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    // Validate buffer
    if (!buffer || buffer.length === 0) {
      throw new Error("PDF buffer is empty or invalid");
    }

    // Dynamically import pdfjs-dist (works in serverless)
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      standardFontDataUrl: "https://unpkg.com/pdfjs-dist@4.11.192/standard_fonts/",
    });

    const pdf = await loadingTask.promise;

    // Extract text from all pages
    const textPromises: Promise<string>[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      textPromises.push(
        pdf.getPage(i).then(async (page) => {
          const textContent = await page.getTextContent();
          return textContent.items
            .map((item: any) => {
              if ("str" in item) {
                return item.str;
              }
              return "";
            })
            .join(" ");
        })
      );
    }

    const pages = await Promise.all(textPromises);
    const text = pages.join("\n\n").trim();

    // Validate result
    if (!text || text.length === 0) {
      throw new Error(
        "PDF contains no readable text. It might be image-based or corrupted."
      );
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
