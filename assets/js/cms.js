/* Living-site layer: articles, extra works, swappable images.
   Content lives in the GitHub repo under /content and is fetched at runtime.
   Edit CMS config if your repo owner/name changes. */
(function () {
  'use strict';
  var CMS = {
    owner: 'melfedawy17-dotcom',
    repo: 'melfedawy',
    branch: 'main'
  };
  var RAW = 'https://raw.githubusercontent.com/' + CMS.owner + '/' + CMS.repo + '/' + CMS.branch + '/';
  var root = document.body.getAttribute('data-root') || './';
  var VER = '20260920e';
  function vs(p){ return p + (p.indexOf('?') > -1 ? '' : '?v=' + VER); }

  function cb() { return '?t=' + Date.now(); }
  function apiRaw(path) {
    return fetch('https://api.github.com/repos/' + CMS.owner + '/' + CMS.repo + '/contents/' + path,
      { headers: { 'Accept': 'application/vnd.github.raw+json' } });
  }
  function loadJSON(path) {
    return fetch(RAW + path + cb(), { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error(path + ' -> ' + r.status);
      return r.json();
    }).catch(function (e) {
      if (path.indexOf('content/') === 0) {
        return apiRaw(path).then(function (r2) {
          if (!r2.ok) throw e;
          return r2.json();
        });
      }
      throw e;
    });
  }
  function loadText(path) {
    return fetch(RAW + path + cb(), { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error(path + ' -> ' + r.status);
      return r.text();
    }).catch(function (e) {
      if (path.indexOf('content/') === 0) {
        return apiRaw(path).then(function (r2) {
          if (!r2.ok) throw e;
          return r2.text();
        });
      }
      throw e;
    });
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  /* tiny markdown -> html */
  function md2html(src) {
    var lines = esc(src).split(/\r?\n/), out = [], list = false, para = [];
    function flushP() { if (para.length) { out.push('<p>' + para.join(' ') + '</p>'); para = []; } }
    function flushL() { if (list) { out.push('</ul>'); list = false; } }
    function inline(t) {
      return t
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    }
    lines.forEach(function (ln) {
      var t = ln.trim();
      if (!t) { flushP(); flushL(); return; }
      if (/^###\s/.test(t)) { flushP(); flushL(); out.push('<h4>' + inline(t.slice(4)) + '</h4>'); }
      else if (/^##\s/.test(t)) { flushP(); flushL(); out.push('<h3>' + inline(t.slice(3)) + '</h3>'); }
      else if (/^#\s/.test(t)) { flushP(); flushL(); out.push('<h2>' + inline(t.slice(2)) + '</h2>'); }
      else if (/^>\s?/.test(t)) { flushP(); flushL(); out.push('<blockquote>' + inline(t.replace(/^>\s?/, '')) + '</blockquote>'); }
      else if (/^[-*]\s/.test(t)) { flushP(); if (!list) { out.push('<ul>'); list = true; } out.push('<li>' + inline(t.slice(2)) + '</li>'); }
      else { para.push(inline(t)); }
    });
    flushP(); flushL();
    return out.join('\n');
  }

  function fmtDate(d, lang) {
    try {
      return new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) { return d; }
  }

  /* ---- swappable images (site.json) ---- */
  loadJSON('content/site.json').then(function (cfg) {
    var imgs = (cfg && cfg.images) || {};
    Object.keys(imgs).forEach(function (key) {
      document.querySelectorAll('[data-dyn="' + key + '"]').forEach(function (el) {
        el.setAttribute('src', root + vs(imgs[key]));
      });
    });
  }).catch(function () { /* keep static defaults */ });

  /* ---- text overrides (content/overrides.json) ---- */
  loadJSON('content/overrides.json').then(function (ov) {
    var lang = document.documentElement.lang;
    var dict = (ov && ov[lang]) || {};
    var glob = (ov && ov.global) || {};
    document.querySelectorAll('[data-cms]').forEach(function (el) {
      var v = dict[el.getAttribute('data-cms')];
      if (v != null && String(v).trim() !== '') el.textContent = v;
    });
    document.querySelectorAll('[data-cms-global]').forEach(function (el) {
      var k = el.getAttribute('data-cms-global');
      var v = glob[k];
      if (v == null || String(v).trim() === '') return;
      el.textContent = v;
      var digits = String(v).replace(/\D/g, '');
      if (k === 'wa_display' && digits) {
        document.querySelectorAll('a[href^="https://wa.me/"]').forEach(function (a) {
          var q = a.href.indexOf('?text=');
          a.href = 'https://wa.me/' + digits + (q > -1 ? a.href.slice(q) : '');
        });
      }
      if (k === 'phone_display' && digits) document.querySelectorAll('a[href^="tel:"]').forEach(function (a) { a.href = 'tel:+' + digits; });
      if (k === 'email') document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) { a.href = 'mailto:' + String(v).trim(); });
    });
  }).catch(function () { /* keep built-in defaults */ });

  /* ---- articles hub ---- */
  var grid = document.getElementById('postsGrid');
  if (grid) {
    loadJSON('content/posts.json').then(function (posts) {
      var empty = document.getElementById('postsEmpty');
      if (!posts || !posts.length) { if (empty) empty.hidden = false; return; }
      posts = posts.slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
      grid.innerHTML = posts.map(function (p) {
        return '<a class="post-card" href="read.html?slug=' + encodeURIComponent(p.slug) + '">' +
          '<span class="post-thumb"><img loading="lazy" src="' + root + vs(p.cover || 'assets/img/case-feasibility.jpg') + '" alt=""></span>' +
          '<span class="post-body-in"><span class="post-meta">' + fmtDate(p.date, p.lang) +
          ' <i class="lang-badge">' + (p.lang === 'ar' ? 'عربي' : 'EN') + '</i></span>' +
          '<h3>' + esc(p.title) + '</h3><p>' + esc(p.excerpt || '') + '</p></span></a>';
      }).join('');
    }).catch(function () {
      var empty = document.getElementById('postsEmpty');
      if (empty) { empty.hidden = false; empty.setAttribute('data-err', '1'); }
    });
  }

  /* ---- article reader ---- */
  var view = document.getElementById('postView');
  if (view) {
    var slug = decodeURIComponent((location.search.match(/slug=([^&]+)/) || [])[1] || '');
    loadJSON('content/posts.json').then(function (posts) {
      var p = (posts || []).filter(function (x) { return x.slug === slug; })[0];
      if (!p) { view.innerHTML = '<p class="err-note">Article not found.</p>'; return; }
      document.documentElement.lang = p.lang === 'ar' ? 'ar' : 'en';
      document.documentElement.dir = p.lang === 'ar' ? 'rtl' : 'ltr';
      document.title = p.title;
      var back = document.getElementById('backToInsights');
      if (back) back.setAttribute('href', p.lang === 'ar' ? root + 'ar/insights/' : root + 'insights/');
      loadText('content/posts/' + slug + '.md').then(function (md) {
        var url = location.href;
        var share =
          '<div class="share-row">' +
          '<a target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(p.title + ' ' + url) + '">WhatsApp</a>' +
          '<a target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url) + '">LinkedIn</a>' +
          '<a target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url) + '">Facebook</a>' +
          '</div>';
        view.innerHTML =
          '<p class="post-meta">' + fmtDate(p.date, p.lang) + ' <i class="lang-badge">' + (p.lang === 'ar' ? 'عربي' : 'EN') + '</i></p>' +
          '<h1>' + esc(p.title) + '</h1>' +
          (p.cover ? '<img class="article-cover" src="' + root + vs(p.cover) + '" alt="">' : '') +
          md2html(md) + share;
      }).catch(function () { view.innerHTML = '<p class="err-note">Could not load the article body.</p>'; });
    }).catch(function () { view.innerHTML = '<p class="err-note">Could not load articles index.</p>'; });
  }

  /* ---- extra works (works.json) appended to the case grid ---- */
  var caseGrid = document.getElementById('caseGrid');
  if (caseGrid) {
    loadJSON('content/works.json').then(function (w) {
      var items = (w && w.items) || [];
      if (!items.length) return;
      var html = items.map(function (it, n) {
        return '<button class="case-card" data-work="' + n + '" type="button">' +
          '<span class="case-thumb"><img loading="lazy" src="' + root + vs(it.img || 'assets/img/case-growth.jpg') + '" alt=""></span>' +
          '<span class="case-body-in"><h3>' + esc(it.title) + '</h3><span class="case-res">' + esc(it.result || '') + '</span>' +
          '<p>' + esc(it.desc || '') + '</p></span></button>';
      }).join('');
      caseGrid.insertAdjacentHTML('beforeend', html);
      var modal = document.getElementById('workModal');
      caseGrid.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-work]');
        if (!btn || !modal) return;
        var it = items[+btn.getAttribute('data-work')];
        modal.querySelector('#wmTitle').textContent = it.title || '';
        modal.querySelector('.wm-cat').textContent = it.cat || '';
        modal.querySelector('.wm-result').textContent = it.result || '';
        modal.querySelector('.wm-desc').textContent = it.desc || '';
        var img = modal.querySelector('.wm-img');
        img.src = root + vs(it.img || 'assets/img/case-growth.jpg');
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
      });
      if (modal) {
        modal.addEventListener('click', function (e) {
          if (e.target.closest('[data-close]') || e.target === modal) { modal.hidden = true; document.body.style.overflow = ''; }
        });
      }
    }).catch(function () { /* no extra works yet */ });
  }
})();
