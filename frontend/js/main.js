// ---------- load header/footer partials ----------
fetch('/partials/cabecera.html').then(r => r.text()).then(d => {
  document.getElementById('contenedor-cabecera').innerHTML = d;
  initHeader();
});
fetch('/partials/pie.html').then(r => r.text()).then(d => {
  document.getElementById('contenedor-pie').innerHTML = d;
});

function initHeader() {
  const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  });

  const burger = document.getElementById('burgerBtn');
  burger.addEventListener('click', () => {
    const nav = document.querySelector('.main-nav');
    const isOpen = nav.style.display === 'flex';
    nav.style.display = isOpen ? 'none' : 'flex';
    nav.style.position = 'fixed';
    nav.style.top = '78px';
    nav.style.left = '0';
    nav.style.right = '0';
    nav.style.background = 'rgba(12,30,34,0.98)';
    nav.style.flexDirection = 'column';
    nav.style.padding = '24px 32px';
    nav.style.gap = '18px';
  });
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- scroll-scrubbed reveal: progress tracks scroll position directly ----------
// (instead of snapping in once, each element fades/rises in proportion to how far
// you've scrolled it into view — slower scroll = slower reveal, and matches scroll speed)
(function () {
  const items = Array.from(document.querySelectorAll('.reveal'));
  if (!items.length) return;

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  function update() {
    const vh = window.innerHeight;
    items.forEach(el => {
      if (reduceMotion) {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.classList.add('in');
        return;
      }
      const rect = el.getBoundingClientRect();
      // reveal starts when the element is 88% down the viewport, finishes at 42% —
      // a long scroll span on purpose, so it plays out slowly with your scroll
      const startAt = vh * 0.88;
      const endAt = vh * 0.42;
      const progress = clamp((startAt - rect.top) / (startAt - endAt), 0, 1);
      el.style.opacity = progress.toFixed(3);
      el.style.transform = 'translateY(' + (28 * (1 - progress)).toFixed(1) + 'px)';
      el.classList.toggle('in', progress > 0.97);
    });
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(() => { update(); ticking = false; }); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

// ---------- pinned sections: hold in place while their items reveal one by one ----------
// (proyectos, "por qué elegirnos", testimonios — the grid sections where this reads well)
(function () {
  const pinWraps = Array.from(document.querySelectorAll('.pin-wrap'));
  if (!pinWraps.length || reduceMotion) return;

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  const rigs = pinWraps.map(wrap => ({
    wrap,
    sticky: wrap.querySelector('.pin-sticky'),
    pinItems: Array.from(wrap.querySelectorAll('.pin-item'))
  })).filter(r => r.sticky && r.pinItems.length);

  function update() {
    rigs.forEach(r => {
      const wrapRect = r.wrap.getBoundingClientRect();
      // skip work while this section is nowhere near the viewport
      if (wrapRect.bottom < -200 || wrapRect.top > window.innerHeight + 200) return;

      const totalRunway = Math.max(r.wrap.offsetHeight - r.sticky.offsetHeight, 1);
      const scrolled = clamp(-wrapRect.top, 0, totalRunway);
      const overall = scrolled / totalRunway; // 0..1 across the whole pinned scroll

      const n = r.pinItems.length;
      r.pinItems.forEach((el, i) => {
        const itemProgress = clamp((overall - i / n) * n, 0, 1);
        el.style.opacity = itemProgress.toFixed(3);
        el.style.transform = 'translateY(' + (28 * (1 - itemProgress)).toFixed(1) + 'px)';
      });
    });
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(() => { update(); ticking = false; }); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

// count-up numbers (hero stats + stats bar)
function animateCount(el) {
  const raw = el.textContent.trim();
  const m = raw.match(/^(\D*)(\d+)(\D*)$/);
  if (!m) return;
  const [, prefix, digits, suffix] = m;
  const target = parseInt(digits, 10);
  if (reduceMotion) { el.textContent = raw; return; }
  const duration = 1100;
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = prefix + Math.round(target * eased) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
const countIo = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { animateCount(e.target); countIo.unobserve(e.target); }
  });
}, { threshold: 0.6 });
document.querySelectorAll('.count').forEach(el => countIo.observe(el));

// subtle scroll parallax on the image-break photo (hero has its own combined rig below)
if (!reduceMotion) {
  const breakImg = document.querySelector('.image-break .scene-bg img');
  if (breakImg) {
    let ticking = false;
    function updateBreakParallax() {
      const rect = breakImg.closest('section').getBoundingClientRect();
      const offset = rect.top * 0.12;
      breakImg.style.transform = 'translateY(' + offset.toFixed(1) + 'px) scale(1.08)';
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(updateBreakParallax); ticking = true; }
    }, { passive: true });
    updateBreakParallax();
  }
}

// ---------- HERO: Apple-style depth — ambient photo (CSS) + mouse-follow foreground (JS) ----------
(function () {
  const heroSection = document.querySelector('.hero');
  const bgWrap = document.querySelector('.hero .scene-bg');
  const textBlock = document.getElementById('heroTextBlock');
  const leadCard = document.querySelector('.hero .lead-card');
  if (!heroSection || !bgWrap) return;

  // once its load-in animation finishes, free up `transform` on the lead-card
  // so the mouse-parallax loop can drive it without fighting the keyframe animation.
  // (#heroTextBlock never had its own animation — only its children do — so it needs no such cleanup.)
  if (leadCard) {
    setTimeout(() => leadCard.classList.remove('hero-anim'), 1500);
  }

  let scrollOffset = 0;
  function recalcScroll() {
    scrollOffset = heroSection.getBoundingClientRect().top * 0.1;
  }
  recalcScroll();
  window.addEventListener('scroll', recalcScroll, { passive: true });

  if (reduceMotion) {
    window.addEventListener('scroll', () => {
      bgWrap.style.transform = 'translateY(' + scrollOffset.toFixed(1) + 'px)';
    }, { passive: true });
    return;
  }

  let mx = 0, my = 0, cx = 0, cy = 0;
  heroSection.addEventListener('mousemove', (e) => {
    const rect = heroSection.getBoundingClientRect();
    mx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    my = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  });
  heroSection.addEventListener('mouseleave', () => { mx = 0; my = 0; });

  function loop() {
    cx += (mx - cx) * 0.06;
    cy += (my - cy) * 0.06;
    bgWrap.style.transform = 'translate3d(' + (-cx * 12).toFixed(2) + 'px,' + (scrollOffset - cy * 8).toFixed(2) + 'px,0)';
    if (textBlock) textBlock.style.transform = 'translate3d(' + (cx * 10).toFixed(2) + 'px,' + (cy * 6).toFixed(2) + 'px,0)';
    if (leadCard) leadCard.style.transform = 'translate3d(' + (cx * 16).toFixed(2) + 'px,' + (cy * 10).toFixed(2) + 'px,0)';
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

// ---------- 3D mouse-tilt on cards throughout the page ----------
function initTilt(selector, opts) {
  const maxTilt = (opts && opts.maxTilt) || 6;
  const lift = (opts && opts.lift) || -6;
  const scale = (opts && opts.scale) || 1.02;
  document.querySelectorAll(selector).forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transition = 'none';
      el.style.transform = 'perspective(900px) rotateX(' + (-py * maxTilt).toFixed(2) + 'deg) rotateY(' + (px * maxTilt).toFixed(2) + 'deg) scale(' + scale + ') translateY(' + lift + 'px)';
    });
    el.addEventListener('mouseleave', () => {
      el.style.transition = 'transform .5s cubic-bezier(.16,.84,.44,1)';
      el.style.transform = '';
      setTimeout(() => { el.style.transition = ''; }, 520);
    });
  });
}
if (!reduceMotion) {
  initTilt('.grid-3 .card', { maxTilt: 6, lift: -8, scale: 1.02 });
  initTilt('.grid-2x2 .value-item', { maxTilt: 5, lift: -6, scale: 1.015 });
  initTilt('.t-grid .t-card', { maxTilt: 5, lift: -4, scale: 1.015 });
}

// ---------- video testimonials: no real video source yet, show an honest note ----------
document.querySelectorAll('.video-card .play-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const note = btn.closest('.video-card').querySelector('.video-note');
    if (note) note.classList.toggle('show');
  });
});

// ---------- contact forms: real submit to the backend instead of a fake alert() ----------
function initForms() {
  document.querySelectorAll('form[data-endpoint]').forEach(form => {
    const successEl = form.querySelector('.form-success');
    const errorEl = form.querySelector('.form-error');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (successEl) successEl.classList.remove('show');
      if (errorEl) errorEl.classList.remove('show');

      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }

      const data = Object.fromEntries(new FormData(form).entries());
      try {
        const res = await fetch(form.getAttribute('data-endpoint'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('request failed');
        const json = await res.json();
        if (successEl) {
          successEl.textContent = json.mensaje || '¡Listo! Un asesor te contactará pronto.';
          successEl.classList.add('show');
        }
        form.reset();
      } catch (err) {
        if (errorEl) {
          errorEl.textContent = 'No pudimos enviar tu información. Intenta de nuevo o escríbenos por WhatsApp.';
          errorEl.classList.add('show');
        }
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = originalText; }
      }
    });
  });
}
initForms();
