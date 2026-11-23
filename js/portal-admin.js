/* ==========================================================================
   portal-admin.js: the studio desk (portal-admin.html).
   Only an account listed as an admin in the database can read or change
   anything here; the page checks too, but the database is what enforces it.
   ========================================================================== */
(function () {
  "use strict";
  var D = window.PortalData, F = window.PortalFormat, C = window.PORTAL_CONFIG;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var app = $("[data-app]");
  var clients = [], current = null, docs = { invoices: [], contracts: [] }, pick = 0, done = false;

  var gate = window.PortalSignIn({
    onIn: function () {
      return D.isAdmin().then(function (ok) {
        if (!ok) { gate.refuse("This desk is only for the studio account."); return; }
        return load().then(function () { gate.show(app); $("#desk-title").focus({ preventScroll: true }); });
      });
    }
  });

  $("[data-kind]").innerHTML = Object.keys(C.kinds).map(function (k) { return '<option value="' + k + '">' + F.esc(C.kinds[k]) + "</option>"; }).join("");

  function load(selectId) {
    return D.listClients().then(function (list) {
      clients = list;
      var id = selectId || (current && current.id) || (clients[0] && clients[0].id);
      drawList(id);
      return id ? openClient(id) : newClient();
    });
  }

  function drawList(id) {
    $("[data-client-list]").innerHTML = clients.map(function (c) {
      var steps = C.stages[c.kind] || C.stages.web;
      var where = c.done ? "Finished" : steps[Math.min(c.stage || 0, steps.length - 1)];
      return '<li><button class="client-pick" type="button" data-pick-client="' + F.esc(c.id) + '"' + (c.id === id ? ' aria-current="true"' : "") + '>' +
        "<strong>" + F.esc(c.company || c.name) + "</strong><span>" + F.esc(where) + "</span></button></li>";
    }).join("");
    $("[data-client-select]").innerHTML = clients.map(function (c) {
      return '<option value="' + F.esc(c.id) + '"' + (c.id === id ? " selected" : "") + ">" + F.esc(c.company || c.name) + "</option>";
    }).join("") + (id ? "" : '<option selected value="">New client</option>');
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-pick-client]");
    if (b) { drawList(b.dataset.pickClient); openClient(b.dataset.pickClient); }
  });
  $("[data-client-select]").addEventListener("change", function (e) { if (e.target.value) { drawList(e.target.value); openClient(e.target.value); } });
  $("[data-new-client]").addEventListener("click", function () { drawList(null); newClient(); $("#d-name").focus(); });

  function openClient(id) {
    return D.clientBundle(id).then(function (b) {
      current = b.client; docs = { invoices: b.invoices, contracts: b.contracts, files: b.files || [] };
      fill();
    });
  }
  function newClient() {
    current = { name: "", company: "", email: "", project: "", kind: "web", stage: 0, stage_dates: {}, note: "", note_at: "" };
    docs = { invoices: [], contracts: [], files: [] };
    fill();
  }

  function fill() {
    var c = current, f = $("[data-project-form]");
    $("[data-desk-name]").textContent = c.id ? (c.company || c.name) : "New client";
    $("[data-desk-sub]").textContent = c.id ? [c.name, c.email].filter(Boolean).join(" · ") : "Fill this in and save. They can sign in with that email right away.";
    f.name.value = c.name || ""; f.company.value = c.company || ""; f.email.value = c.email || "";
    f.project.value = c.project || ""; f.kind.value = c.kind || "web"; f.note.value = c.note || "";
    pick = c.stage || 0; done = !!c.done;
    drawStages();
    $$("[data-saved]").forEach(function (el) { el.textContent = ""; });
    var view = $("[data-view-as]");
    view.hidden = !(D.mode === "sample" && c.id);
    $$(".add-doc").forEach(function (d) { d.hidden = !c.id; d.open = false; });
    drawDocs();
  }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }

  function drawStages() {
    var steps = C.stages[$("[data-kind]").value] || C.stages.web;
    if (pick > steps.length - 1) pick = steps.length - 1;
    $("[data-stage-picks]").innerHTML = steps.map(function (s, i) {
      return '<button class="choice stage-pick" type="button" data-stage="' + i + '" aria-pressed="' + (!done && i === pick) + '"><span class="choice-name">' + (i + 1) + ". " + F.esc(s) + "</span></button>";
    }).join("") + '<button class="choice stage-pick" type="button" data-stage="done" aria-pressed="' + done + '"><span class="choice-name">All done</span></button>';
  }
  $("[data-kind]").addEventListener("change", drawStages);
  $("[data-stage-picks]").addEventListener("click", function (e) {
    var b = e.target.closest("[data-stage]"); if (!b) return;
    var steps = C.stages[$("[data-kind]").value] || C.stages.web;
    if (b.dataset.stage === "done") { done = true; pick = steps.length - 1; } else { done = false; pick = +b.dataset.stage; }
    drawStages();
  });

  /* Save project + step. Reaching a new step stamps today's date on it. */
  $("[data-project-form]").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.currentTarget, out = $('[data-saved="project"]');
    if (!f.name.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim())) { out.textContent = "Add a name and a sign-in email."; return; }
    var c = Object.assign({}, current), today = F.today();
    c.name = f.name.value.trim(); c.company = f.company.value.trim(); c.email = f.email.value.trim().toLowerCase();
    c.project = f.project.value.trim(); c.kind = f.kind.value;
    c.stage_dates = Object.assign({}, c.stage_dates || {});
    if (c.kind !== current.kind) c.stage_dates = {};
    for (var i = 0; i <= pick; i++) if (!c.stage_dates[String(i)]) c.stage_dates[String(i)] = today;
    c.stage = pick; c.done = done;
    if (f.note.value.trim() !== (current.note || "")) { c.note = f.note.value.trim(); c.note_at = today; }
    D.saveClient(c).then(function (saved) {
      current = saved;
      return load(saved.id);
    }).then(function () { $('[data-saved="project"]').textContent = "Saved. The client sees it now."; })
      .catch(function (err) { out.textContent = "Didn’t save: " + err.message; });
  });

  /* ---- Invoices + contracts ---- */
  function drawDocs() {
    $("[data-desk-invoices]").innerHTML = docs.invoices.length ? docs.invoices.map(function (i) {
      return '<li class="doc"><div><p class="doc-title">' + F.esc(i.title) + '</p><p class="doc-meta">' + F.esc(i.number) + " · " + F.money(i.amount) + " · Due " + F.date(i.due_on, true) + "</p></div>" +
        '<label><span class="visually-hidden">Status of ' + F.esc(i.number) + '</span><select data-inv-status="' + F.esc(i.id) + '">' +
        opt("upcoming", "Not sent yet", i.status) + opt("due", "Sent, due", i.status) + opt("paid", "Paid", i.status) + "</select></label>" +
        '<div class="doc-actions"><button class="text-button" type="button" data-remove="invoices:' + F.esc(i.id) + '">Remove</button></div></li>';
    }).join("") : '<li class="empty">No invoices yet.</li>';
    $("[data-desk-contracts]").innerHTML = docs.contracts.length ? docs.contracts.map(function (k) {
      return '<li class="doc"><div><p class="doc-title">' + F.esc(k.title) + '</p><p class="doc-meta">Sent ' + F.date(k.sent_on, true) + "</p></div>" +
        '<label><span class="visually-hidden">Status of ' + F.esc(k.title) + '</span><select data-con-status="' + F.esc(k.id) + '">' +
        opt("sign", "Needs signature", k.status) + opt("signed", "Signed", k.status) + "</select></label>" +
        '<div class="doc-actions"><button class="text-button" type="button" data-remove="contracts:' + F.esc(k.id) + '">Remove</button></div></li>';
    }).join("") : '<li class="empty">No contracts yet.</li>';
    $("[data-desk-files]").innerHTML = docs.files.length ? docs.files.map(function (f) {
      var meta = [F.ext(f.file_name), F.size(f.size_bytes), "Added " + F.date((f.created_at || "").slice(0, 10))].join(" · ");
      return '<li class="doc file"><span class="file-kind file-kind--' + F.esc(f.kind) + '">' + F.fileIcon(f.kind) + '</span>' +
        '<div><p class="doc-title">' + F.esc(f.title) + '</p><p class="doc-meta">' + F.esc(meta) + "</p></div>" +
        '<div class="doc-actions"><button class="text-button" type="button" data-remove="files:' + F.esc(f.id) + '">Remove</button></div></li>';
    }).join("") : '<li class="empty">No files yet.</li>';
  }
  function opt(v, label, cur) { return '<option value="' + v + '"' + (v === cur ? " selected" : "") + ">" + label + "</option>"; }

  document.addEventListener("change", function (e) {
    var inv = e.target.closest("[data-inv-status]"), con = e.target.closest("[data-con-status]");
    if (inv) {
      var p = { status: inv.value, paid_on: inv.value === "paid" ? F.today() : null };
      if (inv.value === "due") p.issued_on = F.today();
      D.updateDoc("invoices", inv.dataset.invStatus, p).then(refresh);
    }
    if (con) D.updateDoc("contracts", con.dataset.conStatus, { status: con.value, signed_on: con.value === "signed" ? F.today() : null }).then(refresh);
  });
  document.addEventListener("click", function (e) {
    var r = e.target.closest("[data-remove]"); if (!r) return;
    var parts = r.dataset.remove.split(":");
    /* Two taps: the first asks, the second removes. */
    if (r.dataset.armed !== "1") { r.dataset.armed = "1"; r.textContent = "Tap again to remove"; return; }
    if (parts[0] === "files") {
      var row = docs.files.filter(function (f) { return f.id === parts[1]; })[0];
      if (row) D.removeFile(row).then(refresh).catch(function (err) { r.textContent = "Didn’t remove: " + err.message; });
      return;
    }
    D.removeDoc(parts[0], parts[1]).then(refresh);
  });
  function refresh() { return openClient(current.id).then(function () { drawList(current.id); }); }

  $("[data-invoice-form]").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.currentTarget, out = $('[data-saved="invoice"]');
    var amount = Math.round(parseFloat(String(f.amount.value).replace(/[^0-9.]/g, "")) * 100);
    if (!f.number.value.trim() || !f.title.value.trim() || !(amount > 0) || !f.due_on.value) { out.textContent = "Fill in number, what it’s for, amount and due date."; return; }
    if (f.pay_url.value && !/^https:\/\//.test(f.pay_url.value)) { out.textContent = "The payment link has to start with https://"; return; }
    D.upload(current.id, f.file.files[0]).then(function (path) {
      return D.addDoc("invoices", { client_id: current.id, number: f.number.value.trim(), title: f.title.value.trim(), amount: amount,
        issued_on: F.today(), due_on: f.due_on.value, status: "due", paid_on: null, file_path: path, pay_url: f.pay_url.value.trim() });
    }).then(function () { f.reset(); return refresh(); }).then(function () { $('[data-saved="invoice"]').textContent = "Invoice added."; })
      .catch(function (err) { out.textContent = "Didn’t add: " + err.message; });
  });
  $("[data-contract-form]").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.currentTarget, out = $('[data-saved="contract"]');
    if (!f.title.value.trim()) { out.textContent = "Give the contract a title."; return; }
    if (f.sign_url.value && !/^https:\/\//.test(f.sign_url.value)) { out.textContent = "The signing link has to start with https://"; return; }
    D.upload(current.id, f.file.files[0]).then(function (path) {
      return D.addDoc("contracts", { client_id: current.id, title: f.title.value.trim(), status: "sign", sent_on: F.today(), signed_on: null, file_path: path, sign_url: f.sign_url.value.trim() });
    }).then(function () { f.reset(); return refresh(); }).then(function () { $('[data-saved="contract"]').textContent = "Contract added."; })
      .catch(function (err) { out.textContent = "Didn’t add: " + err.message; });
  });

  /* ---- Files: checked before upload, then sent with a progress bar ---- */
  var fileForm = $("[data-file-form]"), MAX = (C.maxUploadMB || 50) * 1024 * 1024;
  function fileProblem(file) {
    if (!file) return "Pick a file first.";
    var ext = (/\.([a-z0-9]+)$/i.exec(file.name) || [])[1];
    if (!ext || !(C.fileTypes || {})[ext.toLowerCase()]) return "That kind of file can’t go in the portal. Use PNG, JPG, SVG, WebP, GIF, PDF, ZIP, MP4, MOV, WebM, AI or EPS.";
    if (file.size > MAX) return "This file is " + F.size(file.size) + ". The limit is " + (C.maxUploadMB || 50) + " MB, so share bigger videos as a Google Drive or Dropbox link in your note to the client.";
    return "";
  }
  function guessKind(name) {
    var ext = ((/\.([a-z0-9]+)$/i.exec(name) || [])[1] || "").toLowerCase();
    if (/^(mp4|mov|webm)$/.test(ext)) return "video";
    if (/^(svg|ai|eps)$/.test(ext) || /logo/i.test(name)) return "logo";
    if (/^(png|jpe?g|webp|gif)$/.test(ext)) return "image";
    return "file";
  }
  function fileMsg(text, bad) { var out = $('[data-saved="file"]'); out.textContent = text; out.classList.toggle("is-error", !!bad); }
  fileForm.file.addEventListener("change", function () {
    var file = fileForm.file.files[0], problem = file ? fileProblem(file) : "";
    fileMsg(problem, !!problem);
    $("[data-upload-button]").disabled = !!problem;
    if (file && !problem) {
      fileForm.kind.value = guessKind(file.name);
      if (!fileForm.title.value.trim()) fileForm.title.value = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
    }
  });
  function progress(pct) {
    var bar = $("[data-upload-bar]");
    bar.firstElementChild.style.width = pct + "%"; bar.setAttribute("aria-valuenow", pct);
    $("[data-upload-pct]").textContent = pct < 100 ? pct + "%" : "Saving…";
  }
  fileForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var file = fileForm.file.files[0], problem = fileProblem(file);
    if (!problem && !fileForm.title.value.trim()) problem = "Give the file a name the client will see.";
    if (problem) { fileMsg(problem, true); return; }
    var btn = $("[data-upload-button]"), box = $("[data-upload-progress]");
    btn.disabled = true; btn.textContent = "Uploading…"; box.hidden = false; progress(0); fileMsg("");
    D.addFile(current.id, file, { title: fileForm.title.value.trim(), kind: fileForm.kind.value }, progress)
      .then(function () { fileForm.reset(); return refresh(); })
      .then(function () { fileMsg("Uploaded. The client can download it now."); })
      .catch(function (err) { fileMsg("Didn’t upload: " + err.message, true); })
      .then(function () { btn.disabled = false; btn.textContent = "Upload"; box.hidden = true; });
  });

  /* Sample only: open the client portal as this client. */
  $("[data-view-as]").addEventListener("click", function () {
    try { sessionStorage.setItem("cs-portal-sample-session", JSON.stringify({ email: current.email })); } catch (e) {}
  });

  gate.resume();
})();
