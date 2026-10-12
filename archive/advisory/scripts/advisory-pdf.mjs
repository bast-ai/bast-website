/**
 * Generate the advisory one-pager PDFs from the pages themselves.
 *
 * The page IS the document. @media print in assets/advisory.css drops the site
 * chrome and sets the sheet to Letter; Chromium renders it. There is no second
 * source of truth, so editing copy in the HTML is the whole workflow.
 *
 * AUTO-FIT. Every .sheet-page in the markup is exactly one printed page. The
 * print styles derive every size from a single --adv-scale, and this script
 * steps that scale up until the tallest page is as large as it can be without
 * spilling. Write the copy you want; the fit corrects itself. If a sheet needs
 * a scale below MIN_SCALE it is genuinely too long - cut words, not points.
 *
 * The page then distributes whatever slack is left (see justify-content on
 * .sheet-page), so a light page ends at the bottom margin rather than two
 * inches up, which is what made these read as though the text got cut off.
 *
 *   pnpm build                       # dist/
 *   node scripts/advisory-pdf.mjs    # writes src/assets/*.pdf
 *   node scripts/verify-text.mjs     # proves nothing got clipped
 *   pnpm build                       # again, to copy the PDFs into dist/
 *
 * Needs Playwright's Chromium once:  npx playwright install chromium
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";

const SHEETS = [
  { page: "/advisory/healthcare.html", out: "src/assets/bast-healthcare-advisory.pdf", pages: 2 },
  { page: "/advisory/eu-ai-act.html", out: "src/assets/bast-eu-ai-act-briefing.pdf", pages: 2 },
  // The change sheet is a two-page brief on purpose: the argument runs a page,
  // the method and the origin story run the second. Shrinking it to one made it
  // unreadable at 0.78 and cost the part people remember.
  { page: "/advisory/change.html", out: "src/assets/bast-change-adoption.pdf", pages: 2 },
];

const PAGE_HEIGHT_PX = 11 * 96;   // US Letter at CSS 96dpi
const SAFETY_PX = 6;              // Chromium rounds; do not fight it
const MIN_SCALE = 0.78;
const MAX_SCALE = 1.14;   // short sheets grow to fill the page too
const STEP = 0.01;

const root = path.join(process.cwd(), process.env.ADV_ROOT || "dist");
const TYPES = {
  ".html": "text/html", ".css": "text/css", ".svg": "image/svg+xml",
  ".woff2": "font/woff2", ".js": "text/javascript", ".png": "image/png",
  ".jpg": "image/jpeg", ".pdf": "application/pdf",
};

const server = createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  try {
    const buf = await readFile(path.join(root, p));
    res.writeHead(200, { "Content-Type": TYPES[path.extname(p)] ?? "application/octet-stream" });
    res.end(buf);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});

await new Promise((r) => server.listen(4321, r));
// CHROMIUM_PATH lets a sandbox point at a preinstalled binary; normally unset.
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
const context = await browser.newContext({ viewport: { width: 816, height: 1056 } });
let failed = false;

for (const { page, out, pages = 1 } of SHEETS) {
  const tab = await context.newPage();
  await tab.goto(`http://localhost:4321${page}`, { waitUntil: "networkidle" });
  await tab.emulateMedia({ media: "print" });
  await tab.evaluate(() => document.fonts.ready);

  // Every .sheet-page is a real Letter page in print, with its own margins, so
  // the fit is measured page by page rather than inferred from where a single
  // long box would happen to fragment. The tallest page sets the scale, which
  // is what keeps one type size across the whole document.
  const measure = (scale) =>
    tab.evaluate((s) => {
      document.documentElement.style.setProperty("--adv-scale", String(s));
      return Math.max(...[...document.querySelectorAll(".sheet-page")].map((p) => {
        // The page distributes its slack, so ask for the natural stacked
        // height first - otherwise every page measures as exactly full.
        p.style.justifyContent = "flex-start";
        const box = p.getBoundingClientRect();
        const padBottom = parseFloat(getComputedStyle(p).paddingBottom);
        const bottom = Math.max(...[...p.children].map((k) => k.getBoundingClientRect().bottom));
        p.style.justifyContent = "";
        return bottom - box.top + padBottom;
      }));
    }, scale);

  // Largest scale that still fits one page, searched in both directions.
  const limit = PAGE_HEIGHT_PX - SAFETY_PX;   // per printed page
  let scale = MIN_SCALE;
  let height = await measure(scale);
  for (let s = MIN_SCALE; s <= MAX_SCALE + 1e-9; s = Number((s + STEP).toFixed(3))) {
    const h = await measure(s);
    if (h <= limit) { scale = s; height = h; } else break;
  }
  await measure(scale);

  if (height > limit) {
    console.warn(`  ! ${page} needs more than ${pages} page(s) even at ${MIN_SCALE} - cut copy or raise pages`);
  }

  const buf = await tab.pdf({
    path: out,
    format: "Letter",
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  await tab.close();

  // Chromium paginated it, not us. If the count moved, something overflowed a
  // page and the fit is lying - fail rather than ship a sheet with a stray
  // third page or a half-empty one.
  const printed = (buf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  if (printed !== pages) {
    failed = true;
    console.error(`  ! ${out} printed ${printed} page(s), expected ${pages}`);
  }
  console.log(`wrote ${out}  (scale ${scale}, ${(height / 96).toFixed(2)}in of 11in, ${printed}pp)`);
}

await browser.close();
server.close();
if (failed) process.exit(1);
