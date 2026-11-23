/* Let's Talk Social with Hebz — main script (no dependencies)
   Content comes from /data/*.json. Everything is inserted with textContent,
   never innerHTML, so editing the JSON files cannot inject code. */
(function () {
  'use strict';

  var LTS = (window.LTS = window.LTS || {});

  /* ---------- helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (attrs[k] === null || attrs[k] === undefined || attrs[k] === false) return;
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'class') n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function store(key, val) {
    try { if (val === undefined) return window.localStorage.getItem(key); window.localStorage.setItem(key, val); } catch (e) { return null; }
    return null;
  }
  function loadJSON(path) {
    return fetch(path, { cache: 'no-cache', credentials: 'omit' }).then(function (r) {
      if (!r.ok) throw new Error(path + ' ' + r.status);
      return r.json();
    });
  }
  // Only https / mailto links from config are used.
  function safeUrl(u) {
    if (typeof u !== 'string') return '';
    u = u.trim();
    return /^(https:\/\/|mailto:)/i.test(u) ? u : '';
  }
  // Only local images inside the site (no other domains, no "..").
  function safeImg(p) {
    if (typeof p !== 'string') return '';
    p = p.trim();
    return /^[A-Za-z0-9_\-./]+\.(jpe?g|png|webp|avif|gif)$/i.test(p) && p.indexOf('..') === -1 && p.indexOf('//') === -1 ? p : '';
  }
  function fmtDate(s) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return s || '';
    var d = new Date(s + 'T12:00:00');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function fmtMonth(s) {
    if (!/^\d{4}-\d{2}/.test(s || '')) return s || '';
    var d = new Date(s.slice(0, 7) + '-15T12:00:00');
    return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }
  var toastTimer;
  function toast(msg) {
    var t = $('.toast');
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
  }
  LTS.$ = $; LTS.$$ = $$; LTS.el = el; LTS.loadJSON = loadJSON; LTS.safeImg = safeImg; LTS.safeUrl = safeUrl;
  LTS.fmtDate = fmtDate; LTS.fmtMonth = fmtMonth; LTS.toast = toast;

  /* ---------- config: links, stats, cover ---------- */
  function applyConfig(cfg) {
    var links = (cfg && cfg.links) || {};
    $$('[data-link]').forEach(function (a) {
      var url = safeUrl(links[a.getAttribute('data-link')]);
      if (url) {
        a.setAttribute('href', url);
        if (/^https:/i.test(url)) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener noreferrer'); }
        a.removeAttribute('aria-disabled');
      } else if ((a.getAttribute('href') || '#') === '#') {
        a.setAttribute('aria-disabled', 'true');
        a.addEventListener('click', function (e) { e.preventDefault(); toast('This link is coming soon.'); });
      }
    });
    var stats = (cfg && cfg.stats) || {};
    $$('[data-stat]').forEach(function (n) {
      var v = stats[n.getAttribute('data-stat')];
      if (typeof v === 'string' && v.trim()) {
        n.textContent = v.trim();
        var wrap = n.closest('[data-stat-wrap]');
        if (wrap) wrap.hidden = false;
      }
    });
    var cover = safeImg(cfg && cfg.coverImage);
    var coverEl = $('.profile-cover');
    if (cover && coverEl) { coverEl.style.backgroundImage = 'url("' + cover + '")'; coverEl.classList.add('has-img'); }
    LTS.shareText = (cfg && cfg.shareText) || document.title;
  }

  /* ---------- small page bits ---------- */
  function avatarFallback() {
    $$('img[data-fallback]').forEach(function (img) {
      function swap() {
        var f = el('span', { class: 'avatar-fallback', 'aria-hidden': 'true', text: 'H' });
        img.replaceWith(f);
      }
      if (img.complete && img.naturalWidth === 0) swap(); else img.addEventListener('error', swap);
    });
  }
  function year() { $$('[data-year]').forEach(function (n) { n.textContent = String(new Date().getFullYear()); }); }

  function nav() {
    var btn = $('.nav-toggle'), links = $('#nav-links');
    if (!btn || !links) return;
    btn.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) { links.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    });
    // highlight the section in view
    if (!('IntersectionObserver' in window)) return;
    var map = {};
    $$('a[href^="#"]', links).forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var a = map[en.target.id];
        if (a && en.isIntersecting) {
          $$('a[aria-current]', links).forEach(function (x) { x.removeAttribute('aria-current'); });
          a.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  // Accessible tab lists: arrow keys + roving tabindex.
  function tabs(list, onSelect) {
    var btns = $$('[role="tab"]', list);
    function select(i, focus) {
      btns.forEach(function (b, j) {
        b.setAttribute('aria-selected', j === i ? 'true' : 'false');
        b.tabIndex = j === i ? 0 : -1;
      });
      if (focus) btns[i].focus();
      onSelect(i, btns[i]);
    }
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { select(i, false); });
      b.addEventListener('keydown', function (e) {
        var k = e.key, n = btns.length, j = null;
        if (k === 'ArrowRight' || k === 'ArrowDown') j = (i + 1) % n;
        else if (k === 'ArrowLeft' || k === 'ArrowUp') j = (i - 1 + n) % n;
        else if (k === 'Home') j = 0; else if (k === 'End') j = n - 1;
        if (j !== null) { e.preventDefault(); select(j, true); }
      });
    });
    return select;
  }
  LTS.tabs = tabs;

  function highlights() {
    var list = $('.highlight-tabs');
    if (!list) return;
    var panel = $('#hl-panel'), bars = $$('.story-bars span');
    tabs(list, function (i, b) {
      $('.story-label', panel).textContent = (b.lastChild && b.lastChild.textContent || '').trim();
      $('.story-body', panel).textContent = b.getAttribute('data-body');
      panel.setAttribute('aria-labelledby', b.id);
      bars.forEach(function (s, j) { s.classList.toggle('on', j <= i); });
    });
    bars[0] && bars[0].classList.add('on');
  }

  function share() {
    $$('[data-share]').forEach(function (b) {
      b.addEventListener('click', function () {
        var url = location.origin + location.pathname.replace(/[^/]*$/, '');
        var data = { title: "Let's Talk Social with Hebz", text: LTS.shareText || '', url: url };
        if (navigator.share) { navigator.share(data).catch(function () {}); return; }
        if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast('Link copied. Paste it to a fellow marketer!'); }, function () { toast(url); });
        else toast(url);
      });
    });
  }

  /* ---------- events ---------- */
  function renderEvents(data) {
    var up = (data && data.upcoming) || [], past = (data && data.past) || [];
    var upBox = $('[data-events="upcoming"]'), pastBox = $('[data-events="past"]');
    if (!upBox) return;
    up.forEach(function (e) {
      var media = el('div', { class: 'event-media' }, [el('span', { class: 'chip', text: e.type || 'Event' }), el('span', { class: 'chip chip-dark', text: 'Members only' })]);
      var img = safeImg(e.image); if (img) media.style.backgroundImage = 'url("' + img + '")';
      upBox.appendChild(el('article', { class: 'event-card' }, [
        media,
        el('div', { class: 'event-body' }, [
          el('p', { class: 'event-when', text: [fmtDate(e.date), e.city].filter(Boolean).join(' · ') }),
          el('h3', { class: 'event-title', text: e.title || '' }),
          el('p', { class: 'event-note', text: 'Members get the booking link in the WhatsApp community. Secure card payment.' }),
          el('a', { class: 'btn btn-brand btn-sm', href: '#join', text: 'Join to get access' })
        ])
      ]));
    });
    $('[data-empty="upcoming"]').hidden = up.length > 0;
    past.slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); }).forEach(function (e) {
      var thumb = el('div', { class: 'past-thumb', role: 'img', 'aria-label': e.title ? 'Photo from ' + e.title : 'Event photo' });
      var img = safeImg(e.cover); if (img) thumb.style.backgroundImage = 'url("' + img + '")';
      var sub = [];
      if (e.attendees) sub.push(e.attendees + ' attendees');
      if (e.speakers && e.speakers.length) sub.push('Speakers: ' + e.speakers.map(function (s) { return s.name; }).join(', '));
      var id = /^[a-z0-9-]+$/i.test(e.id || '') ? e.id : '';
      pastBox.appendChild(el('article', { class: 'past-item' }, [
        thumb,
        el('div', { class: 'past-text' }, [
          el('p', { class: 'past-meta', text: [e.type, fmtMonth(e.date), e.city].filter(Boolean).join(' · ') }),
          el('h3', { class: 'past-title', text: e.title || '' }),
          sub.length ? el('p', { class: 'past-sub', text: sub.join(' · ') }) : null
        ]),
        id ? el('a', { class: 'btn btn-outline btn-sm', href: 'event.html?id=' + encodeURIComponent(id), text: 'View recap' }) : null
      ]));
    });
    $('[data-empty="past"]').hidden = past.length > 0;
  }
  function eventTabs() {
    var list = $('#events .segmented');
    if (!list) return;
    tabs(list, function (i) { $('#panel-up').hidden = i !== 0; $('#panel-past').hidden = i !== 1; });
  }

  /* ---------- testimonials carousel ---------- */
  function testimonials(data) {
    var items = ((data && data.items) || []).filter(function (t) { return t && t.quote; });
    if (!items.length) return;
    var idx = 0, quote = $('.t-quote'), name = $('.t-name'), role = $('.t-role'), av = $('.t-avatar'), dots = $('.t-dots');
    $('.t-controls').hidden = items.length < 2;
    items.forEach(function (t, i) {
      var b = el('button', { type: 'button', 'aria-label': 'Show testimonial ' + (i + 1) + ' of ' + items.length });
      b.addEventListener('click', function () { show(i); });
      dots.appendChild(b);
    });
    function show(i) {
      idx = (i + items.length) % items.length;
      var t = items[idx];
      quote.textContent = '“' + t.quote.trim() + '”';
      name.textContent = t.name || 'Community member';
      role.textContent = [t.role, t.country].filter(Boolean).join(' · ');
      var p = safeImg(t.photo); av.style.backgroundImage = p ? 'url("' + p + '")' : '';
      $$('button', dots).forEach(function (b, j) { if (j === idx) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    }
    $('[data-t="prev"]').addEventListener('click', function () { show(idx - 1); });
    $('[data-t="next"]').addEventListener('click', function () { show(idx + 1); });
    // swipe
    var slide = $('.t-slide'), x0 = null;
    slide.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
    slide.addEventListener('pointerup', function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1));
    });
    show(0);
  }

  /* ---------- gallery + lightbox ---------- */
  function gallery(data) {
    var grid = $('#gallery-grid');
    if (!grid) return;
    var photos = ((data && data.photos) || []).map(function (p) { return { src: safeImg(p.src), alt: p.alt || '' }; }).filter(function (p) { return p.src; });
    var members = $('.g-members', grid);
    photos.forEach(function (p, i) {
      var b = el('button', { class: 'g-item', type: 'button', 'aria-label': 'Open photo: ' + (p.alt || 'event photo ' + (i + 1)) }, [
        el('img', { src: p.src, alt: p.alt, loading: 'lazy', decoding: 'async', draggable: 'false' })
      ]);
      b.addEventListener('click', function () { openLightbox(photos, i, b); });
      grid.insertBefore(b, members);
    });
    // light deterrent only: real protection = keep full albums off the public site
    grid.addEventListener('contextmenu', function (e) { if (e.target.tagName === 'IMG') e.preventDefault(); });
  }
  function openLightbox(photos, i, opener) {
    var img = el('img', { alt: '', draggable: 'false' }), cap = el('figcaption');
    var close = el('button', { class: 'lb-close', type: 'button', 'aria-label': 'Close' }, ['✕']);
    var prev = el('button', { class: 'lb-prev', type: 'button', 'aria-label': 'Previous photo' }, ['‹']);
    var next = el('button', { class: 'lb-next', type: 'button', 'aria-label': 'Next photo' }, ['›']);
    var box = el('div', { class: 'lightbox', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Photo viewer' }, [el('figure', null, [img, cap]), close, prev, next]);
    function show(j) { i = (j + photos.length) % photos.length; img.src = photos[i].src; img.alt = photos[i].alt; cap.textContent = photos[i].alt; }
    function done() { document.removeEventListener('keydown', key); box.remove(); document.body.style.overflow = ''; opener.focus(); }
    function key(e) { if (e.key === 'Escape') done(); if (e.key === 'ArrowRight') show(i + 1); if (e.key === 'ArrowLeft') show(i - 1); }
    close.addEventListener('click', done);
    prev.addEventListener('click', function () { show(i - 1); });
    next.addEventListener('click', function () { show(i + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) done(); });
    box.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    document.addEventListener('keydown', key);
    if (photos.length < 2) { prev.hidden = true; next.hidden = true; }
    document.body.appendChild(box); document.body.style.overflow = 'hidden';
    show(i); close.focus();
  }

  /* ---------- cookie notice + install card ---------- */
  function notice(after) {
    var n = $('#cookie-notice');
    if (!n || store('lts-notice') === '1') { after(); return; }
    n.hidden = false;
    $('[data-notice-close]', n).addEventListener('click', function () { store('lts-notice', '1'); n.hidden = true; after(); });
  }
  function installCard() {
    var card = $('#install-card');
    if (!card) return;
    var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
    if (standalone || store('lts-install') === '1') return;
    var deferred = null;
    var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var ready = false;
    function showSoon() { if (ready) return; ready = true; setTimeout(function () { if (!$('#cookie-notice') || $('#cookie-notice').hidden) card.hidden = false; }, 15000); }
    function hide() { card.hidden = true; store('lts-install', '1'); }
    window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; showSoon(); });
    if (isIOS) { $('.install-ios', card).hidden = false; $('[data-install="go"]', card).textContent = 'Got it'; showSoon(); }
    $('[data-install="later"]', card).addEventListener('click', hide);
    $('[data-install="go"]', card).addEventListener('click', function () {
      if (deferred) { deferred.prompt(); deferred.userChoice.finally(function () { deferred = null; hide(); }); }
      else hide();
    });
    window.addEventListener('appinstalled', hide);
  }

  /* ---------- legal page tabs ---------- */
  function legalTabs() {
    var list = $('[data-legal-tabs]');
    if (!list) return;
    var btns = $$('[role="tab"]', list), ids = btns.map(function (b) { return b.getAttribute('aria-controls'); });
    var select = tabs(list, function (i) {
      ids.forEach(function (id, j) { document.getElementById(id).hidden = j !== i; });
      if (history.replaceState) history.replaceState(null, '', '#' + ids[i]);
    });
    var start = Math.max(0, ids.indexOf(location.hash.slice(1)));
    select(start, false);
    window.addEventListener('hashchange', function () { var j = ids.indexOf(location.hash.slice(1)); if (j >= 0) select(j, false); });
  }

  /* ---------- service worker (install as app / offline) ---------- */
  function sw() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }

  /* ---------- boot ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    year(); nav(); avatarFallback(); highlights(); share(); eventTabs(); legalTabs(); sw();
    LTS.config = loadJSON('data/config.json').then(function (c) { applyConfig(c); return c; }).catch(function () { applyConfig({}); return {}; });
    if ($('[data-events]')) loadJSON('data/events.json').then(renderEvents).catch(function () { renderEvents({}); });
    if ($('.t-stage')) loadJSON('data/testimonials.json').then(testimonials).catch(function () {});
    if ($('#gallery-grid')) loadJSON('data/gallery.json').then(gallery).catch(function () {});
    notice(installCard);
  });
})();
