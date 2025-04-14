import { NextResponse } from 'next/server';
import { generateDocxFromText } from '@/lib/docx-generator';

export async function POST(request: Request) {
  try {
    // Get user role from headers or session
    const userRole = request.headers.get('user-role');

    // Check if the user is authorized
    if (userRole !== 'admin' && userRole !== 'read-only') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const content = await request.text(); // Get raw HTML content

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const docxBuffer = await generateDocxFromText(content);
    return new NextResponse(docxBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="ai-response.docx"',
      }
    });
  } catch (error) {
    console.error('DOCX generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate DOCX' },
      { status: 500 }
    );
  }
}
