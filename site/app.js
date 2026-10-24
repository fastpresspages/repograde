// RepoGrade site: progressive enhancement only. No analytics, no cookies, no localStorage.
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  // Mobile nav
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('navmenu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      if (open) menu.removeAttribute('data-open'); else menu.setAttribute('data-open', '');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.hasAttribute('data-open')) {
        menu.removeAttribute('data-open'); toggle.setAttribute('aria-expanded', 'false'); toggle.focus();
      }
    });
  }

  // Copy buttons
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var sel = btn.getAttribute('data-copy');
      var src = document.querySelector(sel);
      if (!src) return;
      var text = src.textContent.trim();
      function done() { var old = btn.textContent; btn.textContent = 'Copied ✓'; setTimeout(function () { btn.textContent = old; }, 1600); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallback(); });
      } else fallback();
      function fallback() {
        var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta);
        ta.select(); try { document.execCommand('copy'); done(); } catch (e) {} ta.remove();
      }
    });
  });

  // FAQ + about details double as anchors
  document.querySelectorAll('details').forEach(function (d) {
    d.addEventListener('toggle', function () { if (d.open && location.hash && d.contains(document.querySelector(location.hash))) d.scrollIntoView(); });
  });
})();

// Repo review form: FormSubmit AJAX with honest error states. Never auto-submits.
(function () {
  var form = document.getElementById('repo-review');
  if (!form) return;
  var note = form.querySelector('.form-note');
  var btn = form.querySelector('button[type=submit]');
  var endpoint = form.getAttribute('data-ajax') || form.action;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    note.textContent = '';
    if (form._honey.value) return; // honeypot: silently drop bots
    var email = form.email.value.trim();
    var message = form.message.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { note.textContent = 'That email does not look valid.'; note.style.color = '#FF5C5C'; form.email.focus(); return; }
    if (message.length < 10) { note.textContent = 'Tell us a little more (10+ chars) so the review is useful.'; note.style.color = '#FF5C5C'; form.message.focus(); return; }
    var payload = {
      email: email, message: message, request_type: form.request_type.value, page: form.page.value,
      _subject: form._subject.value, _template: form._template.value
    };
    btn.disabled = true; var old = btn.textContent; btn.textContent = 'Sending…';
    var timer = setTimeout(function () { done(false, 'Request timed out. Email meetcode99@gmail.com instead.'); }, 20000);
    fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); })
      .then(function (j) { clearTimeout(timer); done(j.success !== 'false', null); })
      .catch(function () { clearTimeout(timer); done(false, null); });
    function done(ok, custom) {
      clearTimeout(timer);
      btn.disabled = false; btn.textContent = old;
      if (ok && custom == null) { note.style.color = ''; note.textContent = 'Received — you will get a reply with the three fixes that matter. No drip campaign.'; form.reset(); }
      else if (ok) { note.style.color = ''; note.textContent = 'Received, with a hiccup on our side. If no reply comes, email meetcode99@gmail.com.'; form.reset(); }
      else { note.style.color = '#FF5C5C'; note.textContent = custom || 'Could not send right now. Email meetcode99@gmail.com and we will take it from there.'; }
    }
  });
})();
