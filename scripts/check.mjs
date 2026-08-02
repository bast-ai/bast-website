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
  "bastcare/index.html",
  "bastcare/privacy/index.html",
  "bastcare/processors/index.html",
  "bastcare/support/index.html",
  "bastcare/terms/index.html",
  "bastcare/delete-account/index.html",
  "bastcare/architecture/index.html",
  "bastcare/architecture/bastcare-solution-architecture.pdf",
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
const principlesHtml = await readFile(path.join(distDir, "principles.html"), "utf8");
const analyticsConsentJs = await readFile(path.join(distDir, "assets/analytics-consent.js"), "utf8");
const siteJs = await readFile(path.join(distDir, "assets/site.js"), "utf8");
const appleAssociation = await readFile(
  path.join(distDir, ".well-known/apple-app-site-association"), "utf8");
const careteamInvite = await readFile(
  path.join(distDir, "careteam/invite/index.html"), "utf8");
const bastcareHome = await readFile(
  path.join(distDir, "bastcare/index.html"), "utf8");
const bastcarePrivacy = await readFile(
  path.join(distDir, "bastcare/privacy/index.html"), "utf8");
const bastcareProcessors = await readFile(
  path.join(distDir, "bastcare/processors/index.html"), "utf8");
const bastcareSupport = await readFile(
  path.join(distDir, "bastcare/support/index.html"), "utf8");
const bastcareTerms = await readFile(
  path.join(distDir, "bastcare/terms/index.html"), "utf8");
const bastcareDeleteAccount = await readFile(
  path.join(distDir, "bastcare/delete-account/index.html"), "utf8");
const bastcareArchitecture = await readFile(
  path.join(distDir, "bastcare/architecture/index.html"), "utf8");
const sitemapXml = await readFile(path.join(distDir, "sitemap.xml"), "utf8");
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

const bastcarePages = [
  [bastcareHome, "home"],
  [bastcarePrivacy, "privacy"],
  [bastcareProcessors, "processors"],
  [bastcareSupport, "support"],
  [bastcareTerms, "terms"],
  [bastcareDeleteAccount, "delete account"],
  [bastcareArchitecture, "architecture"],
];
for (const [contents, label] of bastcarePages) {
  assertIncludes(contents, "BastCare", `BastCare name on ${label} page`);
  assertIncludes(contents, 'href="/bastcare/"', `BastCare home link on ${label} page`);
  assertIncludes(contents, 'href="/bastcare/privacy/"', `privacy link on ${label} page`);
  assertIncludes(contents, 'href="/bastcare/support/"', `support link on ${label} page`);
  assertIncludes(contents, 'href="/bastcare/terms/"', `terms link on ${label} page`);
  assertIncludes(contents, 'href="/bastcare/delete-account/"', `deletion link on ${label} page`);
  assertIncludes(contents, 'href="/bastcare/architecture/"', `architecture link on ${label} page`);
  assertIncludes(contents, 'href="#main"', `skip link on ${label} page`);
  assertIncludes(contents, "not a medical device", `medical posture on ${label} page`);
}

const approvedVisitPrivacyCopy = "Audio stays on your iPhone until the summary is created. Then the audio and full transcript are deleted from your iPhone. Temporary masked transcript text is sent securely to OpenAI, Bast’s AI processing provider, to create the summary. Bast does not save or log transcript text.";
assertIncludes(bastcareHome, approvedVisitPrivacyCopy, "approved marketing privacy copy");
assertIncludes(bastcarePrivacy, approvedVisitPrivacyCopy, "approved policy privacy copy");
assertIncludes(bastcareSupport, "Never send us visit audio", "content-free support guidance");
assertIncludes(bastcareSupport, "hello@bast.ai", "monitored support contact");
assertIncludes(bastcarePrivacy, "Bast, Inc.", "privacy legal entity");
assertIncludes(bastcarePrivacy, "3700 Quebec St", "privacy mailing address");
assertIncludes(bastcarePrivacy, 'href="/bastcare/processors/"', "named processor disclosure link");
for (const provider of ["OpenAI", "Amazon Web Services", "MongoDB", "Apple", "Google", "DuploCloud"]) {
  assertIncludes(bastcareProcessors, provider, `named BastCare provider: ${provider}`);
}
assertIncludes(bastcareProcessors, "Libraries and processors are different lists", "library boundary");
assertIncludes(bastcareTerms, "BastCare 1.0 is offered free of charge", "free-first terms");
assertExcludes(bastcareSupport, "Purchase, restore", "current paid support claim");
assertExcludes(bastcarePrivacy, "verify Apple subscription", "current paid privacy claim");
assertIncludes(bastcareDeleteAccount, "Choose Delete Bast Account", "in-app deletion path");
assertIncludes(bastcareDeleteAccount, "Only after server success", "server-first deletion order");
assertIncludes(bastcareArchitecture, "Functional requirements", "architecture FRs");
assertIncludes(bastcareArchitecture, "Non-functional requirements", "architecture NFRs");
assertIncludes(bastcareArchitecture, "bastcare-solution-architecture.pdf", "architecture PDF download");
const bastcarePublicCopy = bastcarePages.map(([contents]) => contents).join("\n");
for (const internalPhrase of [
  "pre-submission",
  "proof points remain",
  "before App Store submission",
  "Current release status",
  "More than 25 users",
  "Demo/staging now",
  "production-hardening review",
  "being implemented and tested",
]) {
  assertExcludes(bastcarePublicCopy, internalPhrase, `internal public copy: ${internalPhrase}`);
}
assertIncludes(sitemapXml, "/bastcare/</loc>", "BastCare home sitemap route");
for (const route of ["privacy", "processors", "support", "terms", "delete-account", "architecture"]) {
  assertIncludes(sitemapXml, `/bastcare/${route}/`, `BastCare ${route} sitemap route`);
}

const requiredPrinciplesSnippets = [
  "Nature runs on sunlight.",
  "Nature uses only the energy it needs.",
  "Nature fits form to function.",
  "Nature recycles everything.",
  "Nature rewards cooperation.",
  "Nature banks on diversity.",
  "Nature demands local expertise.",
  "Nature curbs excesses from within.",
  "Nature taps the power of limits.",
  "A group of butterflies is called a kaleidoscope.",
  "The intrinsic structure-containing universe is very small",
  "Five relevant examples, intact with context",
  "neuro-symbolic graphs",
  "Knowledge emerges in use.",
  "Nora Bateson",
  "Dave Snowden",
  "François Chollet",
  "Janine M. Benyus",
];
for (const snippet of requiredPrinciplesSnippets) {
  assertIncludes(principlesHtml, snippet, `principles copy: ${snippet}`);
}
assertExcludes(principlesHtml, "Priority stack", "old principles priority stack");

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
  if (path.extname(file) === ".html") {
    for (const match of contents.matchAll(/href=["']([^"']+)["']/g)) {
      const href = match[1];
      if (/^(?:https?:|mailto:|tel:|sms:|#|javascript:)/i.test(href)) continue;

      const cleanPath = href.split(/[?#]/, 1)[0];
      if (!cleanPath) continue;

      const target = cleanPath.startsWith("/")
        ? path.join(distDir, cleanPath)
        : path.resolve(path.dirname(file), cleanPath);
      const resolvedTarget = cleanPath.endsWith("/") ? path.join(target, "index.html") : target;
      try {
        await access(resolvedTarget);
      } catch {
        throw new Error(`Broken internal link "${href}" in ${path.relative(root, file)}`);
      }
    }
  }
  for (const needle of forbidden) {
    if (contents.includes(needle)) {
      throw new Error(`Forbidden token "${needle}" found in ${path.relative(root, file)}`);
    }
  }
}

console.log("Static site checks passed");
