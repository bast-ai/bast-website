(function() {
  const MEASUREMENT_ID = (window.BAST_GA_MEASUREMENT_ID || "").trim();
  const CONSENT_KEY = "bast_cookie_consent";

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied"
  });

  function analyticsConfigured() {
    return Boolean(MEASUREMENT_ID) && !MEASUREMENT_ID.includes("__");
  }

  function getConsent() {
    try {
      return window.localStorage.getItem(CONSENT_KEY);
    } catch (error) {
      return null;
    }
  }

  function setConsent(value) {
    try {
      window.localStorage.setItem(CONSENT_KEY, value);
    } catch (error) {
      return;
    }
  }

  function hasAnalyticsConsent() {
    return getConsent() === "analytics";
  }

  function loadAnalytics() {
    if (!analyticsConfigured() || !hasAnalyticsConsent() || window.bastAnalyticsLoaded) return;

    window.bastAnalyticsLoaded = true;
    window.gtag("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    });
    window.gtag("js", new Date());
    window.gtag("config", MEASUREMENT_ID, {
      send_page_view: true
    });

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    document.head.appendChild(script);
  }

  window.bastTrack = function(eventName, params) {
    if (!analyticsConfigured() || !hasAnalyticsConsent()) return;
    loadAnalytics();
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, params || {});
    }
  };

  function trackClicks() {
    document.addEventListener("click", function(event) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const link = target.closest("a[href]");
      if (!link) return;

      const href = link.getAttribute("href") || "";
      const url = new URL(href, window.location.href);
      const eventBase = {
        link_text: (link.innerText || link.getAttribute("aria-label") || "").trim(),
        link_url: link.href,
        page_path: window.location.pathname,
        transport_type: "beacon"
      };

      if (link.classList.contains("button")) {
        window.bastTrack("cta_click", eventBase);
      }

      if (url.pathname.toLowerCase().endsWith(".pdf")) {
        window.bastTrack("file_download", {
          ...eventBase,
          file_name: url.pathname.split("/").pop() || "download.pdf",
          file_extension: "pdf"
        });
      }

      if (url.protocol === "mailto:") {
        window.bastTrack("mailto_click", eventBase);
        window.bastTrack("generate_lead", {
          ...eventBase,
          method: "email_click"
        });
      }

      if (url.hostname && url.hostname !== window.location.hostname) {
        window.bastTrack("outbound_click", eventBase);
      }
    });
  }

  function injectBannerStyles() {
    if (document.getElementById("bast-consent-style")) return;

    const style = document.createElement("style");
    style.id = "bast-consent-style";
    style.textContent = `
      .bast-consent {
        position: fixed;
        left: 1rem;
        right: 1rem;
        bottom: 1rem;
        z-index: 1000;
        max-width: 760px;
        margin: 0 auto;
        background: #ffffff;
        border: 1px solid #d9dee6;
        border-radius: 8px;
        box-shadow: 0 18px 42px rgba(12, 21, 32, 0.18);
        padding: 1rem;
        color: #111111;
      }
      .bast-consent p {
        margin: 0 0 0.85rem;
        color: #3a3f45;
        font-size: 0.9rem;
        line-height: 1.5;
      }
      .bast-consent-actions {
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
        align-items: center;
      }
      .bast-consent button,
      .bast-consent a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 42px;
        border-radius: 6px;
        font: inherit;
        font-size: 0.84rem;
        font-weight: 700;
        text-decoration: none;
        padding: 0.58rem 0.95rem;
      }
      .bast-consent button {
        cursor: pointer;
      }
      .bast-consent-accept {
        border: 1px solid #111111;
        background: #111111;
        color: #ffffff;
      }
      .bast-consent-reject {
        border: 1px solid #d9dee6;
        background: #ffffff;
        color: #111111;
      }
      .bast-consent a {
        color: #3a3f45;
        border: 1px solid transparent;
      }
      .bast-consent button:focus-visible,
      .bast-consent a:focus-visible {
        outline: 3px solid rgba(26, 150, 198, 0.35);
        outline-offset: 2px;
      }
    `;
    document.head.appendChild(style);
  }

  function showConsentBanner() {
    if (!analyticsConfigured() || document.getElementById("bast-consent")) return;

    injectBannerStyles();

    const banner = document.createElement("section");
    banner.id = "bast-consent";
    banner.className = "bast-consent";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", "Cookie and analytics choices");
    banner.innerHTML = `
      <p>This site uses optional analytics to understand which pages and calls to action are useful. Choose "Allow analytics" to help improve the site, or "Necessary only" to keep analytics off.</p>
      <div class="bast-consent-actions">
        <button class="bast-consent-reject" type="button">Necessary only</button>
        <button class="bast-consent-accept" type="button">Allow analytics</button>
        <a href="privacy.html">Privacy, cookies, and accessibility</a>
      </div>
    `;

    banner.querySelector(".bast-consent-reject").addEventListener("click", function() {
      setConsent("necessary");
      window.gtag("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied"
      });
      banner.remove();
    });

    banner.querySelector(".bast-consent-accept").addEventListener("click", function() {
      setConsent("analytics");
      loadAnalytics();
      banner.remove();
    });

    document.body.appendChild(banner);
  }

  window.bastOpenConsentPreferences = function() {
    try {
      window.localStorage.removeItem(CONSENT_KEY);
    } catch (error) {
      return;
    }
    showConsentBanner();
  };

  document.addEventListener("DOMContentLoaded", function() {
    if (hasAnalyticsConsent()) {
      loadAnalytics();
    } else if (!getConsent()) {
      showConsentBanner();
    }

    trackClicks();
  });
})();
