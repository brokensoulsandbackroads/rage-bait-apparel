const CART_STORAGE_KEY='ragebait-cart-v1';

function loadCart(){
  try{
    const saved=JSON.parse(localStorage.getItem(CART_STORAGE_KEY)||'[]');
    return Array.isArray(saved)?saved.filter(item=>item&&typeof item==='object'):[];
  }catch(_){
    return [];
  }
}

const cart=loadCart();
const cartButton=document.getElementById('cartButton');
const cartDrawer=document.getElementById('cartDrawer');
const cartBackdrop=document.getElementById('cartBackdrop');
const closeCart=document.getElementById('closeCart');
const cartCount=document.getElementById('cartCount');
const cartItems=document.getElementById('cartItems');
const checkoutButton=document.querySelector('.checkout');

function saveCart(){
  try{localStorage.setItem(CART_STORAGE_KEY,JSON.stringify(cart));}catch(_){/* storage unavailable */}
}

const OUTLAW_SIZE_SKUS={
  S:'CV001-BLK-S',
  M:'CV001-BLK-M',
  L:'CV001-BLK-L',
  XL:'CV001-BLK-XL',
  '2XL':'CV001-BLK-2XL',
  '3XL':'CV001-BLK-3XL',
  '4XL':'CV001-BLK-4XL'
};

const siteHeader=document.querySelector('.site-header');
const desktopNav=document.querySelector('.desktop-nav');
let mobileMenuToggle=null;
let mobileNav=null;

function setMobileMenu(open){
  if(!mobileMenuToggle||!mobileNav)return;
  mobileMenuToggle.setAttribute('aria-expanded',String(open));
  mobileNav.classList.toggle('open',open);
  mobileNav.setAttribute('aria-hidden',String(!open));
}

if(siteHeader&&desktopNav&&cartButton){
  mobileMenuToggle=document.createElement('button');
  mobileMenuToggle.type='button';
  mobileMenuToggle.className='mobile-menu-toggle';
  mobileMenuToggle.setAttribute('aria-label','Open navigation menu');
  mobileMenuToggle.setAttribute('aria-expanded','false');
  mobileMenuToggle.setAttribute('aria-controls','mobileNav');
  mobileMenuToggle.innerHTML='<span></span><span></span><span></span>';

  mobileNav=document.createElement('nav');
  mobileNav.id='mobileNav';
  mobileNav.className='mobile-nav';
  mobileNav.setAttribute('aria-label','Mobile navigation');
  mobileNav.setAttribute('aria-hidden','true');

  desktopNav.querySelectorAll('a').forEach(link=>{
    const mobileLink=link.cloneNode(true);
    mobileLink.addEventListener('click',()=>setMobileMenu(false));
    mobileNav.appendChild(mobileLink);
  });

  siteHeader.insertBefore(mobileMenuToggle,cartButton);
  siteHeader.appendChild(mobileNav);

  mobileMenuToggle.addEventListener('click',()=>{
    const isOpen=mobileMenuToggle.getAttribute('aria-expanded')==='true';
    setMobileMenu(!isOpen);
  });

  window.addEventListener('resize',()=>{
    if(window.innerWidth>980)setMobileMenu(false);
  });
}

const outlawCard=document.querySelector('.product-grid .product-card[data-product-card="outlaw-tee"]') || Array.from(document.querySelectorAll('.product-grid .product-card')).find(card=>{
  const heading=card.querySelector('.product-info h3')?.textContent.trim().toLowerCase();
  return heading==='minorz outlaw tee'||heading==='outlaw tee';
});
if(outlawCard){
  const image=outlawCard.querySelector('.product-image');
  const title=outlawCard.querySelector('.product-info h3');
  const description=outlawCard.querySelector('.product-info p');
  const price=outlawCard.querySelector('.product-info strong');
  const button=outlawCard.querySelector('.add-cart');

  if(image){
    image.className='product-photo';
    image.style.cssText='aspect-ratio:1/1;background:#080908;display:grid;place-items:center;position:relative;overflow:hidden;';
    image.innerHTML='<img src="assets/outlaw-tee.webp" alt="Black Rage Bait Apparel Outlaw Tee featuring the Minorz outlaw artwork" style="display:block;width:100%;height:100%;object-fit:contain;padding:8px;">';
  }
  if(title)title.textContent='Outlaw Tee';
  if(description)description.innerHTML='Black front + back graphic tee<span style="display:block;margin-top:5px;color:#7f887b;font-size:10px;letter-spacing:.03em;">VAT included · shipping extra</span>';
  if(price)price.textContent='£29.99';

  if(button){
    button.dataset.product='Outlaw Tee';
    button.dataset.price='29.99';
    button.disabled=true;
    button.textContent='Choose a size';
    button.style.opacity='.58';
    button.style.cursor='not-allowed';

    const sizeWrap=document.createElement('label');
    sizeWrap.className='outlaw-size-picker';
    sizeWrap.style.cssText='display:flex;align-items:center;gap:10px;padding:12px 14px;border-top:1px solid var(--line);background:#0f110f;color:#b9c0b4;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;';
    sizeWrap.innerHTML='<span>Size</span>';

    const sizeSelect=document.createElement('select');
    sizeSelect.setAttribute('aria-label','Choose Outlaw Tee size');
    sizeSelect.style.cssText='flex:1;min-width:0;background:#080908;color:#fff;border:1px solid #394038;padding:9px 10px;font-weight:800;';
    sizeSelect.innerHTML='<option value="" selected disabled>Choose size</option>'+Object.keys(OUTLAW_SIZE_SKUS).map(size=>`<option value="${size}">${size}</option>`).join('');
    sizeWrap.appendChild(sizeSelect);
    outlawCard.insertBefore(sizeWrap,button);

    sizeSelect.addEventListener('change',()=>{
      const size=sizeSelect.value;
      button.dataset.size=size;
      button.dataset.sku=OUTLAW_SIZE_SKUS[size];
      button.disabled=false;
      button.textContent='Add to cart';
      button.style.opacity='1';
      button.style.cursor='pointer';
    });
  }
}

function renderCart(){
  if(!cartCount||!cartItems)return;
  saveCart();
  cartCount.textContent=cart.length;
  cartItems.innerHTML=cart.length?cart.map((item,i)=>{
    const entry=typeof item==='string'?{name:item}:item;
    const variant=entry.size?` · Black · ${entry.size}`:'';
    const price=Number(entry.price)>0?`<strong style="display:block;color:var(--acid);margin-top:4px;">£${Number(entry.price).toFixed(2)}</strong>`:'';
    return `<div class="cart-item"><span>${entry.name}${variant}${price}</span><button aria-label="Remove ${entry.name}" data-remove="${i}">×</button></div>`;
  }).join(''):'<p>Your cart is gloriously empty.</p>';
  cartItems.querySelectorAll('[data-remove]').forEach(btn=>btn.addEventListener('click',()=>{cart.splice(Number(btn.dataset.remove),1);renderCart();}));

  if(checkoutButton){
    checkoutButton.disabled=cart.length===0;
    checkoutButton.textContent=cart.length?'Secure checkout':'Your cart is empty';
  }
}
function openCart(){
  setMobileMenu(false);
  if(!cartDrawer||!cartBackdrop)return;
  cartDrawer.classList.add('open');
  cartBackdrop.classList.add('show');
  cartDrawer.setAttribute('aria-hidden','false');
}
function hideCart(){
  if(!cartDrawer||!cartBackdrop)return;
  cartDrawer.classList.remove('open');
  cartBackdrop.classList.remove('show');
  cartDrawer.setAttribute('aria-hidden','true');
}
if(cartButton)cartButton.addEventListener('click',openCart);
if(closeCart)closeCart.addEventListener('click',hideCart);
if(cartBackdrop)cartBackdrop.addEventListener('click',hideCart);
if(checkoutButton)checkoutButton.addEventListener('click',()=>{
  if(!cart.length)return;
  saveCart();
  window.location.href='checkout.html';
});

document.querySelectorAll('.add-cart').forEach(btn=>btn.addEventListener('click',()=>{
  if(btn.disabled)return;
  const supported=['Outlaw Tee','Virtual Degenerate Hoodie'];
  const product=btn.dataset.product||'Product';
  if(!supported.includes(product))return;
  cart.push({
    name:product,
    size:btn.dataset.size||'',
    sku:btn.dataset.sku||'',
    price:Number(btn.dataset.price||0)
  });
  renderCart();
  openCart();
}));

document.querySelectorAll('.add-cart').forEach(btn=>{
  const product=btn.dataset.product||'';
  if(['Troll Mode Cap','Rage Pack'].includes(product)){
    btn.disabled=true;
    btn.textContent='Coming soon';
    btn.style.opacity='.55';
    btn.style.cursor='not-allowed';
  }
});

document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){
    setMobileMenu(false);
    hideCart();
  }
});

const CREW_ENDPOINT='https://rage-bait-crew-signup.brokensoulsandbackroads.workers.dev/';
const signupForm=document.getElementById('signupForm');
const signupEmail=document.getElementById('email');
const formStatus=document.getElementById('formStatus');
const signupButton=signupForm?.querySelector('button[type="submit"]');

if(signupForm&&!document.querySelector('.signup-privacy-note')){
  const privacyNote=document.createElement('p');
  privacyNote.className='signup-privacy-note';
  privacyNote.style.cssText='max-width:760px;margin:10px 0 0;color:#8f988b;font-size:11px;line-height:1.55;';
  privacyNote.innerHTML='By signing up, you agree to receive marketing emails from <strong style="color:#cfd5cb;">Rage Bait Apparel</strong> about new drops, products, offers and news. You can unsubscribe at any time. Read our <a href="privacy.html" style="color:var(--acid);font-weight:800;text-decoration:none;">Privacy Policy</a>.';
  signupForm.insertAdjacentElement('afterend',privacyNote);
}

if(signupForm&&signupEmail&&formStatus&&signupButton)signupForm.addEventListener('submit',async(e)=>{
  e.preventDefault();

  const email=signupEmail.value.trim();
  if(!email)return;

  const originalLabel=signupButton.textContent;
  signupButton.disabled=true;
  signupButton.textContent='Joining...';
  formStatus.textContent='';

  try{
    const response=await fetch(CREW_ENDPOINT,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email,website:''})
    });

    let data={};
    try{data=await response.json();}catch(_){/* Worker returned no JSON */}

    if(!response.ok||!data.ok){
      throw new Error(data.error||'Signup failed. Please try again.');
    }

    if(data.status==='duplicate'){
      formStatus.textContent="You're already one of us.";
    }else{
      formStatus.textContent=`You're in. Welcome to the crew${data.count?` (#${data.count})`:''}.`;
      signupForm.reset();
    }
  }catch(error){
    console.error('Crew signup failed:',error);
    formStatus.textContent=error.message||'Signup failed. Please try again.';
  }finally{
    signupButton.disabled=false;
    signupButton.textContent=originalLabel;
  }
});

const footer=document.querySelector('footer');
if(footer){
  const stayProblematic=footer.lastElementChild;
  const oldPolicyLink=footer.querySelector('a[href="returns.html"]');
  if(oldPolicyLink&&oldPolicyLink.parentElement?.tagName==='P')oldPolicyLink.parentElement.remove();

  let footerLinks=footer.querySelector('.footer-links');
  if(!footerLinks){
    footerLinks=document.createElement('div');
    footerLinks.className='footer-links';
    footerLinks.style.cssText='display:flex;gap:14px;align-items:center;justify-content:center;flex-wrap:wrap;';
    footer.insertBefore(footerLinks,stayProblematic);
  }

  [
    ['size-guide.html','SIZE GUIDE'],
    ['shipping.html','SHIPPING'],
    ['returns.html','RETURNS'],
    ['privacy.html','PRIVACY'],
    ['terms.html','TERMS'],
    ['contact.html','CONTACT']
  ].forEach(([href,label])=>{
    if(!footerLinks.querySelector(`a[href="${href}"]`)){
      const link=document.createElement('a');
      link.href=href;
      link.textContent=label;
      link.style.cssText='color:var(--acid);text-decoration:none;font-weight:900;letter-spacing:.08em;';
      footerLinks.appendChild(link);
    }
  });

  const oldBusinessLink=footerLinks.querySelector('a[href="contact.html#business-information"]');
  if(oldBusinessLink)oldBusinessLink.remove();

  if(!footerLinks.querySelector('a[href="business-information.html"]')){
    const businessLink=document.createElement('a');
    businessLink.href='business-information.html';
    businessLink.textContent='Business Information';
    businessLink.style.cssText='color:#687066;text-decoration:none;font-size:9px;font-weight:600;letter-spacing:.06em;opacity:.72;text-transform:none;';
    footerLinks.appendChild(businessLink);
  }
}

renderCart();