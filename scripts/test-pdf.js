const { generatePdfFromText } = require('../lib/pdf-generator'); // Adjust path as needed

const testGeneratePdf = async () => {
  try {
    console.log('Starting PDF generation...');
    const pdfBuffer = await generatePdfFromText("Test content for PDF generation");
    console.log('PDF buffer generated successfully:', pdfBuffer);
    
    // Optionally, save the PDF buffer to a file to confirm generation
    const fs = require('fs');
    fs.writeFileSync('test-output.pdf', pdfBuffer);
    console.log('PDF saved as test-output.pdf');
  } catch (error) {
    console.error('Error during PDF generation:', error);
  }
};

testGeneratePdf();
