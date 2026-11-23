/* ==========================================================================
   start.js: the "Start a project" flow on contact.html.
   One question per screen: service, then goal, then name + phone.
   Tapping "Send it to Chwispy" sends the answers through FormSubmit (formsubmit.co)
   to the inbox in data-mail + data-host, or to the FormSubmit alias in data-form once
   it's set. A hidden _honey field catches bots: if it's filled, nothing is sent.
   If the send fails, step 5 offers the old route: the message opens in the visitor's
   email app (plus "Send as a text" when data-sms has a number).
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
  var submitBtn = root.querySelector("[data-submit]");
  var honey = root.querySelector('[name="_honey"]');
  var answers = { service: "", goal: "" };
  var sending = false;
  var step = 1;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function show(n, focus) {
    step = n;
    steps.forEach(function (el) { el.hidden = Number(el.dataset.step) !== n; });
    count.textContent = n <= 3 ? "Question " + n + " of 3" : (n === 4 ? "Sent" : "One more tap");
    bar.style.width = (Math.min(n, 3) / 3 * 100) + "%";
    root.classList.toggle("is-done", n >= 4);
    back.hidden = n === 1 || n === 4;
    if (focus !== false) {
      // Bring the top of the panel back into view (clear of the sticky header),
      // then move focus to the new question without a second jump.
      var top = root.getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * 0.4) {
        root.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
      }
      var h = root.querySelector('[data-step="' + n + '"] h2');
      if (h) h.focus({ preventScroll: true });
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
  back.addEventListener("click", function () { show(step >= 4 ? 3 : step - 1); });

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

  function fillMessage(text) {
    root.querySelectorAll("[data-message]").forEach(function (pre) { pre.textContent = text; });
  }

  // Backup route (step 5): the message opens in the visitor's own email app.
  function showBackup(email, subject, text) {
    var mail = root.querySelector("[data-send-email]");
    mail.href = "mailto:" + email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(text);
    var sms = (root.dataset.sms || "").replace(/\D/g, "");
    var smsLink = root.querySelector("[data-send-sms]");
    if (sms) {
      smsLink.href = "sms:+" + sms + "?&body=" + encodeURIComponent(text);
      smsLink.hidden = false;
    }
    show(5);
  }

  function setSending(on) {
    sending = on;
    submitBtn.disabled = on;
    submitBtn.setAttribute("aria-busy", String(on));
    submitBtn.textContent = on ? "Sending\u2026" : "Send it to Chwispy";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    // Enter pressed in the optional note (question 2) moves on instead of sending.
    if (step !== 3) { if (step === 2 && answers.goal) show(3); return; }
    if (sending) return;
    var name = form.elements.name.value.trim();
    var phone = form.elements.phone.value.trim();
    var ok = name && phone.replace(/\D/g, "").length >= 7;
    err.hidden = ok;
    if (!ok) { (name ? form.elements.phone : form.elements.name).focus(); return; }

    var text = message(name, phone);
    var subject = "New project: " + answers.service + " (" + name + ")";
    fillMessage(text);
    var first = name.split(/\s+/)[0];
    root.querySelector("[data-sent-title]").textContent = "Got it, thanks " + first;

    // The address is stored in two halves (data-mail + data-host) so scrapers
    // reading the page code can't harvest it.
    var email = root.dataset.mail + "@" + root.dataset.host;

    // A bot filled the hidden field: show the thank-you and send nothing.
    if (honey && honey.value) { show(4); return; }

    // Tell PostHog a quote was sent: only the service and goal picked, never the name, phone or note.
    if (window.posthog && typeof window.posthog.capture === "function") {
      window.posthog.capture("quote_form_submitted", { service: answers.service, goal: answers.goal });
    }

    var target = (root.dataset.form || "").trim() || email;
    var payload = {
      "Service": answers.service,
      "Goal": answers.goal,
      "Notes": note.value.trim() || "(none)",
      "Name": name,
      "Phone": phone,
      "_subject": subject,
      "_template": "table",
      "_captcha": "false",
      "_honey": ""
    };

    setSending(true);
    var done = false;
    var timer = setTimeout(function () { if (!done) { done = true; setSending(false); showBackup(email, subject, text); } }, 15000);
    fetch("https://formsubmit.co/ajax/" + encodeURIComponent(target), {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; });
    }).then(function (res) {
      if (done) return;
      done = true; clearTimeout(timer); setSending(false);
      // FormSubmit answers {"success":"true"} when the message went out.
      if (res.ok && String(res.j.success) === "true") { show(4); }
      else { showBackup(email, subject, text); }
      // PREVIEW ONLY: show FormSubmit's answer on the page.
      var dbg = document.createElement("pre"); dbg.id = "debug-answer"; dbg.textContent = "HTTP ok=" + res.ok + " " + JSON.stringify(res.j); root.appendChild(dbg);
    }, function (er) {
      var dbg = document.createElement("pre"); dbg.id = "debug-answer"; dbg.textContent = "FETCH ERROR " + er; root.appendChild(dbg);
      if (done) return;
      done = true; clearTimeout(timer); setSending(false);
      showBackup(email, subject, text);
    });
  });

  root.querySelector("[data-copy]").addEventListener("click", function () {
    var btn = this;
    var pre = root.querySelector('[data-step="5"] [data-message]');
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
