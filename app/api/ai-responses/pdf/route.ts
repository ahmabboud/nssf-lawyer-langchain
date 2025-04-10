import { NextResponse } from 'next/server';
import { generatePdfFromHtml } from '../../../../lib/pdf-generator'; // Adjust the path to your PDF generation file

export async function POST(req: Request) {
  try {
    // Get the raw HTML content from the request body
    const content = await req.text();

    // Check if content is provided
    if (!content) {
      return new NextResponse(
        JSON.stringify({ error: 'Content is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate the PDF buffer from the HTML content
    const pdfBuffer = await generatePdfFromHtml(content);

    // Return the generated PDF as a response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=ai-response.pdf',
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to generate PDF' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
