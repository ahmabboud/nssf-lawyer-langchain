import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export const generatePdfFromHtml = async (content: string): Promise<Buffer> => {
  const htmlContent = content.replace(/\n/g, '<br />');

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

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: 'domcontentloaded' });

  // Convert Uint8Array to Buffer
  const pdfBuffer = Buffer.from(await page.pdf({
    format: 'A4',
    printBackground: true,
  }));

  await browser.close();
  return pdfBuffer;
};
