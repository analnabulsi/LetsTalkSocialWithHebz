/* Community world map: countries shaded by member count, hover/tap for numbers.
   Shapes: data/world.json (from Natural Earth via world-atlas, simplified).
   Numbers: data/members-by-country.json (edit this file). */
(function () {
  'use strict';
  var SVGNS = 'http://www.w3.org/2000/svg';
  var SHADES = ['#FFFFFF', '#F6DCE3', '#EDB1C0', '#DE7F98', '#C8284F', '#7E1534'];
  var LABELS = ['None yet', 'Fewer than 10', '10–49', '50–199', '200–999', '1,000+'];

  function bucket(n) { if (!n) return 0; if (n < 10) return 1; if (n < 50) return 2; if (n < 200) return 3; if (n < 1000) return 4; return 5; }
  function num(v) { var n = Number(v); return isFinite(n) && n > 0 ? Math.floor(n) : 0; }

  function init() {
    var LTS = window.LTS, stage = document.getElementById('world-map');
    if (!stage || !LTS) return;
    Promise.all([LTS.loadJSON('data/world.json'), LTS.loadJSON('data/members-by-country.json').catch(function () { return {}; })])
      .then(function (r) { build(stage, r[0], r[1] || {}); })
      .catch(function () { var l = stage.querySelector('.map-loading'); if (l) l.textContent = 'The map could not load. Please refresh the page.'; });
  }

  function build(stage, world, counts) {
    var LTS = window.LTS, el = LTS.el;
    var members = counts.members || {}, events = counts.events || {};
    var mode = 'members', pinned = null, active = null;
    var tip = stage.querySelector('.map-tip'), tipName = tip.querySelector('strong'), tipVal = tip.querySelector('span');
    var loading = stage.querySelector('.map-loading'); if (loading) loading.remove();
    var fmt = function (n) { return n.toLocaleString('en-US'); };

    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + world.w + ' ' + world.h);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('focusable', 'false');
    var paths = world.c.map(function (c, i) {
      var p = document.createElementNS(SVGNS, 'path');
      p.setAttribute('d', c.d);
      p.dataset.i = i;
      svg.appendChild(p);
      return p;
    });
    stage.insertBefore(svg, tip);

    function valueOf(name) {
      if (mode === 'events') { var e = num(events[name]); return e ? fmt(e) + (e === 1 ? ' event held' : ' events held') : 'No events yet'; }
      var n = num(members[name]);
      if (!n) return 'No members yet';
      if (n < 10) return 'Fewer than 10 members';
      return fmt(n) + ' members';
    }
    function paint() {
      var maxEv = 0; Object.keys(events).forEach(function (k) { maxEv = Math.max(maxEv, num(events[k])); });
      paths.forEach(function (p, i) {
        var name = world.c[i].n, level;
        if (mode === 'events') { var e = num(events[name]); level = !e ? 0 : Math.min(5, 2 + Math.round(3 * e / (maxEv || 1))); }
        else level = bucket(num(members[name]));
        p.setAttribute('fill', SHADES[level]);
      });
      legend();
    }
    function setActive(i, x, y) {
      if (active !== null) paths[active].classList.remove('active');
      active = i;
      if (i === null) { tip.hidden = true; return; }
      var p = paths[i];
      p.classList.add('active');
      p.parentNode.appendChild(p); // bring outline to front
      tipName.textContent = world.c[i].n;
      tipVal.textContent = valueOf(world.c[i].n);
      tip.style.left = x + '%'; tip.style.top = y + '%';
      tip.hidden = false;
    }
    function pctFromEvent(e) {
      var b = svg.getBoundingClientRect();
      return [Math.max(4, Math.min(96, (e.clientX - b.left) / b.width * 100)), Math.max(8, (e.clientY - b.top) / b.height * 100)];
    }
    function centerOf(i) { var c = world.c[i]; return [Math.max(4, Math.min(96, c.cx / world.w * 100)), Math.max(8, c.cy / world.h * 100)]; }

    svg.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var t = e.target.closest('path');
      if (!t) { setActive(pinned, pinned !== null ? centerOf(pinned)[0] : 0, pinned !== null ? centerOf(pinned)[1] : 0); return; }
      var xy = pctFromEvent(e);
      if (Number(t.dataset.i) !== active) setActive(Number(t.dataset.i), xy[0], xy[1]);
      else { tip.style.left = xy[0] + '%'; tip.style.top = xy[1] + '%'; }
    });
    svg.addEventListener('pointerleave', function () {
      if (pinned !== null) { var c = centerOf(pinned); setActive(pinned, c[0], c[1]); } else setActive(null);
    });
    svg.addEventListener('click', function (e) {
      var t = e.target.closest('path');
      if (!t) { pinned = null; setActive(null); syncTop(); return; }
      var i = Number(t.dataset.i), xy = pctFromEvent(e);
      pinned = pinned === i ? null : i;
      setActive(pinned === null ? null : i, xy[0], xy[1]);
      syncTop();
    });

    // legend
    var legendBox = document.getElementById('map-legend');
    function legend() {
      legendBox.textContent = '';
      legendBox.appendChild(el('b', { text: mode === 'events' ? 'Events held' : 'Members' }));
      var rows = mode === 'events' ? [[SHADES[0], 'None yet'], [SHADES[2], 'Some'], [SHADES[5], 'Most']] : SHADES.map(function (s, i) { return [s, LABELS[i]]; });
      rows.forEach(function (r) {
        var sw = el('span', { class: 'swatch', 'aria-hidden': 'true' }); sw.style.background = r[0];
        legendBox.appendChild(el('span', null, [sw, r[1]]));
      });
      if (counts.updated) legendBox.appendChild(el('span', { class: 'muted', text: 'Updated ' + counts.updated }));
    }

    // top countries (keyboard accessible alternative to the map)
    var topBox = document.getElementById('map-top');
    var byName = {}; world.c.forEach(function (c, i) { byName[c.n] = i; });
    var ranked = Object.keys(members).filter(function (n) { return num(members[n]) >= 10 && byName[n] !== undefined; })
      .sort(function (a, b) { return num(members[b]) - num(members[a]); }).slice(0, 8);
    document.getElementById('map-empty').hidden = ranked.length > 0;
    ranked.forEach(function (n) {
      var i = byName[n], sw = el('span', { class: 'swatch', 'aria-hidden': 'true' });
      sw.style.background = SHADES[bucket(num(members[n]))];
      var b = el('button', { type: 'button', 'aria-pressed': 'false', 'data-i': String(i) }, [
        el('span', { class: 'name' }, [sw, n]), el('span', { class: 'n', text: fmt(num(members[n])) })
      ]);
      b.addEventListener('click', function () {
        pinned = pinned === i ? null : i;
        var c = centerOf(i); setActive(pinned, c[0], c[1]); syncTop();
      });
      topBox.appendChild(b);
    });
    function syncTop() { LTS.$$('button', topBox).forEach(function (b) { b.setAttribute('aria-pressed', Number(b.dataset.i) === pinned ? 'true' : 'false'); }); }

    // members / events switch
    LTS.$$('[data-map-mode]').forEach(function (b) {
      b.addEventListener('click', function () {
        mode = b.getAttribute('data-map-mode');
        LTS.$$('[data-map-mode]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        paint();
        if (active !== null) tipVal.textContent = valueOf(world.c[active].n);
      });
    });
    paint();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
