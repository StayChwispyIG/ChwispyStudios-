/* ==========================================================================
   bold.js: the loud effects, on top of motion.js (Anime.js v4).

   1. Viewfinder cursor: the logo's corner brackets trail the pointer and lock
      onto anything you can click, like a camera grabbing focus.
   2. Film strip: on the home page the Video work section pins, and the reels
      run sideways through the gate as you scroll, with a ticking timecode.
   3. Build deck: Recent builds screenshots you can grab and fling. A throw
      tucks the card under the pile; a tap opens that case study.
   4. Logo: the brackets fly in and close around the wordmark, the dot pops,
      and the name wipes in. Plays once per visit; hover replays the brackets.

   Off for reduced motion (motion.js never adds .motion-on then).
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var A = window.anime;
  if (!A || !root.classList.contains("motion-on")) return;

  var animate = A.animate, stagger = A.stagger, createTimeline = A.createTimeline;
  var onScroll = A.onScroll, createDraggable = A.createDraggable, createAnimatable = A.createAnimatable;
  var set = (A.utils && A.utils.set) || A.set;
  var $ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ======================================================================
     1. VIEWFINDER CURSOR
     ====================================================================== */
  if (finePointer && createAnimatable) {
    var vf = document.createElement("div");
    vf.className = "vf-cursor";
    vf.setAttribute("aria-hidden", "true");
    vf.innerHTML = "<i></i><i></i><i></i><i></i><span class=\"vf-label\"></span>";
    var dot = document.createElement("div");
    dot.className = "vf-dot";
    dot.setAttribute("aria-hidden", "true");
    document.body.appendChild(vf);
    document.body.appendChild(dot);
    var label = vf.querySelector(".vf-label");

    var box = createAnimatable(vf, {
      x: { duration: 260, ease: "out(3)" },
      y: { duration: 260, ease: "out(3)" },
      width: { unit: "px", duration: 320, ease: "out(4)" },
      height: { unit: "px", duration: 320, ease: "out(4)" }
    });

    var IDLE = 30;
    var px = -100, py = -100, locked = null, started = false;
    var lockSel = ".btn, .deck-card, .card-button, .build-row, .tile-build, .strip-end, .service-cards a, .hero-services a, .filter, .text-link, .nav-links a, .mode-switch, .menu-toggle, .wordmark, .header-phone, .site-footer a, .lightbox-close, a, button, summary, label";
    var nativeSel = "input:not([type=checkbox]):not([type=radio]), textarea, select, [contenteditable]";
    var labelFor = function (el) {
      if (el.matches(".card-button")) return "Play";
      if (el.matches(".deck-card")) return "Drag";
      if (el.matches(".build-row, .tile-build")) return "View build";
      if (el.matches(".strip-end")) return "All video";
      return "";
    };
    // Buttons already wear corner marks 6px outside; lock exactly onto those.
    var padFor = function (el) {
      if (el.matches(".btn, .mode-switch, .arrow")) return 6;
      if (el.matches(".card-button, .build-row, .tile-build, .deck-card, .service-cards a")) return 0;
      return 8;
    };

    var place = function () {
      if (locked && document.contains(locked)) {
        var r = (locked.querySelector(".deck-inner") || locked).getBoundingClientRect();
        var pad = padFor(locked);
        // Lean a little toward the pointer while locked.
        var lx = (px - (r.left + r.width / 2)) * 0.06;
        var ly = (py - (r.top + r.height / 2)) * 0.06;
        box.x(r.left - pad + lx); box.y(r.top - pad + ly);
        box.width(r.width + pad * 2); box.height(r.height + pad * 2);
      } else {
        box.x(px - IDLE / 2); box.y(py - IDLE / 2);
        box.width(IDLE); box.height(IDLE);
      }
    };

    var setLock = function (el) {
      if (el === locked) return;
      locked = el;
      vf.classList.toggle("is-locked", !!el);
      var text = el ? labelFor(el) : "";
      label.textContent = text;
      vf.classList.toggle("has-label", !!text);
    };

    document.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      px = e.clientX; py = e.clientY;
      if (!started) {
        started = true;
        set(vf, { x: px - IDLE / 2, y: py - IDLE / 2, width: IDLE, height: IDLE });
        root.classList.add("vf-on");
      }
      set(dot, { x: px, y: py });
      var t = e.target instanceof Element ? e.target : null;
      var native = t && t.closest(nativeSel);
      vf.classList.toggle("is-hidden", !!native);
      dot.classList.toggle("is-hidden", !!native);
      var hit = t && !native ? t.closest(lockSel) : null;
      // A big card wins over the small links inside it.
      var big = t && t.closest(".card-button, .build-row, .deck-card, .tile-build, .service-cards a");
      setLock(big || hit);
      place();
    }, { passive: true });

    window.addEventListener("scroll", function () { if (started) place(); }, { passive: true });
    document.addEventListener("mouseleave", function () { vf.classList.add("is-hidden"); dot.classList.add("is-hidden"); });
    document.addEventListener("mouseenter", function () { vf.classList.remove("is-hidden"); dot.classList.remove("is-hidden"); });
    // Focus pull on click.
    document.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse") return;
      animate(vf, { scale: [{ to: 0.86, duration: 120, ease: "out(2)" }, { to: 1, duration: 500, ease: "outElastic(1, .45)" }] });
    });
    // Leaving the page by link: corners snap shut on the pointer.
    window.addEventListener("pagehide", function () { root.classList.remove("vf-on"); });
  }

  /* ======================================================================
     2. FILM STRIP (home page, Video work)
     ====================================================================== */
  var featured = document.querySelector(".featured");
  var stripSection = featured ? featured.closest("section") : null;
  if (stripSection && onScroll) {
    stripSection.classList.add("filmstrip", "is-strip");
    // Everything in the section's .wrap moves into a pinned frame.
    var wrap = stripSection.querySelector(".wrap");
    var pin = document.createElement("div");
    pin.className = "filmstrip-pin";
    stripSection.insertBefore(pin, wrap);
    pin.appendChild(wrap);

    // An end frame that leads on to the full video page.
    var end = document.createElement("a");
    end.className = "strip-end";
    end.href = "work.html#video";
    end.innerHTML = '<span class="mono">End of reel</span><strong>See all the video</strong><span class="arrow" aria-hidden="true"></span>';
    featured.appendChild(end);

    // HUD under the strip: rec dot, timecode, progress, frame count.
    var cards = $(":scope > .card", featured);
    var hud = document.createElement("div");
    hud.className = "strip-hud mono";
    hud.setAttribute("aria-hidden", "true");
    hud.innerHTML = '<span class="rec" data-tc>00:00:00:00</span><span class="strip-bar"><i></i></span><span data-frame>Reel 01 / ' + String(cards.length).padStart(2, "0") + "</span>";
    featured.insertAdjacentElement("afterend", hud);
    var tcEl = hud.querySelector("[data-tc]"), frameEl = hud.querySelector("[data-frame]"), bar = hud.querySelector(".strip-bar i");

    var totalSecs = cards.reduce(function (sum, c) {
      var p = (c.dataset.duration || "").split(":").map(Number);
      return sum + (p.length === 4 ? p[0] * 3600 + p[1] * 60 + p[2] + p[3] / 24 : 0);
    }, 0) || 60;
    var tc = function (s) {
      var f = Math.floor((s % 1) * 24), w = Math.floor(s), pad = function (n) { return String(n).padStart(2, "0"); };
      return pad(Math.floor(w / 3600)) + ":" + pad(Math.floor(w / 60) % 60) + ":" + pad(w % 60) + ":" + pad(f);
    };

    var travel = 0;
    var measure = function () {
      var vw = document.documentElement.clientWidth;
      var gutter = wrap.getBoundingClientRect().left;
      travel = Math.max(0, featured.scrollWidth - (vw - gutter * 2));
      // The section is as tall as one screen plus the sideways distance.
      stripSection.style.setProperty("--strip-h", "calc(100svh + " + Math.round(travel * 1.1) + "px)");
    };
    measure();

    var run = animate(featured, {
      x: function () { return -travel; },
      ease: "linear",
      autoplay: onScroll({
        target: stripSection,
        enter: "top top",
        leave: "bottom bottom",
        sync: 0.12,
        onResize: function (self) { measure(); run && run.refresh && run.refresh(); }
      }),
      onUpdate: function (a) {
        var p = Math.min(1, Math.max(0, a.progress));
        tcEl.textContent = tc(p * totalSecs);
        bar.style.transform = "scaleX(" + p + ")";
        var n = Math.min(cards.length, Math.floor(p * cards.length) + 1);
        frameEl.textContent = "Reel " + String(n).padStart(2, "0") + " / " + String(cards.length).padStart(2, "0");
      }
    });
    window.addEventListener("resize", function () { measure(); if (run.refresh) run.refresh(); });

    // The strip moves as one piece, so drop motion.js's per-card reveal here.
    cards.forEach(function (c) { c.style.opacity = "1"; });
    animate(featured, { opacity: [0, 1], duration: 600 });
  }

  /* ======================================================================
     3. BUILD DECK
     ====================================================================== */
  var stage = document.querySelector(".deck-stage");
  if (stage && createDraggable) {
    var deck = $(".deck-card", stage);
    // Pile layout by depth: 0 = top card.
    var pose = [
      { rotate: -1.5, x: 0, y: 0, scale: 1 },
      { rotate: 5, x: 22, y: -8, scale: 0.97 },
      { rotate: -7, x: -26, y: 10, scale: 0.94 }
    ];
    var order = deck.slice().reverse(); // last in the HTML sits on top
    var layout = function (instant) {
      order.forEach(function (card, depth) {
        card.style.zIndex = String(10 - depth);
        var p = pose[Math.min(depth, pose.length - 1)];
        animate(card, { rotate: p.rotate, scale: p.scale, translateX: p.x, translateY: p.y, duration: instant ? 0 : 700, ease: "outElastic(1, .6)" });
      });
    };
    // Each card gets an inner wrapper for the drag, so pile poses and drag offsets don't fight.
    deck.forEach(function (card) {
      card.style.transform = "none";
      var inner = document.createElement("span");
      inner.className = "deck-inner";
      while (card.firstChild) inner.appendChild(card.firstChild);
      card.appendChild(inner);
    });
    layout(true);

    deck.forEach(function (card) {
      var inner = card.querySelector(".deck-inner");
      var moved = 0;
      createDraggable(inner, {
        container: document.body,
        releaseStiffness: 120,
        releaseDamping: 13,
        releaseMass: 1,
        snap: [0],
        cursor: false,
        onGrab: function () {
          moved = 0;
          card.classList.add("is-grabbed");
          card.style.zIndex = "20";
          animate(inner, { scale: 1.04, duration: 250, ease: "out(3)" });
        },
        onDrag: function (d) {
          moved = Math.max(moved, Math.hypot(d.x, d.y));
          set(inner, { rotate: d.x * 0.06 });
        },
        onRelease: function (d) {
          card.classList.remove("is-grabbed");
          animate(inner, { scale: 1, rotate: 0, duration: 800, ease: "outElastic(1, .5)" });
          if (moved > 110 || d.velocity > 1.5) {
            // Thrown: this card goes to the bottom of the pile, the rest step up.
            order.splice(order.indexOf(card), 1);
            order.push(card);
            layout(false);
          } else {
            card.style.zIndex = String(10 - order.indexOf(card));
          }
        }
      });
      // A tap (no real drag) opens the case study.
      card.addEventListener("click", function (e) {
        e.preventDefault();
        if (moved < 6) window.location.href = card.getAttribute("href");
      });
    });

    // Deal the pile in when it scrolls into view.
    var dealt = false;
    var dealIO = new IntersectionObserver(function (entries) {
      if (dealt || !entries[0].isIntersecting) return;
      dealt = true;
      dealIO.disconnect();
      animate(deck.map(function (c) { return c.querySelector(".deck-inner"); }), {
        opacity: [0, 1],
        y: ["-60vh", 0],
        rotate: function () { return [A.utils && A.utils.random ? A.utils.random(-40, 40) : 30, 0]; },
        duration: 1100,
        ease: "out(4)",
        delay: stagger(140)
      });
    }, { rootMargin: "0px 0px -15% 0px" });
    deck.forEach(function (c) { c.querySelector(".deck-inner").style.opacity = "0"; });
    dealIO.observe(stage);
  }

  /* ======================================================================
     4. LOGO
     ====================================================================== */
  var mark = document.querySelector(".site-header .wordmark");
  var logoImg = mark && mark.querySelector("img.logo-dark");
  if (mark && logoImg && window.fetch && window.DOMParser) {
    fetch(logoImg.getAttribute("src")).then(function (r) { return r.text(); }).then(function (txt) {
      var src = new DOMParser().parseFromString(txt, "image/svg+xml").documentElement;
      var NS = "http://www.w3.org/2000/svg";
      var svg = document.createElementNS(NS, "svg");
      svg.setAttribute("viewBox", src.getAttribute("viewBox"));
      svg.setAttribute("class", "wordmark-svg");
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", "Chwispy Studio");

      // The four corner brackets: the frame path is 8 bars, two per corner.
      var bars = (src.querySelector("#frame path").getAttribute("d").match(/M[^M]+/g) || []);
      var corners = [];
      for (var i = 0; i < 4; i++) {
        var g = document.createElementNS(NS, "path");
        g.setAttribute("d", (bars[i * 2] || "") + (bars[i * 2 + 1] || ""));
        g.setAttribute("fill", "var(--lg-ink)");
        g.style.fill = "var(--lg-ink)";
        svg.appendChild(g);
        corners.push(g);
      }
      var c = src.querySelector("#frame circle");
      var dotEl = document.createElementNS(NS, "circle");
      ["cx", "cy", "r"].forEach(function (a) { dotEl.setAttribute(a, c.getAttribute(a)); });
      dotEl.style.fill = "var(--lg-dot)";
      dotEl.style.transformOrigin = c.getAttribute("cx") + "px " + c.getAttribute("cy") + "px";
      svg.appendChild(dotEl);

      // The name, revealed by a wipe.
      var clipId = "lg-wipe";
      var defs = document.createElementNS(NS, "defs");
      var clip = document.createElementNS(NS, "clipPath");
      clip.setAttribute("id", clipId);
      var wipe = document.createElementNS(NS, "rect");
      wipe.setAttribute("x", "0"); wipe.setAttribute("y", "0"); wipe.setAttribute("height", "122"); wipe.setAttribute("width", "543");
      clip.appendChild(wipe); defs.appendChild(clip); svg.insertBefore(defs, svg.firstChild);
      var word = document.createElementNS(NS, "g");
      word.setAttribute("clip-path", "url(#" + clipId + ")");
      var parts = src.querySelectorAll("#wordmark path");
      var words = [];
      Array.prototype.forEach.call(parts, function (p, idx) {
        var n = document.createElementNS(NS, "path");
        n.setAttribute("d", p.getAttribute("d"));
        n.style.fill = idx === 0 ? "var(--lg-ink)" : "var(--lg-soft)";
        word.appendChild(n);
        words.push(n);
      });
      svg.appendChild(word);

      mark.insertBefore(svg, mark.firstChild);
      mark.classList.add("has-svg");

      var outward = [[-46, -30], [46, -30], [-46, 30], [46, 30]];
      var seen = false;
      try { seen = sessionStorage.getItem("cs-logo") === "1"; sessionStorage.setItem("cs-logo", "1"); } catch (e) {}

      if (!seen) {
        set(wipe, { width: 0 });
        var tl = createTimeline({ defaults: { ease: "out(4)" } });
        tl.add(corners, {
          x: function (el, i) { return [outward[i][0] * 3, 0]; },
          y: function (el, i) { return [outward[i][1] * 3, 0]; },
          opacity: [0, 1],
          duration: 900,
          ease: "outElastic(1, .7)",
          delay: stagger(60)
        }, 150)
          .add(dotEl, { scale: [0, 1.6, 1], duration: 600, ease: "out(3)" }, "-=450")
          .add(wipe, { width: [0, 543], duration: 750, ease: "inOut(3)" }, "-=500")
          .add(words[1] || [], { y: [14, 0], opacity: [0, 1], duration: 500 }, "-=350");
      }

      // Hover: brackets breathe out and snap back.
      mark.addEventListener("mouseenter", function () {
        animate(corners, {
          x: function (el, i) { return outward[i][0] * 0.25; },
          y: function (el, i) { return outward[i][1] * 0.25; },
          duration: 180,
          ease: "out(3)",
          onComplete: function () {
            animate(corners, { x: 0, y: 0, duration: 800, ease: "outElastic(1, .4)" });
          }
        });
        animate(dotEl, { scale: [1, 1.5, 1], duration: 500, ease: "out(3)" });
      });
    }).catch(function () { /* the <img> logo stays */ });
  }
})();
