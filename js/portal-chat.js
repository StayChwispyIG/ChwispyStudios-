/* ==========================================================================
   portal-chat.js: the message timeline both portal pages share.
   PortalChat({ root, me, otherName, onSend }) draws a thread inside root:
     [data-chat-log]     the timeline, oldest at the top, newest at the bottom
     [data-chat-form]    a textarea named "body" and a Send button
     [data-chat-status]  a line for errors
   me is "client" or "studio": your own messages sit on the right.
   Everything anyone typed is escaped; no links or HTML are made from it.
   ========================================================================== */
(function () {
  "use strict";
  var F = window.PortalFormat;

  window.PortalChat = function (opts) {
    var root = opts.root, log = root.querySelector("[data-chat-log]");
    var form = root.querySelector("[data-chat-form]"), box = form.body, btn = form.querySelector("button[type=submit]");
    var status = root.querySelector("[data-chat-status]"), count = root.querySelector("[data-chat-count]");
    var list = [], MAX = 2000;

    function say(msg) { status.textContent = msg || ""; status.classList.toggle("is-error", !!msg); }
    function nearBottom() { return log.scrollHeight - log.scrollTop - log.clientHeight < 80; }
    function toBottom() { log.scrollTop = log.scrollHeight; }

    function draw(stick) {
      var keep = stick || nearBottom(), html = [], lastDay = "", prev = null;
      var mineLast = -1;
      list.forEach(function (m, i) { if (m.sender === opts.me) mineLast = i; });
      list.forEach(function (m, i) {
        var day = F.day(m.created_at);
        if (day !== lastDay) { html.push('<li class="chat-day"><span>' + F.esc(day) + "</span></li>"); lastDay = day; prev = null; }
        var mine = m.sender === opts.me;
        /* Messages from the same side within 5 minutes read as one group. */
        var grouped = prev && prev.sender === m.sender && (new Date(m.created_at) - new Date(prev.created_at)) < 5 * 60000;
        var who = mine ? "You" : opts.otherName();
        var seen = mine && i === mineLast && m.read_at ? " · Seen" : "";
        html.push('<li class="msg ' + (mine ? "msg--me" : "msg--them") + (grouped ? " is-grouped" : "") + '">' +
          (grouped ? "" : '<p class="msg-who">' + F.esc(who) + "</p>") +
          '<p class="msg-body">' + F.esc(m.body) + "</p>" +
          '<p class="msg-time"><time datetime="' + F.esc(m.created_at) + '">' + F.time(m.created_at) + "</time>" + seen + "</p></li>");
        prev = m;
      });
      log.innerHTML = list.length ? html.join("") : '<li class="chat-empty">' + F.esc(opts.empty) + "</li>";
      if (keep) toBottom();
    }

    function merge(rows) {
      var byId = {};
      list.concat(rows || []).forEach(function (m) { byId[m.id] = Object.assign(byId[m.id] || {}, m); });
      list = Object.keys(byId).map(function (k) { return byId[k]; })
        .sort(function (a, z) { return a.created_at < z.created_at ? -1 : a.created_at > z.created_at ? 1 : 0; });
    }

    /* The box grows with what you type, up to about six lines. */
    function grow() { box.style.height = "auto"; box.style.height = Math.min(box.scrollHeight + 2, 168) + "px"; }
    function counter() {
      var left = MAX - box.value.length;
      count.textContent = left < 200 ? left + " characters left" : "";
      btn.disabled = !box.value.trim() || left < 0;
    }
    box.setAttribute("maxlength", String(MAX));
    box.addEventListener("input", function () { grow(); counter(); say(""); });
    /* On a keyboard, Enter sends and Shift+Enter makes a new line. On a phone, Enter is a new line. */
    var hasKeys = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;
    box.addEventListener("keydown", function (e) {
      if (hasKeys && e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); }
    });
    var hint = root.querySelector("[data-chat-hint]");
    if (hint) hint.hidden = !hasKeys;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var body = box.value.trim();
      if (!body || body.length > MAX) return;
      btn.disabled = true; btn.textContent = "Sending…";
      opts.onSend(body).then(function (row) {
        box.value = ""; grow(); merge([row]); draw(true); say("");
      }).catch(function (err) {
        say("Didn’t send: " + (err && err.message ? err.message : "check your connection and try again."));
      }).then(function () { btn.textContent = "Send"; counter(); box.focus({ preventScroll: true }); });
    });
    counter();

    return {
      set: function (rows) { list = []; merge(rows); draw(true); },
      add: function (rows) { var before = list.length; merge(rows); draw(false); return list.length - before; },
      items: function () { return list; },
      focus: function () { box.focus({ preventScroll: true }); },
      bottom: toBottom
    };
  };
})();
