(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {

    // Scroll reveal
    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) e.target.classList.add('is-visible');
        });
      }, { threshold: 0.1 });
      document.querySelectorAll('.reveal').forEach(function (el) { obs.observe(el); });
      setTimeout(function () {
        document.querySelectorAll('.reveal:not(.is-visible)').forEach(function (el) {
          el.classList.add('is-visible');
        });
      }, 1400);
    } else {
      document.querySelectorAll('.reveal').forEach(function (el) {
        el.classList.add('is-visible');
      });
    }

    // Nav active state
    var path = window.location.pathname;
    document.querySelectorAll('.site-nav-links a').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href) return;
      if (href === '/' && (path === '/' || path === '/index.html')) {
        a.classList.add('is-active');
      } else if (href !== '/' && (path === href || path.startsWith(href.replace('.html', '/')))) {
        a.classList.add('is-active');
      }
    });
    if (path.startsWith('/posts/')) {
      var workLink = document.querySelector('a[href="/work.html"]');
      if (workLink) workLink.classList.add('is-active');
    }

    // Mobile nav toggle
    var hamburger = document.querySelector('.site-nav-hamburger');
    var navLinks  = document.querySelector('.site-nav-links');
    if (hamburger && navLinks) {
      hamburger.addEventListener('click', function () {
        navLinks.classList.toggle('is-open');
      });
      navLinks.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { navLinks.classList.remove('is-open'); });
      });
    }

    // Experience horizontal scroll (about page)
    var xpScroll = document.getElementById('xp-scroll');
    if (xpScroll) {
      var cards   = xpScroll.querySelectorAll('.xp-card');
      var dots    = document.querySelectorAll('.xp-progress .dot');
      var counter = document.getElementById('xp-counter');
      var prevBtn = document.getElementById('xp-prev');
      var nextBtn = document.getElementById('xp-next');

      function cardWidth() { return cards[0].getBoundingClientRect().width + 24; }
      function pad(n) { return n < 10 ? '0' + n : String(n); }
      function updateXp() {
        var idx = Math.round(xpScroll.scrollLeft / cardWidth());
        dots.forEach(function (d, i) { d.classList.toggle('is-active', i === idx); });
        if (counter) counter.textContent = pad(idx + 1) + ' / ' + pad(cards.length);
        if (prevBtn) prevBtn.disabled = idx === 0;
        if (nextBtn) nextBtn.disabled = idx === cards.length - 1;
      }

      xpScroll.addEventListener('scroll', updateXp, { passive: true });
      if (prevBtn) prevBtn.addEventListener('click', function () {
        xpScroll.scrollBy({ left: -cardWidth(), behavior: 'smooth' });
      });
      if (nextBtn) nextBtn.addEventListener('click', function () {
        xpScroll.scrollBy({ left: cardWidth(), behavior: 'smooth' });
      });
      updateXp();
    }

    // Project filter pills
    var pills   = document.querySelectorAll('.filter-pill');
    var rows    = document.querySelectorAll('.project-row[data-cat]');
    var countEl = document.getElementById('filter-count');
    if (pills.length) {
      pills.forEach(function (pill) {
        pill.addEventListener('click', function () {
          pills.forEach(function (p) { p.classList.remove('is-active'); });
          pill.classList.add('is-active');
          var f = pill.dataset.filter;
          var n = 0;
          rows.forEach(function (r) {
            var show = f === 'all' || r.dataset.cat === f;
            r.style.display = show ? '' : 'none';
            if (show) n++;
          });
          if (countEl) countEl.textContent = n < 10 ? '0' + n : String(n);
        });
      });
    }

    // Contact form → mailto
    var form = document.getElementById('contact-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var d = {};
        new FormData(form).forEach(function (v, k) { d[k] = v; });
        var subj = encodeURIComponent('[Portfolio] ' + (d.topic || 'Inquiry') + ' — ' + (d.name || ''));
        var body = encodeURIComponent(
          'From: ' + (d.name || '') + ' <' + (d.email || '') + '>\n' +
          'Company: ' + (d.company || '—') + '\n\n' + (d.message || '')
        );
        window.location.href = 'mailto:jteerlink@gmail.com?subject=' + subj + '&body=' + body;
      });
    }

  });
})();
