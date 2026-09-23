(() => {
  const card = document.querySelector('.product-grid .product-card');
  const stage = card?.querySelector('.product-photo');
  if (!card || !stage) return;

  const sources = [
    {
      parts: ['assets/outlaw-gallery-male-front.webp.b64'],
      alt: 'Male model wearing the Rage Bait Apparel Outlaw Tee, front view'
    },
    {
      parts: ['assets/outlaw-gallery-female-front.webp.b64'],
      alt: 'Female model wearing the Rage Bait Apparel Outlaw Tee, front view'
    },
    {
      parts: ['assets/outlaw-gallery-male-back.webp.b64'],
      alt: 'Male model wearing the Rage Bait Apparel Outlaw Tee, back view'
    },
    {
      parts: ['assets/outlaw-gallery-female-back.webp.b64'],
      alt: 'Female model wearing the Rage Bait Apparel Outlaw Tee, back view'
    }
  ];

  const readParts = async parts => {
    const chunks = await Promise.all(parts.map(async path => {
      const response = await fetch(path, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Could not load ${path}`);
      return (await response.text()).trim();
    }));
    return `data:image/webp;base64,${chunks.join('')}`;
  };

  const preload = (src, alt) => new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve({ src, alt });
    img.onerror = () => resolve(null);
    img.src = src;
  });

  Promise.all(sources.map(async item => {
    try {
      const src = await readParts(item.parts);
      return await preload(src, item.alt);
    } catch (error) {
      console.error('Outlaw Tee gallery image failed:', error);
      return null;
    }
  })).then(items => {
    const images = items.filter(Boolean);
    if (!images.length) return;

    stage.className = 'product-photo outlaw-gallery';
    stage.style.cssText = 'aspect-ratio:1/1;background:#080908;position:relative;overflow:hidden;touch-action:pan-y;';
    stage.innerHTML = '';

    const slides = document.createElement('div');
    slides.className = 'outlaw-gallery-slides';
    slides.style.cssText = 'position:absolute;inset:0;';

    const slideEls = images.map((item, index) => {
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.alt;
      img.draggable = false;
      img.loading = index === 0 ? 'eager' : 'lazy';
      img.style.cssText = `position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:${index === 0 ? '1' : '0'};transition:opacity .45s ease;user-select:none;-webkit-user-drag:none;`;
      slides.appendChild(img);
      return img;
    });

    const makeArrow = (label, symbol, side) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', label);
      button.textContent = symbol;
      button.style.cssText = `position:absolute;${side}:9px;top:50%;transform:translateY(-50%);z-index:4;width:34px;height:42px;border:1px solid rgba(255,255,255,.28);background:rgba(0,0,0,.58);color:#fff;font-size:25px;line-height:1;cursor:pointer;display:grid;place-items:center;backdrop-filter:blur(3px);`;
      return button;
    };

    const prev = makeArrow('Previous Outlaw Tee photo', '‹', 'left');
    const next = makeArrow('Next Outlaw Tee photo', '›', 'right');

    const dots = document.createElement('div');
    dots.setAttribute('aria-label', 'Outlaw Tee product photos');
    dots.style.cssText = 'position:absolute;left:50%;bottom:10px;transform:translateX(-50%);z-index:4;display:flex;gap:7px;padding:6px 8px;background:rgba(0,0,0,.45);';

    const dotEls = images.map((_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', `Show photo ${index + 1} of ${images.length}`);
      dot.style.cssText = `width:9px;height:9px;padding:0;border-radius:50%;border:1px solid rgba(255,255,255,.7);background:${index === 0 ? 'var(--acid)' : 'rgba(255,255,255,.25)'};cursor:pointer;`;
      dots.appendChild(dot);
      return dot;
    });

    stage.append(slides, prev, next, dots);

    let current = 0;
    let timer = null;
    let paused = false;
    let touchStartX = null;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const show = index => {
      current = (index + images.length) % images.length;
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
      if (timer) window.clearInterval(timer);
      timer = null;
    };

    const start = () => {
      stop();
      if (!paused && !reduceMotion && images.length > 1) {
        timer = window.setInterval(() => show(current + 1), 4000);
      }
    };

    const manual = index => {
      show(index);
      start();
    };

    prev.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      manual(current - 1);
    });
    next.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      manual(current + 1);
    });
    dotEls.forEach((dot, index) => dot.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      manual(index);
    }));

    stage.addEventListener('mouseenter', () => {
      paused = true;
      stop();
    });
    stage.addEventListener('mouseleave', () => {
      paused = false;
      start();
    });
    stage.addEventListener('focusin', () => {
      paused = true;
      stop();
    });
    stage.addEventListener('focusout', () => {
      paused = false;
      start();
    });
    stage.addEventListener('touchstart', event => {
      touchStartX = event.changedTouches[0]?.clientX ?? null;
      stop();
    }, { passive: true });
    stage.addEventListener('touchend', event => {
      const touchEndX = event.changedTouches[0]?.clientX ?? null;
      if (touchStartX !== null && touchEndX !== null) {
        const delta = touchEndX - touchStartX;
        if (Math.abs(delta) > 38) show(current + (delta < 0 ? 1 : -1));
      }
      touchStartX = null;
      start();
    }, { passive: true });

    show(0);
    start();
  });
})();
