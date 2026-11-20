/* ==========================================================================
   posthog.js: PostHog analytics for every page.
   Project key and host for Chwispy Studio's PostHog project (US cloud).
   The phc_ key is PostHog's public browser key, safe to ship in page code.
   Privacy: the quote form's name, phone and note never go to PostHog.
   Anything inside an element with the class "ph-no-capture" is skipped
   by autocapture and hidden in session recordings.
   Consent: nothing loads until the visitor taps Accept on the cookie banner
   (js/consent.js). The choice is saved as "cs-consent" ("yes" or "no").
   ========================================================================== */
(function () {
  var POSTHOG_KEY = "phc_rsPdrxbUHxgu9kuEdLy7GVUBbUrkaprxGGG7SDNFKEGi";
  var POSTHOG_HOST = "https://us.i.posthog.com"; // EU cloud: https://eu.i.posthog.com

  if (!/^phc_/.test(POSTHOG_KEY)) return;

  var started = false;
  function consent() {
    try { return localStorage.getItem("cs-consent"); } catch (e) { return null; }
  }
  function start() {
    if (started) return;
    started = true;

  !function(t,e){var o,n,p,r;e.__SV||(window.posthog&&window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "identified_only",
    session_recording: { maskAllInputs: true }
  });
  }

  // Declined after accepting: stop PostHog and clear what it stored on this device.
  function stop() {
    if (window.posthog && window.posthog.__loaded) {
      try { window.posthog.opt_out_capturing(); window.posthog.reset(); } catch (e) {}
    }
    try {
      Object.keys(localStorage).forEach(function (k) { if (/^ph_|^__ph/.test(k)) localStorage.removeItem(k); });
      Object.keys(sessionStorage).forEach(function (k) { if (/^ph_|^__ph/.test(k)) sessionStorage.removeItem(k); });
    } catch (e) {}
    document.cookie.split(";").forEach(function (c) {
      var name = c.split("=")[0].trim();
      if (/^ph_/.test(name)) {
        document.cookie = name + "=; Max-Age=0; path=/";
        document.cookie = name + "=; Max-Age=0; path=/; domain=." + location.hostname.replace(/^www\./, "");
      }
    });
  }

  if (consent() === "yes") start();
  document.addEventListener("cs:consent", function (e) {
    if (e.detail === "yes") start(); else stop();
  });
})();
