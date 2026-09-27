(() => {
  const PRODUCT_NAME = 'Rage Bait Keyring';
  const SKU = 'OBLONGKEY';
  const DEFAULT_PRICE = 7.99;

  const card = Array.from(document.querySelectorAll('.product-grid .product-card')).find(item => {
    const heading = item.querySelector('.product-info h3')?.textContent.trim();
    return heading === 'Rage Pack' || heading === PRODUCT_NAME;
  });
  if (!card) return;

  card.dataset.productCard = 'rage-bait-keyring';

  const image = card.querySelector('.product-image');
  const title = card.querySelector('.product-info h3');
  const description = card.querySelector('.product-info p');
  const priceEl = card.querySelector('.product-info strong');
  const button = card.querySelector('.add-cart');

  if (image) {
    image.className = 'product-image sticker-art';
    image.innerHTML = '<span>RAGE BAIT<br>KEYRING</span>';
  }
  if (title) title.textContent = PRODUCT_NAME;
  if (description) description.textContent = 'Oblong Rage Bait keyring';

  let price = DEFAULT_PRICE;
  const visiblePrice = priceEl?.textContent?.match(/([0-9]+(?:\.[0-9]{1,2})?)/);
  if (visiblePrice) price = Number(visiblePrice[1]) || DEFAULT_PRICE;

  if (priceEl) {
    priceEl.dataset.gbp = price.toFixed(2);
    priceEl.textContent = `£${price.toFixed(2)}`;
  }

  if (!button) return;
  button.dataset.product = PRODUCT_NAME;
  button.dataset.sku = SKU;
  button.dataset.price = price.toFixed(2);
  button.disabled = false;
  button.textContent = 'Add to cart';
  button.style.opacity = '1';
  button.style.cursor = 'pointer';

  button.addEventListener('click', () => {
    if (button.disabled) return;
    const entry = {
      name: PRODUCT_NAME,
      sku: SKU,
      price
    };

    try {
      if (typeof cart !== 'undefined' && Array.isArray(cart)) {
        cart.push(entry);
        if (typeof renderCart === 'function') renderCart();
        if (typeof openCart === 'function') openCart();
        return;
      }
    } catch (_) {
      // Fall through to storage-only mode.
    }

    try {
      const key = 'ragebait-cart-v1';
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      const next = Array.isArray(saved) ? saved : [];
      next.push(entry);
      localStorage.setItem(key, JSON.stringify(next));
    } catch (_) {
      // Storage unavailable.
    }
  });
})();
