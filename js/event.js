/* Event recap page: event.html?id=your-event-id reads data/events.json → past[] */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var LTS = window.LTS, $ = LTS.$, el = LTS.el;
    var id = new URLSearchParams(location.search).get('id') || '';
    function q(k) { return $('[data-e="' + k + '"]'); }
    function notFound() {
      q('title').textContent = 'Event not found';
      q('crumb').textContent = 'Not found';
      var r = q('recap'); r.textContent = '';
      r.appendChild(el('p', null, ['This recap doesn’t exist or has moved. ', el('a', { href: './#events', text: 'See all events' }), '.']));
      q('cover').hidden = true;
    }
    if (!/^[a-z0-9-]+$/i.test(id)) { notFound(); return; }
    LTS.loadJSON('data/events.json').then(function (data) {
      var e = ((data && data.past) || []).filter(function (x) { return x && x.id === id; })[0];
      if (!e) { notFound(); return; }
      document.title = e.title + ' — Let\'s Talk Social with Hebz';
      q('title').textContent = e.title;
      q('crumb').textContent = e.title;
      var chips = q('chips');
      [e.type, LTS.fmtDate(e.date), e.city, e.attendees ? e.attendees + ' attendees' : ''].filter(Boolean).forEach(function (t, i) {
        chips.appendChild(el('span', { class: i === 0 ? 'chip chip-dark' : 'chip', text: t }));
      });
      var cover = LTS.safeImg(e.cover);
      if (cover) { q('cover').style.backgroundImage = 'url("' + cover + '")'; q('cover').setAttribute('aria-label', 'Photo from ' + e.title); }
      else q('cover').hidden = true;
      var recap = q('recap'); recap.textContent = '';
      var paras = Array.isArray(e.recap) ? e.recap : (e.recap ? [e.recap] : []);
      if (!paras.length && e.summary) paras = [e.summary];
      paras.forEach(function (p) { recap.appendChild(el('p', { text: p })); });
      if (!paras.length) recap.appendChild(el('p', { text: 'Full recap coming soon.' }));
      if (Array.isArray(e.takeaways) && e.takeaways.length) {
        e.takeaways.forEach(function (t) { q('takeaways').appendChild(el('li', { text: t })); });
        q('takeaways-wrap').hidden = false;
      }
      if (Array.isArray(e.speakers) && e.speakers.length) {
        e.speakers.forEach(function (s) { q('speakers').appendChild(el('div', { class: 'person' }, [el('strong', { text: s.name || '' }), s.title ? el('span', { text: s.title }) : null])); });
        q('speakers-wrap').hidden = false;
      }
      if (e.partners) { q('partners').textContent = e.partners; q('partners-wrap').hidden = false; }
      var photos = (e.photos || []).map(function (p) { return { src: LTS.safeImg(p.src), alt: p.alt || '' }; }).filter(function (p) { return p.src; });
      photos.forEach(function (p) { q('moments').appendChild(el('img', { src: p.src, alt: p.alt, loading: 'lazy', decoding: 'async', draggable: 'false' })); });
      if (photos.length) q('moments-wrap').hidden = false;
      var desc = document.querySelector('meta[name="description"]'); if (desc && e.summary) desc.setAttribute('content', e.summary);
    }).catch(notFound);
  });
})();
