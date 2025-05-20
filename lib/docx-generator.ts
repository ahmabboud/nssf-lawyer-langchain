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
        rightToLeft: true,
        heading: HeadingLevel.HEADING_3,
        children: [
          new TextRun({ text, bold: true, font: 'Arial', rtl: true }),
        ],
      });
    } else if (/^## (.+)/.test(line)) {
      const text = line.replace(/^## /, '');
      return new Paragraph({
        alignment: AlignmentType.RIGHT,
        rightToLeft: true,
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({ text, bold: true, font: 'Arial', rtl: true }),
        ],
      });
    } else if (/^# (.+)/.test(line)) {
      const text = line.replace(/^# /, '');
      return new Paragraph({
        alignment: AlignmentType.RIGHT,
        rightToLeft: true,
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({ text, bold: true, font: 'Arial', rtl: true }),
        ],
      });
    }

    // Handle inline bold text using **bold**
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
            rtl: true,
          })
        );
      }

      parts.push(
        new TextRun({
          text: boldText,
          bold: true,
          font: 'Arial',
          rtl: true,
        })
      );

      lastIndex = end;
    }

    // Add remaining non-bold text
    if (lastIndex < line.length) {
      parts.push(
        new TextRun({
          text: line.substring(lastIndex),
          font: 'Arial',
          rtl: true,
        })
      );
    }

    return new Paragraph({
      alignment: AlignmentType.RIGHT,
      rightToLeft: true,
      children: parts.length > 0
        ? parts
        : [new TextRun({ text: line, font: 'Arial', rtl: true })],
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          rightToLeft: true,
        },
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
