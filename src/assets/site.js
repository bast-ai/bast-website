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

  function handleContactForm() {
    const form = document.querySelector("[data-contact-form]");
    if (!form) return;

    const FORMS_ORIGIN = "https://forms.aws.bast.ai";
    const SUCCESS_FALLBACK = "Thanks, we have your message.";
    const ERROR_FALLBACK = "We couldn't send that. Please wait a moment and try again.";
    const status = form.querySelector("[data-form-status]");

    function fieldValue(name) {
      const field = form.elements.namedItem(name);
      return field && "value" in field ? field.value : "";
    }

    function safeMessage(body, fallback) {
      const message = body && typeof body.message === "string" ? body.message.trim() : "";
      if (message && message.length <= 240 && !message.includes("<")) return message;
      return fallback;
    }

    async function readBody(response) {
      try {
        return await response.json();
      } catch {
        return null;
      }
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      let firstInvalid = null;
      form.querySelectorAll("input, textarea").forEach((control) => {
        if (control.name === "website" || control.type === "checkbox") return;
        const invalid = !control.checkValidity();
        control.setAttribute("aria-invalid", invalid ? "true" : "false");
        if (invalid && !firstInvalid) firstInvalid = control;
      });

      if (firstInvalid) {
        firstInvalid.focus();
        setFormStatus(status, "Please complete the highlighted fields.", "error");
        return;
      }

      const updates = form.elements.namedItem("updates");
      const body = {
        name: fieldValue("name").trim(),
        email: fieldValue("email").trim(),
        message: fieldValue("message").trim(),
        website: fieldValue("website"),
        updates: Boolean(updates && updates.checked),
      };

      if (typeof window.bastTrack === "function") {
        window.bastTrack("form_submit_attempt", {
          form_id: "contact",
          page_path: window.location.pathname
        });
      }

      const submit = form.querySelector("[type='submit']");
      if (submit) submit.disabled = true;
      setFormStatus(status, "Sending…", null);
      try {
        const response = await fetch(`${FORMS_ORIGIN}/contact`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(body),
          credentials: "omit",
          cache: "no-store",
          referrerPolicy: "no-referrer",
        });
        const payload = await readBody(response);
        if (response.ok && payload && payload.ok === true) {
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
          setFormStatus(status, safeMessage(payload, SUCCESS_FALLBACK), "success");
          return;
        }
        setFormStatus(status, safeMessage(payload, ERROR_FALLBACK), "error");
      } catch {
        setFormStatus(status, ERROR_FALLBACK, "error");
      } finally {
        if (submit) submit.disabled = false;
      }
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

  function validBastCareReviewSnapshot(document) {
    const rating = document && document.rating;
    const reviews = document && document.reviews;
    const validReviews = Array.isArray(reviews) && reviews.every((review) =>
      review &&
      typeof review.id === "string" && review.id.length > 0 &&
      typeof review.title === "string" && review.title.length > 0 &&
      typeof review.excerpt === "string" && review.excerpt.length > 0 &&
      Number.isSafeInteger(review.rating) && review.rating >= 1 && review.rating <= 5 &&
      typeof review.version === "string" && review.version.length > 0 &&
      typeof review.updatedAt === "string"
    );

    return document &&
      document.schemaVersion === 1 &&
      document.app && document.app.id === 6789669565 &&
      typeof document.app.appStoreUrl === "string" &&
      document.app.appStoreUrl.startsWith("https://apps.apple.com/") &&
      rating && typeof rating.average === "number" &&
      rating.average >= 0 && rating.average <= 5 &&
      Number.isSafeInteger(rating.count) && rating.count >= 0 &&
      Number.isSafeInteger(rating.writtenReviewCount) &&
      document.app && typeof document.app.version === "string" &&
      /^[0-9]+(\.[0-9]+){1,3}$/.test(document.app.version) &&
      Array.isArray(reviews) && rating.count >= reviews.length &&
      rating.count >= rating.writtenReviewCount &&
      validReviews;
  }

  function ratingCountLabel(count) {
    return count.toLocaleString("en-US") + " " + (count === 1 ? "rating" : "ratings");
  }

  function writtenReviewCountLabel(count) {
    return count.toLocaleString("en-US") + " written " + (count === 1 ? "review" : "reviews");
  }

  function createBastCareReviewCard(review, index, total) {
    const card = document.createElement("article");
    card.className = "bastcare-review-card";
    card.setAttribute("aria-label", "Review " + (index + 1) + " of " + total + ": " + review.title);

    const headingGroup = document.createElement("div");
    const stars = document.createElement("div");
    stars.className = "bastcare-review-stars";
    stars.setAttribute("aria-label", review.rating + " out of 5 stars");
    const starText = document.createElement("span");
    starText.setAttribute("aria-hidden", "true");
    starText.textContent = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
    stars.appendChild(starText);
    const title = document.createElement("h3");
    title.textContent = review.title;
    headingGroup.append(stars, title);

    const quote = document.createElement("blockquote");
    const quoteText = document.createElement("p");
    quoteText.textContent = "“" + review.excerpt + "”";
    quote.appendChild(quoteText);

    const meta = document.createElement("p");
    meta.className = "bastcare-review-meta";
    meta.textContent = "Verified App Store review";

    card.append(headingGroup, quote, meta);
    return card;
  }

  function setupBastCareReviewCarousel(section) {
    if (section.dataset.reviewCarouselReady === "true") return;
    const track = section.querySelector("[data-review-track]");
    const cards = track ? Array.from(track.querySelectorAll(".bastcare-review-card")) : [];
    const previous = section.querySelector("[data-review-prev]");
    const next = section.querySelector("[data-review-next]");
    const status = section.querySelector("[data-review-status]");
    let currentIndex = 0;
    let frame = null;

    if (!track || !cards.length || !previous || !next || !status) return;
    section.dataset.reviewCarouselReady = "true";

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
      status.textContent = "Review " + (currentIndex + 1) + " of " + cards.length;
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
  }

  function initBastCareReviews() {
    const sections = Array.from(document.querySelectorAll("[data-bastcare-reviews]"));
    const ratingOutputs = document.querySelectorAll("[data-bastcare-rating-average], [data-bastcare-rating-count]");
    if (!sections.length && !ratingOutputs.length) return;

    fetch("/assets/data/bastcare-reviews.json", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Reviews unavailable");
        return response.json();
      })
      .then((reviewDocument) => {
        if (!validBastCareReviewSnapshot(reviewDocument)) throw new Error("Invalid review snapshot");
        const average = reviewDocument.rating.average.toFixed(1);
        const countLabel = ratingCountLabel(reviewDocument.rating.count);
        const writtenLabel = writtenReviewCountLabel(reviewDocument.rating.writtenReviewCount);

        document.querySelectorAll("[data-bastcare-rating-average]").forEach((output) => {
          output.textContent = average;
        });
        document.querySelectorAll("[data-bastcare-rating-count]").forEach((output) => {
          output.textContent = countLabel;
        });
        document.querySelectorAll("[data-bastcare-written-review-count]").forEach((output) => {
          output.textContent = writtenLabel;
        });
        document.querySelectorAll("[data-bastcare-rating-line]").forEach((line) => {
          line.setAttribute("aria-label", average + " out of 5 stars from " + countLabel + " on the App Store");
        });
        document.querySelectorAll("[data-bastcare-review-source]").forEach((link) => {
          link.href = reviewDocument.app.appStoreUrl;
        });

        const generated = new Date(reviewDocument.generatedAt);
        const generatedLabel = Number.isNaN(generated.valueOf()) ? "" : generated.toLocaleDateString("en-US", {
          month: "short", day: "numeric", year: "numeric"
        });

        sections.forEach((section) => {
          const track = section.querySelector("[data-review-track]");
          if (track && reviewDocument.reviews.length) {
            const fragment = document.createDocumentFragment();
            reviewDocument.reviews.forEach((review, index) => {
              fragment.appendChild(createBastCareReviewCard(review, index, reviewDocument.reviews.length));
            });
            track.replaceChildren(fragment);
          }
          const note = section.querySelector("[data-bastcare-review-note]");
          if (note) {
            note.textContent = (generatedLabel ? "Latest verified " + generatedLabel + ". " : "") + "Reviews shown are from the U.S. App Store and approved before publishing.";
          }
          setupBastCareReviewCarousel(section);
        });
      })
      .catch(() => {
        sections.forEach(setupBastCareReviewCarousel);
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
    initBastCareReviews();
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

    // Autoplaying promo video: respect reduced-motion; controls stay available.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll("video[data-reduced-motion-pause]").forEach((video) => {
        video.removeAttribute("autoplay");
        video.pause();
      });
    }
  });
})();
