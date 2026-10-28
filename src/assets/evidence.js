// Evidence library (draft, decision docs/decisions/2026-10-28-evidence-library-draft.md).
//
// SOFT GATE. This is a static site, so the name-and-email form can only hide
// the library, not protect it: /evidence/library.json is a public file that
// anyone can open directly. The page HTML ships only the five preview
// findings; the full library is fetched from the same origin after the form.
//
// SUBMIT HANDLER IS A STUB. It checks that a name and a valid-looking email
// were entered, then unlocks the library in this tab. It posts the details
// NOWHERE: no network request carries them, and nothing is written to
// cookies or any browser storage. Reloading the page locks it again.
// Where submissions should go (and the privacy notice that goes with it) is a
// decision for Beth; see the decision note before wiring anything up.
(function () {
  const gate = document.querySelector("[data-evidence-gate]");
  const form = document.querySelector("[data-evidence-gate-form]");
  const library = document.querySelector("[data-evidence-library]");
  if (!gate || !form || !library) return;

  const status = form.querySelector("[data-evidence-gate-status]");
  const list = library.querySelector("[data-evidence-list]");
  const results = library.querySelector("[data-evidence-results]");
  const filters = Array.from(library.querySelectorAll("[data-filter]"));
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let data = null;

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (key === "text") node.textContent = value;
      else node.setAttribute(key, value);
    }
    for (const child of children || []) if (child) node.append(child);
    return node;
  }

  function fillSelect(select, values, labelFor) {
    for (const value of values) {
      select.append(el("option", { value, text: labelFor ? labelFor(value) : value }));
    }
  }

  function unique(key) {
    return Array.from(new Set(data.studies.map((study) => study[key])));
  }

  function setupFilters() {
    const byName = Object.fromEntries(filters.map((f) => [f.getAttribute("data-filter"), f]));
    fillSelect(byName.thesis, Object.keys(data.theses), (k) => data.theses[k].short);
    fillSelect(byName.direction, Object.keys(data.directionDefinitions));
    fillSelect(byName.strength, Object.keys(data.strengthDefinitions));
    fillSelect(byName.studyType, unique("studyType").sort());
    for (const control of filters) {
      control.addEventListener(control.tagName === "SELECT" ? "change" : "input", render);
    }
  }

  function card(study) {
    const thesis = data.theses[study.thesis];
    const kicker = el("p", { class: "card-kicker", text: `${thesis.short} \u00b7 ${study.strength} \u00b7 ${study.direction}` });
    if (study.strength === "Vendor / unreviewed") {
      kicker.append(el("span", { class: "evlib-badge", text: "Preliminary vendor report" }));
    }
    const sourceLink = el("a", { class: "text-link", href: study.url, rel: "noopener", text: `${study.source}, ${study.year}` });
    const details = el("dl", {}, [
      el("dt", { text: "Study" }), el("dd", { text: study.designAndSize }),
      el("dt", { text: "Type" }), el("dd", { text: study.studyType }),
    ]);
    return el("li", { class: "card evlib-card", id: study.id }, [
      kicker,
      el("h3", { text: study.title }),
      el("p", { class: "evlib-finding", text: study.finding }),
      details,
      el("p", { class: "evlib-source" }, [sourceLink]),
      el("p", { class: "evlib-caveat" }, [el("strong", { text: "Caveats: " }), study.caveats]),
    ]);
  }

  function render() {
    const want = Object.fromEntries(filters.map((f) => [f.getAttribute("data-filter"), f.value.trim()]));
    const q = (want.q || "").toLowerCase();
    const shown = data.studies.filter((study) =>
      (!want.thesis || study.thesis === want.thesis) &&
      (!want.direction || study.direction === want.direction) &&
      (!want.strength || study.strength === want.strength) &&
      (!want.studyType || study.studyType === want.studyType) &&
      (!q || [study.title, study.finding, study.source, study.designAndSize, study.caveats, String(study.year)]
        .join(" ").toLowerCase().includes(q)));
    list.replaceChildren(...shown.map(card));
    results.textContent = `Showing ${shown.length} of ${data.studies.length} studies.`;
  }

  async function unlock() {
    // Same-origin GET of static data. Nothing from the form is sent.
    const response = await fetch("/evidence/library.json", { credentials: "omit", cache: "no-cache" });
    if (!response.ok) throw new Error(`library.json ${response.status}`);
    data = await response.json();
    setupFilters();
    render();
    gate.hidden = true;
    library.hidden = false;
    library.querySelector("[data-filter='q']").focus();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = form.elements.namedItem("name");
    const email = form.elements.namedItem("email");
    const nameOk = name.value.trim().length > 0;
    const emailOk = emailPattern.test(email.value.trim());
    name.setAttribute("aria-invalid", String(!nameOk));
    email.setAttribute("aria-invalid", String(!emailOk));
    if (!nameOk || !emailOk) {
      status.className = "form-note is-error";
      status.textContent = !nameOk ? "Please add your name." : "Please add a valid email address.";
      (!nameOk ? name : email).focus();
      return;
    }

    // TODO(Beth decision): send { name, email } to the chosen destination here.
    // Intentionally a stub: no fetch, no beacon, no third-party form service.

    status.className = "form-note";
    status.textContent = "Opening the library\u2026";
    try {
      await unlock();
    } catch (error) {
      status.className = "form-note is-error";
      status.textContent = "The library didn't load. Please try again.";
    }
  });
})();
