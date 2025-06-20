import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
} from 'docx';

export async function generateDocxFromText(content: string) {
  const lines = content.split('\n');

  const paragraphs = lines.map((line) => {
    // Handle headers
    if (/^### (.+)/.test(line)) {
      const text = line.replace(/^### /, '');
      return new Paragraph({
        alignment: AlignmentType.RIGHT,
        heading: HeadingLevel.HEADING_3,
        bidirectional: true,
        children: [
          new TextRun({
            text,
            bold: true,
            font: 'Arial',
            rightToLeft: true,
          }),
        ],
      });
    } else if (/^## (.+)/.test(line)) {
      const text = line.replace(/^## /, '');
      return new Paragraph({
        alignment: AlignmentType.RIGHT,
        heading: HeadingLevel.HEADING_2,
        bidirectional: true,
        children: [
          new TextRun({
            text,
            bold: true,
            font: 'Arial',
            rightToLeft: true,
          }),
        ],
      });
    } else if (/^# (.+)/.test(line)) {
      const text = line.replace(/^# /, '');
      return new Paragraph({
        alignment: AlignmentType.RIGHT,
        heading: HeadingLevel.HEADING_1,
        bidirectional: true,
        children: [
          new TextRun({
            text,
            bold: true,
            font: 'Arial',
            rightToLeft: true,
          }),
        ],
      });
    }

    // Handle bold text (**bold**)
    const parts: TextRun[] = [];
    const regex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      const start = match.index;
      const end = regex.lastIndex;
      const boldText = match[1];

      if (start > lastIndex) {
        parts.push(
          new TextRun({
            text: line.substring(lastIndex, start),
            font: 'Arial',
            rightToLeft: true,
          })
        );
      }

      parts.push(
        new TextRun({
          text: boldText,
          bold: true,
          font: 'Arial',
          rightToLeft: true,
        })
      );

      lastIndex = end;
    }

    if (lastIndex < line.length) {
      parts.push(
        new TextRun({
          text: line.substring(lastIndex),
          font: 'Arial',
          rightToLeft: true,
        })
      );
    }

    return new Paragraph({
      alignment: AlignmentType.RIGHT,
      bidirectional: true, // ✅ this is enough for paragraph RTL
      children: parts.length > 0
        ? parts
        : [new TextRun({ text: line, font: 'Arial', rightToLeft: true })],
    });
  });

  const doc = new Document({
    sections: [
      {
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
