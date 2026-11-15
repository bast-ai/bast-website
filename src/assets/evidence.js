// Evidence library.
// The five preview findings are in the page. The full library is the static
// file /assets/data/library.json, loaded same-origin with no token.
// An optional updates form posts to the Bast forms service and never hides the studies.
// A leftover ?t= on the address bar is removed and is not sent.
(function () {
  const FORMS_ORIGIN = "https://forms.aws.bast.ai";
  const CONFIRM_MESSAGE = "Check your email for a confirmation link.";
  const LOAD_MESSAGE = "The full library didn't load. The five findings above stay on this page.";
  const WAIT_MESSAGE = "Please wait a little while, then try again.";
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const form = document.querySelector("[data-evidence-updates-form]");
  const library = document.querySelector("[data-evidence-library]");
  if (!library) return;

  const formStatus = form ? form.querySelector("[data-evidence-updates-status]") : null;
  const retry = library.querySelector("[data-evidence-retry]");
  const libraryStatus = library.querySelector("[data-evidence-status]");
  const list = library.querySelector("[data-evidence-list]");
  const results = library.querySelector("[data-evidence-results]");
  const meta = library.querySelector("[data-evidence-meta]");
  const filters = Array.from(library.querySelectorAll("[data-filter]"));
  let libraryData = null;
  let studies = [];
  let filtersReady = false;

  const params = new URLSearchParams(window.location.search);
  if (params.has("t")) {
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

  function setFormStatus(message, kind) {
    if (!formStatus) return;
    formStatus.textContent = message || "";
    formStatus.className = kind ? `form-note is-${kind}` : "form-note";
  }

  function setLibraryStatus(message, kind) {
    if (!libraryStatus) return;
    libraryStatus.textContent = message || "";
    libraryStatus.className = kind ? `form-note is-${kind}` : "form-note";
  }

  function showRetry(show) {
    if (!retry) return;
    retry.hidden = !show;
  }

  function fieldValue(name) {
    if (!form) return "";
    const field = form.elements.namedItem(name);
    return field && "value" in field ? field.value : "";
  }

  async function apiFetch(path, options) {
    const headers = new Headers(options && options.headers);
    return fetch(`${FORMS_ORIGIN}${path}`, {
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

  function formatPublished(study) {
    const published = asText(study.published);
    const full = published.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (full) {
      const date = new Date(Date.UTC(Number(full[1]), Number(full[2]) - 1, Number(full[3])));
      if (!Number.isNaN(date.getTime())) {
        return new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: "UTC",
        }).format(date);
      }
    }
    const month = published.match(/^(\d{4})-(\d{2})$/);
    if (month) {
      const date = new Date(Date.UTC(Number(month[1]), Number(month[2]) - 1, 1));
      if (!Number.isNaN(date.getTime())) {
        return new Intl.DateTimeFormat("en-US", {
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        }).format(date);
      }
    }
    if (/^\d{4}$/.test(published)) return published;
    return asText(study.year);
  }

  function citation(study) {
    const authors = asText(study.authors);
    const journal = asText(study.journal);
    if (authors && journal) return `${authors}, ${journal}`;
    if (authors) return authors;
    if (journal) return journal;
    return asText(study.source);
  }

  function sourceLink(text, href) {
    if (!text) return null;
    if (!href) return text;
    return el("a", { class: "text-link", href, rel: "noopener", text });
  }

  function card(study, idPrefix) {
    const thesis = thesisLabel(asText(study.thesis));
    const parts = [thesis, asText(study.strength), asText(study.direction)].filter(Boolean);
    const children = [el("p", { class: "card-kicker", text: parts.join(" · ") })];
    if (isVendor(study)) {
      children.push(el("p", { class: "evlib-badge", text: "Preliminary vendor report" }));
    }

    const href = httpsUrl(study.url);
    const title = asText(study.title);
    const cite = citation(study);
    if (title) {
      const heading = el("h3");
      if (href) heading.append(el("a", { href, rel: "noopener", text: title }));
      else heading.textContent = title;
      children.push(heading);
    }
    if (cite || (!title && href)) {
      const source = el("p", { class: "evlib-source" });
      const linked = sourceLink(cite || "Source", !title ? href : "");
      if (linked && typeof linked !== "string") source.append(linked);
      else source.textContent = cite;
      children.push(source);
    }

    const when = formatPublished(study);
    if (when) children.push(el("p", { class: "evlib-date", text: when }));

    const finding = readable(study.finding);
    if (finding) children.push(el("p", { class: "evlib-finding", text: finding }));

    const why = readable(study.whyItMatters);
    if (why) {
      children.push(el("p", { class: "evlib-why" }, [
        el("span", { class: "evlib-why-label", text: "Why this matters: " }),
        why,
      ]));
    }

    const caveats = readable(study.caveats);
    if (caveats) children.push(el("p", { class: "evlib-caveat", text: caveats }));

    const id = asText(study.id);
    const safeId = idPrefix && /^[A-Za-z0-9_-]+$/.test(id) ? `${idPrefix}-${id}` : "";
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
        study.title, study.finding, study.source, study.authors, study.journal,
        study.whyItMatters, study.designAndSize, study.caveats, study.studyType,
        study.sampleSize, study.year, study.published,
      ].map(readable).join(" ").toLowerCase();
      return haystack.includes(q);
    });
    const limit = 300;
    const shown = matched.slice(0, limit);
    list.replaceChildren(...shown.map((study) => card(study, "library")));
    const extra = matched.length > shown.length ? ` Showing ${shown.length} on this page.` : "";
    results.textContent = matched.length
      ? `Showing ${shown.length} of ${studies.length} studies.${extra}`
      : `Showing 0 of ${studies.length} studies.`;
  }

  function renderMeta() {
    if (!meta) return;
    meta.replaceChildren();
    // The file's title, status, source, and schema are internal. Show the date.
    const updated = formatUpdated(libraryData.lastUpdated);
    if (updated) {
      meta.append(el("p", { class: "evlib-updated", text: `Updated ${updated}` }));
    }
  }

  function updateCount() {
    for (const node of document.querySelectorAll("[data-evidence-count]")) {
      node.textContent = String(studies.length);
    }
  }

  function featuredStudies() {
    const ids = libraryData && libraryData.featured;
    if (!Array.isArray(ids) || !ids.length) return [];
    const byId = new Map();
    for (const study of studies) {
      const id = asText(study.id);
      if (id && !byId.has(id)) byId.set(id, study);
    }
    const picked = [];
    for (const id of ids) {
      const study = byId.get(asText(id));
      if (study) picked.push(study);
    }
    return picked;
  }

  function renderFeatured() {
    const section = document.querySelector("[data-evidence-featured]");
    const highlights = document.querySelector("[data-evidence-highlights]");
    const slot = section && section.querySelector("[data-evidence-featured-list]");
    const picked = featuredStudies();
    if (!section || !slot || !picked.length) {
      if (section) section.hidden = true;
      if (highlights) highlights.hidden = false;
      return;
    }
    slot.replaceChildren(...picked.map((study) => card(study, "featured")));
    section.hidden = false;
    if (highlights) highlights.hidden = true;
  }

  function showLibrary() {
    renderMeta();
    if (!filtersReady) {
      setupFilters();
      filtersReady = true;
    }
    renderFeatured();
    render();
    updateCount();
    library.hidden = false;
    setLibraryStatus("", "");
    showRetry(false);
  }

  function studiesFrom(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    if (!Array.isArray(data.studies)) return null;
    return data.studies.filter((study) => study && typeof study === "object");
  }

  async function openLibrary() {
    setLibraryStatus("Opening the library…", "");
    showRetry(false);
    let response;
    try {
      response = await fetch("/assets/data/library.json", {
        headers: { Accept: "application/json" },
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });
    } catch {
      setLibraryStatus(LOAD_MESSAGE, "error");
      showRetry(true);
      return;
    }
    if (!response.ok) {
      setLibraryStatus(LOAD_MESSAGE, "error");
      showRetry(true);
      return;
    }
    const data = await readBody(response);
    const parsed = studiesFrom(data);
    if (!data || parsed === null) {
      setLibraryStatus("The library opened, but it wasn't in a form this page can read. Please email community@bast.ai.", "error");
      showRetry(true);
      return;
    }
    libraryData = data;
    studies = parsed;
    showLibrary();
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const emailField = form.elements.namedItem("email");
      const email = fieldValue("email").trim();
      const emailOk = emailPattern.test(email);
      if (emailField) emailField.setAttribute("aria-invalid", String(!emailOk));
      if (!emailOk) {
        setFormStatus("Please add a valid email address.", "error");
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
      setFormStatus("Sending the confirmation link…", "");
      try {
        const response = await apiFetch("/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(body),
        });
        if (response.status === 429) {
          setFormStatus(WAIT_MESSAGE, "error");
          return;
        }
        if (response.status === 403) {
          setFormStatus("Please open this page on www.bast.ai and try again.", "error");
          return;
        }
        if (!response.ok) {
          setFormStatus("We couldn't send that. Please wait a moment and try again.", "error");
          return;
        }
        const payload = await readBody(response);
        setFormStatus(safeMessage(payload, CONFIRM_MESSAGE), "success");
      } catch {
        setFormStatus("We couldn't send that. Please wait a moment and try again.", "error");
      } finally {
        if (submit) submit.disabled = false;
      }
    });
  }

  if (retry) {
    retry.addEventListener("click", () => {
      openLibrary();
    });
  }

  openLibrary();
})();
