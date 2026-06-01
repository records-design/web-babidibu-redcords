/* Babidibu Records — main.js */

// ─── HERO ENTRANCE ────────────────────────────────────────────────────────────

function heroEntrance() {
  const headline = document.querySelector('.hero-headline');
  const ctas     = document.querySelector('.hero-ctas');
  const rail     = document.querySelector('.ha-rail-wrap');

  // CSS transition-delay maneja el stagger visual
  setTimeout(() => {
    [headline, ctas, rail].forEach(el => { if (el) el.classList.add('is-ready'); });
  }, 80);
}

// ─── MEDIA RAIL — auto-scroll + drag + wheel + touch ──────────────────────────
//
// Todos los modos de scroll usan wrap.scrollLeft, garantizando coherencia.
// Loop infinito: cuando scrollLeft >= halfWidth, resetea a scrollLeft - halfWidth.
// Los 5 duplicados en el HTML aseguran que la transición sea invisible.

function initMediaRail() {
  const wrap = document.querySelector('.video-band-wrap');
  const band = document.querySelector('#videoBand');
  if (!wrap || !band) return;

  // Speed: px por frame (~60fps). 1.0 ≈ 60px/s — cadencia cómoda de media galería.
  const SPEED = 0.9;

  let paused     = false;  // hover pausa el auto-scroll
  let isDragging = false;
  let dragStartX = 0;
  let dragStartScroll = 0;
  let touchStartX = 0;
  let touchStartScroll = 0;
  let rafId;

  // halfWidth: ancho de los 5 cards originales (= la mitad del band total)
  function halfWidth() {
    return Math.floor(band.scrollWidth / 2);
  }

  // Normaliza el scroll para mantener el loop infinito
  function normalizeScroll() {
    const hw = halfWidth();
    if (hw <= 0) return;
    if (wrap.scrollLeft >= hw) {
      wrap.scrollLeft -= hw;
    } else if (wrap.scrollLeft < 0) {
      wrap.scrollLeft += hw;
    }
  }

  // Loop principal — solo avanza cuando no está pausado ni siendo dragged
  function tick() {
    if (!paused && !isDragging) {
      wrap.scrollLeft += SPEED;
      normalizeScroll();
    }
    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);

  // ── HOVER (pausa auto-scroll) ──────────────────────────────────────────────
  wrap.addEventListener('mouseenter', () => { paused = true;  });
  wrap.addEventListener('mouseleave', () => { paused = false; });

  // ── MOUSE DRAG ────────────────────────────────────────────────────────────
  wrap.addEventListener('mousedown', (e) => {
    isDragging = true;
    paused = true;
    dragStartX = e.clientX;
    dragStartScroll = wrap.scrollLeft;
    wrap.classList.add('is-dragging');
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    paused = false;
    wrap.classList.remove('is-dragging');
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const delta = dragStartX - e.clientX;
    wrap.scrollLeft = dragStartScroll + delta;
    normalizeScroll();
  });

  // ── MOUSE WHEEL ───────────────────────────────────────────────────────────
  wrap.addEventListener('wheel', (e) => {
    // Si el usuario usa scroll horizontal nativo, no interferir
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    wrap.scrollLeft += e.deltaY * 0.75;
    normalizeScroll();
  }, { passive: false });

  // ── TOUCH SWIPE ───────────────────────────────────────────────────────────
  wrap.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartScroll = wrap.scrollLeft;
    paused = true;
  }, { passive: true });

  wrap.addEventListener('touchmove', (e) => {
    const delta = touchStartX - e.touches[0].clientX;
    wrap.scrollLeft = touchStartScroll + delta;
    normalizeScroll();
  }, { passive: true });

  wrap.addEventListener('touchend', () => {
    paused = false;
  });
}

// ─── SCROLL REVEAL ────────────────────────────────────────────────────────────

function initScrollReveal() {
  const targets = document.querySelectorAll('[data-reveal]');
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.10, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach((el) => observer.observe(el));
}

// ─── NAVBAR AUTO-HIDE ─────────────────────────────────────────────────────────
// Apple / Linear style: oculta al bajar, reaparece inmediatamente al subir.

function initNavbar() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  let lastY  = window.scrollY;
  let ticking = false;

  function update() {
    const y = window.scrollY;

    // Clase scrolled: cambia el fondo al alejarse del top
    header.classList.toggle('scrolled', y > 60);

    // Auto-hide: solo activa pasados 100px del top
    if (y > 100) {
      if (y > lastY + 6) {
        // Bajando → ocultar
        header.classList.add('nav-hidden');
      } else if (y < lastY - 4) {
        // Subiendo → mostrar de inmediato
        header.classList.remove('nav-hidden');
      }
    } else {
      // Cerca del top → siempre visible
      header.classList.remove('nav-hidden');
    }

    lastY   = y;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  update();
}

// ─── HERO TITLE BOUNCE ANIMATION ─────────────────────────────────────────────
// Divide las palabras del h1 en spans individuales y les asigna
// animaciones con bounce desde direcciones alternadas.
// Las chispas son elementos absolutamente posicionados.

function initHeroTitleAnimation() {
  // ─── WORD-SPLIT DESACTIVADO DEFINITIVAMENTE ───────────────────────────────
  // El word-split reemplazaba .hw content con .hero-word spans a opacity:0,
  // vaciando los wrappers que el CSS reveal (.is-ready .hw-1/2) necesita.
  // Resultado: título invisible aunque el CSS "revelara" un wrapper vacío.
  //
  // Ahora: el CSS puro en .hw revela el texto directamente. Sin JS intermedio.
  // Solo se ejecutan las chispas decorativas.
  // ─────────────────────────────────────────────────────────────────────────

  if (prefersReducedMotion()) return;
  createHeroSparks(); // solo las chispas, sin tocar el texto
}

function createHeroSparks() {
  const h1 = document.querySelector('.hero h1');
  if (!h1) return;

  const COLORS = ['#7BF004', '#FC05B8', '#F2F120', '#FA6B05', '#0AA9E0'];
  const COUNT  = 14;

  for (let i = 0; i < COUNT; i++) {
    const spark = document.createElement('span');
    spark.className = 'hero-spark';

    // Posiciones distribuidas en el ancho del título
    const leftPct = 5 + (i / (COUNT - 1)) * 90; // 5% – 95%
    const topPct  = 15 + (i % 5) * 16;          // 15%, 31%, 47%, 63%, 79%

    // Vectores de explosión basados en posición
    const cx = leftPct - 50;  // -45 a +45
    const cy = topPct  - 50;  // -35 a +45
    const mag = 45 + (i % 3) * 18;
    const len = Math.sqrt(cx * cx + cy * cy) || 1;
    const tx  = (cx / len) * mag;
    const ty  = (cy / len) * mag * 0.65; // achatar verticalmente

    spark.style.left = leftPct + '%';
    spark.style.top  = topPct  + '%';
    spark.style.setProperty('--tx', tx.toFixed(1) + 'px');
    spark.style.setProperty('--ty', ty.toFixed(1) + 'px');
    spark.style.setProperty('--color', COLORS[i % COLORS.length]);
    spark.style.animationName           = 'heroSparkPop';
    spark.style.animationDuration       = '0.72s';
    spark.style.animationTimingFunction = 'ease-out';
    spark.style.animationDelay          = (0.12 + i * 0.08) + 's';
    spark.style.animationFillMode       = 'both';

    h1.appendChild(spark);
  }
}

// ─── ARTIST RAIL — auto-scroll horizontal suave con loop infinito ─────────────
// Igual que initMediaRail pero aplicado al rail de artistas del hero.

function initArtistRail() {
  const wrap = document.getElementById('artistRail');
  const rail = wrap?.querySelector('.ha-rail');
  if (!wrap || !rail) return;

  const SPEED = 1.1; // px/frame — movimiento vivo y musical (~66px/s a 60fps)
  let paused   = false;
  let dragging = false;
  let dragX    = 0;
  let dragScroll = 0;
  let touchX   = 0;
  let touchScroll = 0;

  function half() { return Math.floor(rail.scrollWidth / 2); }

  function normalize() {
    const h = half();
    if (h <= 0) return;
    if (wrap.scrollLeft >= h)   wrap.scrollLeft -= h;
    else if (wrap.scrollLeft < 0) wrap.scrollLeft += h;
  }

  function tick() {
    if (!paused && !dragging) { wrap.scrollLeft += SPEED; normalize(); }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  wrap.addEventListener('mouseenter', () => { paused = true;  });
  wrap.addEventListener('mouseleave', () => { paused = false; });

  wrap.addEventListener('mousedown', (e) => {
    dragging = true; paused = true;
    dragX = e.clientX; dragScroll = wrap.scrollLeft;
    wrap.classList.add('is-dragging');
  });
  document.addEventListener('mouseup', () => {
    dragging = false; paused = false;
    wrap.classList.remove('is-dragging');
  });
  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    wrap.scrollLeft = dragScroll + (dragX - e.clientX);
    normalize();
  });

  wrap.addEventListener('touchstart', (e) => {
    touchX = e.touches[0].clientX; touchScroll = wrap.scrollLeft; paused = true;
  }, { passive: true });
  wrap.addEventListener('touchmove', (e) => {
    wrap.scrollLeft = touchScroll + (touchX - e.touches[0].clientX); normalize();
  }, { passive: true });
  wrap.addEventListener('touchend', () => { paused = false; });
}

// ─── BIO EXPANDIBLE EN CARDS DE ARTISTAS ─────────────────────────────────────

function initBioExpand() {
  const toggles = document.querySelectorAll('.ap-bio-toggle');
  toggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.ap-card');
      if (!card) return;
      const isExpanded = card.classList.toggle('is-expanded');
      btn.setAttribute('aria-expanded', String(isExpanded));
      const textEl = btn.querySelector('.ap-bio-toggle-text');
      if (textEl) textEl.textContent = isExpanded ? 'Ver menos' : 'Leer bio completa';
    });
  });
}

// ─── MINI AUDIO PLAYER — "Las Hinchadas del Mundial" ─────────────────────────

function initAudioPlayer() {
  const audio    = document.getElementById('audio-hinchadas');
  const player   = document.getElementById('player-hinchadas');
  const btn      = document.getElementById('btn-hinchadas');
  const progress = document.getElementById('progress-hinchadas');
  const bar      = document.getElementById('bar-hinchadas');
  const handle   = document.getElementById('handle-hinchadas');
  const timeCurr = document.getElementById('time-curr-hinchadas');
  const timeTot  = document.getElementById('time-tot-hinchadas');

  if (!audio || !player) return;

  function fmt(s) {
    if (!isFinite(s) || isNaN(s)) return '–:––';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  function setPct(pct) {
    bar.style.width = pct + '%';
    if (handle) handle.style.left = pct + '%';
    progress.setAttribute('aria-valuenow', Math.round(pct));
  }

  // Mostrar duración cuando se carga metadata
  audio.addEventListener('loadedmetadata', () => {
    timeTot.textContent = fmt(audio.duration);
  });

  // Actualizar progreso en tiempo real
  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    setPct(pct);
    timeCurr.textContent = fmt(audio.currentTime);
  });

  // Play / Pause
  function togglePlay() {
    if (audio.paused) {
      audio.play().catch(() => {}); // silenciar error de autoplay
      player.classList.add('is-playing');
      btn.setAttribute('aria-label', 'Pausar');
    } else {
      audio.pause();
      player.classList.remove('is-playing');
      btn.setAttribute('aria-label', 'Reproducir');
    }
  }

  btn.addEventListener('click', togglePlay);

  // Click / arrastre en la barra de progreso para buscar
  function seekTo(e) {
    if (!audio.duration) return;
    const rect = progress.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    audio.currentTime = (x / rect.width) * audio.duration;
  }

  let seeking = false;

  progress.addEventListener('mousedown', (e) => {
    seeking = true;
    seekTo(e);
  });

  document.addEventListener('mousemove', (e) => {
    if (seeking) seekTo(e);
  });

  document.addEventListener('mouseup', () => { seeking = false; });

  // Touch seek
  progress.addEventListener('touchstart', (e) => {
    seeking = true;
    seekTo(e.touches[0]);
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (seeking) seekTo(e.touches[0]);
  }, { passive: true });

  document.addEventListener('touchend', () => { seeking = false; });

  // Teclado en la barra de progreso
  progress.addEventListener('keydown', (e) => {
    if (!audio.duration) return;
    if (e.key === 'ArrowRight') audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
    if (e.key === 'ArrowLeft')  audio.currentTime = Math.max(0, audio.currentTime - 5);
  });

  // Cuando termina
  audio.addEventListener('ended', () => {
    player.classList.remove('is-playing');
    btn.setAttribute('aria-label', 'Reproducir');
    setPct(0);
    timeCurr.textContent = '0:00';
  });
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

document.addEventListener('DOMContentLoaded', () => {
  heroEntrance();
  initNavbar();
  initHeroTitleAnimation(); // Debe ir antes del initBioExpand
  initBioExpand();
  initAudioPlayer();

  if (prefersReducedMotion()) {
    document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('revealed'));
    const headline = document.querySelector('.hero-headline');
    if (headline) headline.classList.add('is-ready');
    const rail = document.querySelector('.ha-rail-wrap');
    if (rail) rail.classList.add('is-ready');
    initArtistRail(); // drag/touch siempre accesible
  } else {
    initArtistRail();
    initScrollReveal();
  }
});
