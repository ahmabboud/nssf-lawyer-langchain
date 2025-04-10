import * as docx from 'docx';

export async function generateDocxFromText(content: string) {
  // Strip basic HTML tags (for safety, use a parser if needed)
  const plainText = content.replace(/<[^>]+>/g, '');

  const doc = new docx.Document({
    sections: [
      {
        properties: {},
        children: [
          new docx.Paragraph({
            children: [new docx.TextRun(plainText)],
          }),
        ],
      },
    ],
  });

  const buffer = await docx.Packer.toBuffer(doc);
  return buffer;
}
