/* ==========================================================================
   motion.js: the site's animation layer, built on Anime.js v4
   (js/vendor/anime.umd.min.js, loaded just before this file).

   Loud at the top, quiet below:
   - Home hero: the headline rises word by word, the tiles open like shutters,
     and CHWISPY STUDIO stamps in letter by letter, then splits apart in parallax as you scroll.
   - Inner pages: the page title rises word by word.
   - Everything marked data-reveal eases up as it scrolls in. Lists (service
     cards, recent builds, video cards) come in one after another.
   - Section numbers like (01) scramble in, and prices count up to their number.
   - Big buttons lean toward the pointer (mouse and trackpad only).

   The head of each page adds the "motion" class to <html> (which hides these
   pieces until they animate) unless the visitor asked for reduced motion.
   If this file or Anime.js fails to load, that class comes off after a moment
   and the page shows as normal.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var A = window.anime;

  if (!A || reduce || !root.classList.contains("motion")) {
    root.classList.remove("motion");
    return;
  }
  root.classList.add("motion-on");

  var animate = A.animate, stagger = A.stagger, createTimeline = A.createTimeline;
  var splitText = A.splitText, onScroll = A.onScroll, set = A.utils ? A.utils.set : A.set;
  var scrambleText = A.scrambleText;
  var $ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var show = function (els) { els.forEach(function (el) { el.style.opacity = "1"; }); };

  /* Split a heading into words that rise out of a clipped line. */
  var splitWords = function (el) {
    show([el]);
    return splitText(el, { words: { wrap: "clip" } }).words;
  };

  /* ---- Home hero ---------------------------------------------------------- */
  var hero = document.querySelector(".hero");
  if (hero) {
    var h1 = hero.querySelector("h1");
    var copyRest = $(".tile-copy > :not(h1)", hero);
    var tiles = $(".hero-grid > .tile:not(.tile-copy)", hero);
    var mark = hero.querySelector(".hero-mark");
    var markParts = mark ? $("span", mark) : [];
    var markChars = [];

    if (mark) {
      show([mark]);
      markParts.forEach(function (part) {
        markChars = markChars.concat(splitText(part, { chars: { wrap: "clip" } }).chars);
      });
    }

    var tl = createTimeline({ defaults: { ease: "out(4)", duration: 900 } });
    if (h1) {
      tl.add(splitWords(h1), { y: ["110%", "0%"], duration: 1000, delay: stagger(70) }, 120);
    }
    if (copyRest.length) {
      tl.add(copyRest, { opacity: [0, 1], y: [24, 0], delay: stagger(90) }, "-=650");
    }
    if (tiles.length) {
      tl.add(tiles, {
        opacity: [0, 1],
        clipPath: ["inset(100% 0% 0% 0%)", "inset(0% 0% 0% 0%)"],
        duration: 1100,
        ease: "inOut(4)",
        delay: stagger(110, { start: 0 })
      }, 200);
    }
    if (markChars.length) {
      tl.add(markChars, { y: ["105%", "0%"], duration: 1100, ease: "out(5)", delay: stagger(40, { from: "first" }) }, "-=900");
    }
    tl.call(function () {
      tiles.forEach(function (t) { t.style.clipPath = ""; });
    });

    /* As the name scrolls past, "Studio" rises faster than "Chwispy" (parallax). */
    if (markParts.length === 2 && onScroll) {
      animate(markParts[0], { y: [0, -30], ease: "linear", autoplay: onScroll({ target: mark, sync: 0.25 }) });
      animate(markParts[1], { y: [0, -80], ease: "linear", autoplay: onScroll({ target: mark, sync: 0.25 }) });
    }
  }

  /* ---- Inner page titles ------------------------------------------------- */
  $(".page-hero h1").forEach(function (title) {
    var around = $(":scope > :not(h1)", title.parentNode);
    show(around);
    var t = createTimeline({ defaults: { ease: "out(4)" } });
    t.add(splitWords(title), { y: ["110%", "0%"], duration: 1000, delay: stagger(80) }, 80);
    if (around.length) t.add(around, { opacity: [0, 1], y: [18, 0], duration: 800, delay: stagger(80) }, "-=750");
  });

  /* ---- Prices count up: "From $2,495" runs 0 → 2,495 --------------------- */
  var countUp = function (el) {
    var node = null;
    // Find the text node holding the dollar amount, so spans like "From" stay put.
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (/\$[\d,]+/.test(walker.currentNode.nodeValue)) { node = walker.currentNode; break; }
    }
    if (!node || el.dataset.counted || el.hasAttribute("data-desk-price")) return;
    el.dataset.counted = "1";
    var original = node.nodeValue;
    var target = parseInt(original.match(/\$([\d,]+)/)[1].replace(/,/g, ""), 10);
    if (!target) return;
    var box = { v: 0 };
    el.style.fontVariantNumeric = "tabular-nums";
    animate(box, {
      v: target,
      duration: 1400,
      ease: "out(3)",
      onUpdate: function () {
        node.nodeValue = original.replace(/\$[\d,]+/, "$" + Math.round(box.v).toLocaleString("en-US"));
      },
      onComplete: function () { node.nodeValue = original; }
    });
  };

  /* ---- Section numbers scramble in: (01) (02) (03) ------------------------ */
  var scramble = function (els) {
    if (!scrambleText) return;
    els.forEach(function (tag, i) {
      animate(tag, { innerHTML: scrambleText({ chars: "numbers", delay: i * 80 }) });
    });
  };

  /* ---- Scroll reveals ------------------------------------------------------
     Lists reveal their items one after another; anything else eases up whole. */
  var groupSel = ".service-cards, .build-rows, .featured, .work-grid, .steps, .logos, .quotes";
  var groupItems = function (group) {
    if (group.matches(".featured, .work-grid")) return $(":scope > .card:not([hidden])", group);
    return $(":scope > *", group);
  };

  var revealGroup = function (group) {
    var items = groupItems(group);
    show([group]);
    var fromSide = group.matches(".build-rows");
    animate(items, {
      opacity: [0, 1],
      x: fromSide ? [-40, 0] : 0,
      y: fromSide ? 0 : [48, 0],
      duration: 950,
      ease: "out(4)",
      delay: stagger(fromSide ? 110 : 90)
    });
    items.forEach(function (it) { $(".price, .tier-price", it).forEach(countUp); });
  };

  var revealOne = function (el) {
    var head = el.matches(".section-head") ? el.querySelector("h2") : null;
    if (head) {
      show([el]);
      var tags = $(".tag", head);
      scramble(tags);
      animate(el.querySelectorAll(":scope > :not(h2)"), { opacity: [0, 1], x: [-16, 0], duration: 800, delay: 300, ease: "out(4)" });
      animate(head, { opacity: [0, 1], y: [28, 0], duration: 900, ease: "out(4)" });
      return;
    }
    animate(el, { opacity: [0, 1], y: [36, 0], duration: 1000, ease: "out(4)" });
    $(".price, .tier-price", el).forEach(countUp);
  };

  var groups = $(groupSel);
  var singles = $("[data-reveal]").filter(function (el) {
    if (el.closest(".hero, .page-hero")) return false;
    // A card inside a list is handled by its list.
    return !groups.some(function (g) { return g !== el && g.contains(el); }) && groups.indexOf(el) === -1;
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      if (groups.indexOf(entry.target) !== -1) revealGroup(entry.target);
      else revealOne(entry.target);
    });
  }, { rootMargin: "0px 0px -12% 0px" });
  groups.forEach(function (g) { io.observe(g); });
  singles.forEach(function (el) { io.observe(el); });

  /* Work filters un-hide cards after the grid has revealed: bring those in too. */
  $(".filter").forEach(function (f) {
    f.addEventListener("click", function () {
      requestAnimationFrame(function () {
        var shown = $(".work-grid .card:not([hidden])");
        animate(shown, { opacity: [0, 1], y: [24, 0], duration: 600, ease: "out(3)", delay: stagger(50) });
      });
    });
  });

  /* ---- Magnetic buttons: big buttons lean toward the pointer --------------- */
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    $(".btn-large").forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        animate(btn, { x: dx * 14, y: dy * 10, duration: 400, ease: "out(3)" });
      });
      btn.addEventListener("pointerleave", function () {
        animate(btn, { x: 0, y: 0, duration: 900, ease: "outElastic(1, .5)" });
      });
    });
  }
})();
