import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
} from 'docx';

export async function generateDocxFromText(content: string) {
  const lines = content.split('\n');

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: lines.map(line =>
          new Paragraph({
            bidirectional: true, // Enables right-to-left layout
            alignment: AlignmentType.RIGHT, // Aligns text to the right
            children: [
              new TextRun({
                text: line,
                font: 'Arial', // Font that supports Arabic
              }),
            ],
          })
        ),
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
