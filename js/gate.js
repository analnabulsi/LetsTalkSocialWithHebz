/* DRAFT CURTAIN — hides the site behind a login while it's unfinished.
   ⚠️ This is a privacy curtain, NOT real security: GitHub Pages is static and
   the repository files can still be read directly. Don't put secrets on the site.
   ON/OFF SWITCH: "draftMode" in data/config.json (true = login, false = open).

   Change the login: run in Terminal (Mac):
     printf 'lts-draft-v1|USERNAME|PASSWORD' | shasum -a 256
   and paste the result into HASH below (username in lowercase). */
(function () {
  'use strict';
  var SALT = 'lts-draft-v1';
  var HASH = 'b0a1d9229afa9bcb650fcf76fbbcce56d3ef37118f2d39e203e4b79c449150b2';
  var KEY = 'lts-draft-ok';

  var root = document.documentElement;
  function ok() { try { return sessionStorage.getItem(KEY) === HASH || localStorage.getItem(KEY) === HASH; } catch (e) { return false; } }
  if (ok()) return;
  root.classList.add('lts-locked');

  function sha256(text) {
    if (!(window.crypto && crypto.subtle)) return Promise.reject(new Error('insecure'));
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    });
  }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { if (k === 'text') n.textContent = attrs[k]; else if (k === 'class') n.className = attrs[k]; else n.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (c) { n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }

  // Read the switch. Content stays hidden until we know; if the file can't be read, the login shows (safe default).
  var settled = fetch('data/config.json', { cache: 'no-cache', credentials: 'omit' })
    .then(function (r) { return r.ok ? r.json() : {}; })
    .then(function (c) { return c && c.draftMode === false ? 'open' : 'draft'; })
    .catch(function () { return 'draft'; });

  function whenReady(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  settled.then(function (state) {
    if (state === 'open') {
      root.classList.remove('lts-locked');
      var m = document.querySelector('meta[name="robots"]'); if (m) m.remove();
      return;
    }
    whenReady(showGate);
  });

  function showGate() {
    var user = el('input', { id: 'gate-user', name: 'username', type: 'text', autocomplete: 'username', autocapitalize: 'none', spellcheck: 'false', required: 'required' });
    var pass = el('input', { id: 'gate-pass', name: 'password', type: 'password', autocomplete: 'current-password', required: 'required' });
    var remember = el('input', { id: 'gate-remember', type: 'checkbox' });
    var err = el('p', { class: 'gate-error', role: 'alert' });
    var btn = el('button', { type: 'submit', class: 'btn btn-brand', text: 'View draft' });
    var form = el('form', { class: 'gate-card', novalidate: 'novalidate' }, [
      el('p', { class: 'gate-brand' }, [el('span', { class: 'brand-serif', text: "Let's Talk Social" }), ' ', el('span', { class: 'brand-script', text: 'with Hebz' })]),
      el('h1', { class: 'gate-title', text: 'Draft preview' }),
      el('p', { class: 'gate-sub', text: 'This website is not published yet. Please sign in to review it.' }),
      el('label', { for: 'gate-user', text: 'Username' }), user,
      el('label', { for: 'gate-pass', text: 'Password' }), pass,
      el('label', { class: 'gate-check', for: 'gate-remember' }, [remember, ' Remember me on this device']),
      err, btn
    ]);
    var gate = el('div', { class: 'gate', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'gate-title' }, [form]);
    form.querySelector('.gate-title').id = 'gate-title';
    document.body.appendChild(gate);
    user.focus();

    var tries = 0;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      err.textContent = '';
      var u = user.value.trim().toLowerCase(), p = pass.value;
      if (!u || !p) { err.textContent = 'Enter your username and password.'; return; }
      btn.disabled = true;
      sha256(SALT + '|' + u + '|' + p).then(function (h) {
        if (h === HASH) {
          try { (remember.checked ? localStorage : sessionStorage).setItem(KEY, HASH); } catch (x) {}
          root.classList.remove('lts-locked');
          gate.remove();
          return;
        }
        tries += 1;
        pass.value = '';
        err.textContent = 'That username or password is not right.';
        // slow down repeated guessing
        setTimeout(function () { btn.disabled = false; pass.focus(); }, Math.min(8000, 600 * tries * tries));
      }).catch(function () {
        btn.disabled = false;
        err.textContent = 'Please open the site over https to sign in.';
      });
    });
  }
})();
