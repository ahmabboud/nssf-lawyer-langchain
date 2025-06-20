import { generateDocxFromText } from '@/lib/docx-generator';

export const runtime = 'nodejs'; // ✅ Forces Vercel to use Node.js runtime (not Edge)

export async function POST(request: Request) {
  try {
    const userRole = request.headers.get('user-role');

    if (userRole !== 'admin' && userRole !== 'read-only') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const content = await request.text();

    if (!content) {
      return new Response(JSON.stringify({ error: 'Content is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const docxBuffer = await generateDocxFromText(content);

    return new Response(docxBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="ai-response.docx"',
      },
    });
  } catch (error) {
    console.error('DOCX generation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate DOCX' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
