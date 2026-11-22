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
      ]
    };
  }
  function db() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (!d || !d.clients) { d = seed(); store(d); }
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
    resetSample: function () { store(seed()); }
  };
  function bundle(d, c) {
    if (!c) return null;
    return {
      client: c,
      invoices: d.invoices.filter(function (x) { return x.client_id === c.id; }),
      contracts: d.contracts.filter(function (x) { return x.client_id === c.id; })
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
          rows(s.from("contracts").select("*").order("sent_on", { ascending: false }))
        ]);
      }).then(function (r) { return r[0][0] ? { client: r[0][0], invoices: r[1], contracts: r[2] } : null; });
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
          rows(s.from("contracts").select("*").eq("client_id", id).order("sent_on", { ascending: false }))
        ]);
      }).then(function (r) { return { client: r[0][0], invoices: r[1], contracts: r[2] }; });
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
    safeUrl: function (u) { return /^(https:\/\/|#)/.test(u || "") ? u : ""; }
  };
})();
