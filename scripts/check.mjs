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
  "assets/platform.css",
  "assets/site.js",
  "assets/analytics-consent.js",
  "assets/bast-logo.svg",
  "assets/platform/admin-interaction-log.jpg",
  "assets/platform/admin-usage-analytics.jpg",
  "assets/bastcare/screens/home-build-51.jpg",
  "assets/bastcare/screens/consent-build-51.jpg",
  "assets/bastcare/screens/recording-build-51.jpg",
  "assets/bastcare/screens/processing-build-51.jpg",
  "assets/bastcare/screens/summary-build-51.jpg",
  "assets/bastcare/screens/visits.webp",
  "assets/bastcare/screens/careteam-build-51.jpg",
  "assets/bastcare/screens/sharing-settings-build-51.jpg",
  "assets/bastcare/screens/share-preview-build-51.jpg",
  "assets/data/bastcare-metrics.json",
  "assets/data/bastcare-reviews.json",
  "assets/bast-ai-healthcare-teaser.pdf",
  "assets/bast-ai-healthcare-teaser-cover.png",
  "assets/advisory.css",
  "assets/bast-healthcare-advisory.pdf",
  "assets/bast-eu-ai-act-briefing.pdf",
  "assets/bast-change-adoption.pdf",
  "assets/bast-narrative.pdf",
  "assets/bast-narrative-cover.png",
  "advisory/index.html",
  "advisory/healthcare.html",
  "advisory/eu-ai-act.html",
  "advisory/change.html",
  ".nojekyll",
  ".well-known/apple-app-site-association",
  "careteam/invite/index.html",
  "platform/index.html",
  "bastcare/index.html",
  "bastcare/privacy/index.html",
  "bastcare/processors/index.html",
  "bastcare/support/index.html",
  "bastcare/terms/index.html",
  "bastcare/delete-account/index.html",
  "bastcare/architecture/index.html",
  "bastcare/architecture/bastcare-solution-architecture.pdf",
  "llms.txt",
  "faq/index.html",
  "team/index.html",
  "frames/index.html",
  "frames/claim-level-source-grounding/index.html",
];

const forbidden = [
  "G-FL8JCB0PXZ",
  "hello@profa.mail",
  "__GA_MEASUREMENT_ID__",
  "__GA_MEASUREMENT_ID_DISPLAY__",
  "__SITE_ENV__",
  "__SITE_URL__",
  "__ROBOTS_META__",
  // Wrong legal entity name — the registered entity is "Bast, Inc." (decision 2026-08-28).
  "Bast AI, Inc.",
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

function assertBalancedCssBlocks(contents, label) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let inComment = false;

  for (let index = 0; index < contents.length; index += 1) {
    const character = contents[index];
    const next = contents[index + 1];
    if (inComment) {
      if (character === "*" && next === "/") {
        inComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === "/" && next === "*") {
      inComment = true;
      index += 1;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      if (depth < 0) throw new Error(`Unbalanced ${label}: unexpected closing brace`);
    }
  }

  if (inComment || quote || depth !== 0) {
    throw new Error(`Unbalanced ${label}: unterminated CSS block, comment, or string`);
  }
}

for (const file of requiredFiles) {
  await exists(file);
}

const indexHtml = await readFile(path.join(distDir, "index.html"), "utf8");
const platformHtml = await readFile(path.join(distDir, "platform/index.html"), "utf8");
const investorsHtml = await readFile(path.join(distDir, "investors.html"), "utf8");
const principlesHtml = await readFile(path.join(distDir, "principles.html"), "utf8");
const privacyHtml = await readFile(path.join(distDir, "privacy.html"), "utf8");
const advisoryPages = await Promise.all([
  "index.html",
  "healthcare.html",
  "eu-ai-act.html",
  "change.html",
].map((file) => readFile(path.join(distDir, "advisory", file), "utf8")));
const advisoryIndexHtml = advisoryPages[0];
const analyticsConsentJs = await readFile(path.join(distDir, "assets/analytics-consent.js"), "utf8");
const siteJs = await readFile(path.join(distDir, "assets/site.js"), "utf8");
const siteCss = await readFile(path.join(distDir, "assets/styles.css"), "utf8");
const platformCss = await readFile(path.join(distDir, "assets/platform.css"), "utf8");
assertBalancedCssBlocks(siteCss, "site stylesheet");
assertBalancedCssBlocks(platformCss, "platform stylesheet");
const bastcareMetrics = JSON.parse(await readFile(
  path.join(distDir, "assets/data/bastcare-metrics.json"), "utf8"));
const bastcareReviews = JSON.parse(await readFile(
  path.join(distDir, "assets/data/bastcare-reviews.json"), "utf8"));
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
  {
    label: "BastCare summary gallery",
    needle: 'class="offering-summary-gallery"',
  },
  {
    label: "Build 51 visit summary homepage screen",
    needle: "summary-build-51.jpg",
  },
  {
    label: "Build 51 CareTeam homepage screen",
    needle: "careteam-build-51.jpg",
  },
  {
    label: "Build 51 sharing preview homepage screen",
    needle: "share-preview-build-51.jpg",
  },
  {
    label: "homepage Bast Platform interaction-log product view",
    needle: "/assets/platform/admin-interaction-log.jpg",
  },
  {
    label: "homepage Bast Platform analytics product view",
    needle: "/assets/platform/admin-usage-analytics.jpg",
  },
  {
    label: "homepage Bast Platform demos action",
    needle: 'class="button button-primary" href="#demos">Watch the demos</a>',
  },
  {
    label: "homepage Bast Platform copy panel",
    needle: 'class="offering-platform-copy"',
  },
  {
    label: "dedicated Bast Platform homepage link",
    needle: 'href="/platform/"',
  },
  {
    label: "homepage BastCare growth counter",
    needle: 'data-bastcare-metrics-context="growth"',
  },
  {
    label: "homepage BastCare App Store action",
    needle: 'data-app-store-placement="bast-home-offering"',
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
  {
    label: "old My Visits homepage screen",
    needle: "/assets/bastcare/screens/visits.webp",
  },
  {
    label: "old visit summary homepage screen",
    needle: "/assets/bastcare/screens/summary.webp",
  },
  {
    label: "old sharing preview homepage screen",
    needle: "/assets/bastcare/screens/share-preview.webp",
  },
  {
    label: "homepage technical-frame promotion",
    needle: 'href="/frames/claim-level-source-grounding/"',
  },
  {
    label: "old homepage Platform control-path diagram",
    needle: 'class="platform-system-figure offering-platform-figure"',
  },
];

for (const { needle, label } of requiredHomepageSnippets) {
  assertIncludes(indexHtml, needle, label);
}
for (const { needle, label } of replacedHomepageSnippets) {
  assertExcludes(indexHtml, needle, label);
}

for (const [contents, label] of [
  [indexHtml, "home"],
  [investorsHtml, "investors"],
  [principlesHtml, "principles"],
  [privacyHtml, "privacy"],
]) {
  assertExcludes(contents, 'href="/advisory/"', `public Advisory link on ${label} page`);
  assertIncludes(contents, 'href="/bastcare/"', `public BastCare link on ${label} page`);
}
for (const contents of advisoryPages) {
  assertIncludes(contents, '<meta name="robots" content="noindex, nofollow">', "Advisory noindex directive");
}
for (const contents of advisoryPages.slice(1)) {
  assertIncludes(contents, 'class="button button-primary advisory-subnav-download"', "visible advisory PDF action");
  assertIncludes(contents, "Talk with Beth", "direct advisory contact action");
  assertIncludes(contents, "Get the PDF", "plain-language advisory PDF action");
}
assertIncludes(advisoryIndexHtml, "AI advice for senior leaders", "direct advisory positioning");
assertIncludes(advisoryIndexHtml, "where data is private and the stakes are high", "high-stakes operating focus");
assertIncludes(advisoryIndexHtml, "I advise three organizations at a time", "limited direct advisory capacity");
assertIncludes(advisoryIndexHtml, 'href="/assets/bast-narrative.pdf"', "advisory narrative PDF link");
assertIncludes(advisoryIndexHtml, 'src="/assets/bast-narrative-cover.png"', "advisory narrative cover");
assertIncludes(advisoryIndexHtml, "It knows your information. It shows its sources. Your people stay in charge.", "plain-language advisory point of view");

assertIncludes(indexHtml, 'window.location.pathname.endsWith("/index.html")', "canonical homepage redirect");
assertIncludes(indexHtml, 'href="assets/styles.css?v=', "versioned homepage stylesheet");
assertIncludes(indexHtml, 'href="assets/platform.css?v=', "versioned homepage Platform diagram stylesheet");
assertIncludes(indexHtml, 'src="assets/site.js?v=', "versioned homepage behavior");
assertIncludes(indexHtml, 'src="assets/analytics-consent.js?v=', "versioned homepage analytics behavior");
assertExcludes(indexHtml, 'href="assets/styles.css"', "unversioned homepage stylesheet");
assertIncludes(platformHtml, 'href="/assets/styles.css?v=', "versioned Platform shared stylesheet");
assertIncludes(platformHtml, 'href="/assets/platform.css?v=', "versioned Platform stylesheet");
assertIncludes(platformHtml, 'src="/assets/site.js?v=', "versioned Platform behavior");
assertExcludes(platformHtml, 'href="/assets/platform.css"', "unversioned Platform stylesheet");
assertIncludes(platformHtml, "Build governed AI on infrastructure you control.", "Platform positioning");
assertIncludes(platformHtml, "Bast control layer", "Platform system map");
assertIncludes(platformHtml, "Approved sources", "Platform approved-source boundary");
assertIncludes(platformHtml, "Grounded", "Platform grounded-answer outcome");
assertIncludes(platformHtml, "Refusal", "Platform refusal outcome");
assertIncludes(platformHtml, "Bast hosted", "Bast-hosted deployment option");
assertIncludes(platformHtml, "Private cloud", "private-cloud deployment option");
assertIncludes(platformHtml, "On premises", "on-premises deployment option");
assertIncludes(platformHtml, "Your IP stays yours.", "Platform ownership statement");
assertIncludes(platformHtml, 'href="/bastcare/"', "Platform BastCare link");
assertIncludes(platformHtml, 'href="/frames/claim-level-source-grounding/"', "Platform technical frame link");
assertIncludes(siteJs, 'window.bastTrack("lead_submit_success", leadParams)', "successful lead tracking");
assertIncludes(siteJs, 'window.bastTrack("generate_lead", leadParams)', "confirmed lead tracking");
assertIncludes(siteJs, 'fetch("/assets/data/bastcare-metrics.json"', "privacy-safe BastCare metrics loading");
assertIncludes(siteJs, 'data-bastcare-metrics-context', "BastCare growth counter context");
assertIncludes(siteJs, 'fetch("/assets/data/bastcare-reviews.json"', "privacy-safe App Store review loading");
assertIncludes(siteJs, 'setupBastCareReviewCarousel', "accessible App Store review carousel behavior");
assertExcludes(siteJs, 'https://itunes.apple.com/', "browser-side Apple review request");
if (bastcareReviews.schemaVersion !== 1 ||
    bastcareReviews.app?.id !== 6789669565 ||
    typeof bastcareReviews.rating?.average !== "number" ||
    !Number.isSafeInteger(bastcareReviews.rating?.count) ||
    !Array.isArray(bastcareReviews.reviews) ||
    bastcareReviews.reviews.length !== bastcareReviews.rating?.writtenReviewCount ||
    bastcareReviews.reviews.length < 1) {
  throw new Error("Invalid BastCare App Store review snapshot");
}
if (bastcareMetrics.schemaVersion !== 1 ||
    !Number.isSafeInteger(bastcareMetrics.metrics?.successfulSummaries) ||
    bastcareMetrics.metrics.successfulSummaries < 1) {
  throw new Error("Invalid BastCare public metrics snapshot");
}
assertExcludes(siteJs, 'function handlePdfDownloads()', "duplicate PDF click handler");
assertIncludes(analyticsConsentJs, 'resource: link.getAttribute("data-resource") || undefined', "PDF resource tracking");
assertIncludes(analyticsConsentJs, 'window.bastTrack("app_store_click"', "App Store conversion tracking");
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
  assertIncludes(contents, 'href="/bastcare/processors/"', `processors link on ${label} page`);
  assertIncludes(contents, 'href="/bastcare/support/"', `support link on ${label} page`);
  assertIncludes(contents, 'href="/bastcare/terms/"', `terms link on ${label} page`);
  assertIncludes(contents, 'href="/bastcare/delete-account/"', `deletion link on ${label} page`);
  assertIncludes(contents, 'href="/bastcare/architecture/"', `architecture link on ${label} page`);
  assertIncludes(contents, 'href="#main"', `skip link on ${label} page`);
  assertIncludes(contents, "not a medical device", `medical posture on ${label} page`);
}

const approvedVisitPrivacyCopy = "Audio stays on your iPhone until the summary is created. Then the audio and full transcript are deleted from your iPhone. Temporary masked transcript text is sent securely to OpenAI, Bast’s AI processing provider, to create the summary. Bast does not save or log transcript text.";
assertIncludes(bastcareHome, approvedVisitPrivacyCopy, "approved marketing privacy copy");
assertIncludes(bastcareHome, 'href="/assets/styles.css?v=', "versioned BastCare stylesheet");
assertIncludes(bastcareHome, 'src="/assets/site.js?v=', "versioned BastCare behavior");
assertExcludes(bastcareHome, 'href="/assets/styles.css"', "unversioned BastCare stylesheet");
assertIncludes(bastcareHome, 'id="bastcare-tour"', "BastCare screenshot walkthrough");
assertIncludes(bastcareHome, "Screens show fictional demonstration names", "BastCare demo-data disclosure");
assertIncludes(bastcareHome, "home-build-51.jpg", "Build 51 home screen");
assertIncludes(bastcareHome, "summary-build-51.jpg", "Build 51 visit summary screen");
assertIncludes(bastcareHome, "careteam-build-51.jpg", "Build 51 CareTeam screen");
assertIncludes(bastcareHome, "sharing-settings-build-51.jpg", "Build 51 sharing controls screen");
assertIncludes(bastcareHome, "share-preview-build-51.jpg", "Build 51 CareTeam share preview");
assertExcludes(bastcareHome, "/assets/bastcare/screens/home.webp", "old BastCare home screenshot");
assertIncludes(bastcareHome, "Real help. In their words.", "BastCare review carousel headline");
assertIncludes(bastcareHome, "Privacy and trust - so needed", "latest verified review fallback");
assertIncludes(bastcareHome, "Loved the ease and accuracy", "BastCare verified review quote");
assertIncludes(bastcareHome, "MapleFan2", "BastCare public reviewer attribution");
assertIncludes(bastcareHome, "6 ratings", "BastCare App Store rating count fallback");
assertIncludes(bastcareHome, "4 written reviews", "BastCare written review count fallback");
assertIncludes(bastcareHome, "data-review-track", "BastCare App Store review carousel");
assertIncludes(bastcareHome, "BastCare summaries created", "BastCare aggregate proof metrics");
assertIncludes(bastcareHome, 'data-app-store-placement="hero"', "hero App Store download action");
assertIncludes(bastcareHome, 'data-app-store-placement="tour"', "tour App Store download action");
assertIncludes(bastcareHome, 'data-app-store-placement="proof"', "proof App Store download action");
const bastcareAppStoreLink = 'href="https://apps.apple.com/app/id6789669565"';
if (bastcareHome.split(bastcareAppStoreLink).length - 1 < 3) {
  throw new Error("BastCare App Store link must appear in all three download actions");
}
assertIncludes(bastcarePrivacy, approvedVisitPrivacyCopy, "approved policy privacy copy");
assertIncludes(bastcareSupport, "Never send us visit audio", "content-free support guidance");
assertIncludes(bastcareSupport, "community@bast.ai", "monitored support contact");
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
assertIncludes(bastcareDeleteAccount, "Choose Delete BastCare Account", "in-app deletion path");
assertIncludes(bastcareDeleteAccount, "Only after server success", "server-first deletion order");
assertIncludes(bastcareArchitecture, "Functional requirements", "architecture FRs");
assertIncludes(bastcareArchitecture, "Non-functional requirements", "architecture NFRs");
assertIncludes(bastcareArchitecture, "bastcare-solution-architecture.pdf", "architecture PDF download");
const bastcarePublicCopy = bastcarePages.map(([contents]) => contents).join("\n");
assertExcludes(bastcarePublicCopy, "add a note", "deferred patient-note wording");
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
assertIncludes(sitemapXml, "/platform/</loc>", "Bast Platform sitemap route");
assertIncludes(sitemapXml, "/bastcare/</loc>", "BastCare home sitemap route");
for (const route of ["faq/", "team/", "frames/", "frames/claim-level-source-grounding/"]) {
  assertIncludes(sitemapXml, `/${route}</loc>`, `GEO ${route} sitemap route`);
}
for (const route of ["", "healthcare.html", "eu-ai-act.html", "change.html"]) {
  assertExcludes(sitemapXml, `/advisory/${route}`, `Advisory ${route || "home"} sitemap route`);
}
for (const route of ["privacy", "processors", "support", "terms", "delete-account", "architecture"]) {
  assertIncludes(sitemapXml, `/bastcare/${route}/`, `BastCare ${route} sitemap route`);
}

// GEO layer: structured data and crawler surfaces (2026-08-28).
const llmsTxt = await readFile(path.join(distDir, "llms.txt"), "utf8");
const faqHtml = await readFile(path.join(distDir, "faq/index.html"), "utf8");
const teamHtml = await readFile(path.join(distDir, "team/index.html"), "utf8");
const frameHtml = await readFile(
  path.join(distDir, "frames/claim-level-source-grounding/index.html"), "utf8");
assertIncludes(indexHtml, '"legalName": "Bast, Inc."', "Organization legalName");
assertIncludes(indexHtml, '"award"', "Organization OEDIT award");
assertIncludes(principlesHtml, 'href="/frames/claim-level-source-grounding/"', "principles frame crosslink");
assertIncludes(llmsTxt, "Bast, Inc.", "llms.txt legal entity");
assertIncludes(llmsTxt, "/platform/", "llms.txt Platform entry");
assertIncludes(llmsTxt, "/frames/claim-level-source-grounding/", "llms.txt frame entry");
assertIncludes(llmsTxt, "not affiliated with Vast.ai", "llms.txt Vast.ai disambiguation");
assertIncludes(faqHtml, "Is Bast AI affiliated with Vast.ai?", "FAQ Vast.ai disambiguation question");
assertIncludes(faqHtml, '"FAQPage"', "FAQ structured data");
assertIncludes(teamHtml, "Thanh Lam", "team page CTO bio");
assertIncludes(teamHtml, '"Person"', "team Person structured data");
assertIncludes(frameHtml, '"DefinedTerm"', "frame DefinedTerm structured data");
assertIncludes(frameHtml, "Claim-Level Source Grounding", "frame page title copy");
assertIncludes(bastcareHome, '"operatingSystem": "iOS"', "BastCare SoftwareApplication schema");
assertIncludes(bastcareArchitecture, '"BreadcrumbList"', "architecture BreadcrumbList schema");

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
