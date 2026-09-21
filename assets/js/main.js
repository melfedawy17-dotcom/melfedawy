var FORM_ERR='/*FORM_ERR*/';
var FORM_SENDING='/*FORM_SENDING*/';
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

  /* contact form: FormSubmit ajax primary, visible status, WA-card fallback note */
  var form = document.querySelector('.con-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      var onNetlify = /(^|\.)netlify\.app$|netlify\.com$/.test(location.hostname);
      if (onNetlify) return;
      e.preventDefault();
      var d = new FormData(form), o = {};
      d.forEach(function (v, k) { o[k] = v; });
      o._subject = 'Website inquiry — ' + (o.name || '');
      o._captcha = 'false'; o._template = 'table';
      var btn = form.querySelector('button[type=submit]') || form.querySelector('.btn');
      var note = form.querySelector('.form-note');
      var orig = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = FORM_SENDING; }
      var ctl = new AbortController(); var to = setTimeout(function () { ctl.abort(); }, 12000);
      fetch('https://formsubmit.co/ajax/m.elfedawy17@gmail.com', { method: 'POST', signal: ctl.signal,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(o) })
        .then(function (r) { clearTimeout(to); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function () {
          if (note) { note.textContent = form.getAttribute('data-sent-note') || note.textContent; note.style.color = '#7ED39A'; }
          form.reset();
        })
        .catch(function () {
          clearTimeout(to);
          if (note) { note.textContent = FORM_ERR; note.style.color = '#ff8f8f'; }
        })
        .then(function () { if (btn) { btn.disabled = false; btn.textContent = orig; } });
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
