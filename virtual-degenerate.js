(() => {
  const SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
  const galleryImages = [
    { src: 'assets/virtual-degenerate-hoodie-front.webp', alt: 'Front view of the black Rage Bait Apparel Virtual Degenerate Hoodie' },
    { src: 'assets/virtual-degenerate-hoodie-back.webp', alt: 'Back view of the black Rage Bait Apparel Virtual Degenerate Hoodie' }
  ];

  const productCards = Array.from(document.querySelectorAll('.product-grid .product-card'));
  const hoodieCard = productCards.find(card => card.querySelector('.product-info h3')?.textContent.trim() === 'Virtual Degenerate Hoodie');
  if (!hoodieCard || hoodieCard.dataset.virtualDegenerateReady === 'true') return;
  hoodieCard.dataset.virtualDegenerateReady = 'true';

  const image = hoodieCard.querySelector('.product-image');
  const title = hoodieCard.querySelector('.product-info h3');
  const description = hoodieCard.querySelector('.product-info p');
  const price = hoodieCard.querySelector('.product-info strong');
  const button = hoodieCard.querySelector('.add-cart');

  if (title) title.textContent = 'Virtual Degenerate Hoodie';
  if (description) {
    description.innerHTML = 'Black front + back graphic hoodie<span style="display:block;margin-top:5px;color:#7f887b;font-size:10px;letter-spacing:.03em;">VAT included · shipping extra</span>';
  }
  if (price) price.textContent = '£44.99';

  if (button) {
    button.dataset.product = 'Virtual Degenerate Hoodie';
    button.dataset.price = '44.99';
    delete button.dataset.sku;
    delete button.dataset.size;
    button.disabled = true;
    button.textContent = 'Choose a size';
    button.style.opacity = '.58';
    button.style.cursor = 'not-allowed';

    if (!hoodieCard.querySelector('.hoodie-size-picker')) {
      const sizeWrap = document.createElement('label');
      sizeWrap.className = 'hoodie-size-picker';
      sizeWrap.style.cssText = 'display:flex;align-items:center;gap:10px;padding:12px 14px;border-top:1px solid var(--line);background:#0f110f;color:#b9c0b4;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;';
      sizeWrap.innerHTML = '<span>Size</span>';

      const sizeSelect = document.createElement('select');
      sizeSelect.setAttribute('aria-label', 'Choose Virtual Degenerate Hoodie size');
      sizeSelect.style.cssText = 'flex:1;min-width:0;background:#080908;color:#fff;border:1px solid #394038;padding:9px 10px;font-weight:800;';
      sizeSelect.innerHTML = '<option value="" selected disabled>Choose size</option>' + SIZES.map(size => `<option value="${size}">${size}</option>`).join('');
      sizeWrap.appendChild(sizeSelect);
      hoodieCard.insertBefore(sizeWrap, button);

      sizeSelect.addEventListener('change', () => {
        button.dataset.size = sizeSelect.value;
        delete button.dataset.sku;
        button.disabled = false;
        button.textContent = 'Add to cart';
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
      });
    }
  }

  if (!image) return;

  image.className = 'product-photo virtual-degenerate-gallery';
  image.style.cssText = 'aspect-ratio:1/1;background:#080908;position:relative;overflow:hidden;touch-action:pan-y;';
  image.innerHTML = '<img src="assets/virtual-degenerate-hoodie-front.webp" alt="Front view of the black Rage Bait Apparel Virtual Degenerate Hoodie" style="display:block;width:100%;height:100%;object-fit:contain;padding:8px;">';

  const preload = item => new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(item);
    img.onerror = () => {
      console.error('Virtual Degenerate Hoodie image failed to load:', item.src);
      resolve(null);
    };
    img.src = item.src;
  });

  Promise.all(galleryImages.map(preload)).then(results => {
    const loaded = results.filter(Boolean);
    if (!loaded.length) return;

    image.innerHTML = '';

    const slides = document.createElement('div');
    slides.style.cssText = 'position:absolute;inset:0;';

    const slideEls = loaded.map((item, index) => {
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.alt;
      img.draggable = false;
      img.decoding = 'async';
      img.style.cssText = `position:absolute;inset:0;width:100%;height:100%;object-fit:contain;padding:8px;box-sizing:border-box;opacity:${index === 0 ? 1 : 0};transition:opacity .45s ease;user-select:none;-webkit-user-drag:none;`;
      slides.appendChild(img);
      return img;
    });

    if (loaded.length === 1) {
      image.appendChild(slides);
      return;
    }

    const arrow = (label, symbol, side) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('aria-label', label);
      btn.textContent = symbol;
      btn.style.cssText = `position:absolute;${side}:9px;top:50%;transform:translateY(-50%);z-index:4;width:34px;height:42px;border:1px solid rgba(255,255,255,.28);background:rgba(0,0,0,.58);color:#fff;font-size:25px;line-height:1;cursor:pointer;display:grid;place-items:center;`;
      return btn;
    };

    const prev = arrow('Previous Virtual Degenerate Hoodie photo', '‹', 'left');
    const next = arrow('Next Virtual Degenerate Hoodie photo', '›', 'right');
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

    image.append(slides, prev, next, dots);

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
      if (!paused && !reduceMotion) timer = setInterval(() => show(current + 1), 4000);
    };

    const manual = index => {
      show(index);
      start();
    };

    prev.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); manual(current - 1); });
    next.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); manual(current + 1); });
    dotEls.forEach((dot, index) => dot.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); manual(index); }));

    image.addEventListener('mouseenter', () => { paused = true; stop(); });
    image.addEventListener('mouseleave', () => { paused = false; start(); });
    image.addEventListener('focusin', () => { paused = true; stop(); });
    image.addEventListener('focusout', () => { paused = false; start(); });
    image.addEventListener('touchstart', event => {
      touchStartX = event.changedTouches[0]?.clientX ?? null;
      stop();
    }, { passive: true });
    image.addEventListener('touchend', event => {
      const end = event.changedTouches[0]?.clientX ?? null;
      if (touchStartX !== null && end !== null && Math.abs(end - touchStartX) > 38) {
        show(current + (end < touchStartX ? 1 : -1));
      }
      touchStartX = null;
      start();
    }, { passive: true });

    show(0);
    start();
  });
})();
