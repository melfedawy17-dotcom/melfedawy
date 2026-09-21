/* Mohamed Elfedawy — site behaviour */
(function () {
  'use strict';

  /* sticky nav state */
  var nav = document.querySelector('.nav');
  var onScroll = function () {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 12);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* mobile menu */
  var burger = document.querySelector('.burger');
  var links = document.getElementById('navLinks');
  if (burger && links) {
    burger.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* language switch: remember the explicit choice */
  document.querySelectorAll('[data-lang-set]').forEach(function (a) {
    a.addEventListener('click', function () {
      try { localStorage.setItem('mf-lang', a.getAttribute('data-lang-set')); } catch (e) {}
    });
  });

  /* reveal on scroll */
  var revealables = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealables.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('in'); });
  }
  window.__mfRevealOK = true;

  /* animated counters (verified numbers only) */
  var counters = document.querySelectorAll('[data-count]');
  var runCount = function (el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dur = 1200, t0 = null;
    var step = function (t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window && counters.length) {
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCount(en.target); io2.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { io2.observe(el); });
  }

  /* video modal */
  var modal = document.getElementById('videoModal');
  if (modal) {
    var vmTitle = modal.querySelector('#vmTitle');
    var vmTopic = modal.querySelector('.vm-topic');
    document.querySelectorAll('[data-video]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        vmTitle.textContent = btn.getAttribute('data-video');
        vmTopic.textContent = btn.getAttribute('data-topic') || '';
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
      });
    });
    modal.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]') || e.target === modal) {
        modal.hidden = true;
        document.body.style.overflow = '';
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) { modal.hidden = true; document.body.style.overflow = ''; }
    });
  }

  /* contact form: Netlify Forms when hosted there, mailto fallback elsewhere */
  var form = document.querySelector('.con-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      var onNetlify = /(^|\.)netlify\.app$|netlify\.com$/.test(location.hostname);
      if (onNetlify) return; /* native POST → Netlify Forms */
      e.preventDefault();
      var d = new FormData(form);
      var body =
        'Name: ' + (d.get('name') || '') + '\n' +
        'Email: ' + (d.get('email') || '') + '\n' +
        'Phone / WhatsApp: ' + (d.get('phone') || '') + '\n' +
        'Business / Project: ' + (d.get('business') || '') + '\n' +
        'Project type: ' + (d.get('ptype') || '') + '\n' +
        'Needs help with: ' + (d.get('need') || '') + '\n\n' +
        (d.get('message') || '');
      var mailto = 'mailto:' + (form.getAttribute('data-fallback-email') || '') +
        '?subject=' + encodeURIComponent('Website inquiry — ' + (d.get('name') || '')) +
        '&body=' + encodeURIComponent(body);
      location.href = mailto;
      var note = form.querySelector('.form-note');
      if (note) note.textContent = form.getAttribute('data-sent-note') || note.textContent;
    });
  }
})();


/* v18: direct-connect contact icons (numbers never rendered as text) */
(function () {
  var rev = function (s) { return s.split('').reverse().join(''); };
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('[data-wa],[data-tel],[data-mail]') : null;
    if (!a) return;
    e.preventDefault();
    if (a.getAttribute('data-wa')) location.href = 'https://wa.me/' + rev(a.getAttribute('data-wa'));
    else if (a.getAttribute('data-tel')) location.href = 'tel:' + rev(a.getAttribute('data-tel'));
    else if (a.getAttribute('data-mail')) location.href = 'mailto:' + rev(a.getAttribute('data-mail'));
  });
})();
