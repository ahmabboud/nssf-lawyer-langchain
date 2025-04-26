// lib/pdf-generator.ts
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export const generatePdfFromHtml = async (html: string) => {
  let browser = null;
  try {
    const isDev = process.env.NODE_ENV === "development";
    
    browser = await puppeteer.launch({
      executablePath: isDev 
        ? "/usr/bin/chromium-browser"  // Local development path
        : await chromium.executablePath(),
      args: isDev 
        ? ["--no-sandbox", "--disable-setuid-sandbox"]
        : [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
      headless: chromium.headless,
      defaultViewport: chromium.defaultViewport,
    });

    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 30000
    });

    // Wait for fonts and dynamic content
    await page.evaluateHandle("document.fonts.ready");
    
    return await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "80px", right: "50px", bottom: "80px", left: "50px" },
      timeout: 60000
    });
  } finally {
    if (browser) await browser.close();
  }
};
