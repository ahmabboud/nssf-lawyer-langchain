import puppeteer from 'puppeteer';

// Function to generate PDF from HTML content with Arabic RTL support
export const generatePdfFromHtml = async (content: string): Promise<Buffer> => {
  // Replace newlines (\n) with <br> for proper line breaks
  const htmlContent = content.replace(/\n/g, '<br />');

  // Wrap the content in full RTL HTML
  const fullHtml = `
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            direction: rtl;
            font-family: 'Arial', 'Amiri', 'Noto Naskh Arabic', sans-serif;
            font-size: 16px;
            line-height: 1.6;
            padding: 2em;
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `;

  // Launch a new headless browser
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Set the full HTML content
  await page.setContent(fullHtml, {
    waitUntil: 'domcontentloaded',
  });

  // Generate the PDF
  const pdfBufferArray = await page.pdf({
    format: 'A4',
    printBackground: true,
    landscape: false,
  });

  const buffer = Buffer.from(pdfBufferArray);

  await browser.close();
  return buffer;
};
