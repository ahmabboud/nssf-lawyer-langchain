// app/api/ai-responses/pdf/route.ts
import { NextResponse } from 'next/server';
import { generatePdfFromText } from '../../../../lib/pdf-generator';

export async function POST(req: Request) {
  try {
    const { content } = await req.json();  // Extract JSON content from the request body
    const pdfBuffer = await generatePdfFromText(content);

    // Return the PDF with the appropriate headers for downloading
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=generated.pdf',
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to generate PDF' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
