import { generatePdfFromHtml } from "@/lib/pdf-generator";

export async function POST(req: Request) {
  try {
    const htmlContent = await req.text();

    if (!htmlContent) {
      return new Response(JSON.stringify({ error: "HTML content required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const pdfBuffer = await generatePdfFromHtml(htmlContent);

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=ai-response.pdf",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("PDF Generation Error:", error);
    return new Response(JSON.stringify({ error: "PDF generation failed. Try again later" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
