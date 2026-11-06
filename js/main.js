/* =========================================================
   KY Furniture — interactions
   ========================================================= */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var WA = '918000622415';
  var waLink = function (text) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text); };

  var yearEl = $('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- WhatsApp enquiry links (before loops clone them) ---------- */
  $$('[data-enquire]').forEach(function (a) {
    a.href = waLink('Hi KY Furniture, I am interested in the ' + a.dataset.enquire + '. Please share the price and details.');
    a.target = '_blank';
    a.rel = 'noopener';
  });

  /* ---------- split headings into words ---------- */
  function wrapWord(node, i) {
    var outer = document.createElement('span');
    outer.className = 'w';
    var inner = document.createElement('span');
    inner.className = 'wi';
    inner.style.transitionDelay = (i * 0.07) + 's';
    if (node.nodeType === 1 && node.classList.contains('script')) outer.classList.add('w-scr');
    inner.appendChild(node);
    outer.appendChild(inner);
    return outer;
  }
  function splitText(el) {
    var nodes = Array.prototype.slice.call(el.childNodes);
    el.innerHTML = '';
    var i = 0;
    nodes.forEach(function (n) {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { el.appendChild(document.createTextNode(' ')); return; }
          el.appendChild(wrapWord(document.createTextNode(part), i++));
        });
      } else if (n.nodeName === 'BR') {
        el.appendChild(n);
      } else {
        el.appendChild(wrapWord(n, i++));
      }
    });
  }
  $$('[data-split]').forEach(splitText);

  /* ---------- reveal on scroll ---------- */
  var revealTargets = $$('[data-reveal]:not([data-reveal="clip"]), [data-split]:not([data-split="manual"])');
  /* clip-path hides an element from IntersectionObserver, so clip reveals watch their parent */
  var clipParents = [];
  $$('[data-reveal="clip"]').forEach(function (el) {
    if (clipParents.indexOf(el.parentElement) < 0) clipParents.push(el.parentElement);
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (clipParents.indexOf(e.target) > -1) {
          $$('[data-reveal="clip"]', e.target).forEach(function (c) { c.classList.add('in'); });
        } else {
          e.target.classList.add('in');
        }
        io.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    revealTargets.concat(clipParents).forEach(function (el) { io.observe(el); });
  } else {
    $$('[data-reveal="clip"]').forEach(function (el) { el.classList.add('in'); });
    revealTargets.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- counters ---------- */
  function runCounter(el) {
    var target = +el.dataset.count, start = null, dur = 2000;
    function step(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / dur, 1);
      var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      el.textContent = Math.round(target * eased).toLocaleString('en-IN');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { runCounter(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach(function (el) { cio.observe(el); });
  }

  /* ---------- smooth scroll (Lenis, optional) ---------- */
  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true });
  }
  function scrollToEl(target) {
    var headerH = 76;
    if (lenis) lenis.scrollTo(target, { offset: -headerH, duration: 1.4 });
    else window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - headerH, behavior: reduce ? 'auto' : 'smooth' });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id.length < 2) return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    closeMenu();
    scrollToEl(id === '#home' ? document.body : target);
  });

  /* =========================================================
     LOOP CAROUSEL — infinite, draggable, eases to a stop on hover
     ========================================================= */
  function Loop(el) {
    this.el = el;
    this.track = $('.loop-track', el);
    this.speed = reduce ? 0 : (+el.dataset.speed || 40);
    this.dir = el.dataset.dir === 'right' ? 1 : -1;
    this.originals = Array.prototype.slice.call(this.track.children);
    this.x = 0; this.mult = 1; this.target = 1;
    this.dragging = false; this.moved = false; this.visible = true;
    this.build();

    var self = this;
    if (el.dataset.pause !== 'false') {
      el.addEventListener('mouseenter', function () { self.target = 0; });
      el.addEventListener('mouseleave', function () { self.target = 1; });
    }
    if (el.dataset.drag !== 'false') this.bindDrag();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { self.visible = en[0].isIntersecting; }).observe(el);
    }
  }
  Loop.prototype.build = function () {
    $$('[data-clone]', this.track).forEach(function (n) { n.remove(); });
    var self = this;
    var addSet = function () {
      self.originals.forEach(function (n) {
        var c = n.cloneNode(true);
        c.setAttribute('data-clone', '');
        c.setAttribute('aria-hidden', 'true');
        $$('a, button', c).forEach(function (f) { f.setAttribute('tabindex', '-1'); });
        if (c.matches && c.matches('a, button')) c.setAttribute('tabindex', '-1');
        self.track.appendChild(c);
      });
    };
    addSet();
    var firstClone = this.track.children[this.originals.length];
    this.setW = firstClone.offsetLeft - this.originals[0].offsetLeft;
    if (this.setW <= 0) this.setW = this.track.scrollWidth / 2;
    if (!(this.setW > 20)) { this.setW = 0; return; }
    var needed = Math.min(8, Math.ceil((this.el.offsetWidth * 1.5) / this.setW));
    for (var k = 1; k < needed; k++) addSet();
  };
  Loop.prototype.bindDrag = function () {
    var self = this, startX = 0, startPos = 0, lastX = 0, vel = 0;
    this.el.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      self.dragging = true; self.moved = false;
      startX = lastX = e.clientX; startPos = self.x; vel = 0;
    });
    window.addEventListener('pointermove', function (e) {
      if (!self.dragging) return;
      var dx = e.clientX - startX;
      if (!self.moved && Math.abs(dx) > 6) { self.moved = true; self.el.classList.add('is-drag'); }
      if (self.moved) { vel = e.clientX - lastX; lastX = e.clientX; self.x = startPos + dx; }
    });
    var end = function () {
      if (!self.dragging) return;
      self.dragging = false;
      self.el.classList.remove('is-drag');
      self.fling = vel * 0.9;
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    this.el.addEventListener('click', function (e) {
      if (self.moved) { e.preventDefault(); e.stopPropagation(); self.moved = false; }
    }, true);
    this.el.addEventListener('dragstart', function (e) { e.preventDefault(); });
  };
  Loop.prototype.tick = function (dt) {
    if (!this.visible && !this.dragging) return;
    this.mult += (this.target - this.mult) * Math.min(1, dt * 4);
    if (!this.dragging) {
      this.x += this.dir * this.speed * this.mult * dt;
      if (this.fling) { this.x += this.fling; this.fling *= 0.92; if (Math.abs(this.fling) < 0.1) this.fling = 0; }
    }
    var w = this.setW;
    if (w > 0) {
      while (this.x <= -w) this.x += w;
      while (this.x > 0) this.x -= w;
    }
    this.track.style.transform = 'translate3d(' + this.x.toFixed(2) + 'px,0,0)';
  };

  var loops = $$('.loop').map(function (el) { return new Loop(el); });
  var rebuild = function () { loops.forEach(function (l) { l.build(); }); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuild);
  var rT;
  window.addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(rebuild, 250); });

  /* ---------- parallax ---------- */
  var parallax = $$('[data-speed]').filter(function (el) { return !el.classList.contains('loop'); });

  /* ---------- header / progress state ---------- */
  var header = $('#header'), totop = $('#totop'), ttBar = $('#ttBar');
  var lastY = -1, maxScroll = 1;
  function measureMax() { maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight); }
  measureMax();
  window.addEventListener('load', measureMax);
  window.addEventListener('resize', measureMax);
  function onScroll(y) {
    if (y === lastY) return;
    header.classList.toggle('scrolled', y > 60);
    if (!document.body.classList.contains('menu-open')) {
      if (y > 500 && y > lastY + 2) header.classList.add('hide');
      else if (y < lastY - 2 || y <= 500) header.classList.remove('hide');
    }
    lastY = y;
    totop.classList.toggle('show', y > 700);
    ttBar.style.strokeDashoffset = (144.5 * (1 - Math.min(1, y / maxScroll))).toFixed(1);
  }

  /* ---------- main RAF loop (all reads first, then writes) ---------- */
  var prev = performance.now();
  function frame(now) {
    var dt = Math.min((now - prev) / 1000, 0.05);
    prev = now;
    if (lenis) lenis.raf(now);

    var vh = window.innerHeight, y = window.pageYOffset, moves = [];
    if (!reduce) {
      parallax.forEach(function (el) {
        /* measure the (untransformed) parent so the offset never feeds back into itself */
        var r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        moves.push([el, (r.top + r.height / 2 - vh / 2) * (+el.dataset.speed)]);
      });
    }

    loops.forEach(function (l) { l.tick(dt); });
    moves.forEach(function (m) { m[0].style.translate = '0 ' + m[1].toFixed(1) + 'px'; });
    onScroll(y);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- active nav link ---------- */
  var navLinks = $$('.nav a');
  if ('IntersectionObserver' in window) {
    var nio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = '#' + e.target.id;
        navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['home', 'about', 'categories', 'products', 'services', 'gallery', 'contact'].forEach(function (id) {
      var s = document.getElementById(id); if (s) nio.observe(s);
    });
  }

  /* ---------- mobile menu ---------- */
  var burger = $('#burger'), mmenu = $('#mmenu');
  function closeMenu() {
    document.body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
    mmenu.setAttribute('aria-hidden', 'true');
    if (lenis) lenis.start();
  }
  var mmClose = $('#mmClose');
  if (mmClose) mmClose.addEventListener('click', closeMenu);
  burger.addEventListener('click', function () {
    var open = !document.body.classList.contains('menu-open');
    if (!open) return closeMenu();
    document.body.classList.add('menu-open');
    header.classList.remove('hide');
    burger.setAttribute('aria-expanded', 'true');
    mmenu.setAttribute('aria-hidden', 'false');
    if (lenis) lenis.stop();
  });

  /* ---------- hero slider ---------- */
  var slides = $$('.hero-slide'), heroNo = $('#heroNo'), heroBar = $('#heroBar');
  var cur = 0, SLIDE_MS = 6500, slideStart = performance.now();
  function goSlide(n) {
    slides[cur].classList.remove('is-active');
    cur = (n + slides.length) % slides.length;
    var img = $('img', slides[cur]);
    img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
    slides[cur].classList.add('is-active');
    if (heroNo) heroNo.textContent = ('0' + (cur + 1)).slice(-2);
    slideStart = performance.now();
  }
  (function heroTick(now) {
    var p = Math.min((now - slideStart) / SLIDE_MS, 1);
    if (heroBar) heroBar.style.transform = 'scaleX(' + p.toFixed(3) + ')';
    if (p >= 1 && slides.length > 1) goSlide(cur + 1);
    requestAnimationFrame(heroTick);
  })(performance.now());

  /* hero mouse drift */
  var heroFrame = $('.hero-frame'), heroContent = $('.hero-content');
  if (finePointer && !reduce) {
    heroFrame.addEventListener('mousemove', function (e) {
      var r = heroFrame.getBoundingClientRect();
      var mx = (e.clientX - r.left) / r.width - 0.5, my = (e.clientY - r.top) / r.height - 0.5;
      heroContent.style.translate = (mx * -14).toFixed(1) + 'px ' + (my * -10).toFixed(1) + 'px';
      $('.hero-slides').style.translate = (mx * 18).toFixed(1) + 'px ' + (my * 12).toFixed(1) + 'px';
    });
    $('.hero-slides').style.inset = '-20px';
  }

  /* ---------- like buttons ---------- */
  document.addEventListener('click', function (e) {
    var like = e.target.closest('.pc-like');
    if (!like) return;
    e.preventDefault();
    like.classList.toggle('is-on');
    var i = $('i', like);
    i.className = like.classList.contains('is-on') ? 'ph-fill ph-heart' : 'ph ph-heart';
    if (!reduce && like.animate) like.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 450, easing: 'cubic-bezier(.2,.8,.2,1)' });
  });

  /* ---------- video cards: autoplay muted, only while visible ---------- */
  var videoLoop = $('.video-loop');
  function setCardVideos(play) {
    $$('video', videoLoop).forEach(function (v) {
      v.muted = true;
      if (play) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause();
    });
  }
  if (videoLoop) {
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { setCardVideos(en[0].isIntersecting); }, { threshold: 0.05 }).observe(videoLoop);
    } else setCardVideos(true);
  }

  /* ---------- lightbox ---------- */
  var lb = $('#lightbox'), lbStage = $('#lbStage');
  function openLb(node) {
    lbStage.innerHTML = '';
    lbStage.appendChild(node);
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    if (lenis) lenis.stop();
  }
  function closeLb() {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    var v = $('video', lbStage); if (v) v.pause();
    setTimeout(function () { lbStage.innerHTML = ''; }, 450);
    if (lenis) lenis.start();
  }
  document.addEventListener('click', function (e) {
    var g = e.target.closest('[data-lightbox]');
    if (g) {
      var src = $('img', g).currentSrc || $('img', g).src;
      var img = new Image();
      img.src = g.dataset.full || src.replace(/w=\d+/, 'w=1800');
      img.alt = $('img', g).alt;
      img.onerror = function () { img.onerror = null; img.src = src; };
      openLb(img);
      return;
    }
    var vc = e.target.closest('[data-video]');
    if (vc) {
      var wrap = document.createElement('div');
      wrap.className = 'lb-video';
      var v = document.createElement('video');
      v.autoplay = true; v.loop = true; v.playsInline = true; v.muted = false;
      v.poster = $('video', vc).getAttribute('poster');
      v.src = vc.dataset.video;
      var mb = document.createElement('button');
      mb.className = 'lb-mute'; mb.type = 'button';
      var syncMute = function () {
        mb.innerHTML = v.muted ? '<i class="ph-fill ph-speaker-slash"></i><span>Unmute</span>' : '<i class="ph-fill ph-speaker-high"></i><span>Mute</span>';
        mb.setAttribute('aria-label', v.muted ? 'Unmute video' : 'Mute video');
      };
      mb.addEventListener('click', function (ev) { ev.stopPropagation(); v.muted = !v.muted; syncMute(); });
      v.addEventListener('click', function () { if (v.paused) v.play(); else v.pause(); });
      syncMute();
      wrap.appendChild(v); wrap.appendChild(mb);
      v.onerror = function () {
        var box = document.createElement('div');
        box.className = 'lb-empty';
        box.innerHTML = '<span class="hand">video not found</span>' + vc.dataset.video;
        openLb(box);
      };
      openLb(wrap);
      var pl = v.play();
      if (pl && pl.catch) pl.catch(function () { v.muted = true; syncMute(); v.play(); });
    }
  });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.closest('.lb-close')) closeLb(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (lb.classList.contains('open')) closeLb(); closeMenu(); }
  });

  /* ---------- map tabs ---------- */
  var mapFrame = $('#mapFrame');
  $$('.map-tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('.map-tabs button').forEach(function (x) { x.classList.remove('is-on'); });
      b.classList.add('is-on');
      mapFrame.src = 'https://www.google.com/maps?q=' + encodeURIComponent(b.dataset.map) + '&output=embed';
    });
  });

  /* ---------- inquiry form → WhatsApp ---------- */
  var form = $('#cform'), cfMsg = $('#cfMsg');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.name.value.trim(), phone = form.phone.value.trim();
    var ok = true;
    [['name', name.length > 1], ['phone', /^[0-9+\s-]{10,15}$/.test(phone)]].forEach(function (f) {
      form[f[0]].closest('.field').classList.toggle('err', !f[1]);
      if (!f[1]) ok = false;
    });
    if (!ok) { cfMsg.textContent = 'Please add your name and a valid phone number.'; return; }
    var need = (form.querySelector('input[name="need"]:checked') || {}).value || '';
    var lines = [
      'Hi KY Furniture! New inquiry from the website:',
      'Name: ' + name,
      'Phone: ' + phone,
      'Looking for: ' + need
    ];
    if (form.area.value.trim()) lines.push('Area: ' + form.area.value.trim());
    if (form.message.value.trim()) lines.push('Details: ' + form.message.value.trim());
    window.open(waLink(lines.join('\n')), '_blank', 'noopener');
    cfMsg.textContent = 'Thank you, ' + name.split(' ')[0] + '! WhatsApp is opening with your message.';
    form.reset();
  });

  /* ---------- magnetic buttons ---------- */
  if (finePointer && !reduce) {
    $$('.magnetic').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        el.style.transform = 'translate(' + (x * 0.22).toFixed(1) + 'px,' + (y * 0.3).toFixed(1) + 'px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transition = 'transform .6s cubic-bezier(.2,.8,.2,1)';
        el.style.transform = '';
        setTimeout(function () { el.style.transition = ''; }, 600);
      });
    });
  }

  /* ---------- custom cursor ---------- */
  if (finePointer && !reduce) {
    var dot = $('.cursor-dot'), ring = $('.cursor-ring'), ringLabel = $('span', ring);
    var mx = -100, my = -100, rx = -100, ry = -100;
    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      document.body.classList.add('has-cursor');
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
    });
    document.addEventListener('mouseleave', function () { document.body.classList.remove('has-cursor'); });
    (function cursorLoop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = 'translate(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px)';
      requestAnimationFrame(cursorLoop);
    })();
    document.addEventListener('mouseover', function (e) {
      var labelEl = e.target.closest('[data-cursor]');
      var link = e.target.closest('a, button, label, input, textarea');
      var inner = labelEl && e.target.closest('.vcard, .gitem, .cat, .why-card, .pcard, .scard, .tcard');
      if (labelEl && (inner || !link)) {
        ringLabel.textContent = labelEl.dataset.cursor;
        ring.classList.add('is-label'); ring.classList.remove('is-link');
        dot.style.opacity = '0';
      } else if (link) {
        ring.classList.add('is-link'); ring.classList.remove('is-label');
        dot.style.opacity = '';
      } else {
        ring.classList.remove('is-link', 'is-label');
        dot.style.opacity = '';
      }
    });
  }

  /* ---------- hero intro ---------- */
  setTimeout(function () {
    $('.hero').classList.add('hero-in');
    $('.hero-title').classList.add('in');
  }, 2000);
  var plEl = $('#preloader');
  if (plEl) setTimeout(function () { plEl.remove(); }, 3600);
})();
