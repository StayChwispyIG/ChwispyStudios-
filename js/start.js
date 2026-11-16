/* ==========================================================================
   start.js: the "Start a project" flow on contact.html.
   One question per screen: service, then goal, then name + phone.
   The finished message opens in the visitor's email app, addressed to the
   inbox in data-email. If data-sms has a number, a "Send as a text" button
   shows too. Nothing is sent anywhere until the visitor hits send themselves.
   ========================================================================== */
(function () {
  "use strict";
  var root = document.querySelector("[data-starter]");
  if (!root) return;

  var GOALS = {
    "Video": ["Sell a product or run ads", "Grow on social", "Tell our story", "Cover an event", "Something else"],
    "Website": ["Launch a new site", "Redo my current site", "Get more inquiries", "Something else"],
    "Shopify store": ["Open a new store", "Fix up my store", "Sell more online", "Something else"],
    "Logo or flyer": ["A new logo", "An event flyer", "A promo flyer", "Something else"]
  };
  // Links from services.html arrive as ?type=...; map them onto the first two answers.
  var FROM_SERVICES = {
    "social content": ["Video", "Grow on social"],
    "commercial": ["Video", "Sell a product or run ads"],
    "brand film": ["Video", "Tell our story"],
    "event": ["Video", "Cover an event"],
    "website": ["Website", null],
    "shopify": ["Shopify store", null],
    "design": ["Logo or flyer", null]
  };

  var form = root.querySelector("form");
  var steps = root.querySelectorAll("[data-step]");
  var count = root.querySelector("[data-step-count]");
  var bar = root.querySelector("[data-bar]");
  var back = root.querySelector("[data-back]");
  var goalsBox = root.querySelector("[data-goals]");
  var nextBtn = root.querySelector("[data-next]");
  var note = root.querySelector("#start-note");
  var err = root.querySelector("[data-error]");
  var answers = { service: "", goal: "" };
  var step = 1;

  function show(n, focus) {
    step = n;
    steps.forEach(function (el) { el.hidden = Number(el.dataset.step) !== n; });
    count.textContent = n <= 3 ? "Question " + n + " of 3" : "All set";
    bar.style.width = (Math.min(n, 3) / 3 * 100) + "%";
    root.classList.toggle("is-done", n === 4);
    back.hidden = n === 1;
    if (focus !== false) {
      var h = root.querySelector('[data-step="' + n + '"] h2');
      if (h) h.focus({ preventScroll: false });
    }
  }

  function mark(group, value) {
    root.querySelectorAll('[data-pick="' + group + '"]').forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.value === value));
    });
  }

  function buildGoals(service) {
    goalsBox.innerHTML = "";
    (GOALS[service] || GOALS["Video"]).forEach(function (g) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "choice choice--goal";
      b.dataset.pick = "goal";
      b.dataset.value = g;
      b.setAttribute("aria-pressed", String(answers.goal === g));
      b.innerHTML = '<span class="choice-name"></span>';
      b.firstChild.textContent = g;
      goalsBox.appendChild(b);
    });
    nextBtn.hidden = !answers.goal;
  }

  root.addEventListener("click", function (e) {
    var b = e.target.closest("[data-pick]");
    if (!b) return;
    if (b.dataset.pick === "service") {
      if (answers.service !== b.dataset.value) answers.goal = "";
      answers.service = b.dataset.value;
      mark("service", answers.service);
      buildGoals(answers.service);
      setTimeout(function () { show(2); }, 180);
    } else {
      answers.goal = b.dataset.value;
      mark("goal", answers.goal);
      nextBtn.hidden = false;
      // "Something else" waits for a note; every other goal moves straight on.
      if (answers.goal === "Something else") { note.focus(); }
      else { setTimeout(function () { show(3); }, 180); }
    }
  });
  nextBtn.addEventListener("click", function () { show(3); });
  back.addEventListener("click", function () { show(step === 4 ? 3 : step - 1); });

  function message(name, phone) {
    var lines = [
      "Hi Chris,",
      "",
      "I'm " + name + ". I need help with: " + answers.service + ".",
      "Goal: " + answers.goal + "."
    ];
    if (note.value.trim()) lines.push("Notes: " + note.value.trim());
    lines.push("", "My number is " + phone + ".");
    return lines.join("\n");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = form.elements.name.value.trim();
    var phone = form.elements.phone.value.trim();
    var ok = name && phone.replace(/\D/g, "").length >= 7;
    err.hidden = ok;
    if (!ok) { (name ? form.elements.phone : form.elements.name).focus(); return; }

    var text = message(name, phone);
    var subject = "New project: " + answers.service + " (" + name + ")";
    root.querySelector("[data-message]").textContent = text;

    var email = root.dataset.email;
    var mail = root.querySelector("[data-send-email]");
    mail.href = "mailto:" + email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(text);

    var sms = (root.dataset.sms || "").replace(/\D/g, "");
    var smsLink = root.querySelector("[data-send-sms]");
    if (sms) {
      smsLink.href = "sms:+" + sms + "?&body=" + encodeURIComponent(text);
      smsLink.hidden = false;
    }
    show(4);
  });

  root.querySelector("[data-copy]").addEventListener("click", function () {
    var btn = this;
    var pre = root.querySelector("[data-message]");
    var done = function () { btn.textContent = "Copied"; setTimeout(function () { btn.textContent = "Copy message"; }, 2000); };
    var select = function () {
      var r = document.createRange(); r.selectNodeContents(pre);
      var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
    };
    try {
      navigator.clipboard.writeText(pre.textContent).then(done, select);
    } catch (x) { select(); }
  });

  // Arriving from a "Ask about this" link on the services page.
  var type = new URLSearchParams(location.search).get("type");
  var pre = type && FROM_SERVICES[type.toLowerCase()];
  if (pre) {
    answers.service = pre[0];
    mark("service", pre[0]);
    if (pre[1]) answers.goal = pre[1];
    buildGoals(pre[0]);
    show(2, false);
  } else {
    show(1, false);
  }
})();
