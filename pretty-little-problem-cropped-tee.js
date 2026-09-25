(() => {
  const PRODUCT_NAME = 'Pretty Little Problem Cropped Tee';
  const SIZES = ['XS', 'S', 'M', 'L', 'XL'];
  const SIZE_SKUS = Object.fromEntries(SIZES.map(size => [size, `BY042-BLK-${size}`]));
  const PRICE = 24.99;
  const CART_KEY = 'ragebait-cart-v1';

  const productGrid = document.querySelector('.product-grid');
  if (!productGrid || productGrid.querySelector('[data-product-card="pretty-little-problem-cropped-tee"]')) return;

  const card = document.createElement('article');
  card.className = 'product-card';
  card.dataset.productCard = 'pretty-little-problem-cropped-tee';
  card.innerHTML = `
    <div class="product-photo pretty-little-problem-cropped-tee-gallery" style="aspect-ratio:1/1;background:#080908;position:relative;overflow:hidden;touch-action:pan-y;">
      <img alt="Front view of the women's Pretty Little Problem Cropped Tee" loading="lazy" decoding="async" style="display:block;width:100%;height:100%;object-fit:contain;padding:8px;box-sizing:border-box;">
    </div>
    <div class="product-info">
      <div>
        <h3>${PRODUCT_NAME}</h3>
        <p>Women's black cropped tee with Pretty Little Problem front + back graphics<span style="display:block;margin-top:5px;color:#7f887b;font-size:10px;letter-spacing:.03em;">VAT included · shipping extra · women's cropped fit</span></p>
      </div>
      <strong data-gbp="${PRICE.toFixed(2)}">£${PRICE.toFixed(2)}</strong>
    </div>
    <label class="hoodie-size-picker" style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-top:1px solid var(--line);background:#0f110f;color:#b9c0b4;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;">
      <span>Size</span>
      <select aria-label="Choose Pretty Little Problem Cropped Tee size" style="flex:1;min-width:0;background:#080908;color:#fff;border:1px solid #394038;padding:9px 10px;font-weight:800;">
        <option value="" selected disabled>Choose size</option>
        ${SIZES.map(size => `<option value="${size}">${size}</option>`).join('')}
      </select>
    </label>
    <button class="add-cart" data-product="${PRODUCT_NAME}" data-price="${PRICE.toFixed(2)}" disabled style="opacity:.58;cursor:not-allowed;">Choose a size</button>
  `;

  const prettyHoodie = productGrid.querySelector('[data-product-card="pretty-little-problem-hoodie"]');
  if (prettyHoodie?.nextSibling) productGrid.insertBefore(card, prettyHoodie.nextSibling);
  else if (prettyHoodie) productGrid.appendChild(card);
  else productGrid.prepend(card);

  const button = card.querySelector('.add-cart');
  const sizeSelect = card.querySelector('.hoodie-size-picker select');
  sizeSelect?.addEventListener('change', () => {
    const size = sizeSelect.value;
    button.dataset.size = size;
    button.dataset.sku = SIZE_SKUS[size];
    button.dataset.price = PRICE.toFixed(2);
    button.disabled = false;
    button.textContent = 'Add to cart';
    button.style.opacity = '1';
    button.style.cursor = 'pointer';
  });

  button?.addEventListener('click', () => {
    if (button.disabled || !button.dataset.size || !button.dataset.sku) return;
    const entry = {
      name: PRODUCT_NAME,
      size: button.dataset.size,
      sku: button.dataset.sku,
      price: PRICE
    };

    try {
      if (typeof cart !== 'undefined' && Array.isArray(cart)) {
        cart.push(entry);
        if (typeof renderCart === 'function') renderCart();
        if (typeof openCart === 'function') openCart();
        return;
      }
    } catch (_) {}

    try {
      const saved = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      const next = Array.isArray(saved) ? saved : [];
      next.push(entry);
      localStorage.setItem(CART_KEY, JSON.stringify(next));
    } catch (_) {}
  });

  const gallery = card.querySelector('.pretty-little-problem-cropped-tee-gallery');
  const bases = [
    { base: 'assets/Pretty_Little_Problem_tee_front_mockup', alt: 'Front view of the women\'s Pretty Little Problem Cropped Tee' },
    { base: 'assets/Pretty_Little_Problem_tee_back_mockup', alt: 'Back view of the women\'s Pretty Little Problem Cropped Tee' }
  ];
  const extensions = ['.png', '.jpg', '.jpeg', '.webp'];

  const findImage = item => new Promise(resolve => {
    let i = 0;
    const tryNext = () => {
      if (i >= extensions.length) return resolve(null);
      const src = item.base + extensions[i++];
      const img = new Image();
      img.onload = () => resolve({ src, alt: item.alt });
      img.onerror = tryNext;
      img.src = src;
    };
    tryNext();
  });

  Promise.all(bases.map(findImage)).then(results => {
    const loaded = results.filter(Boolean);
    if (!gallery || loaded.length === 0) return;
    gallery.innerHTML = '';

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

    gallery.appendChild(slides);
    if (loaded.length < 2) return;

    const arrow = (label, symbol, side) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('aria-label', label);
      btn.textContent = symbol;
      btn.style.cssText = `position:absolute;${side}:9px;top:50%;transform:translateY(-50%);z-index:4;width:34px;height:42px;border:1px solid rgba(255,255,255,.28);background:rgba(0,0,0,.58);color:#fff;font-size:25px;line-height:1;cursor:pointer;display:grid;place-items:center;`;
      return btn;
    };

    const prev = arrow('Previous Pretty Little Problem Cropped Tee photo', '‹', 'left');
    const next = arrow('Next Pretty Little Problem Cropped Tee photo', '›', 'right');
    const dots = document.createElement('div');
    dots.style.cssText = 'position:absolute;left:50%;bottom:10px;transform:translateX(-50%);z-index:4;display:flex;gap:7px;padding:6px 8px;background:rgba(0,0,0,.45);';
    const dotEls = loaded.map((_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', `Show Pretty Little Problem Cropped Tee photo ${index + 1} of ${loaded.length}`);
      dot.style.cssText = `width:9px;height:9px;padding:0;border-radius:50%;border:1px solid rgba(255,255,255,.7);background:${index === 0 ? 'var(--acid)' : 'rgba(255,255,255,.25)'};cursor:pointer;`;
      dots.appendChild(dot);
      return dot;
    });

    gallery.append(prev, next, dots);
    let current = 0;
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

    prev.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); show(current - 1); });
    next.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); show(current + 1); });
    dotEls.forEach((dot, index) => dot.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); show(index); }));
    show(0);
  });
})();
