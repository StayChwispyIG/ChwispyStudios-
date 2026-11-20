/* ==========================================================================
   consent.js: the cookie banner.
   Shows once, until the visitor picks Accept or Decline. The choice is saved
   on their device as "cs-consent" and sent to js/posthog.js, which only
   starts analytics after Accept. Any element with data-cookie-settings
   (the footer link) opens the banner again so the choice can be changed.
   ========================================================================== */
(function () {
  "use strict";
  var KEY = "cs-consent";
  var banner = null;
  var opener = null;

  function saved() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function choose(value) {
    try { localStorage.setItem(KEY, value); } catch (e) {}
    document.dispatchEvent(new CustomEvent("cs:consent", { detail: value }));
    close();
  }

  function build() {
    banner = document.createElement("section");
    banner.className = "consent";
    banner.setAttribute("aria-labelledby", "consent-title");
    banner.innerHTML =
      '<p class="consent-title" id="consent-title">Cookies</p>' +
      '<p class="consent-copy">I use analytics cookies to see which pages get read and to replay visits so I can fix what trips people up. ' +
      'Form fields are always hidden. Nothing runs unless you accept. <a href="privacy.html#cookies">Privacy policy</a></p>' +
      '<div class="consent-actions">' +
      '<button class="btn btn-primary btn-small" type="button" data-consent="yes">Accept</button>' +
      '<button class="btn btn-ghost btn-small" type="button" data-consent="no">Decline</button>' +
      "</div>";
    banner.addEventListener("click", function (e) {
      var b = e.target.closest("[data-consent]");
      if (b) choose(b.getAttribute("data-consent"));
    });
    banner.addEventListener("keydown", function (e) {
      // Escape closes a reopened banner without changing the saved choice.
      if (e.key === "Escape" && saved()) close();
    });
    // Sits right after the skip link so keyboard and screen reader users reach it first.
    var skip = document.querySelector(".skip-link");
    if (skip) skip.insertAdjacentElement("afterend", banner);
    else document.body.insertBefore(banner, document.body.firstChild);
  }

  function open(fromLink) {
    if (!banner) build();
    banner.hidden = false;
    requestAnimationFrame(function () { banner.classList.add("is-open"); });
    if (fromLink) {
      opener = fromLink;
      var current = saved();
      var first = banner.querySelector('[data-consent="' + (current === "no" ? "no" : "yes") + '"]');
      if (first) first.focus();
    }
  }

  function close() {
    if (!banner) return;
    banner.classList.remove("is-open");
    banner.hidden = true;
    if (opener) { opener.focus(); opener = null; }
  }

  function init() {
    document.addEventListener("click", function (e) {
      var link = e.target.closest("[data-cookie-settings]");
      if (!link) return;
      e.preventDefault();
      open(link);
    });
    if (!saved()) open();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
