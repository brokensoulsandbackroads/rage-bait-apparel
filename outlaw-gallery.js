(() => {
  let started = false;

  const galleryImages = [
    { src: 'assets/outlaw-tee-front-male-v3.webp', alt: 'Male model wearing the Rage Bait Apparel Outlaw Tee, front view' },
    { src: 'assets/outlaw-tee-front-female-v3.webp', alt: 'Female model wearing the Rage Bait Apparel Outlaw Tee, front view' },
    { src: 'assets/outlaw-tee-back-male-v2.webp', alt: 'Male model wearing the Rage Bait Apparel Outlaw Tee, back view' },
    { src: 'assets/outlaw-tee-back-female-v5.webp', alt: 'Female model wearing the Rage Bait Apparel Outlaw Tee, back view' }
  ];

  const preload = item => new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(item);
    img.onerror = () => {
      console.error('Outlaw Tee image failed to load:', item.src);
      resolve(null);
    };
    img.src = item.src;
  });

  function findOutlawCard() {
    return Array.from(document.querySelectorAll('.product-grid .product-card')).find(card => {
      const title = card.querySelector('.product-info h3')?.textContent.trim().toLowerCase() || '';
      const buttonProduct = card.querySelector('.add-cart')?.dataset.product?.trim().toLowerCase() || '';
      return title === 'outlaw tee' || title === 'minorz outlaw tee' || buttonProduct === 'outlaw tee' || buttonProduct === 'minorz outlaw tee';
    }) || null;
  }

  async function initGallery() {
    if (started) return;

    const card = findOutlawCard();
    const stage = card?.querySelector('.product-photo, .product-image');
    if (!card || !stage) return;

    const loaded = (await Promise.all(galleryImages.map(preload))).filter(Boolean);
    if (!loaded.length) return;

    started = true;
    card.dataset.productCard = card.dataset.productCard || 'outlaw-tee';
    stage.className = 'product-photo outlaw-gallery';
    stage.style.cssText = 'aspect-ratio:1/1;background:#080908;position:relative;overflow:hidden;touch-action:pan-y;';
    stage.innerHTML = '';

    const slides = document.createElement('div');
    slides.style.cssText = 'position:absolute;inset:0;';

    const slideEls = loaded.map((item, index) => {
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.alt;
      img.draggable = false;
      img.decoding = 'async';
      img.style.cssText = `position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:${index === 0 ? 1 : 0};transition:opacity .45s ease;user-select:none;-webkit-user-drag:none;`;
      slides.appendChild(img);
      return img;
    });

    stage.appendChild(slides);
    if (loaded.length < 2) return;

    const arrow = (label, symbol, side) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('aria-label', label);
      btn.textContent = symbol;
      btn.style.cssText = `position:absolute;${side}:9px;top:50%;transform:translateY(-50%);z-index:4;width:34px;height:42px;border:1px solid rgba(255,255,255,.28);background:rgba(0,0,0,.58);color:#fff;font-size:25px;line-height:1;cursor:pointer;display:grid;place-items:center;`;
      return btn;
    };

    const prev = arrow('Previous Outlaw Tee photo', '‹', 'left');
    const next = arrow('Next Outlaw Tee photo', '›', 'right');
    const dots = document.createElement('div');
    dots.style.cssText = 'position:absolute;left:50%;bottom:10px;transform:translateX(-50%);z-index:4;display:flex;gap:7px;padding:6px 8px;background:rgba(0,0,0,.45);';

    const dotEls = loaded.map((_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', `Show photo ${index + 1} of ${loaded.length}`);
      dot.style.cssText = `width:9px;height:9px;padding:0;border-radius:50%;border:1px solid rgba(255,255,255,.7);background:${index === 0 ? 'var(--acid)' : 'rgba(255,255,255,.25)'};cursor:pointer;`;
      dots.appendChild(dot);
      return dot;
    });

    stage.append(prev, next, dots);

    let current = 0;
    let timer = null;
    let paused = false;
    let touchStartX = null;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const show = index => {
      current = (index + loaded.length) % loaded.length;
      slideEls.forEach((slide, i) => {
        slide.style.opacity = i === current ? '1' : '0';
        slide.setAttribute('aria-hidden', String(i !== current));
      });
      dotEls.forEach((dot, i) => {
        dot.style.background = i === current ? 'var(--acid)' : 'rgba(255,255,255,.25)';
        dot.setAttribute('aria-current', i === current ? 'true' : 'false');
      });
    };

    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    const start = () => {
      stop();
      if (!paused && !reduceMotion && loaded.length > 1) timer = setInterval(() => show(current + 1), 4000);
    };

    const manual = index => {
      show(index);
      start();
    };

    prev.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); manual(current - 1); });
    next.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); manual(current + 1); });
    dotEls.forEach((dot, i) => dot.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); manual(i); }));

    stage.addEventListener('mouseenter', () => { paused = true; stop(); });
    stage.addEventListener('mouseleave', () => { paused = false; start(); });
    stage.addEventListener('focusin', () => { paused = true; stop(); });
    stage.addEventListener('focusout', () => { paused = false; start(); });
    stage.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0]?.clientX ?? null; stop(); }, { passive: true });
    stage.addEventListener('touchend', e => {
      const end = e.changedTouches[0]?.clientX ?? null;
      if (touchStartX !== null && end !== null && Math.abs(end - touchStartX) > 38) show(current + (end < touchStartX ? 1 : -1));
      touchStartX = null;
      start();
    }, { passive: true });

    show(0);
    start();
  }

  document.addEventListener('ragebait:ready', initGallery, { once: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initGallery, { once: true });
  else initGallery();
  setTimeout(initGallery, 800);
})();