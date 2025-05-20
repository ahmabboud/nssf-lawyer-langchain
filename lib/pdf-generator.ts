import chromium from '@sparticuz/chromium';

export async function generatePdfFromHtml(content: string) {
  const isProd = process.env.NODE_ENV === 'production';

  const puppeteer = isProd
    ? await import('puppeteer-core')
    : await import('puppeteer');

  const browser = await puppeteer.default.launch({
    args: isProd ? chromium.args : ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: chromium.defaultViewport,
    executablePath: isProd ? await chromium.executablePath() : undefined,
    headless: true,
  });

  const page = await browser.newPage();

  // Inject styles and parse basic markdown
  const html = `
  <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8" />
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet" />
      <style>
        body {
          font-family: 'Cairo', sans-serif;
          direction: rtl;
          text-align: right;
          padding: 2rem;
        }
        h1, h2, h3 {
          font-weight: bold;
        }
        h1 { font-size: 24px; }
        h2 { font-size: 20px; }
        h3 { font-size: 18px; }
        p {
          font-size: 16px;
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      ${parseMarkdownToHtml(content)}
    </body>
  </html>
`;

  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
  });

  await browser.close();
  return pdfBuffer;
}
function parseMarkdownToHtml(markdown: string): string {
  const lines = markdown.split('\n');

  return lines
    .map((line) => {
      if (/^### (.+)/.test(line)) {
        return `<h3>${line.replace(/^### /, '')}</h3>`;
      } else if (/^## (.+)/.test(line)) {
        return `<h2>${line.replace(/^## /, '')}</h2>`;
      } else if (/^# (.+)/.test(line)) {
        return `<h1>${line.replace(/^# /, '')}</h1>`;
      } else {
        // Handle inline bold using **bold**
        const bolded = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        return `<p>${bolded}</p>`;
      }
    })
    .join('\n');
}
