/*!
 * JidoPay embed widget
 * Usage:
 *   <script src="https://jidopay.com/embed.js" async></script>
 *   <button data-jidopay="lnk_abc123">Pay $49</button>
 *
 * When a user clicks any element with a [data-jidopay="LINK_ID"] attribute,
 * we open an overlay with an iframe pointing at the JidoPay checkout page
 * for that payment link. Works on any site, no framework required.
 *
 * Optional attributes:
 *   data-jidopay-theme="light" | "dark"     // force a theme, default inherits
 *   data-jidopay-autoload="true"            // skip the summary card, go
 *                                           // straight to Stripe checkout
 */
(function () {
  "use strict";

  if (window.__jidopayEmbedLoaded) return;
  window.__jidopayEmbedLoaded = true;

  var SCRIPT = document.currentScript;
  var ORIGIN = (function () {
    try {
      return new URL(SCRIPT.src).origin;
    } catch (_) {
      return "https://jidopay.com";
    }
  })();

  var MODAL_ID = "jidopay-embed-modal";
  var STYLE_ID = "jidopay-embed-style";

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      "#" + MODAL_ID + "{position:fixed;inset:0;z-index:2147483647;" +
      "display:flex;align-items:center;justify-content:center;" +
      "padding:16px;box-sizing:border-box;" +
      "background:rgba(10,12,20,0.62);" +
      "backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);" +
      "opacity:0;transition:opacity 180ms ease-out;" +
      "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;}" +
      "#" + MODAL_ID + ".is-open{opacity:1;}" +
      "#" + MODAL_ID + " .jp-frame-wrap{" +
      "position:relative;width:100%;max-width:460px;" +
      "max-height:min(720px,calc(100vh - 32px));" +
      "background:#ffffff;border-radius:20px;overflow:hidden;" +
      "box-shadow:0 40px 120px -24px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.06);" +
      "transform:translateY(12px) scale(0.985);" +
      "transition:transform 220ms cubic-bezier(0.2,0.9,0.3,1);}" +
      "#" + MODAL_ID + ".is-open .jp-frame-wrap{transform:translateY(0) scale(1);}" +
      "#" + MODAL_ID + " iframe{display:block;width:100%;height:620px;" +
      "max-height:calc(100vh - 32px);border:0;background:#ffffff;}" +
      "#" + MODAL_ID + " .jp-close{" +
      "position:absolute;top:12px;right:12px;width:32px;height:32px;" +
      "display:flex;align-items:center;justify-content:center;" +
      "border-radius:999px;border:0;cursor:pointer;" +
      "background:rgba(255,255,255,0.92);color:#0a0c14;" +
      "box-shadow:0 4px 12px rgba(0,0,0,0.15);" +
      "transition:transform 120ms ease-out,background 120ms ease-out;" +
      "z-index:2;}" +
      "#" + MODAL_ID + " .jp-close:hover{transform:scale(1.06);background:#ffffff;}" +
      "#" + MODAL_ID + " .jp-close svg{width:16px;height:16px;}" +
      "#" + MODAL_ID + " .jp-loading{" +
      "position:absolute;inset:0;display:flex;align-items:center;" +
      "justify-content:center;color:#6b7280;font-size:13px;" +
      "letter-spacing:0.02em;pointer-events:none;}" +
      "@media (max-width:520px){" +
      "#" + MODAL_ID + " .jp-frame-wrap{max-width:100%;border-radius:16px;}" +
      "#" + MODAL_ID + " iframe{height:calc(100vh - 32px);}}";
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  function closeIcon() {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>'
    );
  }

  function openModal(linkId, opts) {
    injectStyles();
    closeModal();

    var modal = document.createElement("div");
    modal.id = MODAL_ID;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "JidoPay secure checkout");

    var wrap = document.createElement("div");
    wrap.className = "jp-frame-wrap";

    var loading = document.createElement("div");
    loading.className = "jp-loading";
    loading.textContent = "Loading secure checkout…";

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "jp-close";
    closeBtn.setAttribute("aria-label", "Close checkout");
    closeBtn.innerHTML = closeIcon();

    var iframe = document.createElement("iframe");
    iframe.setAttribute("title", "JidoPay checkout");
    iframe.setAttribute(
      "allow",
      "payment *; clipboard-write; publickey-credentials-get *"
    );
    iframe.setAttribute("referrerpolicy", "origin");

    var params = [];
    if (opts && opts.theme) params.push("theme=" + encodeURIComponent(opts.theme));
    if (opts && opts.autoload) params.push("autoload=1");
    var qs = params.length ? "?" + params.join("&") : "";
    iframe.src = ORIGIN + "/embed/" + encodeURIComponent(linkId) + qs;

    iframe.addEventListener("load", function () {
      loading.style.display = "none";
    });

    wrap.appendChild(iframe);
    wrap.appendChild(loading);
    wrap.appendChild(closeBtn);
    modal.appendChild(wrap);
    document.body.appendChild(modal);

    // Double-raf so the transition runs from the initial state.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        modal.classList.add("is-open");
      });
    });

    var prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modal.__prevOverflow = prevOverflow;

    function dismiss() {
      closeModal();
    }

    closeBtn.addEventListener("click", dismiss);
    modal.addEventListener("click", function (e) {
      if (e.target === modal) dismiss();
    });
    document.addEventListener("keydown", function escListener(e) {
      if (e.key === "Escape") {
        dismiss();
        document.removeEventListener("keydown", escListener);
      }
    });
  }

  function closeModal() {
    var existing = document.getElementById(MODAL_ID);
    if (!existing) return;
    document.body.style.overflow = existing.__prevOverflow || "";
    existing.classList.remove("is-open");
    setTimeout(function () {
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    }, 220);
  }

  function handleClick(e) {
    var target = e.target;
    while (target && target !== document.body) {
      if (target.nodeType === 1 && target.hasAttribute("data-jidopay")) {
        var linkId = target.getAttribute("data-jidopay");
        if (!linkId) return;
        e.preventDefault();
        openModal(linkId, {
          theme: target.getAttribute("data-jidopay-theme") || null,
          autoload: target.getAttribute("data-jidopay-autoload") === "true",
        });
        return;
      }
      target = target.parentNode;
    }
  }

  // Listen to messages from the iframe so the checkout page can ask us
  // to close (e.g. after the customer finishes paying).
  window.addEventListener("message", function (e) {
    if (e.origin !== ORIGIN) return;
    var data = e.data;
    if (!data || typeof data !== "object") return;
    if (data.type === "jidopay:close") closeModal();
  });

  // Delegate clicks on the document so dynamically-added buttons work.
  document.addEventListener("click", handleClick, true);
})();
