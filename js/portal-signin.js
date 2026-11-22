/* ==========================================================================
   portal-signin.js: the sign-in both portal pages share.
   Email, then the 6-digit code emailed to that address. No passwords.
   PortalSignIn({ onIn, admin }) wires up the cards in the page and returns:
     show(view)   hide sign-in, show the signed-in view
     refuse(msg)  sign straight back out and say why on the email card
     resume()     if a session is still open, go straight in
   ========================================================================== */
(function () {
  "use strict";
  window.PortalSignIn = function (opts) {
    var D = window.PortalData;
    var $ = function (s, r) { return (r || document).querySelector(s); };
    var signin = $("[data-signin]");
    var emailCard = $('[data-card="email"]'), codeCard = $('[data-card="code"]');
    var emailInput = $("#portal-email"), codeInput = $("#portal-code");
    var outBtn = $("[data-sign-out]"), back = $("[data-back-site]");
    var pending = "", view = null;

    var note = $("[data-preview-note]");
    if (D.mode === "sample" && note) note.hidden = false;

    function status(el, msg, isError) { el.textContent = msg || ""; el.classList.toggle("is-error", !!isError); }
    function busy(form, on) { var b = $("button[type=submit]", form); b.disabled = on; b.setAttribute("aria-busy", String(on)); }
    function showCard(which, focus) {
      emailCard.hidden = which !== "email"; codeCard.hidden = which !== "code";
      if (focus !== false) (which === "email" ? emailInput : codeInput).focus();
    }

    $("[data-email-form]").addEventListener("submit", function (e) {
      e.preventDefault();
      var form = e.currentTarget, out = $("[data-email-status]"), email = emailInput.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { status(out, "Enter the email you gave me for your project.", true); emailInput.focus(); return; }
      status(out, ""); busy(form, true);
      D.sendCode(email).then(function () {
        pending = email;
        $("[data-sent-to]").textContent = email;
        codeInput.value = ""; status($("[data-code-status]"), "");
        showCard("code");
      }).catch(function () {
        status(out, "I couldn’t send a code just now. Wait a minute and try again.", true);
      }).then(function () { busy(form, false); });
    });

    codeInput.addEventListener("input", function () {
      codeInput.value = codeInput.value.replace(/\D/g, "").slice(0, 6);
      if (codeInput.value.length === 6) $("[data-code-form]").requestSubmit();
    });
    $("[data-code-form]").addEventListener("submit", function (e) {
      e.preventDefault();
      var form = e.currentTarget, out = $("[data-code-status]");
      if (codeInput.value.length !== 6) { status(out, "The code is 6 digits.", true); codeInput.focus(); return; }
      if (form.getAttribute("aria-busy") === "true") return;
      form.setAttribute("aria-busy", "true");
      status(out, ""); busy(form, true);
      D.verifyCode(pending, codeInput.value).then(function () { return opts.onIn(); })
        .catch(function (err) { status(out, err.message, true); codeInput.select(); })
        .then(function () { busy(form, false); form.setAttribute("aria-busy", "false"); });
    });
    $("[data-resend]").addEventListener("click", function () {
      var out = $("[data-code-status]");
      D.sendCode(pending).then(function () { status(out, "New code sent. Use the newest one.", false); })
        .catch(function () { status(out, "Wait a minute before asking for another code.", true); });
    });
    $("[data-change-email]").addEventListener("click", function () { showCard("email"); });

    outBtn.addEventListener("click", function () {
      D.signOut().then(function () {
        if (view) view.hidden = true;
        signin.hidden = false; outBtn.hidden = true; if (back) back.hidden = false;
        emailInput.value = ""; showCard("email", false);
        window.scrollTo(0, 0);
      });
    });

    return {
      show: function (v) {
        view = v;
        signin.hidden = true; v.hidden = false; outBtn.hidden = false; if (back) back.hidden = true;
        window.scrollTo(0, 0);
      },
      refuse: function (msg) {
        D.signOut();
        showCard("email");
        status($("[data-email-status]"), msg, true);
      },
      resume: function () {
        return D.user().then(function (u) { if (!u) return false; return Promise.resolve(opts.onIn()).then(function () { return true; }); })
          .catch(function () { return false; });
      }
    };
  };
})();
