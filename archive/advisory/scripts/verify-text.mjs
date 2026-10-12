/**
 * Prove that every word on the sheet survived the trip into the PDF.
 *
 * A clipped line or a dropped paragraph does not change the page count and is
 * easy to miss by eye, so this compares the rendered sheet against the text
 * extracted from the PDF and fails loudly if anything went missing.
 *
 *   node scripts/advisory-pdf.mjs && node scripts/verify-text.mjs
 *
 * Two extractor quirks are worked around here. pdftotext sprinkles spaces
 * inside kerned words ("i nsti tuti on"), so the comparison drops everything
 * that is not a letter or a digit. And it linearises multi-column layouts in
 * its own order, so the comparison is made on overlapping character shingles
 * rather than whole sentences: a reordering breaks one or two shingles at the
 * seam, while genuinely missing copy breaks a long unbroken run of them. Only
 * runs longer than RUN_TOLERANCE are reported.
 *
 * Exits non-zero if anything is missing.
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";

const SHEETS = [
  { page: "/advisory/healthcare.html", pdf: "src/assets/bast-healthcare-advisory.pdf" },
  { page: "/advisory/eu-ai-act.html", pdf: "src/assets/bast-eu-ai-act-briefing.pdf" },
  { page: "/advisory/change.html", pdf: "src/assets/bast-change-adoption.pdf" },
];

const SHINGLE = 24;        // characters, ignoring spaces and punctuation
const RUN_TOLERANCE = 40;  // a longer unbroken gap than this is missing copy

const root = path.join(process.cwd(), process.env.ADV_ROOT || "dist");
const TYPES = {
  ".html": "text/html", ".css": "text/css", ".svg": "image/svg+xml",
  ".woff2": "font/woff2", ".js": "text/javascript", ".png": "image/png",
};
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  try {
    const buf = await readFile(path.join(root, p));
    res.writeHead(200, { "Content-Type": TYPES[path.extname(p)] ?? "application/octet-stream" });
    res.end(buf);
  } catch { res.writeHead(404); res.end("not found"); }
});
await new Promise((r) => server.listen(4322, r));

const squash = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
const context = await browser.newContext({ viewport: { width: 816, height: 1056 } });
let bad = 0;

for (const { page, pdf } of SHEETS) {
  const tab = await context.newPage();
  await tab.goto(`http://localhost:4322${page}`, { waitUntil: "networkidle" });
  await tab.emulateMedia({ media: "print" });

  // One text node at a time. innerText would splice together strings that sit
  // in different corners of the page, and a shingle straddling that splice is
  // a false alarm rather than missing copy.
  const nodes = await tab.evaluate(() => {
    const out = [];
    const walk = document.createTreeWalker(document.querySelector(".sheet"), NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const t = n.data.replace(/\s+/g, " ").trim();
      if (t) out.push(t);
    }
    return out;
  });
  await tab.close();

  const haystack = squash(execFileSync("pdftotext", [pdf, "-"], { encoding: "utf8" }));
  const misses = [];

  for (const text of nodes) {
    const flat = squash(text);
    if (flat.length <= SHINGLE) {
      if (flat && !haystack.includes(flat)) misses.push(text);
      continue;
    }
    // Keep the original offsets so a gap can be quoted back in real words.
    const at = [...text].map((c, i) => i).filter((i) => /[a-z0-9]/i.test(text[i]));
    const gaps = [];
    let run = null;
    for (let i = 0; i + SHINGLE <= flat.length; i++) {
      if (haystack.includes(flat.slice(i, i + SHINGLE))) {
        if (run) { gaps.push(run); run = null; }
      } else {
        run ??= { start: i, end: i };
        run.end = i;
      }
    }
    if (run) gaps.push(run);
    for (const g of gaps) {
      if (g.end - g.start < RUN_TOLERANCE) continue;
      const from = at[g.start] ?? 0;
      const to = at[Math.min(g.end + SHINGLE, at.length - 1)] ?? text.length;
      misses.push(text.slice(from, to));
    }
  }

  console.log(`${page}  ${misses.length ? `${misses.length} GAP(S)` : "complete"}`);
  for (const m of misses) { bad++; console.log(`   MISSING: ${m}`); }
}

await browser.close();
server.close();
process.exit(bad ? 1 : 0);
