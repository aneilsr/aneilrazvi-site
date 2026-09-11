/* PostHog for aneilrazvi.com
   Project 546540, US Cloud. The token below is the write-only project key and is
   safe in public HTML; PostHog's own settings page labels it that way.

   Loaded once per page as: <script defer src="assets/analytics.js"></script>

   Beyond autocapture, this records the handful of things that actually mean
   something on this site: someone finding the Workshop tab, someone starting or
   finishing the maturity assessment, someone leaving for a newsletter issue, and
   someone reaching for the calendar. Everything else is autocapture noise. */
(function () {
  var TOKEN = 'phc_rv6ht5nuMpj4Y6nCUbyunkYXuoLPosouSqVmDjt28YLd';
  var HOST = 'https://us.i.posthog.com';

  // Respect an explicit Do Not Track signal. Costs almost nothing and it is the
  // right default for a site whose whole pitch is that rules should be written down.
  var dnt = navigator.doNotTrack === '1' || window.doNotTrack === '1' ||
            navigator.msDoNotTrack === '1';
  if (dnt) return;

  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init me ws ys ps bs capture je Di ks fs ol fs Bs $s Us register register_once register_for_session unregister unregister_for_session Ps getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty Ss Ts createPersonProfile Es gs opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing ys debug xs getPageViewId captureTraceFeedback captureTraceMetric".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

  posthog.init(TOKEN, {
    api_host: HOST,
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true
  });

  function on(sel, ev, fn) {
    document.addEventListener(ev, function (e) {
      var t = e.target && e.target.closest ? e.target.closest(sel) : null;
      if (t) fn(t, e);
    }, true);
  }
  function cap(name, props) { try { posthog.capture(name, props || {}); } catch (err) {} }

  document.addEventListener('DOMContentLoaded', function () {

    /* The Workshop tab. The whole question is whether anyone finds it. */
    on('.wm-tab', 'click', function (t) {
      cap('work_with_me_tab', { tab: t.id === 'tab-workshop' ? 'workshop' : 'work' });
    });
    if (location.pathname.indexOf('work-with-me') > -1 && location.hash === '#workshop') {
      cap('work_with_me_tab', { tab: 'workshop', via: 'deep_link' });
    }

    /* Newsletter issues. Which cover pulls, and whether Sidenotes pull differently. */
    on('.art', 'click', function (t) {
      var h4 = t.querySelector('h4'), cat = t.querySelector('.cat');
      cap('newsletter_issue_click', {
        title: h4 ? h4.textContent.trim() : null,
        edition: cat ? cat.textContent.trim() : null,
        kind: t.classList.contains('side') ? 'sidenote' : 'issue'
      });
    });

    /* Anyone reaching for time. This is the only event that turns into money. */
    on('a[href*="cal.com"], a[href*="calendar.app.google"]', 'click', function (t) {
      cap('booking_link_click', { href: t.getAttribute('href'), page: location.pathname });
    });

    /* Email, the other way people start a conversation. */
    on('a[href^="mailto:"]', 'click', function () {
      cap('email_link_click', { page: location.pathname });
    });

    /* The assessment funnel. The server already records this via /api/progress;
       these give the client-side half so the drop-off is visible in one place. */
    if (location.pathname.indexOf('maturity') > -1) {
      cap('assessment_landed', {});
      var start = document.getElementById('start');
      if (start) start.addEventListener('click', function () { cap('assessment_started', {}); });
    }

    /* Anything leaving the site, so referral traffic out is legible too. */
    on('a[href^="http"]', 'click', function (t) {
      var h = t.getAttribute('href') || '';
      if (h.indexOf('aneilrazvi.com') > -1) return;
      if (t.classList.contains('art')) return; /* already captured above */
      cap('outbound_click', { href: h, page: location.pathname });
    });
  });
})();
