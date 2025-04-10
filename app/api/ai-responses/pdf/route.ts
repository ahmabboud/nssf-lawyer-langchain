// app/api/generate-pdf/route.ts
import { NextResponse } from 'next/server';
import { generatePdfFromText } from '@/lib/pdf-generator';

export async function POST(request: Request) {
  try {
    // Get user role from headers or session
    const userRole = request.headers.get('user-role');

    // Check if the user is authorized
    if (userRole !== 'admin' && userRole !== 'read-only') {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 403 }
      );
    }

    const content = await request.text();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const pdfBuffer = await generatePdfFromText(content);
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="ai-response.pdf"',
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}