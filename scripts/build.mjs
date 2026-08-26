import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const distDir = path.join(root, "dist");

const defaultGaMeasurementId = "G-0D3N068YJH";
const gaMeasurementId = process.env.GA_MEASUREMENT_ID ?? defaultGaMeasurementId;
const siteEnv = process.env.SITE_ENV || "local";
const siteUrl = process.env.SITE_URL || "https://www.bast.ai";
const robotsMeta = process.env.ROBOTS_META || (siteEnv === "production" ? "index, follow" : "noindex, nofollow");
const measurementDisplay = gaMeasurementId || "not configured yet";
const assetVersion = (
  process.env.ASSET_VERSION ||
  process.env.GITHUB_SHA ||
  Date.now().toString(36)
).replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 12) || "local";

const replacements = new Map([
  ["__GA_MEASUREMENT_ID__", gaMeasurementId],
  ["__GA_MEASUREMENT_ID_DISPLAY__", measurementDisplay],
  ["__SITE_ENV__", siteEnv],
  ["__SITE_URL__", siteUrl],
  ["__ROBOTS_META__", robotsMeta],
]);

async function replacePlaceholders(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (![".html", ".xml", ".txt", ".js", ".css"].includes(ext)) return;

  let contents = await readFile(filePath, "utf8");
  for (const [token, value] of replacements) {
    contents = contents.split(token).join(value);
  }
  if (ext === ".html") {
    contents = contents.replace(
      /((?:href|src)="\/?assets\/[^"?]+\.(?:css|js))"/g,
      `$1?v=${assetVersion}"`,
    );
  }
  await writeFile(filePath, contents);
}

async function walk(dir) {
  const entries = await import("node:fs/promises").then((fs) => fs.readdir(dir, { withFileTypes: true }));
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
    } else {
      await replacePlaceholders(fullPath);
    }
  }
}

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });
await cp(srcDir, distDir, { recursive: true });
await walk(distDir);

console.log(`Built ${path.relative(root, distDir)} for ${siteEnv} with assets ${assetVersion}`);
