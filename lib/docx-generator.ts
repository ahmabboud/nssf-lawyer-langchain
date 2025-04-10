import * as docx from 'docx';

// Helper function to handle newlines in the content
export async function generateDocxFromText(content: string) {
  // Split the content by newlines to preserve line breaks
  const lines = content.split('\n');

  const doc = new docx.Document({
    sections: [
      {
        properties: {},
        children: lines.map(line => 
          new docx.Paragraph({
            children: [new docx.TextRun(line)],
          })
        ),
      },
    ],
  });

  const buffer = await docx.Packer.toBuffer(doc);
  return buffer;
}
