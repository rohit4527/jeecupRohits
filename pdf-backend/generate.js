const puppeteer = require('puppeteer');

(async () => {
  const username = process.argv[2];
  const password = process.argv[3];

  console.log("🔐 Navigating to login...");

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto('https://20.235.202.50/', { waitUntil: 'domcontentloaded' });

  await page.type('input[placeholder="Enter your application number"]', username);
  await page.type('input[placeholder="Enter your password"]', password);
  await page.click('button.signInButton');

  await page.waitForSelector('button.viewButton', { visible: true });
  console.log("✅ Logged in. Waiting for view button...");
  await page.click('button.viewButton');
  await page.waitForSelector('.section', { visible: true });

  console.log("📂 Expanding all sections...");
  await page.evaluate(() => {
    const toggles = Array.from(document.querySelectorAll('.section > div[style*="cursor: pointer"]'));
    toggles.forEach(toggle => {
      const table = toggle.nextElementSibling;
      if (!table || table.style.display === 'none') {
        toggle.click();
      }
    });
  });

  await page.waitForSelector('.response-table', { visible: true });
  await page.waitForTimeout(3000);

  console.log("✅ HTML content ready. Generating PDF...");
 const fullHtml = `
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial; font-size: 14px; padding: 20px; }
          .response-table { border-collapse: collapse; width: 100%; margin-top: 20px; table-layout: fixed; word-wrap: break-word; }
          .response-table td, .response-table th {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: left;
          }
          hr { border: none; border-top: 1px dashed #aaa; }
        </style>
      </head>
      <body>${htmlContent}</body>
    </html>
  `;
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
  });

  await browser.close();

  console.log("✅ PDF generated. Sending as base64...");

  const base64 = pdfBuffer.toString('base64');
  process.stdout.write(`PDF_BASE64_START${base64}`);
})();

