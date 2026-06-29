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

  document.addEventListener("DOMContentLoaded", function() {
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
