import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const distDir = path.join(root, "dist");
const requiredFiles = [
  "index.html",
  "investors.html",
  "404.html",
  "privacy.html",
  "robots.txt",
  "sitemap.xml",
  "assets/styles.css",
  "assets/site.js",
  "assets/analytics-consent.js",
  "assets/bast-logo.svg",
  "assets/bast-ai-healthcare-teaser.pdf",
  "assets/bast-ai-healthcare-teaser-cover.png",
];

const forbidden = [
  "G-FL8JCB0PXZ",
  "hello@profa.mail",
  "__GA_MEASUREMENT_ID__",
  "__GA_MEASUREMENT_ID_DISPLAY__",
  "__SITE_ENV__",
  "__SITE_URL__",
  "__ROBOTS_META__",
];

async function exists(relPath) {
  await access(path.join(distDir, relPath));
}

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

for (const file of requiredFiles) {
  await exists(file);
}

const files = await collectFiles(distDir);
for (const file of files) {
  const { size } = await stat(file);
  if (size === 0) {
    throw new Error(`Empty file: ${path.relative(root, file)}`);
  }

  if (![".html", ".js", ".css", ".xml", ".txt"].includes(path.extname(file))) {
    continue;
  }

  const contents = await readFile(file, "utf8");
  for (const needle of forbidden) {
    if (contents.includes(needle)) {
      throw new Error(`Forbidden token "${needle}" found in ${path.relative(root, file)}`);
    }
  }
}

console.log("Static site checks passed");
