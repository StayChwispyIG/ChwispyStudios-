/* ==========================================================================
   portal-data.js: every read and write the portal makes, in one place.
   portal.js (clients) and portal-admin.js (the studio desk) only call
   window.PortalData; they never talk to the database themselves.

   Two back ends with the same calls:
   - sample: made-up clients kept in this browser (localStorage), so the
     preview works with nothing set up. Code 123456 signs anyone in.
   - live: Supabase. Sign-in is a 6-digit code emailed to the client.
     What each person can read or change is enforced by the database
     (supabase/schema.sql), not by this file: a client's browser can only
     ever receive their own rows and files, whatever this code does.

   Money is stored in cents. Dates are YYYY-MM-DD.
   ========================================================================== */
(function () {
  "use strict";
  var C = window.PORTAL_CONFIG || { mode: "sample" };

  /* ---------------------------------------------------------------- sample */
  var KEY = "cs-portal-sample";
  var SESSION = "cs-portal-sample-session";
  var ADMIN_EMAIL = "studio@example.com"; // sample only: this address opens the desk

  function seed() {
    return {
      clients: [
        { id: "c1", name: "Jordan Reyes", company: "Ridgeline Coffee Co.", email: "jordan@example.com",
          project: "Website build", kind: "web", stage: 2,
          stage_dates: { "0": "2026-11-03", "1": "2026-11-10", "2": "2026-11-18" },
          note: "The homepage and menu page are built. I’m wiring up the order button now.\nYou’ll get a preview link to review on Wednesday.",
          note_at: "2026-11-21" },
        { id: "c2", name: "Maya Ortiz", company: "Ortiz Family Bakery", email: "maya@example.com",
          project: "Shopify store", kind: "shopify", stage: 1,
          stage_dates: { "0": "2026-11-12", "1": "2026-11-19" },
          note: "Store theme is set up. Send me photos of your top 10 products when you can.",
          note_at: "2026-11-19" },
        { id: "c3", name: "Dee Carter", company: "Carter Auto Detail", email: "dee@example.com",
          project: "30-second commercial", kind: "video", stage: 3,
          stage_dates: { "0": "2026-10-28", "1": "2026-11-08", "2": "2026-11-12", "3": "2026-11-20" },
          note: "First cut is ready. Watch it and send any changes by Friday.",
          note_at: "2026-11-20" }
      ],
      invoices: [
        { id: "i1", client_id: "c1", number: "CS-1041", title: "Deposit, 50%", amount: 90000, issued_on: "2026-11-03", due_on: "2026-11-03", status: "paid", paid_on: "2026-11-03", file_path: "sample/invoice.pdf", pay_url: "" },
        { id: "i2", client_id: "c1", number: "CS-1048", title: "Extra page: catering menu", amount: 15000, issued_on: "2026-11-20", due_on: "2026-11-28", status: "due", paid_on: "", file_path: "sample/invoice.pdf", pay_url: "#pay" },
        { id: "i3", client_id: "c1", number: "CS-1052", title: "Final payment, 50%", amount: 90000, issued_on: "", due_on: "2026-12-12", status: "upcoming", paid_on: "", file_path: "", pay_url: "" },
        { id: "i4", client_id: "c2", number: "CS-1049", title: "Deposit, 50%", amount: 110000, issued_on: "2026-11-12", due_on: "2026-11-12", status: "paid", paid_on: "2026-11-12", file_path: "sample/invoice.pdf", pay_url: "" },
        { id: "i5", client_id: "c3", number: "CS-1037", title: "Deposit, 50%", amount: 60000, issued_on: "2026-10-28", due_on: "2026-10-28", status: "paid", paid_on: "2026-10-29", file_path: "sample/invoice.pdf", pay_url: "" },
        { id: "i6", client_id: "c3", number: "CS-1050", title: "Final payment, 50%", amount: 60000, issued_on: "2026-11-20", due_on: "2026-11-20", status: "due", paid_on: "", file_path: "sample/invoice.pdf", pay_url: "#pay" }
      ],
      contracts: [
        { id: "k1", client_id: "c1", title: "Website agreement", status: "signed", sent_on: "2026-11-01", signed_on: "2026-11-03", file_path: "sample/contract.pdf", sign_url: "" },
        { id: "k2", client_id: "c1", title: "Change order: catering menu page", status: "sign", sent_on: "2026-11-20", signed_on: "", file_path: "sample/contract.pdf", sign_url: "#sign" },
        { id: "k3", client_id: "c2", title: "Shopify store agreement", status: "signed", sent_on: "2026-11-10", signed_on: "2026-11-12", file_path: "sample/contract.pdf", sign_url: "" },
        { id: "k4", client_id: "c3", title: "Video production agreement", status: "signed", sent_on: "2026-10-25", signed_on: "2026-10-28", file_path: "sample/contract.pdf", sign_url: "" }
      ],
      deliverables: [
        { id: "f1", client_id: "c1", title: "Logo, full colour", kind: "logo", file_path: "sample/logo.svg", file_name: "ridgeline-logo.svg", size_bytes: 18432, mime_type: "image/svg+xml", created_at: "2026-11-14T18:00:00Z" },
        { id: "f2", client_id: "c1", title: "Homepage hero photo", kind: "image", file_path: "sample/hero.jpg", file_name: "ridgeline-hero.jpg", size_bytes: 2411724, mime_type: "image/jpeg", created_at: "2026-11-18T18:00:00Z" },
        { id: "f3", client_id: "c1", title: "Menu launch reel", kind: "video", file_path: "sample/reel.mp4", file_name: "ridgeline-menu-reel.mp4", size_bytes: 38273024, mime_type: "video/mp4", created_at: "2026-11-21T18:00:00Z" },
        { id: "f4", client_id: "c3", title: "Commercial, first cut", kind: "video", file_path: "sample/reel.mp4", file_name: "carter-first-cut.mp4", size_bytes: 41943040, mime_type: "video/mp4", created_at: "2026-11-20T18:00:00Z" }
      ],
      messages: [
        { id: "m1", client_id: "c1", sender: "client", body: "Quick one: can the catering menu page have its own order button, or does it share the main one?", created_at: "2026-11-20T18:12:00Z", read_at: "2026-11-20T18:40:00Z" },
        { id: "m2", client_id: "c1", sender: "studio", body: "It can have its own. I’ll point it at your catering form so those orders don’t mix with daily pickup.", created_at: "2026-11-20T19:03:00Z", read_at: "2026-11-20T19:30:00Z" },
        { id: "m3", client_id: "c1", sender: "client", body: "Perfect. I’ll send the catering photos tonight.", created_at: "2026-11-20T19:31:00Z", read_at: "2026-11-21T16:00:00Z" },
        { id: "m4", client_id: "c1", sender: "studio", body: "Got the photos, thanks. The edited hero shot is in your Files tab.\nPreview link for the whole site comes Wednesday.", created_at: "2026-11-22T00:22:00Z", read_at: null },
        { id: "m5", client_id: "c3", sender: "client", body: "Watched the first cut. Love it! Can the logo hold a second longer at the end?", created_at: "2026-11-21T22:05:00Z", read_at: null }
      ]
    };
  }
  function db() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (!d || !d.clients) { d = seed(); store(d); }
    if (!d.deliverables) { d.deliverables = seed().deliverables; store(d); }
    if (!d.messages) { d.messages = seed().messages; store(d); }
    return d;
  }
  function store(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  function uid(p) { return p + Math.random().toString(36).slice(2, 9); }
  function later(v) { return new Promise(function (r) { setTimeout(function () { r(v); }, 250); }); }
  function fail(msg) { return Promise.reject(new Error(msg)); }
  function sampleUser() { try { return JSON.parse(sessionStorage.getItem(SESSION)); } catch (e) { return null; } }

  var sample = {
    mode: "sample",
    sendCode: function (email) { return later({ ok: true, email: email }); },
    verifyCode: function (email, code) {
      if (String(code) !== "123456") return fail("That code didn’t work. Check it, or send a new one.");
      var u = { email: String(email).toLowerCase() };
      try { sessionStorage.setItem(SESSION, JSON.stringify(u)); } catch (e) {}
      return later(u);
    },
    user: function () { return Promise.resolve(sampleUser()); },
    signOut: function () { try { sessionStorage.removeItem(SESSION); } catch (e) {} return Promise.resolve(); },

    /* The preview has no real inboxes, so any address you type opens the first sample client. */
    myProject: function () {
      var d = db(), u = sampleUser();
      var c = d.clients.filter(function (x) { return u && x.email === u.email; })[0] || d.clients[0];
      return later(bundle(d, c));
    },
    fileUrl: function (path) { return Promise.resolve(path ? "assets/portal-sample/" + path.split("/").pop() : ""); },

    isAdmin: function () { return Promise.resolve(true); },
    listClients: function () { return later(db().clients.slice()); },
    clientBundle: function (id) { var d = db(); return later(bundle(d, d.clients.filter(function (c) { return c.id === id; })[0])); },
    saveClient: function (c) {
      var d = db(), i = d.clients.findIndex(function (x) { return x.id === c.id; });
      if (!c.id) { c.id = uid("c"); d.clients.push(c); } else d.clients[i] = c;
      store(d); return later(c);
    },
    addDoc: function (table, row) { var d = db(); row.id = uid(table[0]); d[table].push(row); store(d); return later(row); },
    updateDoc: function (table, id, patch) {
      var d = db(), row = d[table].filter(function (x) { return x.id === id; })[0];
      Object.assign(row, patch); store(d); return later(row);
    },
    removeDoc: function (table, id) { var d = db(); d[table] = d[table].filter(function (x) { return x.id !== id; }); store(d); return later(true); },
    upload: function (clientId, file) { return later(file ? "sample/" + (/contract/i.test(file.name) ? "contract.pdf" : "invoice.pdf") : ""); },
    /* Files tab. The preview pretends to upload (with progress) and keeps
       only the details; downloads open the sample files that ship with it. */
    addFile: function (clientId, file, meta, onProgress) {
      return new Promise(function (resolve) {
        var pct = 0, t = setInterval(function () {
          pct = Math.min(100, pct + 20); if (onProgress) onProgress(pct);
          if (pct === 100) {
            clearInterval(t);
            var ext = extOf(file.name), d = db();
            var row = { id: uid("f"), client_id: clientId, title: meta.title, kind: meta.kind,
              file_path: "sample/" + (meta.kind === "video" ? "reel.mp4" : ext === "svg" ? "logo.svg" : /^(png|jpe?g|webp|gif)$/.test(ext) ? "hero.jpg" : "invoice.pdf"),
              file_name: file.name, size_bytes: file.size, mime_type: typeOf(file.name), created_at: new Date().toISOString() };
            d.deliverables.push(row); store(d); resolve(row);
          }
        }, 120);
      });
    },
    removeFile: function (row) { var d = db(); d.deliverables = d.deliverables.filter(function (x) { return x.id !== row.id; }); store(d); return later(true); },
    downloadUrl: function (row) { return Promise.resolve("assets/portal-sample/" + row.file_path.split("/").pop()); },

    /* Messages. The preview keeps them in this browser; a change made on
       the desk shows up in an open client tab (and back) within a moment. */
    thread: function (clientId) { return later(threadOf(db(), clientId)); },
    send: function (clientId, sender, body) {
      var d = db(), row = { id: uid("m"), client_id: clientId, sender: sender, body: String(body).trim().slice(0, 2000), created_at: new Date().toISOString(), read_at: null };
      d.messages.push(row); store(d); return later(row);
    },
    markRead: function (clientId, reader) {
      var d = db(), other = reader === "studio" ? "client" : "studio", now = new Date().toISOString(), n = 0;
      d.messages.forEach(function (m) { if (m.client_id === clientId && m.sender === other && !m.read_at) { m.read_at = now; n++; } });
      if (n) store(d); return Promise.resolve();
    },
    unreadByClient: function () {
      var out = {}; db().messages.forEach(function (m) { if (m.sender === "client" && !m.read_at) out[m.client_id] = (out[m.client_id] || 0) + 1; });
      return Promise.resolve(out);
    },
    watch: function (clientId, onChange) {
      function fn(e) { if (e.key === KEY) onChange(); }
      window.addEventListener("storage", fn);
      return function () { window.removeEventListener("storage", fn); };
    },
    resetSample: function () { store(seed()); }
  };
  function newest(a, z) { return a.created_at < z.created_at ? 1 : -1; }
  function extOf(name) { var m = /\.([a-z0-9]+)$/i.exec(name || ""); return m ? m[1].toLowerCase() : ""; }
  function typeOf(name) { return (C.fileTypes || {})[extOf(name)] || ""; }
  function threadOf(d, id) {
    return d.messages.filter(function (m) { return m.client_id === id; }).sort(function (a, z) { return a.created_at < z.created_at ? -1 : 1; });
  }
  function bundle(d, c) {
    if (!c) return null;
    return {
      client: c,
      invoices: d.invoices.filter(function (x) { return x.client_id === c.id; }),
      contracts: d.contracts.filter(function (x) { return x.client_id === c.id; }),
      files: d.deliverables.filter(function (x) { return x.client_id === c.id; }).sort(newest),
      messages: threadOf(d, c.id)
    };
  }

  /* ------------------------------------------------------------------ live */
  var client = null;
  function sb() {
    if (client) return Promise.resolve(client);
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js";
      s.crossOrigin = "anonymous";
      s.onload = function () {
        client = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey, {
          auth: { persistSession: true, autoRefreshToken: true, storageKey: "cs-portal-auth" }
        });
        resolve(client);
      };
      s.onerror = function () { reject(new Error("The portal couldn’t load. Check your connection and try again.")); };
      document.head.appendChild(s);
    });
  }
  function rows(q) { return q.then(function (r) { if (r.error) throw r.error; return r.data; }); }

  var live = {
    mode: "live",
    sendCode: function (email) {
      return sb().then(function (s) {
        return s.auth.signInWithOtp({ email: email, options: { shouldCreateUser: true } });
      }).then(function (r) { if (r.error) throw r.error; return { ok: true, email: email }; });
    },
    verifyCode: function (email, code) {
      return sb().then(function (s) { return s.auth.verifyOtp({ email: email, token: String(code), type: "email" }); })
        .then(function (r) { if (r.error) throw new Error("That code didn’t work. Check it, or send a new one."); return r.data.user; });
    },
    user: function () { return sb().then(function (s) { return s.auth.getUser(); }).then(function (r) { return r.data ? r.data.user : null; }); },
    signOut: function () { return sb().then(function (s) { return s.auth.signOut(); }); },

    /* The database hands back only the signed-in client's own rows. */
    myProject: function () {
      return sb().then(function (s) {
        return Promise.all([
          rows(s.from("clients").select("*").limit(1)),
          rows(s.from("invoices").select("*").order("due_on", { ascending: true })),
          rows(s.from("contracts").select("*").order("sent_on", { ascending: false })),
          rows(s.from("deliverables").select("*").order("created_at", { ascending: false })),
          rows(s.from("messages").select("*").order("created_at", { ascending: true }).limit(500))
        ]);
      }).then(function (r) { return r[0][0] ? { client: r[0][0], invoices: r[1], contracts: r[2], files: r[3], messages: r[4] } : null; });
    },
    /* Files sit in a private bucket. Each open makes a link that dies in 60 seconds. */
    fileUrl: function (path) {
      if (!path) return Promise.resolve("");
      return sb().then(function (s) { return s.storage.from(C.bucket).createSignedUrl(path, 60); })
        .then(function (r) { if (r.error) throw r.error; return r.data.signedUrl; });
    },

    isAdmin: function () { return sb().then(function (s) { return s.rpc("is_admin"); }).then(function (r) { return !!r.data; }); },
    listClients: function () { return sb().then(function (s) { return rows(s.from("clients").select("*").order("updated_at", { ascending: false })); }); },
    clientBundle: function (id) {
      return sb().then(function (s) {
        return Promise.all([
          rows(s.from("clients").select("*").eq("id", id).limit(1)),
          rows(s.from("invoices").select("*").eq("client_id", id).order("due_on", { ascending: true })),
          rows(s.from("contracts").select("*").eq("client_id", id).order("sent_on", { ascending: false })),
          rows(s.from("deliverables").select("*").eq("client_id", id).order("created_at", { ascending: false })),
          rows(s.from("messages").select("*").eq("client_id", id).order("created_at", { ascending: true }).limit(500))
        ]);
      }).then(function (r) { return { client: r[0][0], invoices: r[1], contracts: r[2], files: r[3], messages: r[4] }; });
    },
    saveClient: function (c) {
      return sb().then(function (s) {
        var row = Object.assign({}, c); delete row.created_at; row.updated_at = new Date().toISOString();
        if (row.email) row.email = row.email.trim().toLowerCase();
        return rows(c.id ? s.from("clients").update(row).eq("id", c.id).select() : s.from("clients").insert(row).select());
      }).then(function (r) { return r[0]; });
    },
    addDoc: function (table, row) { return sb().then(function (s) { return rows(s.from(table).insert(row).select()); }).then(function (r) { return r[0]; }); },
    updateDoc: function (table, id, patch) { return sb().then(function (s) { return rows(s.from(table).update(patch).eq("id", id).select()); }).then(function (r) { return r[0]; }); },
    removeDoc: function (table, id) { return sb().then(function (s) { return rows(s.from(table).delete().eq("id", id)); }); },
    /* Files go in a folder named after the client's id; the bucket rules key off that folder. */
    upload: function (clientId, file) {
      if (!file) return Promise.resolve("");
      var safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
      var path = clientId + "/" + Date.now() + "-" + safe;
      return sb().then(function (s) { return s.storage.from(C.bucket).upload(path, file, { contentType: "application/pdf", upsert: false }); })
        .then(function (r) { if (r.error) throw r.error; return path; });
    },

    /* Files tab. The upload goes straight to the private bucket with the
       studio's own sign-in, so the bucket rules (admins only) still apply;
       it uses XHR only so the desk can show a progress bar. */
    addFile: function (clientId, file, meta, onProgress) {
      var name = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
      var path = clientId + "/" + Date.now() + "-" + name, s;
      return sb().then(function (c) { s = c; return s.auth.getSession(); }).then(function (r) {
        var token = r.data && r.data.session && r.data.session.access_token;
        if (!token) throw new Error("You’re signed out. Sign in again and retry.");
        return new Promise(function (resolve, reject) {
          var x = new XMLHttpRequest();
          x.open("POST", C.supabaseUrl + "/storage/v1/object/" + C.filesBucket + "/" + path.split("/").map(encodeURIComponent).join("/"));
          x.setRequestHeader("Authorization", "Bearer " + token);
          x.setRequestHeader("apikey", C.supabaseAnonKey);
          x.setRequestHeader("x-upsert", "false");
          x.setRequestHeader("Content-Type", typeOf(file.name) || file.type || "application/octet-stream");
          x.upload.onprogress = function (e) { if (e.lengthComputable && onProgress) onProgress(Math.round(e.loaded / e.total * 100)); };
          x.onload = function () {
            if (x.status >= 200 && x.status < 300) return resolve();
            var msg = ""; try { msg = JSON.parse(x.responseText).message; } catch (e) {}
            reject(new Error(msg || "The upload didn’t go through (" + x.status + ")."));
          };
          x.onerror = function () { reject(new Error("The upload stopped. Check your connection and try again.")); };
          x.send(file);
        });
      }).then(function () {
        return rows(s.from("deliverables").insert({ client_id: clientId, title: meta.title, kind: meta.kind, file_path: path,
          file_name: file.name, size_bytes: file.size, mime_type: typeOf(file.name) || file.type || null }).select())
          .catch(function (err) { return s.storage.from(C.filesBucket).remove([path]).then(function () { throw err; }); });
      }).then(function (r) { return r[0]; });
    },
    removeFile: function (row) {
      return sb().then(function (s) {
        return s.storage.from(C.filesBucket).remove([row.file_path]).then(function (r) {
          if (r.error) throw r.error;
          return rows(s.from("deliverables").delete().eq("id", row.id));
        });
      });
    },
    /* A download link that works for 2 minutes and saves under the file's own name. */
    downloadUrl: function (row) {
      return sb().then(function (s) { return s.storage.from(C.filesBucket).createSignedUrl(row.file_path, 120, { download: row.file_name || true }); })
        .then(function (r) { if (r.error) throw r.error; return r.data.signedUrl; });
    },

    /* Messages. The database decides whose thread you get and which side
       you may post as (supabase/messages.sql); it also sets the time. */
    thread: function (clientId) {
      return sb().then(function (s) { return rows(s.from("messages").select("*").eq("client_id", clientId).order("created_at", { ascending: true }).limit(500)); });
    },
    send: function (clientId, sender, body) {
      return sb().then(function (s) { return rows(s.from("messages").insert({ client_id: clientId, sender: sender, body: String(body).trim().slice(0, 2000) }).select()); })
        .then(function (r) { return r[0]; });
    },
    markRead: function (clientId) {
      return sb().then(function (s) { return s.rpc("mark_thread_read", { p_client: clientId }); }).then(function () {}, function () {});
    },
    unreadByClient: function () {
      return sb().then(function (s) { return rows(s.from("messages").select("client_id").eq("sender", "client").is("read_at", null).limit(1000)); })
        .then(function (list) { var out = {}; list.forEach(function (m) { out[m.client_id] = (out[m.client_id] || 0) + 1; }); return out; });
    },
    /* New messages arrive live. Realtime still only sends rows this person may read. */
    watch: function (clientId, onChange) {
      var ch = null, stopped = false;
      sb().then(function (s) {
        if (stopped) return;
        var f = { event: "INSERT", schema: "public", table: "messages" };
        if (clientId) f.filter = "client_id=eq." + clientId;
        ch = s.channel("messages-" + (clientId || "all")).on("postgres_changes", f, function (p) { onChange(p.new); }).subscribe();
      }).catch(function () {});
      return function () { stopped = true; if (ch && client) client.removeChannel(ch); };
    }
  };

  var ready = C.mode === "live" && C.supabaseUrl && C.supabaseAnonKey;
  window.PortalData = ready ? live : sample;
  window.PortalData.sampleAdminEmail = ADMIN_EMAIL;

  /* Shared formatting for both pages. */
  window.PortalFormat = {
    money: function (cents) {
      return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: cents % 100 ? 2 : 0 });
    },
    date: function (iso, withYear) {
      if (!iso) return "";
      var p = iso.split("-"), d = new Date(+p[0], +p[1] - 1, +p[2]);
      return d.toLocaleDateString("en-US", withYear ? { month: "short", day: "numeric", year: "numeric" } : { month: "short", day: "numeric" });
    },
    today: function () {
      var d = new Date(), z = function (n) { return String(n).padStart(2, "0"); };
      return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate());
    },
    /* due + past its date reads as overdue; the stored status never has to change for that. */
    invoiceState: function (inv) {
      if (inv.status === "paid") return "paid";
      if (inv.status === "upcoming") return "upcoming";
      return inv.due_on && inv.due_on < this.today() ? "overdue" : "due";
    },
    esc: function (s) {
      return String(s == null ? "" : s).replace(/[&<>"']/g, function (ch) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
      });
    },
    size: function (b) {
      if (!b && b !== 0) return "";
      var u = ["B", "KB", "MB", "GB"], i = 0; while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; }
      return (i < 2 ? Math.round(b) : b.toFixed(b < 10 ? 1 : 0)) + " " + u[i];
    },
    ext: function (name) { var m = /\.([a-z0-9]+)$/i.exec(name || ""); return m ? m[1].toUpperCase() : "FILE"; },
    /* Inline icons by kind, drawn in the current text colour. */
    fileIcon: function (kind) {
      var paths = {
        logo: '<path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4"/><circle cx="12" cy="12" r="3.2"/>',
        video: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9.2v5.6l4.8-2.8z"/>',
        image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="9.5" r="1.6"/><path d="M4 18l5.5-5.5 4 4 2.5-2.5L21 19"/>',
        file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>'
      };
      return '<svg class="file-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + (paths[kind] || paths.file) + "</svg>";
    },
    /* Chat times: 2:14 PM, and a day label for the line between days. */
    time: function (iso) { return iso ? new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : ""; },
    day: function (iso) {
      if (!iso) return "";
      var d = new Date(iso), now = new Date(), y = new Date(now); y.setDate(now.getDate() - 1);
      var same = function (a, b) { return a.toDateString() === b.toDateString(); };
      if (same(d, now)) return "Today";
      if (same(d, y)) return "Yesterday";
      return d.toLocaleDateString("en-US", d.getFullYear() === now.getFullYear() ? { weekday: "short", month: "short", day: "numeric" } : { month: "short", day: "numeric", year: "numeric" });
    },
    safeUrl: function (u) { return /^(https:\/\/|#)/.test(u || "") ? u : ""; }
  };
})();
