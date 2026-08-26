(function() {
  function setMode(mode) {
    const tabs = document.querySelectorAll("[data-mode]");
    const panels = document.querySelectorAll("[data-panel]");

    tabs.forEach((tab) => {
      const selected = tab.getAttribute("data-mode") === mode;
      tab.setAttribute("aria-selected", selected ? "true" : "false");
    });

    panels.forEach((panel) => {
      panel.hidden = panel.getAttribute("data-panel") !== mode;
    });

    if (typeof window.bastTrack === "function") {
      window.bastTrack("proof_mode_select", {
        mode,
        page_path: window.location.pathname
      });
    }
  }

  function loadDemo(button) {
    const videoId = button.getAttribute("data-video-id");
    const title = button.getAttribute("data-video-title") || "Bast demo";
    const player = document.querySelector("[data-demo-player]");

    if (!videoId || !player) return;

    player.innerHTML = "";

    const iframe = document.createElement("iframe");
    iframe.title = title;
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0&modestbranding=1`;
    iframe.loading = "lazy";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;

    player.appendChild(iframe);

    document.querySelectorAll("[data-video-id]").forEach((demoButton) => {
      const selected = demoButton === button;
      demoButton.setAttribute("aria-pressed", selected ? "true" : "false");
      demoButton.textContent = selected ? "Demo loaded" : "Load demo";
    });

    if (typeof window.bastTrack === "function") {
      window.bastTrack("demo_video_load", {
        video_id: videoId,
        video_title: title,
        page_path: window.location.pathname
      });
    }
  }

  function setFormStatus(el, message, kind) {
    if (!el) return;
    el.textContent = message;
    el.classList.remove("is-error", "is-success");
    if (kind) el.classList.add("is-" + kind);
  }

  function composeMailto(data) {
    const subject = "Build with Bast - " + (data.organization || data.name || "inquiry");
    const body =
      "Name: " + data.name + "\n" +
      "Email: " + data.email + "\n" +
      "Organization: " + (data.organization || "-") + "\n\n" +
      data.message;
    window.location.href =
      "mailto:community@bast.ai?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
  }

  function handleContactForm() {
    const form = document.querySelector("[data-contact-form]");
    if (!form) return;

    const status = form.querySelector("[data-form-status]");
    const endpoint = (window.BAST_CONTACT_ENDPOINT || "").trim();
    const field = (name) => form.elements.namedItem(name);

    form.addEventListener("submit", function(event) {
      event.preventDefault();

      let firstInvalid = null;
      form.querySelectorAll("input, textarea").forEach((control) => {
        const invalid = !control.checkValidity();
        control.setAttribute("aria-invalid", invalid ? "true" : "false");
        if (invalid && !firstInvalid) firstInvalid = control;
      });

      if (firstInvalid) {
        firstInvalid.focus();
        setFormStatus(status, "Please complete the highlighted fields.", "error");
        return;
      }

      const data = {
        access_key: window.BAST_CONTACT_ACCESS_KEY || "",
        subject: "bast.ai contact: " + field("name").value.trim(),
        from_name: "Bast AI website",
        botcheck: "",
        name: field("name").value.trim(),
        email: field("email").value.trim(),
        message: field("message").value.trim()
      };

      if (typeof window.bastTrack === "function") {
        window.bastTrack("form_submit_attempt", {
          form_id: "contact",
          page_path: window.location.pathname
        });
      }

      if (!endpoint) {
        if (typeof window.bastTrack === "function") {
          window.bastTrack("lead_email_open", {
            form_id: "contact",
            page_path: window.location.pathname
          });
        }
        setFormStatus(status, "Opening your email app to finish sending…", null);
        composeMailto(data);
        return;
      }

      setFormStatus(status, "Sending…", null);
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }).then((response) => {
        if (!response.ok) throw new Error("Request failed");
        if (typeof window.bastTrack === "function") {
          const leadParams = {
            method: "contact_form",
            form_id: "contact",
            page_path: window.location.pathname
          };
          window.bastTrack("generate_lead", leadParams);
          window.bastTrack("lead_submit_success", leadParams);
        }
        form.reset();
        setFormStatus(status, "Thanks - we'll be in touch shortly.", "success");
      }).catch(() => {
        if (typeof window.bastTrack === "function") {
          window.bastTrack("lead_email_fallback", {
            form_id: "contact",
            page_path: window.location.pathname
          });
        }
        setFormStatus(status, "Opening your email app to send instead…", null);
        composeMailto(data);
      });
    });
  }

  function initBastCareTour() {
    document.querySelectorAll("[data-tour-track]").forEach((track) => {
      const cards = Array.from(track.querySelectorAll(".bastcare-tour-card"));
      const tour = track.closest(".bastcare-tour");
      const previous = tour && tour.querySelector("[data-tour-prev]");
      const next = tour && tour.querySelector("[data-tour-next]");
      const status = tour && tour.querySelector("[data-tour-status]");
      let currentIndex = 0;
      let frame = null;

      if (!cards.length || !previous || !next || !status) return;

      function nearestCardIndex() {
        const trackLeft = track.getBoundingClientRect().left;
        let nearestIndex = 0;
        let nearestDistance = Infinity;

        cards.forEach((card, index) => {
          const distance = Math.abs(card.getBoundingClientRect().left - trackLeft);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
          }
        });

        return nearestIndex;
      }

      function updateControls(index) {
        currentIndex = Math.max(0, Math.min(cards.length - 1, index));
        previous.disabled = currentIndex === 0;
        next.disabled = currentIndex === cards.length - 1;
        status.textContent = `${currentIndex + 1} of ${cards.length}`;
      }

      function showCard(index) {
        const targetIndex = Math.max(0, Math.min(cards.length - 1, index));
        const target = cards[targetIndex];
        const left = target.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft;
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        track.scrollTo({ left, behavior: reducedMotion ? "auto" : "smooth" });
        updateControls(targetIndex);
      }

      previous.addEventListener("click", () => showCard(currentIndex - 1));
      next.addEventListener("click", () => showCard(currentIndex + 1));

      track.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        showCard(currentIndex + (event.key === "ArrowRight" ? 1 : -1));
      });

      track.addEventListener("scroll", () => {
        if (frame) return;
        frame = window.requestAnimationFrame(() => {
          frame = null;
          updateControls(nearestCardIndex());
        });
      }, { passive: true });

      window.addEventListener("resize", () => updateControls(nearestCardIndex()));
      updateControls(0);
    });
  }

  function initBastCareMetrics() {
    const panels = Array.from(document.querySelectorAll("[data-bastcare-metrics]"));
    if (!panels.length) return;

    fetch("/assets/data/bastcare-metrics.json", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Metrics unavailable");
        return response.json();
      })
      .then((document) => {
        const metrics = document && document.metrics;
        const displayed = ["successfulSummaries", "inputTokens", "outputTokens"];
        const required = [...displayed, "summariesWithTokenUsage"];
        const valid = document && document.schemaVersion === 1 && metrics && required.every((name) =>
          Number.isSafeInteger(metrics[name]) && metrics[name] >= 0
        );

        if (!valid || metrics.successfulSummaries < 1) return;

        const coverage = metrics.summariesWithTokenUsage;
        const updated = new Date(document.generatedAt);
        const updatedDate = Number.isNaN(updated.valueOf())
          ? ""
          : updated.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

        panels.forEach((panel) => {
          displayed.forEach((name) => {
            const output = panel.querySelector(`[data-bastcare-metric="${name}"]`);
            if (output) output.textContent = metrics[name].toLocaleString("en-US");
          });

          const note = panel.querySelector("[data-bastcare-metrics-note]");
          const isGrowthCounter = panel.getAttribute("data-bastcare-metrics-context") === "growth";

          if (note && isGrowthCounter) {
            note.textContent = `${updatedDate ? `Refreshed ${updatedDate}. ` : ""}Each successful BastCare summary moves this number.`;
          } else if (note) {
            const updatedLabel = updatedDate ? ` Updated ${updatedDate}.` : "";
            note.textContent = Number.isSafeInteger(coverage) && coverage < metrics.successfulSummaries
              ? `Token totals cover ${coverage.toLocaleString("en-US")} of ${metrics.successfulSummaries.toLocaleString("en-US")} successful runs.${updatedLabel} No transcript text is included.`
              : `Every successful summary moves this number.${updatedLabel} No transcript text is included.`;
          }

          panel.hidden = false;
        });
      })
      .catch(() => {
        // Keep the proof block hidden until a validated aggregate is available.
      });
  }

  document.addEventListener("DOMContentLoaded", function() {
    handleContactForm();
    initBastCareTour();
    initBastCareMetrics();

    document.querySelectorAll("[data-mode]").forEach((tab) => {
      tab.addEventListener("click", function() {
        setMode(tab.getAttribute("data-mode"));
      });
    });

    document.querySelectorAll("[data-scroll-target]").forEach((trigger) => {
      trigger.addEventListener("click", function() {
        const target = document.querySelector(trigger.getAttribute("data-scroll-target"));
        if (!target) return;

        target.scrollIntoView({ behavior: "smooth", block: "start" });
        if (typeof window.bastTrack === "function") {
          window.bastTrack("cta_click", {
            link_text: trigger.textContent.trim(),
            page_path: window.location.pathname
          });
        }
      });
    });

    document.querySelectorAll("[data-video-id]").forEach((button) => {
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", function() {
        loadDemo(button);
      });
    });
  });
})();
