(() => {
  const NAME = 'Rage Bait Radio | Zero Apologies Hoodie';
  const SIZES = ['XS','S','M','L','XL','2XL','3XL','4XL','5XL'];
  const COLOURS = {
    black: {label:'Black', code:'DBK', images:['mockups/rage-bait-radio-black-front.png.png','mockups/rage-bait-radio-black-back.png.png']},
    lime: {label:'Lime Green', code:'LIM', images:['mockups/rage-bait-radio-green-front.png.png','mockups/rage-bait-radio-green-back.png.png']}
  };
  const grid = document.querySelector('.product-grid');
  if (!grid || grid.querySelector('[data-product-card="rage-bait-radio-hoodie"]')) return;
  const card = document.createElement('article');
  card.className = 'product-card';
  card.dataset.productCard = 'rage-bait-radio-hoodie';
  card.dataset.listedDate = '2026-10-17';
  card.innerHTML = `
    <div class="product-photo rage-radio-gallery" style="aspect-ratio:1/1;background:#080908;position:relative;overflow:hidden;">
      <img alt="Rage Bait Radio black hoodie, front" src="mockups/rage-bait-radio-black-front.png.png" loading="lazy" style="width:100%;height:100%;object-fit:contain;padding:8px;box-sizing:border-box;">
      <button type="button" class="radio-prev" aria-label="Previous image" style="position:absolute;top:50%;left:8px;transform:translateY(-50%);padding:8px 12px;background:#000b;color:white;border:1px solid #888;cursor:pointer;">‹</button>
      <button type="button" class="radio-next" aria-label="Next image" style="position:absolute;top:50%;right:8px;transform:translateY(-50%);padding:8px 12px;background:#000b;color:white;border:1px solid #888;cursor:pointer;">›</button>
    </div>
    <div class="product-info"><div><h3>${NAME}</h3><p>Front + back neon graphic hoodie · Black or Lime Green<span style="display:block;margin-top:5px;color:#7f887b;font-size:10px;">VAT included · shipping extra · 3XL–5XL +£1</span></p></div><strong data-gbp="44.99">£44.99</strong></div>
    <label style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#0f110f;color:#b9c0b4;font-size:11px;font-weight:900;text-transform:uppercase;"><span>Colour</span><select class="radio-colour" aria-label="Choose Rage Bait Radio hoodie colour" style="flex:1;background:#080908;color:white;border:1px solid #394038;padding:9px;"><option value="black">Black</option><option value="lime">Lime Green</option></select></label>
    <label style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#0f110f;color:#b9c0b4;font-size:11px;font-weight:900;text-transform:uppercase;"><span>Size</span><select class="radio-size" aria-label="Choose Rage Bait Radio hoodie size" style="flex:1;background:#080908;color:white;border:1px solid #394038;padding:9px;"><option value="">Choose size</option>${SIZES.map(size=>`<option value="${size}">${size}${['3XL','4XL','5XL'].includes(size)?' (+£1)':''}</option>`).join('')}</select></label>
    <button class="add-cart" data-product="${NAME}" data-price="44.99" disabled style="opacity:.58;cursor:not-allowed;">Choose a size</button>`;
  grid.appendChild(card);
  const colour = card.querySelector('.radio-colour');
  const size = card.querySelector('.radio-size');
  const button = card.querySelector('.add-cart');
  const price = card.querySelector('.product-info strong');
  const img = card.querySelector('.rage-radio-gallery img');
  let imageIndex = 0;
  function display(){
    const variant = COLOURS[colour.value];
    img.src = variant.images[imageIndex];
    img.alt = `Rage Bait Radio ${variant.label} hoodie, ${imageIndex?'back':'front'}`;
  }
  function sync(){
    const variant = COLOURS[colour.value];
    const amount = ['3XL','4XL','5XL'].includes(size.value) ? 45.99 : 44.99;
    button.dataset.price = amount.toFixed(2);
    price.dataset.gbp = amount.toFixed(2);
    price.textContent = `£${amount.toFixed(2)}`;
    if(size.value){
      button.dataset.size = size.value;
      button.dataset.sku = `JH001-${variant.code}-${size.value}`;
      button.disabled = false;
      button.textContent = 'Add to cart';
      button.style.opacity = '1';
      button.style.cursor = 'pointer';
    } else {
      button.disabled = true;
      button.textContent = 'Choose a size';
    }
    window.RageBaitCurrency?.refresh?.();
  }
  colour.addEventListener('change',()=>{imageIndex=0;display();sync();});
  size.addEventListener('change',sync);
  card.querySelector('.radio-prev').addEventListener('click',()=>{imageIndex=1-imageIndex;display();});
  card.querySelector('.radio-next').addEventListener('click',()=>{imageIndex=1-imageIndex;display();});
  button.addEventListener('click',()=>{
    if(button.disabled)return;
    const entry={name:NAME,size:size.value,sku:button.dataset.sku,price:Number(button.dataset.price),colour:COLOURS[colour.value].label};
    if(typeof cart!=='undefined'&&Array.isArray(cart)){
      cart.push(entry);
      if(typeof renderCart==='function')renderCart();
      if(typeof openCart==='function')openCart();
    }
  });
  display();sync();
})();
