import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const distDir = path.join(root, "dist");
const requiredFiles = [
  "index.html",
  "investors.html",
  "principles.html",
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
  ".nojekyll",
  ".well-known/apple-app-site-association",
  "careteam/invite/index.html",
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

function assertIncludes(contents, needle, label) {
  if (!contents.includes(needle)) {
    throw new Error(`Missing ${label}`);
  }
}

function assertExcludes(contents, needle, label) {
  if (contents.includes(needle)) {
    throw new Error(`Unexpected ${label}`);
  }
}

for (const file of requiredFiles) {
  await exists(file);
}

const indexHtml = await readFile(path.join(distDir, "index.html"), "utf8");
const analyticsConsentJs = await readFile(path.join(distDir, "assets/analytics-consent.js"), "utf8");
const siteJs = await readFile(path.join(distDir, "assets/site.js"), "utf8");
const appleAssociation = await readFile(
  path.join(distDir, ".well-known/apple-app-site-association"), "utf8");
const careteamInvite = await readFile(
  path.join(distDir, "careteam/invite/index.html"), "utf8");
const requiredHomepageSnippets = [
  {
    label: "mobile SMS link",
    needle: "sms:3037176099?&body=Hi%20Bast%2C%20I%27d%20like%20to%20connect",
  },
  {
    label: "Lucid Therapeutics demo video",
    needle: 'data-video-id="SjxGRh3G1JI"',
  },
  {
    label: "health and medicine demo video",
    needle: 'data-video-id="b2l16nkB0f8"',
  },
  {
    label: "ontology demo video",
    needle: 'data-video-id="Sa-uNxoRjos"',
  },
  {
    label: "operating principles page link",
    needle: 'href="principles.html"',
  },
];
const replacedHomepageSnippets = [
  {
    label: "old admin dashboard demo video",
    needle: 'data-video-id="nS74QjwSHQA"',
  },
  {
    label: "old chat and admin console demo video",
    needle: 'data-video-id="Q-j02Y1AHEw"',
  },
];

for (const { needle, label } of requiredHomepageSnippets) {
  assertIncludes(indexHtml, needle, label);
}
for (const { needle, label } of replacedHomepageSnippets) {
  assertExcludes(indexHtml, needle, label);
}

assertIncludes(indexHtml, 'window.location.pathname.endsWith("/index.html")', "canonical homepage redirect");
assertIncludes(siteJs, 'window.bastTrack("lead_submit_success", leadParams)', "successful lead tracking");
assertIncludes(siteJs, 'window.bastTrack("generate_lead", leadParams)', "confirmed lead tracking");
assertExcludes(siteJs, 'function handlePdfDownloads()', "duplicate PDF click handler");
assertIncludes(analyticsConsentJs, 'resource: link.getAttribute("data-resource") || undefined', "PDF resource tracking");
assertExcludes(analyticsConsentJs, 'window.bastTrack("generate_lead"', "unconfirmed email lead tracking");
assertIncludes(appleAssociation, "N9WW75Q3VS.ai.bast.careloop", "BastCare App ID association");
assertIncludes(appleAssociation, '"/careteam/invite"', "CareTeam invitation path");
assertIncludes(careteamInvite, "does not receive or store the private invitation token", "token-blind fallback disclosure");
assertExcludes(careteamInvite, "analytics-consent", "analytics on private invitation fallback");
assertExcludes(careteamInvite, "location.hash", "invitation token parsing in website fallback");

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
  if (path.extname(file) === ".html" && contents.includes('href="index.html')) {
    throw new Error(`Legacy index.html link found in ${path.relative(root, file)}`);
  }
  for (const needle of forbidden) {
    if (contents.includes(needle)) {
      throw new Error(`Forbidden token "${needle}" found in ${path.relative(root, file)}`);
    }
  }
}

console.log("Static site checks passed");
