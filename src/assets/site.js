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

  function composeGateMailto(resource) {
    const subject = "PDF request: " + resource;
    const body = "I want the " + resource + " please.";
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

  function triggerDownload(fileUrl, fileName) {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName || "";
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function handleGateForms() {
    const endpoint = (window.BAST_LEAD_ENDPOINT || "").trim();

    document.querySelectorAll(".download-trigger[aria-controls]").forEach(function(trigger) {
      const target = document.getElementById(trigger.getAttribute("aria-controls"));
      if (!target) return;
      trigger.addEventListener("click", function() {
        const open = target.hidden;
        target.hidden = !open;
        trigger.setAttribute("aria-expanded", open ? "true" : "false");
        if (open) {
          const input = target.querySelector('input[type="email"]');
          if (input) input.focus();
        }
      });
    });

    document.querySelectorAll("[data-gate-form]").forEach(function(form) {
      const status = form.querySelector("[data-gate-status]");
      const input = form.querySelector('input[type="email"]');
      const fileUrl = form.getAttribute("data-file");
      const resource = form.getAttribute("data-resource") || fileUrl;
      const fileName = (fileUrl || "").split("/").pop();

      form.addEventListener("submit", function(event) {
        event.preventDefault();

        const valid = input.checkValidity();
        input.setAttribute("aria-invalid", valid ? "false" : "true");
        if (!valid) {
          input.focus();
          setFormStatus(status, "Please enter a valid work email.", "error");
          return;
        }

        const email = input.value.trim();

        // Note: email (PII) only goes to the lead endpoint or the visitor's own
        // email app (mailto), never to GA.
        if (typeof window.bastTrack === "function") {
          window.bastTrack("generate_lead", { method: "gated_download", resource: resource, page_path: window.location.pathname });
          window.bastTrack("file_download", { file_name: fileName, resource: resource, file_extension: "pdf", page_path: window.location.pathname });
        }

        form.reset();
        input.setAttribute("aria-invalid", "false");

        if (endpoint) {
          // Future CRM path: post the lead and deliver the PDF right away.
          fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, resource: resource })
          }).catch(function() {});
          triggerDownload(fileUrl, fileName);
          setFormStatus(status, "Thanks — your download is starting.", "success");
        } else {
          // No CRM yet: the visitor emails us and we send the study back.
          setFormStatus(status, "Opening your email app so we can email you the study.", "success");
          composeGateMailto(resource);
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function() {
    handleContactForm();
    handleGateForms();

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
