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
      "mailto:hello@bast.ai?subject=" + encodeURIComponent(subject) +
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
        organization: field("organization").value.trim(),
        message: field("message").value.trim()
      };

      if (typeof window.bastTrack === "function") {
        window.bastTrack("generate_lead", { method: "contact_form", page_path: window.location.pathname });
        window.bastTrack("form_submit", { form_id: "contact", page_path: window.location.pathname });
      }

      if (!endpoint) {
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
        form.reset();
        setFormStatus(status, "Thanks — we'll be in touch shortly.", "success");
      }).catch(() => {
        setFormStatus(status, "Opening your email app to send instead…", null);
        composeMailto(data);
      });
    });
  }

  function handlePdfDownloads() {
    document.querySelectorAll("[data-pdf-download]").forEach(function(link) {
      link.addEventListener("click", function() {
        const fileName = (link.getAttribute("href") || "").split("/").pop();
        const resource = link.getAttribute("data-resource") || fileName;

        if (typeof window.bastTrack === "function") {
          window.bastTrack("file_download", {
            file_name: fileName,
            resource: resource,
            file_extension: "pdf",
            page_path: window.location.pathname
          });
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function() {
    handleContactForm();
    handlePdfDownloads();

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
