import puppeteer from 'puppeteer';
import dommatrix from 'dommatrix';

// Function to generate PDF from HTML content
export const generatePdfFromHtml = async (content: string): Promise<Buffer> => {
  // Replace newlines (\n) with <br> for proper line breaks
  const htmlContent = content.replace(/\n/g, '<br />');

  // Launch a new headless browser
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Set the HTML content to be rendered in the page
  await page.setContent(htmlContent, {
    waitUntil: 'domcontentloaded', // Ensure DOM is loaded before rendering
  });

  // Generate PDF from the content
  const pdfBufferArray = await page.pdf({
    format: 'A4', // PDF format
    printBackground: true, // Ensure background colors are included
    landscape: false, // Portrait mode
  });

  // Convert Uint8Array to Buffer
  const buffer = Buffer.from(pdfBufferArray);

  // Close the browser instance
  await browser.close();

  return buffer;
};
