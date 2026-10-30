/* ==========================================================================
   main.js: every interactive piece of the site, vanilla JS, no build step.
   Each block checks whether its elements exist, so one file serves all pages.
   ========================================================================== */
(function () {
  "use strict";

  document.documentElement.classList.add("js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Sticky header that shrinks on scroll ---------------------------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 40);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- Full-screen mobile menu ----------------------------------------- */
  var toggle = document.querySelector(".menu-toggle");
  var overlay = document.getElementById("menu");
  if (toggle && overlay) {
    var setMenu = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      overlay.classList.toggle("is-open", open);
      overlay.inert = !open;
      document.body.classList.toggle("menu-open", open);
      if (open) overlay.querySelector("a").focus();
    };
    overlay.inert = true;
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) {
        setMenu(false);
        toggle.focus();
      }
    });
    overlay.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
  }

  /* ---- Scene reveals: slow fades as sections enter --------------------- */
  var reveals = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---- Timecode helper (HH:MM:SS:FF at 24fps) -------------------------- */
  function timecode(seconds) {
    var f = Math.floor((seconds % 1) * 24);
    var s = Math.floor(seconds);
    var pad = function (n) { return String(n).padStart(2, "0"); };
    return pad(Math.floor(s / 3600)) + ":" + pad(Math.floor(s / 60) % 60) + ":" + pad(s % 60) + ":" + pad(f);
  }

  /* ---- Home showreel hero ---------------------------------------------- */
  var reel = document.querySelector(".hero video");
  if (reel) {
    var tc = document.querySelector("[data-reel-timecode]");
    var reelBtn = document.querySelector("[data-reel-toggle]");

    // Reduced motion: never autoplay. The poster frame stays up.
    if (reduceMotion) {
      reel.removeAttribute("autoplay");
      reel.pause();
    } else {
      var p = reel.play();
      if (p && p.catch) p.catch(function () { /* autoplay blocked: poster shows */ });
    }

    var syncBtn = function () {
      if (!reelBtn) return;
      reelBtn.textContent = reel.paused ? "Play reel" : "Pause reel";
      reelBtn.setAttribute("aria-pressed", String(!reel.paused));
    };
    reel.addEventListener("play", syncBtn);
    reel.addEventListener("pause", syncBtn);
    syncBtn();
    if (reelBtn) {
      reelBtn.addEventListener("click", function () {
        if (reel.paused) reel.play(); else reel.pause();
      });
    }

    if (tc) {
      var tick = function () {
        tc.textContent = timecode(reel.currentTime || 0);
        if (!reel.paused) requestAnimationFrame(tick);
      };
      reel.addEventListener("play", function () { requestAnimationFrame(tick); });
      tick();
    }
  }

  /* ---- Card hover/tap previews ------------------------------------------
     Each card's preview clip is only created the first time someone hovers
     or focuses it, so the grid costs nothing to load. */
  document.querySelectorAll(".card[data-preview]").forEach(function (card) {
    if (reduceMotion) return;
    var media = card.querySelector(".card-media");
    var video = null;
    var start = function () {
      if (!video) {
        video = document.createElement("video");
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = "none";
        video.setAttribute("aria-hidden", "true");
        video.src = card.dataset.preview;
        video.addEventListener("error", function () { video.remove(); video = null; });
        media.appendChild(video);
      }
      var p = video.play();
      if (p && p.then) p.then(function () { card.classList.add("is-previewing"); }).catch(function () {});
    };
    var stop = function () {
      card.classList.remove("is-previewing");
      if (video) video.pause();
    };
    card.addEventListener("mouseenter", start);
    card.addEventListener("mouseleave", stop);
    card.addEventListener("focusin", start);
    card.addEventListener("focusout", stop);
    // Phones: start the preview when the card scrolls into the middle of the screen.
    if (window.matchMedia("(hover: none)").matches && "IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) start(); else stop(); });
      }, { rootMargin: "-35% 0px -35% 0px" }).observe(card);
    }
  });

  /* ---- Work filters ----------------------------------------------------- */
  var filters = document.querySelectorAll(".filter");
  if (filters.length) {
    var cards = document.querySelectorAll(".work-grid .card");
    var empty = document.querySelector(".empty-state");
    var count = document.querySelector("[data-count]");
    var apply = function (type) {
      var shown = 0;
      cards.forEach(function (card) {
        var match = type === "all" || card.dataset.type === type;
        card.hidden = !match;
        if (match) shown++;
      });
      filters.forEach(function (f) { f.setAttribute("aria-pressed", String(f.dataset.filter === type)); });
      if (empty) empty.hidden = shown > 0;
      if (count) count.textContent = shown + (shown === 1 ? " project" : " projects");
    };
    filters.forEach(function (f) {
      f.addEventListener("click", function () {
        apply(f.dataset.filter);
        history.replaceState(null, "", f.dataset.filter === "all" ? location.pathname : "#" + f.dataset.filter);
      });
    });
    var initial = location.hash.slice(1);
    apply(document.querySelector('.filter[data-filter="' + initial + '"]') ? initial : "all");
  }

  /* ---- Project lightbox -------------------------------------------------
     Reads data-* attributes from the clicked card. Full videos are embeds
     (Vimeo or YouTube), never self-hosted. */
  var box = document.getElementById("lightbox");
  if (box && typeof box.showModal === "function") {
    var player = box.querySelector(".lightbox-player");
    var captions = box.querySelector("[data-captions]");
    var current = null;
    var opener = null;

    var embedUrl = function (url, cc) {
      if (!url || url.indexOf("REPLACE") !== -1) return "";
      var sep = url.indexOf("?") === -1 ? "?" : "&";
      if (url.indexOf("youtube") !== -1) {
        return url + sep + "autoplay=1&rel=0&modestbranding=1" + (cc ? "&cc_load_policy=1" : "");
      }
      // Vimeo
      return url + sep + "autoplay=1&dnt=1" + (cc ? "&texttrack=en" : "");
    };

    var loadPlayer = function () {
      var src = embedUrl(current.dataset.embed, captions && captions.checked);
      if (!src) {
        player.innerHTML = '<p class="player-note mono">Placeholder: add this project’s Vimeo or YouTube embed URL to the card’s data-embed attribute.</p>';
        return;
      }
      player.innerHTML = "";
      var frame = document.createElement("iframe");
      frame.src = src;
      frame.title = current.dataset.title + " (full video)";
      frame.allow = "autoplay; fullscreen; picture-in-picture";
      frame.allowFullscreen = true;
      player.appendChild(frame);
    };

    var fill = function (name, value) {
      var el = box.querySelector('[data-field="' + name + '"]');
      if (el) el.textContent = value || "";
    };

    document.querySelectorAll(".card[data-embed] .card-button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        current = btn.closest(".card");
        opener = btn;
        fill("title", current.dataset.title);
        fill("client", current.dataset.client);
        fill("industry", current.dataset.industry);
        fill("role", current.dataset.role);
        fill("type", current.dataset.typeLabel);
        fill("breakdown", current.dataset.breakdown);
        fill("timecode", current.dataset.duration);
        loadPlayer();
        box.showModal();
      });
    });

    if (captions) captions.addEventListener("change", function () { if (current) loadPlayer(); });

    var close = function () { box.close(); };
    box.querySelector(".lightbox-close").addEventListener("click", close);
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    box.querySelectorAll("[data-close]").forEach(function (a) { a.addEventListener("click", close); });
    box.addEventListener("close", function () {
      player.innerHTML = ""; // stops playback
      if (opener) opener.focus();
    });
  }

  /* ---- Booking embed: load Calendly/Cal.com only when scrolled near ---- */
  var booking = document.querySelector("[data-booking-url]");
  if (booking) {
    var url = booking.dataset.bookingUrl;
    if (url && url.indexOf("REPLACE") === -1 && "IntersectionObserver" in window) {
      var bio = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        bio.disconnect();
        booking.innerHTML = "";
        var frame = document.createElement("iframe");
        frame.src = url;
        frame.title = "Book a call with Chris";
        frame.loading = "lazy";
        booking.appendChild(frame);
      }, { rootMargin: "300px" });
      bio.observe(booking);
    }
  }

  /* ---- Footer year ----------------------------------------------------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
