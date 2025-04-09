import { writeFile } from 'fs';
import { generatePdfFromText } from '../lib/pdf-generator';

const testGeneratePdf = async () => {
  try {
    const pdfBuffer = await generatePdfFromText("Test content for PDF generation");

    // Save the generated PDF buffer to a file
    writeFile('test-output.pdf', pdfBuffer, (err) => {
      if (err) {
        console.error('Error saving PDF file', err);
      } else {
        console.log('PDF saved successfully');
      }
    });
  } catch (error) {
    console.error('Error during PDF generation', error);
  }
};

testGeneratePdf();
