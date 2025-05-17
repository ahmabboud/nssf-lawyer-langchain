import puppeteer from 'puppeteer';

// Function to generate PDF from HTML content with Arabic RTL support
export const generatePdfFromHtml = async (content: string): Promise<Buffer> => {
  // Convert Markdown to basic HTML (bold and headers)
  let htmlContent = content
    // Convert bold **text** to <strong>text</strong>
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Convert ### Header to <h3>
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    // Convert ## Header to <h2>
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    // Convert # Header to <h1>
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Convert line breaks to <br />
    .replace(/\n/g, '<br />');

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
          h1, h2, h3 {
            font-weight: bold;
            margin-top: 1em;
            margin-bottom: 0.5em;
          }
          h1 { font-size: 24px; }
          h2 { font-size: 20px; }
          h3 { font-size: 18px; }
          strong {
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setContent(fullHtml, {
    waitUntil: 'domcontentloaded',
  });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    landscape: false,
  });

  await browser.close();
  return Buffer.from(pdfBuffer);
};
