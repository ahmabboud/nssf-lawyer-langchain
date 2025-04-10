import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Helper function to strip HTML tags (use a simple regex or a more advanced HTML parser)
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, ''); // Strips basic HTML tags
}

export const generatePdfFromText = async (content: string) => {
  const text = stripHtmlTags(content); // Clean up HTML content

  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points (72 dpi)
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;
  const lineHeight = 14;
  const margin = 50;
  
  let y = height - margin;

  // Split text into paragraphs (assuming paragraphs are separated by newlines)
  const paragraphs = text.split('\n').filter(p => p.trim().length > 0);

  for (const paragraph of paragraphs) {
    // Split the paragraph into lines that fit within the page width
    const lines = [];
    let currentLine = '';
    
    for (const word of paragraph.split(' ')) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      
      if (testWidth > (width - 2 * margin)) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }

    // Draw each line
    for (const line of lines) {
      if (y < margin) {
        // Add a new page if we run out of space
        page.drawText('-- Continued on next page --', {
          x: margin,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
        
        y = height - margin;
        pdfDoc.addPage([595.28, 841.89]);
        page = pdfDoc.getPage(pdfDoc.getPageCount() - 1);
      }
      
      page.drawText(line, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
      
      y -= lineHeight;
    }
    
    // Add space between paragraphs
    y -= lineHeight / 2;
  }

  return await pdfDoc.save();
};