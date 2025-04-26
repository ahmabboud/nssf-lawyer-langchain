// app/api/generate-pdf/route.ts
import { NextResponse } from "next/server";
import { generatePdfFromHtml } from "@/lib/pdf-generator";

export async function POST(req: Request) {
  try {
    const htmlContent = await req.text();
    
    if (!htmlContent) {
      return NextResponse.json(
        { error: "HTML content required" },
        { status: 400 }
      );
    }

    const pdfBuffer = await generatePdfFromHtml(htmlContent);
    
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=ai-response.pdf",
        "Cache-Control": "no-store, max-age=0"
      }
    });
  } catch (error) {
    console.error("PDF Generation Error:", error);
    return NextResponse.json(
      { error: "PDF generation failed. Try again later" },
      { status: 500 }
    );
  }
}
