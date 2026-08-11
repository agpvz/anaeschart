// Render a filled form to PDF headlessly, using the same engine the browser
// print dialog uses — so the output matches the screen exactly.
//
//   npm i -D playwright && npx playwright install chromium
//   node tools/export-pdf.mjs index.html case.json case.pdf
//
// The JSON argument is optional; without it you get a blank form.

import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const [, , html = 'index.html', json, out = 'case.pdf'] = process.argv;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(html).href, { waitUntil: 'load' });

if (json) {
  const data = JSON.parse(readFileSync(json, 'utf8'));
  await page.evaluate(d => window.SASA.fill(d), data);
}

await page.pdf({
  path: out,
  printBackground: true,      // the green rules and tints are backgrounds
  preferCSSPageSize: true     // honours @page { size: A4 landscape; margin: 0 }
});

await browser.close();
console.log(`wrote ${out}`);
