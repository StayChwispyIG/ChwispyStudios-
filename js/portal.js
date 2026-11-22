/* ==========================================================================
   portal.js: the client side of the portal (portal.html).
   Sign in with email + 6-digit code, then Overview, Invoices, Contracts.
   All data comes from window.PortalData (portal-data.js). Anything a client
   typed or the studio wrote is escaped before it reaches the page.
   ========================================================================== */
(function () {
  "use strict";
  var D = window.PortalData, F = window.PortalFormat, C = window.PORTAL_CONFIG;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var signin = $("[data-signin]"), app = $("[data-app]");
  var gate = window.PortalSignIn({ onIn: function () { return open(); } });

  /* ---- Signed in ---- */
  function open() {
    return D.myProject().then(function (b) {
      if (!b) { gate.refuse("I don’t have a project under that email. Use the one you gave me, or message me."); return; }
      render(b);
      gate.show(app);
      $("[data-hello]").focus({ preventScroll: true });
    });
  }

  function render(b) {
    var c = b.client, steps = (C.stages[c.kind] || C.stages.web), fin = !!c.done;
    var now = fin ? steps.length : Math.min(c.stage || 0, steps.length - 1);
    var first = (c.name || "").split(" ")[0];
    $("[data-hello]").textContent = first ? "Hi, " + first : "Welcome back";
    $("[data-client-company]").textContent = c.company || "";
    $("[data-project-name]").textContent = c.project || "";

    /* Where things stand */
    var last = c.stage_dates && c.stage_dates[String(steps.length - 1)];
    $("[data-stage-name]").textContent = fin ? "All done" : steps[now];
    $("[data-stage-count]").textContent = fin ? (last ? "Finished " + F.date(last, true) : "Finished") : "Step " + (now + 1) + " of " + steps.length;
    $("[data-stage-bar]").innerHTML = steps.map(function (s, i) {
      return '<span class="' + (i < now ? "is-done" : i === now ? "is-now" : "") + '"></span>';
    }).join("");
    $("[data-timeline]").innerHTML = steps.map(function (s, i) {
      var cls = i < now ? "is-done" : i === now ? "is-now" : "is-next";
      var when = c.stage_dates && c.stage_dates[String(i)];
      var meta = i < now ? "Done " + F.date(when) : i === now ? "In progress" + (when ? " since " + F.date(when) : "") : "Up next";
      if (i > now + 1) meta = "";
      return '<li class="' + cls + '"' + (i === now ? ' aria-current="step"' : "") + '><span class="mark" aria-hidden="true"></span><div>' +
        '<p class="step-name">' + F.esc(s) + '</p>' + (meta ? '<p class="step-meta">' + meta + '</p>' : "") + '</div></li>';
    }).join("");

    /* Latest note */
    $("[data-note]").textContent = c.note || "No update yet.";
    $("[data-note-date]").textContent = c.note_at ? "Chwispy, " + F.date(c.note_at, true) : "";

    /* Invoices */
    var open = b.invoices.filter(function (i) { var s = F.invoiceState(i); return s === "due" || s === "overdue"; });
    var paid = b.invoices.filter(function (i) { return i.status === "paid"; }).reduce(function (t, i) { return t + i.amount; }, 0);
    var due = open.reduce(function (t, i) { return t + i.amount; }, 0);
    $("[data-total-paid]").textContent = F.money(paid);
    var dueEl = $("[data-total-due]"); dueEl.textContent = F.money(due); dueEl.classList.toggle("is-due", due > 0);
    var order = { overdue: 0, due: 1, upcoming: 2, paid: 3 };
    var invs = b.invoices.slice().sort(function (a, z) {
      return order[F.invoiceState(a)] - order[F.invoiceState(z)] || (a.due_on < z.due_on ? -1 : 1);
    });
    $("[data-invoices]").innerHTML = invs.length ? invs.map(invoiceRow).join("") : '<li class="empty">No invoices yet.</li>';

    /* Contracts */
    var toSign = b.contracts.filter(function (k) { return k.status === "sign"; });
    var ks = b.contracts.slice().sort(function (a, z) { return (a.status === "sign" ? 0 : 1) - (z.status === "sign" ? 0 : 1); });
    $("[data-contracts]").innerHTML = ks.length ? ks.map(contractRow).join("") : '<li class="empty">No contracts yet.</li>';

    /* Counts on the tabs + Waiting on you */
    count("invoices", open.length); count("contracts", toSign.length);
    var todos = open.map(function (i) {
      var late = F.invoiceState(i) === "overdue";
      return todo("Pay " + F.money(i.amount) + " for " + i.title.toLowerCase(), (late ? "Was due " : "Due ") + F.date(i.due_on), "invoices", "See invoice");
    }).concat(toSign.map(function (k) {
      return todo("Sign the " + k.title.replace(/^./, function (m) { return m.toLowerCase(); }), "Sent " + F.date(k.sent_on), "contracts", "Review it");
    }));
    $("[data-todo]").innerHTML = todos.join("");
    $("[data-todo]").hidden = !todos.length;
    $("[data-all-clear]").hidden = !!todos.length;
  }

  function count(name, n) { var el = $('[data-count="' + name + '"]'); el.textContent = n; el.hidden = !n; el.setAttribute("aria-label", n + " need you"); }
  function todo(title, sub, tab, label) {
    return '<li class="todo"><div><p class="todo-title">' + F.esc(title) + '</p><p class="todo-sub">' + F.esc(sub) + '</p></div>' +
      '<button class="btn btn-ghost btn-small" type="button" data-go="' + tab + '">' + label + '</button></li>';
  }
  /* Live files need a fresh private link, made on tap. The sample files are plain links. */
  function fileLink(path) {
    if (!path) return "";
    if (D.mode === "sample") return '<a class="text-button" href="assets/portal-sample/' + F.esc(path.split("/").pop()) + '" target="_blank" rel="noopener">View PDF</a>';
    return '<button class="text-button" type="button" data-file="' + F.esc(path) + '">View PDF</button>';
  }
  function invoiceRow(i) {
    var s = F.invoiceState(i);
    var word = { paid: "Paid " + F.date(i.paid_on), due: "Due " + F.date(i.due_on), overdue: "Overdue", upcoming: "Due " + F.date(i.due_on) }[s];
    var sub = i.number + (i.issued_on ? " · Sent " + F.date(i.issued_on, true) : " · Not sent yet");
    var pay = F.safeUrl(i.pay_url);
    var acts = (s === "due" || s === "overdue") && pay ? '<a class="btn btn-primary btn-small" href="' + F.esc(pay) + '"' + (/^https/.test(pay) ? ' rel="noopener" target="_blank"' : "") + '>Pay now</a>' : "";
    acts += fileLink(i.file_path);
    return '<li class="doc"><div><p class="doc-title">' + F.esc(i.title) + '</p><p class="doc-meta">' + F.esc(sub) + '</p></div>' +
      '<p class="doc-amount">' + F.money(i.amount) + '</p>' +
      '<p><span class="status status--' + (s === "upcoming" ? "upcoming" : s) + '">' + word + '</span></p>' +
      '<div class="doc-actions">' + acts + '</div></li>';
  }
  function contractRow(k) {
    var sign = k.status === "sign", link = F.safeUrl(k.sign_url);
    var acts = sign && link ? '<a class="btn btn-primary btn-small" href="' + F.esc(link) + '"' + (/^https/.test(link) ? ' rel="noopener" target="_blank"' : "") + '>Review and sign</a>' : "";
    acts += fileLink(k.file_path);
    return '<li class="doc doc--contract"><div><p class="doc-title">' + F.esc(k.title) + '</p><p class="doc-meta">Sent ' + F.date(k.sent_on, true) + '</p></div>' +
      '<p><span class="status status--' + (sign ? "sign" : "signed") + '">' + (sign ? "Needs your signature" : "Signed " + F.date(k.signed_on)) + '</span></p>' +
      '<div class="doc-actions">' + acts + '</div></li>';
  }

  /* ---- Tabs (arrow keys move between them) ---- */
  var tabs = $$("[data-tab]");
  function select(name, focus) {
    tabs.forEach(function (t) {
      var on = t.dataset.tab === name;
      t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1;
      $("#view-" + t.dataset.tab).hidden = !on;
      if (on && focus) t.focus();
    });
    try { history.replaceState(null, "", "#" + name); } catch (e) {}
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { select(t.dataset.tab); });
    t.addEventListener("keydown", function (e) {
      var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length].dataset.tab, true); }
    });
  });
  app.addEventListener("click", function (e) {
    var go = e.target.closest("[data-go]");
    if (go) { select(go.dataset.go); $(".tabs").scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    var f = e.target.closest("[data-file]");
    if (f) {
      var w = window.open("", "_blank"); // opened first so phones don't block it
      D.fileUrl(f.dataset.file).then(function (url) { if (w) { w.opener = null; w.location = url; } else location.href = url; })
        .catch(function () { if (w) w.close(); f.textContent = "Couldn’t open. Tap to try again"; });
    }
  });

  /* ---- Already signed in? Go straight to the project. ---- */
  var startTab = (location.hash || "").slice(1);
  gate.resume().then(function (ok) { if (ok && ["invoices", "contracts"].indexOf(startTab) > -1) select(startTab); });
})();
