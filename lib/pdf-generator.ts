// lib/pdf-generator.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const generatePdfFromText = async (text: string) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const { width, height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  page.drawText(text, {
    x: 50,
    y: height - 50,
    size: 12,
    font,
    color: rgb(0, 0, 0),
    maxWidth: width - 100,
    lineHeight: 18,
  });
  
  return await pdfDoc.save();
};
