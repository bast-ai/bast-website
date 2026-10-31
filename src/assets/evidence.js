// Evidence library.
// The five preview findings are in the page. The full library is requested
// from the Bast sign-up service after a reader opens the confirmation link.
// That link's code is read once, removed from the address bar, and never
// written to cookies or browser storage.
(function () {
  const GATE_ORIGIN = "https://forms.aws.bast.ai";
  const CONFIRM_MESSAGE = "Check your email for a confirmation link.";
  const EXPIRED_MESSAGE = "This link expired. Sign up again and we'll email you a new one.";
  const WAIT_MESSAGE = "Please wait a little while, then try again.";
  const LOAD_MESSAGE = "The library didn't load. Please wait a moment and open the link from your email again.";
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const gate = document.querySelector("[data-evidence-gate]");
  const form = document.querySelector("[data-evidence-gate-form]");
  const library = document.querySelector("[data-evidence-library]");
  if (!gate || !form || !library) return;

  const status = form.querySelector("[data-evidence-gate-status]");
  const retry = form.querySelector("[data-evidence-retry]");
  const list = library.querySelector("[data-evidence-list]");
  const results = library.querySelector("[data-evidence-results]");
  const meta = library.querySelector("[data-evidence-meta]");
  const filters = Array.from(library.querySelectorAll("[data-filter]"));
  let libraryData = null;
  let studies = [];
  let linkToken = "";

  const params = new URLSearchParams(window.location.search);
  const fromLink = (params.get("t") || "").trim();
  if (fromLink) {
    linkToken = fromLink;
    params.delete("t");
    const search = params.toString();
    const next = window.location.pathname + (search ? `?${search}` : "") + window.location.hash;
    history.replaceState(null, "", next);
  }

  function asText(value) {
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) return value.map(asText).filter(Boolean).join(", ");
    return "";
  }

  function readable(value) {
    const direct = asText(value);
    if (direct) return direct;
    if (!value || typeof value !== "object" || Array.isArray(value)) return "";
    return Object.entries(value)
      .map(([key, item]) => {
        const text = asText(item) || readable(item);
        return text ? `${key}: ${text}` : "";
      })
      .filter(Boolean)
      .join(" · ");
  }

  function httpsUrl(value) {
    const text = asText(value);
    if (!text) return "";
    try {
      const url = new URL(text);
      return url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  }

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (value == null || value === "") continue;
      if (key === "text") node.textContent = value;
      else node.setAttribute(key, value);
    }
    for (const child of children || []) {
      if (typeof child === "string") node.append(child);
      else if (child) node.append(child);
    }
    return node;
  }

  function setStatus(message, kind) {
    status.textContent = message || "";
    status.className = kind ? `form-note is-${kind}` : "form-note";
  }

  function showRetry(show) {
    if (!retry) return;
    retry.hidden = !show;
  }

  function fieldValue(name) {
    const field = form.elements.namedItem(name);
    return field && "value" in field ? field.value : "";
  }

  async function gateFetch(path, options) {
    const headers = new Headers(options && options.headers);
    return fetch(`${GATE_ORIGIN}${path}`, {
      method: (options && options.method) || "GET",
      headers,
      body: options && options.body,
      credentials: "omit",
      cache: "no-store",
      referrerPolicy: "no-referrer",
    });
  }

  async function readBody(response) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  function safeMessage(body, fallback) {
    const message = body && typeof body.message === "string" ? body.message.trim() : "";
    if (message && message.length <= 240 && !message.includes("<")) return message;
    return fallback;
  }

  function formatUpdated(value) {
    const text = asText(value);
    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return text;
    const date = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return text;
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  function thesisLabel(key) {
    const theses = libraryData && libraryData.theses;
    const entry = theses && typeof theses === "object" ? theses[key] : null;
    if (typeof entry === "string" && entry.trim()) return entry.trim();
    if (entry && typeof entry === "object") {
      const short = asText(entry.short || entry.label || entry.title);
      if (short) return short;
    }
    return key;
  }

  function keysOf(map, fallback) {
    if (map && typeof map === "object" && !Array.isArray(map)) {
      const keys = Object.keys(map).map(asText).filter(Boolean);
      if (keys.length) return keys;
    }
    return fallback;
  }

  function unique(key) {
    const values = [];
    for (const study of studies) {
      const value = asText(study[key]);
      if (value && !values.includes(value)) values.push(value);
    }
    return values;
  }

  function fillSelect(select, values, labelFor) {
    for (const value of values) {
      select.append(el("option", { value, text: labelFor ? labelFor(value) : value }));
    }
  }

  function setupFilters() {
    const byName = Object.fromEntries(filters.map((filter) => [filter.getAttribute("data-filter"), filter]));
    if (byName.thesis) fillSelect(byName.thesis, keysOf(libraryData.theses, unique("thesis")), thesisLabel);
    if (byName.direction) fillSelect(byName.direction, keysOf(libraryData.directionDefinitions, unique("direction")));
    if (byName.strength) fillSelect(byName.strength, keysOf(libraryData.strengthDefinitions, unique("strength")));
    if (byName.studyType) fillSelect(byName.studyType, unique("studyType").sort());
    for (const control of filters) {
      control.addEventListener(control.tagName === "SELECT" ? "change" : "input", render);
    }
  }

  function isVendor(study) {
    return study.strength === "Vendor / unreviewed" || study.studyType === "Vendor report";
  }

  function card(study) {
    const thesis = thesisLabel(asText(study.thesis));
    const parts = [thesis, asText(study.strength), asText(study.direction)].filter(Boolean);
    const kicker = el("p", { class: "card-kicker", text: parts.join(" · ") });
    const children = [kicker];
    if (isVendor(study)) {
      children.push(el("p", { class: "evlib-badge", text: "Preliminary vendor report" }));
    }
    const title = asText(study.title);
    if (title) children.push(el("h3", { text: title }));
    const finding = readable(study.finding);
    if (finding) children.push(el("p", { class: "evlib-finding", text: finding }));

    const rows = [
      ["Study", readable(study.designAndSize)],
      ["Type", asText(study.studyType)],
      ["Size", asText(study.sampleSize)],
    ].filter(([, value]) => value);
    if (rows.length) {
      const details = el("dl");
      for (const [label, value] of rows) {
        details.append(el("dt", { text: label }), el("dd", { text: value }));
      }
      children.push(details);
    }

    const href = httpsUrl(study.url);
    const sourceBits = [asText(study.source), asText(study.year)].filter(Boolean).join(", ");
    if (href || sourceBits) {
      const source = el("p", { class: "evlib-source" });
      if (href) source.append(el("a", { class: "text-link", href, rel: "noopener", text: sourceBits || "Source" }));
      else source.textContent = sourceBits;
      children.push(source);
    }

    const caveats = readable(study.caveats);
    if (caveats) {
      children.push(el("p", { class: "evlib-caveat" }, [el("strong", { text: "Caveats: " }), caveats]));
    }

    const id = asText(study.id);
    const safeId = /^[A-Za-z0-9_-]+$/.test(id) ? `library-${id}` : "";
    return el("li", { class: "card evlib-card", id: safeId }, children);
  }

  function render() {
    const want = Object.fromEntries(filters.map((filter) => [filter.getAttribute("data-filter"), filter.value.trim()]));
    const q = (want.q || "").toLowerCase();
    const matched = studies.filter((study) => {
      if (want.thesis && asText(study.thesis) !== want.thesis) return false;
      if (want.direction && asText(study.direction) !== want.direction) return false;
      if (want.strength && asText(study.strength) !== want.strength) return false;
      if (want.studyType && asText(study.studyType) !== want.studyType) return false;
      if (!q) return true;
      const haystack = [
        study.title, study.finding, study.source, study.designAndSize,
        study.caveats, study.studyType, study.sampleSize, study.year,
      ].map(readable).join(" ").toLowerCase();
      return haystack.includes(q);
    });
    const limit = 300;
    const shown = matched.slice(0, limit);
    list.replaceChildren(...shown.map(card));
    const extra = matched.length > shown.length ? ` First ${shown.length} are on this page.` : "";
    results.textContent = matched.length
      ? `Showing ${shown.length} of ${studies.length} studies.${extra}`
      : `Showing 0 of ${studies.length} studies.`;
  }

  function renderMeta() {
    if (!meta) return;
    meta.replaceChildren();
    const heading = asText(libraryData.title);
    if (heading) meta.append(el("p", { class: "evlib-library-title", text: heading }));
    const rows = [
      ["Status", asText(libraryData.status)],
      ["Updated", formatUpdated(libraryData.lastUpdated)],
      ["Source", readable(libraryData.source)],
      ["Schema", asText(libraryData.schemaVersion)],
    ].filter(([, value]) => value);
    if (!rows.length) return;
    const details = el("dl", { class: "evlib-meta" });
    for (const [label, value] of rows) {
      details.append(el("dt", { text: label }), el("dd", { text: value }));
    }
    meta.append(details);
    const note = el("p", {
      class: "evlib-keep",
      text: "This page does not save the confirmation link. To open the library again later, use the email, or sign up for a new link.",
    });
    meta.append(note);
  }

  function updateCount() {
    for (const node of document.querySelectorAll("[data-evidence-count]")) {
      node.textContent = String(studies.length);
    }
  }

  function showLibrary() {
    renderMeta();
    setupFilters();
    render();
    updateCount();
    gate.hidden = true;
    library.hidden = false;
    showRetry(false);
    const search = library.querySelector("[data-filter='q']");
    if (search) search.focus();
  }

  function studiesFrom(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    if (!Array.isArray(data.studies)) return null;
    return data.studies.filter((study) => study && typeof study === "object");
  }

  async function openLibrary() {
    if (!linkToken) return;
    setStatus("Opening the library…", "");
    showRetry(false);
    let response;
    try {
      response = await gateFetch("/library", {
        headers: { Authorization: `Bearer ${linkToken}`, Accept: "application/json" },
      });
    } catch {
      setStatus(LOAD_MESSAGE, "error");
      showRetry(true);
      return;
    }
    if (response.status === 401) {
      linkToken = "";
      setStatus(EXPIRED_MESSAGE, "error");
      showRetry(false);
      const email = form.elements.namedItem("email");
      if (email) email.focus();
      return;
    }
    if (response.status === 429) {
      setStatus(WAIT_MESSAGE, "error");
      showRetry(true);
      return;
    }
    if (!response.ok) {
      setStatus(LOAD_MESSAGE, "error");
      showRetry(true);
      return;
    }
    const data = await readBody(response);
    const parsed = studiesFrom(data);
    if (!data || parsed === null) {
      setStatus("The library opened, but it wasn't in a form this page can read. Please email community@bast.ai.", "error");
      showRetry(true);
      return;
    }
    libraryData = data;
    studies = parsed;
    showLibrary();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const emailField = form.elements.namedItem("email");
    const email = fieldValue("email").trim();
    const emailOk = emailPattern.test(email);
    if (emailField) emailField.setAttribute("aria-invalid", String(!emailOk));
    if (!emailOk) {
      setStatus("Please add a valid email address.", "error");
      showRetry(false);
      if (emailField) emailField.focus();
      return;
    }

    const updates = form.elements.namedItem("updates");
    const name = fieldValue("name").trim();
    const body = {
      email,
      website: fieldValue("website"),
      updates: Boolean(updates && updates.checked),
    };
    if (name) body.name = name;

    const submit = form.querySelector("[type='submit']");
    if (submit) submit.disabled = true;
    setStatus("Sending the confirmation link…", "");
    showRetry(false);
    try {
      const response = await gateFetch("/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
      if (response.status === 429) {
        setStatus(WAIT_MESSAGE, "error");
        return;
      }
      if (response.status === 403) {
        setStatus("Please open this page on www.bast.ai and try again.", "error");
        return;
      }
      if (!response.ok) {
        setStatus("We couldn't send that just now. Please wait a moment and try again.", "error");
        return;
      }
      const payload = await readBody(response);
      setStatus(safeMessage(payload, CONFIRM_MESSAGE), "success");
    } catch {
      setStatus("We couldn't send that just now. Please wait a moment and try again.", "error");
    } finally {
      if (submit) submit.disabled = false;
    }
  });

  if (retry) {
    retry.addEventListener("click", () => {
      openLibrary();
    });
  }

  if (linkToken) openLibrary();
})();
