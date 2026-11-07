import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(new URL("../src/assets/site.js", import.meta.url), "utf8");
const snapshot = JSON.parse(await readFile(
  new URL("../src/assets/data/bastcare-metrics.json", import.meta.url),
  "utf8",
));

const tokenCards = ["inputTokens", "outputTokens"];

function loadSite({ document = { addEventListener() {} }, fetch = () => Promise.reject(new Error("unmocked")) } = {}) {
  const hooks = {};
  const sandbox = {
    __BAST_TEST_HOOKS__: hooks,
    document,
    fetch,
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "src/assets/site.js" });
  assert.equal(typeof hooks.formatBastCareMetric, "function");
  assert.equal(typeof hooks.initBastCareMetrics, "function");
  return hooks;
}

function expectedTokenCount(value) {
  const raw = BigInt(value);
  if (raw >= 1000000n) {
    const hundredths = (raw + 5000n) / 10000n;
    const whole = hundredths / 100n;
    const fraction = hundredths % 100n;
    if (fraction === 0n) return `${whole}.0M`;
    if (fraction % 10n === 0n) return `${whole}.${fraction / 10n}M`;
    return `${whole}.${String(fraction).padStart(2, "0")}M`;
  }
  return `${raw / 1000n}k`;
}

function assertCompactToken(format, value) {
  const displays = tokenCards.map((name) => format(name, value));
  assert.deepEqual(displays[0], displays[1], `${value} must match on both token cards`);
  const display = displays[0];
  assert.equal(display, expectedTokenCount(value));
  assert.equal(display.includes(","), false, `${display} must not use a thousands separator`);
  if (value >= 1000000) {
    assert.match(display, /^\d+\.\d{1,2}M$/);
    assert.doesNotMatch(display, /k$/);
  } else {
    assert.match(display, /^\d+k$/);
    assert.doesNotMatch(display, /M$/);
  }
}

test("both token cards use the same millions and thousands rule", () => {
  const { formatBastCareMetric } = loadSite();
  const samples = [
    0,
    1,
    999,
    1000,
    9999,
    10000,
    744000,
    744603,
    999000,
    999499,
    999500,
    999999,
    1000000,
    1004999,
    1005000,
    1009999,
    1010000,
    1014999,
    1015000,
    1234567,
    1499999,
    1500000,
    1999999,
    2000000,
    4480511,
    9999499,
    9999500,
    10000000,
    123456789,
    Number.MAX_SAFE_INTEGER,
  ];

  for (let value = 999000; value <= 1006000; value += 1) samples.push(value);

  for (const value of samples) {
    assertCompactToken(formatBastCareMetric, value);
  }

  assert.equal(formatBastCareMetric("inputTokens", 4480511), "4.48M");
  assert.equal(formatBastCareMetric("outputTokens", 4480511), "4.48M");
  assert.equal(formatBastCareMetric("inputTokens", 744000), "744k");
  assert.equal(formatBastCareMetric("outputTokens", 744000), "744k");
  assert.equal(formatBastCareMetric("inputTokens", 744603), "744k");
  assert.equal(formatBastCareMetric("outputTokens", 744603), "744k");
  assert.equal(formatBastCareMetric("inputTokens", 999999), "999k");
  assert.equal(formatBastCareMetric("outputTokens", 1000000), "1.0M");
  assert.equal(formatBastCareMetric("inputTokens", 1005000), "1.01M");
  assert.equal(formatBastCareMetric("outputTokens", 1500000), "1.5M");
});

test("summary counts and invalid token values stay safe", () => {
  const { formatBastCareMetric } = loadSite();

  assert.equal(formatBastCareMetric("successfulSummaries", 355), "355");
  assert.equal(formatBastCareMetric("successfulSummaries", 0), "0");
  assert.equal(formatBastCareMetric("successfulSummaries", 1000), "1,000");
  assert.equal(formatBastCareMetric("successfulSummaries", 4480511), "4,480,511");

  for (const name of [...tokenCards, "successfulSummaries"]) {
    for (const value of [null, undefined, Number.NaN, Infinity, -Infinity, -1, 1.5, "4480511", "744000", true, false, {}, []]) {
      assert.doesNotThrow(() => {
        assert.equal(formatBastCareMetric(name, value), null);
      });
    }
  }
});

function metricPanel(context = null) {
  const metrics = {
    successfulSummaries: { textContent: "-" },
    inputTokens: { textContent: "-" },
    outputTokens: { textContent: "-" },
  };
  const note = { textContent: "Every successful summary moves this number." };
  const panel = {
    hidden: true,
    getAttribute(name) {
      return name === "data-bastcare-metrics-context" ? context : null;
    },
    querySelector(selector) {
      const metric = /data-bastcare-metric="([^"]+)"/.exec(selector);
      if (metric) return Object.hasOwn(metrics, metric[1]) ? metrics[metric[1]] : null;
      if (selector === "[data-bastcare-metrics-note]") return note;
      return null;
    },
  };
  return { panel, metrics, note };
}

function documentWith(panels) {
  return {
    addEventListener() {},
    querySelectorAll(selector) {
      return selector === "[data-bastcare-metrics]" ? panels : [];
    },
  };
}

test("both public token cards render the committed aggregate", async () => {
  const { panel, metrics, note } = metricPanel();
  const { formatBastCareMetric, initBastCareMetrics } = loadSite({
    document: documentWith([panel]),
    fetch(url) {
      assert.equal(url, "/assets/data/bastcare-metrics.json");
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(snapshot),
      });
    },
  });

  await initBastCareMetrics();

  assert.equal(panel.hidden, false);
  assert.equal(metrics.successfulSummaries.textContent, formatBastCareMetric("successfulSummaries", snapshot.metrics.successfulSummaries));
  assert.equal(metrics.inputTokens.textContent, formatBastCareMetric("inputTokens", snapshot.metrics.inputTokens));
  assert.equal(metrics.outputTokens.textContent, formatBastCareMetric("outputTokens", snapshot.metrics.outputTokens));
  assert.equal(metrics.inputTokens.textContent, expectedTokenCount(snapshot.metrics.inputTokens));
  assert.equal(metrics.outputTokens.textContent, expectedTokenCount(snapshot.metrics.outputTokens));
  assert.match(note.textContent, /^Every successful summary moves this number\./);
  assert.equal(metrics.inputTokens.textContent.includes(","), false);
  assert.equal(metrics.outputTokens.textContent.includes(","), false);
});

test("invalid, missing, and failed metrics do not display an error", async () => {
  const failed = metricPanel();
  const invalidPanel = metricPanel();
  const partial = metricPanel();
  const partialCards = {
    successfulSummaries: { textContent: "-" },
    inputTokens: { textContent: "-" },
  };
  partial.panel.querySelector = (selector) => {
    const metric = /data-bastcare-metric="([^"]+)"/.exec(selector);
    if (metric) return partialCards[metric[1]] ?? null;
    if (selector === "[data-bastcare-metrics-note]") return partial.note;
    return null;
  };

  const invalid = structuredClone(snapshot);
  invalid.metrics.outputTokens = Number.NaN;
  const payloads = [null, invalid, snapshot];
  let calls = 0;
  const { initBastCareMetrics } = loadSite({
    document: documentWith([failed.panel, invalidPanel.panel, partial.panel]),
    fetch() {
      const payload = payloads[calls];
      calls += 1;
      if (payload == null) return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve(payload) });
    },
  });

  await initBastCareMetrics();
  assert.equal(failed.panel.hidden, true);
  assert.equal(failed.metrics.inputTokens.textContent, "-");
  assert.equal(failed.metrics.outputTokens.textContent, "-");

  await initBastCareMetrics();
  assert.equal(invalidPanel.panel.hidden, true);
  assert.equal(invalidPanel.metrics.inputTokens.textContent, "-");
  assert.equal(invalidPanel.metrics.outputTokens.textContent, "-");

  await initBastCareMetrics();
  assert.equal(partial.panel.hidden, false);
  assert.equal(partialCards.inputTokens.textContent, expectedTokenCount(snapshot.metrics.inputTokens));
  assert.equal(partialCards.successfulSummaries.textContent, snapshot.metrics.successfulSummaries.toLocaleString("en-US"));
  assert.equal(Object.hasOwn(partialCards, "outputTokens"), false);
});
