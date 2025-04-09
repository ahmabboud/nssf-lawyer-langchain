import * as docx from 'docx'; // Assuming you are using 'docx' library

export async function generateDocxFromText(content: string) {
  const doc = new docx.Document({
    sections: [
      {
        properties: {},
        children: [
          new docx.Paragraph({
            children: [new docx.TextRun(content)],
          }),
        ],
      },
    ],
  });

  // Using await to handle the promise returned by toBuffer
  const buffer = await docx.Packer.toBuffer(doc);
  return buffer;
}
