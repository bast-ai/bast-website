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

// BastCare App Store ratings come from the snapshot the deploy job refreshes
// from Apple just before this build (scripts/collect-bastcare-reviews.py).
// The snapshot version stays available to the review queue and is not printed.
const bastcareSnapshot = JSON.parse(
  await readFile(path.join(srcDir, "assets/data/bastcare-reviews.json"), "utf8"),
);
const bastcareVersion = bastcareSnapshot.app?.version;
const bastcareRating = bastcareSnapshot.rating ?? {};
if (typeof bastcareVersion !== "string" || !/^[0-9]+(\.[0-9]+){1,3}$/.test(bastcareVersion)) {
  throw new Error("BastCare snapshot has no valid App Store version");
}
if (typeof bastcareRating.average !== "number" ||
    !Number.isSafeInteger(bastcareRating.count) ||
    !Number.isSafeInteger(bastcareRating.writtenReviewCount)) {
  throw new Error("BastCare snapshot has no valid App Store rating");
}
const countLabel = (count, singular, plural) =>
  `${count.toLocaleString("en-US")} ${count === 1 ? singular : plural}`;

const replacements = new Map([
  ["__BASTCARE_RATING_AVERAGE__", bastcareRating.average.toFixed(1)],
  ["__BASTCARE_RATING_COUNT_LABEL__", countLabel(bastcareRating.count, "rating", "ratings")],
  ["__BASTCARE_WRITTEN_REVIEW_COUNT_LABEL__",
    countLabel(bastcareRating.writtenReviewCount, "written review", "written reviews")],
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
  if (ext === ".html") contents = addShareTags(contents);
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

// Share previews (decision 2026-10-18): every indexable page gets static Open
// Graph and Twitter tags in the built HTML. Page-specific tags in the source
// win; anything missing is filled from the page's <title>, meta description,
// and canonical URL, with the default Bast share image.
const shareImage = {
  url: "__SITE_URL__/assets/og/bast-share.png",
  width: "1200",
  height: "630",
  alt: "Bast logo with the headline Explainable Healthcare AI That Shows Its Work, and bast.ai",
};

function attr(value) {
  return value.replace(/"/g, "&quot;");
}

function addShareTags(contents) {
  // Only public pages, i.e. those whose robots tag follows the build setting.
  // noindex pages (404, CareTeam invitation, archive stubs) and redirect stubs
  // are left alone.
  if (!contents.includes('<meta name="robots" content="__ROBOTS_META__">')) return contents;
  if (!contents.includes("</head>")) return contents;
  const title = contents.match(/<title>([^<]*)<\/title>/)?.[1]?.trim();
  const description = contents.match(/<meta name="description" content="([^"]*)"/)?.[1];
  const canonical = contents.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
  if (!title || !description || !canonical) return contents;

  const has = (key) => new RegExp(`<meta (?:property|name)="${key}"`).test(contents);
  const value = (key) => contents.match(new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`))?.[1];
  const ogTitle = value("og:title") ?? attr(title);
  const ogDescription = value("og:description") ?? description;
  const ogImage = value("og:image") ?? shareImage.url;
  const tags = [];
  const add = (kind, key, content) => {
    if (!has(key)) tags.push(`<meta ${kind}="${key}" content="${content}">`);
  };
  add("property", "og:title", ogTitle);
  add("property", "og:description", ogDescription);
  add("property", "og:type", "website");
  add("property", "og:url", canonical);
  add("property", "og:site_name", "Bast AI");
  if (!has("og:image")) {
    add("property", "og:image", shareImage.url);
    add("property", "og:image:type", "image/png");
    add("property", "og:image:width", shareImage.width);
    add("property", "og:image:height", shareImage.height);
    add("property", "og:image:alt", shareImage.alt);
  }
  add("name", "twitter:card", "summary_large_image");
  add("name", "twitter:title", ogTitle);
  add("name", "twitter:description", ogDescription);
  add("name", "twitter:image", ogImage);
  if (!tags.length) return contents;
  return contents.replace("</head>", `${tags.join("\n")}\n</head>`);
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
