import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const distDir = path.join(root, "dist");
const requiredFiles = [
  "index.html",
  "investors.html",
  "principles.html",
  "manifesto/index.html",
  "assets/manifesto.css",
  "assets/manifesto.js",
  "assets/manifesto/data-belonging-periwinkle-organic.png",
  "assets/manifesto/data-belonging-periwinkle-organic.gif",
  "assets/manifesto/robert-w-beth-manifesto-retold.pdf",
  "404.html",
  "privacy.html",
  "robots.txt",
  "sitemap.xml",
  "assets/styles.css",
  "assets/platform.css",
  "assets/site.js",
  "assets/analytics-consent.js",
  "assets/bast-logo.svg",
  "assets/og/bast-share.png",
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
  "assets/bastcare/screens/home-1-0-9.jpg",
  "assets/bastcare/screens/visits-1-0-9.jpg",
  "assets/bastcare/screens/summary-1-0-9.jpg",
  "assets/bastcare/screens/translate-1-0-9.jpg",
  "assets/bastcare/screens/export-1-0-9.jpg",
  "assets/bastcare/screens/share-1-0-9.jpg",
  "assets/bastcare/screens/share-review-1-0-9.jpg",
  "assets/bastcare/screens/shared-1-0-9.jpg",
  "assets/bastcare/media/bastcare-walkthrough-captioned.mp4",
  "assets/bastcare/media/bastcare-walkthrough-poster.jpg",
  "assets/data/bastcare-metrics.json",
  "assets/data/bastcare-reviews.json",
  "assets/bast-narrative.pdf",
  "assets/bast-narrative-cover.png",
  "advisory/index.html",
  ".nojekyll",
  ".well-known/apple-app-site-association",
  "careteam/invite/index.html",
  "platform/index.html",
  "platform/architecture/index.html",
  "platform/delivery/index.html",
  "platform/evidence/index.html",
  "platform/demo/index.html",
  "demos/index.html",
  "pilot/index.html",
  "assets/pilot/pilot.css",
  "assets/pilot/beth-and-sister.webp",
  "assets/pilot/beth-and-sister.jpg",
  "assets/bastcare-pilot-one-pager.pdf",
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
  "frames/zero-tolerance-ai-output-architecture/index.html",
];

const forbidden = [
  "G-FL8JCB0PXZ",
  "hello@profa.mail",
  "__GA_MEASUREMENT_ID__",
  "__GA_MEASUREMENT_ID_DISPLAY__",
  "__SITE_ENV__",
  "__SITE_URL__",
  "__ROBOTS_META__",
  "__BASTCARE_VERSION__",
  "__BASTCARE_RATING_AVERAGE__",
  "__BASTCARE_RATING_COUNT_LABEL__",
  "__BASTCARE_WRITTEN_REVIEW_COUNT_LABEL__",
  // Wrong legal entity name — the registered entity is "Bast, Inc." (decision 2026-08-28).
  "Bast AI, Inc.",
  // Public review handles reduce credibility and are intentionally omitted from site output.
  "yessireebob",
  "Circe-QQ",
  "TaylorMcLemore",
  "Ghent Dalgliesh",
  "wipkmm",
  "MapleFan2",
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

function extractPrimaryNav(contents, label) {
  const match = contents.match(/<nav class="site-nav[^"]*" aria-label="Primary">([\s\S]*?)<\/nav>/);
  if (!match) throw new Error(`Missing primary navigation on ${label} page`);
  return match[1];
}

for (const file of requiredFiles) {
  await exists(file);
}

const indexHtml = await readFile(path.join(distDir, "index.html"), "utf8");
const platformHtml = await readFile(path.join(distDir, "platform/index.html"), "utf8");
const platformArchitectureHtml = await readFile(path.join(distDir, "platform/architecture/index.html"), "utf8");
const platformDeliveryHtml = await readFile(path.join(distDir, "platform/delivery/index.html"), "utf8");
const platformEvidenceHtml = await readFile(path.join(distDir, "platform/evidence/index.html"), "utf8");
const platformDemoHtml = await readFile(path.join(distDir, "platform/demo/index.html"), "utf8");
const investorsHtml = await readFile(path.join(distDir, "investors.html"), "utf8");
const principlesHtml = await readFile(path.join(distDir, "principles.html"), "utf8");
const privacyHtml = await readFile(path.join(distDir, "privacy.html"), "utf8");
const advisoryArchiveStub = await readFile(path.join(distDir, "advisory/index.html"), "utf8");
const analyticsConsentJs = await readFile(path.join(distDir, "assets/analytics-consent.js"), "utf8");
const siteJs = await readFile(path.join(distDir, "assets/site.js"), "utf8");
const siteCss = await readFile(path.join(distDir, "assets/styles.css"), "utf8");
const platformCss = await readFile(path.join(distDir, "assets/platform.css"), "utf8");
assertBalancedCssBlocks(siteCss, "site stylesheet");
assertBalancedCssBlocks(platformCss, "platform stylesheet");
assertIncludes(siteCss, ".outcome-stat .case-badge", "readable homepage case-study badge override");
const bastcareMetrics = JSON.parse(await readFile(
  path.join(distDir, "assets/data/bastcare-metrics.json"), "utf8"));
const bastcareReviews = JSON.parse(await readFile(
  path.join(distDir, "assets/data/bastcare-reviews.json"), "utf8"));
const appleAssociation = await readFile(
  path.join(distDir, ".well-known/apple-app-site-association"), "utf8");
const careteamInvite = await readFile(
  path.join(distDir, "careteam/invite/index.html"), "utf8");
const faqHtmlForPlus = await readFile(path.join(distDir, "faq/index.html"), "utf8");
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

assertExcludes(investorsHtml, "bast-ai-healthcare-teaser", "retired healthcare teaser reference");
assertExcludes(investorsHtml, "Download teaser", "retired teaser download");
assertIncludes(investorsHtml, 'href="/platform/evidence/"', "investor evidence-register link");

assertIncludes(indexHtml, '<body class="home-page">', "homepage editorial style scope");
for (const [contents, label] of [
  [indexHtml, "home"],
  [platformHtml, "platform"],
  [bastcareHome, "BastCare"],
  [bastcarePrivacy, "BastCare privacy"],
]) {
  const primaryNav = extractPrimaryNav(contents, label);
  const primaryLinkCount = (primaryNav.match(/<a\b/g) || []).length;
  if (primaryLinkCount !== 4) {
    throw new Error(`Expected exactly four primary links on ${label} page; found ${primaryLinkCount}`);
  }
  assertIncludes(primaryNav, 'href="/demos/"', `Demos primary link on ${label} page`);
  assertIncludes(primaryNav, 'href="/platform/"', `Platform primary link on ${label} page`);
  assertIncludes(primaryNav, 'href="/bastcare/"', `BastCare primary link on ${label} page`);
  assertIncludes(primaryNav, "Contact", `Contact primary link on ${label} page`);
  for (const legacyLabel of ["How it works", "Offerings", "Principles", "Investors", "Advisory"]) {
    assertExcludes(primaryNav, legacyLabel, `${legacyLabel} primary link on ${label} page`);
  }
}

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
    label: "homepage zero-tolerance frame promotion",
    needle: 'href="/frames/zero-tolerance-ai-output-architecture/"',
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
// Advisory pages are archived (decision 2026-10-12): only a noindex stub remains.
assertIncludes(advisoryArchiveStub, '<meta name="robots" content="noindex, nofollow">', "Advisory archive stub noindex");
assertIncludes(advisoryArchiveStub, 'http-equiv="refresh" content="5; url=/"', "Advisory archive stub redirect");
assertIncludes(advisoryArchiveStub, "Bast Advisory pages have been archived.", "Advisory archive notice");
for (const archived of [
  "advisory/healthcare.html",
  "advisory/eu-ai-act.html",
  "advisory/change.html",
  "assets/advisory.css",
  "assets/bast-healthcare-advisory.pdf",
  "assets/bast-eu-ai-act-briefing.pdf",
  "assets/bast-change-adoption.pdf",
]) {
  let published = true;
  try { await exists(archived); } catch { published = false; }
  if (published) throw new Error(`Archived advisory file is still published: ${archived}`);
}

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
assertIncludes(platformHtml, "Stable AI products, built to keep getting better.", "outcome-led Platform headline");
assertIncludes(platformHtml, "Bast Agent OS", "public Agent OS name");
assertIncludes(platformHtml, "Grounded in what you trust.", "trusted knowledge benefit");
assertIncludes(platformHtml, "Shows where it came from.", "source visibility benefit");
assertIncludes(platformHtml, "People stay in charge.", "human accountability benefit");
assertIncludes(platformHtml, "The platform in the palm of your hand", "BastCare product proof");
assertIncludes(platformHtml, 'href="/bastcare/"', "Platform BastCare link");
assertIncludes(platformHtml, 'href="/platform/architecture/"', "quiet architecture diligence link");
assertIncludes(platformHtml, 'href="/platform/evidence/"', "quiet evidence diligence link");
assertExcludes(platformHtml, "The architecture is the business case.", "architecture-led marketing copy");
assertExcludes(platformHtml, "Commit history helps us find change", "commit-history marketing copy");
assertExcludes(platformHtml, "detect-remediate-verify-rollback", "recovery-loop marketing copy");
assertExcludes(platformHtml, 'class="evidence-nav"', "evidence navigation on primary Platform page");
assertExcludes(platformHtml, 'class="maturity ', "maturity taxonomy on primary Platform page");
for (const [contents, label] of [
  [platformArchitectureHtml, "architecture"],
  [platformDeliveryHtml, "delivery"],
  [platformEvidenceHtml, "evidence"],
  [platformDemoHtml, "demo"],
]) {
  assertIncludes(contents, 'class="evidence-nav"', `${label} evidence navigation`);
  assertIncludes(contents, 'href="/platform/architecture/"', `${label} architecture link`);
  assertIncludes(contents, 'href="/platform/delivery/"', `${label} delivery link`);
  assertIncludes(contents, 'href="/platform/evidence/"', `${label} evidence link`);
  assertIncludes(contents, 'href="/platform/demo/"', `${label} demo link`);
}
assertIncludes(platformArchitectureHtml, "one microservice per agent remains a direction", "bounded agent microservice language");
assertIncludes(platformArchitectureHtml, "BastCare on the new AWS path", "current BastCare delivery path");
assertIncludes(platformArchitectureHtml, "Retire the remaining Duplo estate", "bounded Duplo transition language");
assertIncludes(platformArchitectureHtml, "detect, remediate within bounds, verify recovery", "self-healing definition");
assertIncludes(platformEvidenceHtml, "BAST-AGENT-001", "evidence claim identifier");
assertIncludes(platformEvidenceHtml, "Review needed", "publication review state");
assertIncludes(platformDemoHtml, "Too broad without bounded comparative evidence", "quality comparison boundary");
assertIncludes(siteJs, 'window.bastTrack("lead_submit_success", leadParams)', "successful lead tracking");
assertIncludes(siteJs, 'window.bastTrack("generate_lead", leadParams)', "confirmed lead tracking");
assertIncludes(siteJs, 'fetch("/assets/data/bastcare-metrics.json"', "privacy-safe BastCare metrics loading");
assertIncludes(siteJs, 'data-bastcare-metrics-context', "BastCare growth counter context");
assertIncludes(siteJs, 'fetch("/assets/data/bastcare-reviews.json"', "privacy-safe App Store review loading");
assertIncludes(siteJs, 'setupBastCareReviewCarousel', "accessible App Store review carousel behavior");
assertExcludes(siteJs, 'https://itunes.apple.com/', "browser-side Apple review request");
if (bastcareReviews.schemaVersion !== 1 ||
    bastcareReviews.reviews?.some((review) => Object.hasOwn(review, "author")) ||
    bastcareReviews.app?.id !== 6789669565 ||
    typeof bastcareReviews.rating?.average !== "number" ||
    !Number.isSafeInteger(bastcareReviews.rating?.count) ||
    !Array.isArray(bastcareReviews.reviews) ||
    !Number.isSafeInteger(bastcareReviews.rating?.writtenReviewCount) ||
    bastcareReviews.reviews.length > bastcareReviews.rating.count ||
    !/^[0-9]+(\.[0-9]+){1,3}$/.test(bastcareReviews.app?.version ?? "") ||
    bastcareReviews.reviews.length < 1) {
  throw new Error("Invalid BastCare App Store review snapshot");
}

// Review approval queue (decision 2026-10-12): only approved review text ships.
const reviewQueue = Object.fromEntries(await Promise.all(
  ["approved", "pending", "rejected"].map(async (name) => {
    const document = JSON.parse(await readFile(
      path.join(root, "data/bastcare-reviews", `${name}.json`), "utf8"));
    if (document.schemaVersion !== 1 || !Array.isArray(document.reviews)) {
      throw new Error(`Invalid BastCare review queue file: ${name}.json`);
    }
    return [name, document.reviews];
  })));
const approvedReviewIds = new Set(reviewQueue.approved.map((review) => review.id));
for (const [name, reviews] of Object.entries(reviewQueue)) {
  for (const review of reviews) {
    if (name !== "approved" && approvedReviewIds.has(review.id)) {
      throw new Error(`BastCare review ${review.id} is both approved and ${name}`);
    }
  }
}
for (const review of bastcareReviews.reviews) {
  if (!approvedReviewIds.has(review.id)) {
    throw new Error(`Unapproved BastCare review ${review.id} in public snapshot`);
  }
}
const bastcarePublicReviewOutput = [
  JSON.stringify(bastcareReviews),
  await readFile(path.join(distDir, "bastcare/index.html"), "utf8"),
  await readFile(path.join(distDir, "index.html"), "utf8"),
].join("\n");
for (const review of [...reviewQueue.pending, ...reviewQueue.rejected]) {
  if (review.excerpt) {
    assertExcludes(bastcarePublicReviewOutput, review.excerpt, `unapproved BastCare review text (${review.id})`);
  }
}
if (!reviewQueue.approved.some((review) => review.placement === "featured" && review.title === "This app is a Godsend")) {
  throw new Error("Featured Australian review is not recorded in approved.json");
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
assertIncludes(careteamInvite, 'href="https://apps.apple.com/app/id6789669565"', "BastCare installation link");
assertIncludes(careteamInvite, "After installing, return to the invitation message", "post-install invitation recovery");
assertIncludes(careteamInvite, 'name="referrer" content="no-referrer"', "invitation referrer protection");
assertExcludes(careteamInvite, "current TestFlight invitation", "obsolete tester-only installation instructions");
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
const bastcarePublicCopy = bastcarePages.map(([contents]) => contents).join("\n");
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

const approvedVisitPrivacyCopy = "When you request a summary, BastCare masks configured names in a separate copy of your transcript and sends it securely through Bast to an AI provider for processing.";
assertIncludes(bastcareHome, approvedVisitPrivacyCopy, "approved marketing privacy copy");
assertIncludes(bastcareHome, 'class="bastcare-page bastcare-home"', "aligned BastCare homepage panels");
assertIncludes(bastcareHome, 'href="/assets/styles.css?v=', "versioned BastCare stylesheet");
assertIncludes(bastcareHome, 'src="/assets/site.js?v=', "versioned BastCare behavior");
assertExcludes(bastcareHome, 'href="/assets/styles.css"', "unversioned BastCare stylesheet");
assertIncludes(bastcareHome, 'id="bastcare-tour"', "BastCare screenshot walkthrough");
assertIncludes(bastcareHome, "Screens show fictional demonstration names", "BastCare demo-data disclosure");
const bastcareVersionTag = `BastCare <span data-bastcare-version>${bastcareReviews.app.version}</span> · Now available`;
assertIncludes(bastcareHome, bastcareVersionTag, "BastCare App Store version in release hero");
assertIncludes(indexHtml, bastcareVersionTag, "BastCare App Store version on Bast home");
assertIncludes(bastcareHome, `<title>BastCare ${bastcareReviews.app.version} - Be in the room</title>`, "BastCare versioned page title");
assertIncludes(bastcareHome, `"softwareVersion": "${bastcareReviews.app.version}"`, "BastCare structured-data version");
assertIncludes(bastcareHome, "data-bastcare-release-notes-version=", "hand-approved BastCare release notes marker");
for (const [contents, label] of [[bastcareHome, "BastCare"], [indexHtml, "home"]]) {
  assertExcludes(contents, "1.0.10", `hardcoded BastCare 1.0.10 on ${label} page`);
  assertExcludes(contents, 'alt="BastCare 1.0.', `version-specific screenshot alt text on ${label} page`);
  assertExcludes(contents, 'alt="BastCare Build ', `build-specific screenshot alt text on ${label} page`);
  assertIncludes(contents, `${bastcareReviews.rating.average.toFixed(1)} out of 5 stars from`, `build-time BastCare rating on ${label} page`);
}
assertIncludes(bastcareHome, "Be in the room.", "BastCare outcome headline");
assertIncludes(bastcareHome, "Use every feature for your first two hours of recorded visits", "BastCare free-use offer");
assertIncludes(bastcareHome, "See where a key point came from.", "BastCare source-lineage story");
assertIncludes(bastcareHome, "How this summary was made", "BastCare source view");
assertIncludes(bastcareHome, "Simplified Chinese", "BastCare summary language list");
assertIncludes(bastcareHome, "Albanian", "BastCare Albanian support");
assertIncludes(bastcareHome, "German", "BastCare German support");
// The captioned walkthrough replaces the Sept 19 release video in the hero (2026-10-13).
assertExcludes(bastcareHome, "bastcare-release.m4v", "retired Sept 19 release video");
assertExcludes(bastcareHome, "bastcare-release-poster.jpg", "retired Sept 19 release poster");
assertIncludes(bastcareHome, 'id="bastcare-walkthrough"', "BastCare hero walkthrough anchor");
if ((bastcareHome.match(/<video\b/g) || []).length !== 1) {
  throw new Error("Expected exactly one video on the BastCare page");
}
{
  const heroVideo = bastcareHome.match(/<figure class="bastcare-release-video[^"]*" id="bastcare-walkthrough">\s*<video ([^>]*)>\s*<source src="\/assets\/bastcare\/media\/bastcare-walkthrough-captioned\.mp4" type="video\/mp4">/);
  if (!heroVideo) throw new Error("Missing captioned walkthrough in the BastCare hero");
  for (const attribute of ["controls", "playsinline", 'poster="/assets/bastcare/media/bastcare-walkthrough-poster.jpg"']) {
    assertIncludes(heroVideo[1], attribute, `hero walkthrough ${attribute}`);
  }
  assertExcludes(heroVideo[1], "autoplay", "autoplaying 43 MB walkthrough");
}
assertIncludes(bastcareHome, "bastcare-walkthrough-captioned.mp4", "captioned BastCare walkthrough");
assertIncludes(bastcareHome, "bastcare-walkthrough-poster.jpg", "BastCare walkthrough poster");
assertIncludes(bastcareHome, 'preload="metadata"', "metadata-only walkthrough loading");
assertIncludes(bastcareHome, "seven-language translation", "carousel translation handoff");
for (const screen of [
  "home-1-0-9.jpg",
  "visits-1-0-9.jpg",
  "summary-1-0-9.jpg",
  "translate-1-0-9.jpg",
  "export-1-0-9.jpg",
  "share-1-0-9.jpg",
  "share-review-1-0-9.jpg",
  "shared-1-0-9.jpg",
]) {
  assertIncludes(bastcareHome, screen, `BastCare walkthrough screen: ${screen}`);
}
assertExcludes(bastcareHome, "build-51", "stale Build 51 BastCare walkthrough screen");
assertExcludes(bastcareHome, "/assets/bastcare/screens/home.webp", "old BastCare home screenshot");
assertIncludes(bastcareHome, "Real help. In their words.", "BastCare review carousel headline");
assertIncludes(bastcareHome, "This app is a Godsend", "featured Australian review title");
assertIncludes(bastcareHome, "Verified Australian App Store review", "featured Australian review attribution");
assertIncludes(bastcareHome, "Privacy and trust - so needed", "latest verified review fallback");
assertIncludes(bastcareHome, "Loved the ease and accuracy", "BastCare verified review quote");
assertIncludes(bastcareHome, "Verified App Store review", "BastCare review source attribution");
assertIncludes(bastcareHome, `${bastcareReviews.rating.count} ratings`, "BastCare App Store rating count fallback");
assertIncludes(bastcareHome, `${bastcareReviews.rating.writtenReviewCount} written reviews`, "BastCare written review count fallback");
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
assertIncludes(bastcareHome, 'href="/bastcare/processors/"', "BastCare processing disclosure link");
assertIncludes(bastcarePrivacy, "Each request goes only to the provider selected for that request", "single-provider request boundary");
for (const provider of ["Anthropic", "OpenAI"]) {
  assertIncludes(bastcareProcessors, `<p class="processor-name">${provider}</p>`, `${provider} processor disclosure`);
  assertIncludes(bastcareArchitecture, provider, `${provider} architecture disclosure`);
}
assertIncludes(bastcareHome, "Use it to regenerate the summary", "BastCare transcript regeneration message");
assertIncludes(bastcarePrivacy, "Use this summary", "BastCare regeneration preview choice");
assertIncludes(bastcareSupport, "Regenerate summary", "BastCare regeneration support");
assertIncludes(bastcareSupport, "View transcript", "BastCare transcript support");
assertIncludes(bastcareArchitecture, "On-device source", "BastCare transcript architecture commitment");
for (const staleTranscriptClaim of [
  "audio and full transcript are deleted from your iPhone",
  "temporary audio and transcript text do not",
  "temporary audio and transcript text are removed",
  "deletes temporary audio and transcript text from the iPhone",
  "remove temporary audio and text after the summary is saved",
]) {
  assertExcludes(bastcarePublicCopy, staleTranscriptClaim, `stale transcript deletion claim: ${staleTranscriptClaim}`);
}
assertIncludes(bastcareSupport, "Never send us visit audio", "content-free support guidance");
assertIncludes(bastcareSupport, "community@bast.ai", "monitored support contact");
assertIncludes(bastcarePrivacy, "Bast, Inc.", "privacy legal entity");
assertIncludes(bastcarePrivacy, "3700 Quebec St", "privacy mailing address");
assertIncludes(bastcarePrivacy, 'href="/bastcare/processors/"', "named processor disclosure link");
for (const provider of ["OpenAI", "Amazon Web Services", "MongoDB", "Apple", "Google"]) {
  assertIncludes(bastcareProcessors, provider, `named BastCare provider: ${provider}`);
}
assertIncludes(bastcareProcessors, "Libraries and processors are different lists", "library boundary");
assertIncludes(bastcareTerms, "BastCare is free to download and includes the first two recorded hours", "current included-hours terms");
// BastCare Plus is paused (Beth, 2026-10-13; 1.0.12 release notes).
const plusPaused = "BastCare Plus is paused for now while we improve subscriptions";
assertIncludes(faqHtmlForPlus, plusPaused, "FAQ BastCare Plus pause");
assertIncludes(bastcareTerms, plusPaused, "terms BastCare Plus pause");
assertExcludes(faqHtmlForPlus, "A paid tier is not part of the current release", "stale FAQ paid-tier claim");
assertExcludes(bastcareSupport, "Purchase, restore", "current paid support claim");
assertExcludes(bastcarePrivacy, "verify Apple subscription", "current paid privacy claim");
assertIncludes(bastcareDeleteAccount, "Choose Delete BastCare Account", "in-app deletion path");
assertIncludes(bastcareDeleteAccount, "Only after server success", "server-first deletion order");
assertIncludes(bastcareArchitecture, "Functional requirements", "architecture FRs");
assertIncludes(bastcareArchitecture, "Non-functional requirements", "architecture NFRs");
assertIncludes(bastcareArchitecture, "bastcare-solution-architecture.pdf", "architecture PDF download");
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
assertIncludes(sitemapXml, "/demos/</loc>", "Demos sitemap route");

// Demos page (decision 2026-10-12): one top-nav home for every demo; Lucid labeled Pilot.
const demosHtml = await readFile(path.join(distDir, "demos/index.html"), "utf8");
for (const videoId of ["SjxGRh3G1JI", "b2l16nkB0f8", "Sa-uNxoRjos"]) {
  assertIncludes(demosHtml, `data-video-id="${videoId}"`, `demos page video ${videoId}`);
}
assertIncludes(demosHtml, "data-demo-player", "demos page click-to-load player");
assertIncludes(demosHtml, 'src="/assets/site.js?v=', "demos page player behavior");
assertIncludes(demosHtml, 'href="/platform/demo/"', "demos page demo-guide link");
assertIncludes(demosHtml, 'href="/bastcare/#bastcare-walkthrough"', "demos page BastCare walkthrough link");
assertIncludes(demosHtml, 'aria-current="page" href="/demos/"', "demos page current navigation");
assertIncludes(indexHtml, 'href="/demos/"', "homepage link to the demos page");
for (const [contents, label] of [[demosHtml, "demos"], [indexHtml, "home"]]) {
  assertIncludes(contents, '<span class="demo-pilot-label">Pilot</span> Lucid Therapeutics', `Pilot label on ${label} Lucid demo`);
  assertIncludes(contents, "A pilot of Bast applied to Lucid Therapeutics&rsquo; patient information", `Lucid pilot wording on ${label} page`);
  assertExcludes(contents, "pilot usage analytics", `superseded Lucid analytics wording on ${label} page`);
  assertExcludes(contents, "production analytics", `production claim on ${label} demos`);
}
// Beth, 2026-10-12: the Pilot tag and card text carry the pilot status; no
// louder page-level "not a production deployment" note.
for (const [contents, label] of [[demosHtml, "demos"], [indexHtml, "home"]]) {
  assertExcludes(contents, "demos-pilot-note", `page-level pilot note on ${label}`);
  assertExcludes(contents, "not a production deployment", `production disclaimer on ${label}`);
}
const demoCardCount = (demosHtml.match(/class="demo-card"/g) || []).length;
const pilotLabelCount = (demosHtml.match(/class="demo-pilot-label">Pilot</g) || []).length;
// Only the Lucid Therapeutics demo is a pilot (Beth, 2026-10-12).
if (demoCardCount !== 5 || pilotLabelCount !== 1) {
  throw new Error(`Expected five demos with only Lucid labeled Pilot; found ${demoCardCount} demos and ${pilotLabelCount} labels`);
}

for (const route of ["architecture", "delivery", "evidence", "demo"]) {
  assertIncludes(sitemapXml, `/platform/${route}/</loc>`, `Platform ${route} sitemap route`);
}
assertIncludes(sitemapXml, "/bastcare/</loc>", "BastCare home sitemap route");
for (const route of [
  "faq/",
  "team/",
  "frames/",
  "frames/claim-level-source-grounding/",
  "frames/zero-tolerance-ai-output-architecture/",
]) {
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
assertExcludes(llmsTxt, "not a production deployment", "production disclaimer in llms.txt");
const faqHtml = await readFile(path.join(distDir, "faq/index.html"), "utf8");
const teamHtml = await readFile(path.join(distDir, "team/index.html"), "utf8");
const frameHtml = await readFile(
  path.join(distDir, "frames/claim-level-source-grounding/index.html"), "utf8");
const frame2Html = await readFile(
  path.join(distDir, "frames/zero-tolerance-ai-output-architecture/index.html"), "utf8");
const framesIndexHtml = await readFile(path.join(distDir, "frames/index.html"), "utf8");
assertIncludes(indexHtml, '"legalName": "Bast, Inc."', "Organization legalName");
assertIncludes(indexHtml, '"award"', "Organization OEDIT award");
assertIncludes(principlesHtml, 'href="/frames/claim-level-source-grounding/"', "principles frame crosslink");
assertIncludes(llmsTxt, "Bast, Inc.", "llms.txt legal entity");
assertIncludes(llmsTxt, "/platform/", "llms.txt Platform entry");
assertIncludes(llmsTxt, "/demos/", "llms.txt Demos entry");
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

// GEO layer, second drop (2026-09-05): frame 02 + verified identity additions.
const frame2Path = 'href="/frames/zero-tolerance-ai-output-architecture/"';
assertIncludes(frame2Html, '"DefinedTerm"', "frame 02 DefinedTerm structured data");
assertIncludes(frame2Html, '"FAQPage"', "frame 02 FAQPage structured data");
assertIncludes(frame2Html, "Zero-Tolerance AI Output Architecture", "frame 02 title copy");
assertIncludes(frame2Html, "Tier 3 — Output Interception", "frame 02 tier taxonomy");
assertIncludes(frame2Html, 'href="/frames/claim-level-source-grounding/"', "frame 02 companion link");
assertIncludes(frameHtml, frame2Path, "frame 01 companion link");
assertIncludes(framesIndexHtml, frame2Path, "frames index card for frame 02");
assertIncludes(framesIndexHtml, '"name": "Zero-Tolerance AI Output Architecture"', "frames index DefinedTermSet entry");
assertIncludes(principlesHtml, frame2Path, "principles frame 02 crosslink");
assertIncludes(faqHtml, frame2Path, "FAQ frame 02 crosslink");
assertIncludes(faqHtml, "bast.ai/frames/zero-tolerance-ai-output-architecture/", "FAQ schema frame 02 reference");
assertIncludes(llmsTxt, "/frames/zero-tolerance-ai-output-architecture/", "llms.txt frame 02 entry");
assertIncludes(llmsTxt, "https://github.com/bast-ai", "llms.txt GitHub profile");
assertIncludes(indexHtml, '"https://github.com/bast-ai"', "Organization GitHub sameAs");
assertIncludes(indexHtml, '"name": "Bast Platform"', "Organization Bast Platform offer");
// Gate B1 (2026-09-05; review notes in private bast-ai/ai-workspace website/): no named customer deployment claim until Beth approves the wording.
assertExcludes(frame2Html, "Lucid Therapeutics", "unapproved customer claim on frame 02");
// Policy (decision 2026-08-28): frames define categories without naming other vendors.
for (const vendor of ["OpenAI", "Anthropic", "Galileo", "Arthur AI", "Guardrails AI", "Fiddler", "Arize", "Patronus", "LangChain"]) {
  assertExcludes(frameHtml, vendor, `vendor name on frame 01: ${vendor}`);
  assertExcludes(frame2Html, vendor, `vendor name on frame 02: ${vendor}`);
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

// Share previews (decision 2026-10-18): every sitemap page carries static
// Open Graph and Twitter tags with an absolute image URL.
{
  const siteUrlForShare = process.env.SITE_URL || "https://www.bast.ai";
  const shareImageBytes = await readFile(path.join(distDir, "assets/og/bast-share.png"));
  if (shareImageBytes.readUInt32BE(16) !== 1200 || shareImageBytes.readUInt32BE(20) !== 630) {
    throw new Error("Default share image must be 1200x630");
  }
  if (shareImageBytes.length > 300 * 1024) throw new Error("Default share image is over 300 KB");
  const metaContent = (html, key) =>
    html.match(new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`))?.[1];
  for (const [, loc] of sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const route = loc.slice(siteUrlForShare.length);
    const file = route.endsWith("/") ? path.join(route, "index.html") : route;
    const html = await readFile(path.join(distDir, file), "utf8");
    for (const key of ["og:title", "og:description", "og:type", "og:url", "og:image",
      "og:image:width", "og:image:height", "twitter:card", "twitter:title",
      "twitter:description", "twitter:image"]) {
      if (!metaContent(html, key)) throw new Error(`Missing ${key} on ${route}`);
    }
    for (const key of ["og:image", "twitter:image", "og:url"]) {
      if (!metaContent(html, key).startsWith(`${siteUrlForShare}/`)) {
        throw new Error(`${key} on ${route} is not an absolute site URL`);
      }
    }
    if (metaContent(html, "twitter:card") !== "summary_large_image") {
      throw new Error(`twitter:card on ${route} is not summary_large_image`);
    }
    if ((html.match(/<meta property="og:image" /g) || []).length !== 1) {
      throw new Error(`Expected one og:image on ${route}`);
    }
  }
  assertIncludes(indexHtml, `<meta property="og:image" content="${siteUrlForShare}/assets/og/bast-share.png">`, "default share image on home");
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
  if (path.extname(file) === ".html" &&
      path.relative(distDir, file) !== path.join("advisory", "index.html") &&
      /href="(?:https:\/\/www\.bast\.ai)?\/advisory\//.test(contents)) {
    throw new Error(`Link to archived /advisory/ found in ${path.relative(root, file)}`);
  }
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

// /pilot/ (2026-10-22): QR-code page for nonprofit pilots. The booking CTA is
// the first action (#book, the QR target, is the hero that holds it); no prices, pilot length, license
// counts, Craig Hospital claims, or source-tracing claims; privacy wording
// matches /bastcare/.
const pilotHtml = await readFile(path.join(distDir, "pilot/index.html"), "utf8");
const pilotBookHref = 'href="mailto:beth@bast.ai?subject=BastCare%20pilot%20-%2030-minute%20call"';
assertIncludes(pilotHtml, '<section id="book" class="pilot-hero"', "pilot #book hero anchor");
const pilotHeroCta = pilotHtml.indexOf(`<a class="pilot-cta" ${pilotBookHref}>Book a 30-minute call</a>`);
if (pilotHeroCta < pilotHtml.indexOf('id="book"') || pilotHeroCta > pilotHtml.indexOf("pilot-photo")) {
  throw new Error("pilot booking CTA must sit in the #book hero, before the photo");
}
if (pilotHtml.split(pilotBookHref).length - 1 < 2) throw new Error("pilot page needs a repeated booking CTA");
assertIncludes(pilotHtml, 'href="https://apps.apple.com/app/id6789669565"', "pilot App Store link");
assertIncludes(pilotHtml, 'href="/assets/bastcare-pilot-one-pager.pdf"', "pilot one-pager download");
assertIncludes(pilotHtml, 'alt="Beth Rudden with her sister"', "pilot photo alt text");
assertIncludes(pilotHtml, "Published findings, not BastCare results.", "pilot research label");
assertIncludes(pilotHtml, "then BastCare deletes it", "pilot audio deletion wording");
assertIncludes(pilotHtml, 'href="tel:+13037176099"', "pilot phone link");
for (const banned of [/\$\s?\d/, /Craig/i, /\btrac(e|es|ed|ing)\b/i, /\bno audio or transcript\b/i, /\b\d+\s*(licenses|seats|weeks|months|days)\b/i, /\b(per|a) (month|year|license|seat)\b/i]) {
  if (banned.test(pilotHtml)) throw new Error(`pilot page contains banned wording: ${banned}`);
}
for (const [rel, maxBytes] of [["assets/pilot/beth-and-sister.webp", 250_000], ["assets/pilot/beth-and-sister.jpg", 250_000], ["assets/bastcare-pilot-one-pager.pdf", 600_000]]) {
  const { size } = await stat(path.join(distDir, rel));
  if (size > maxBytes) throw new Error(`${rel} is ${size} bytes; limit ${maxBytes}`);
}

console.log("Static site checks passed");
