const cart=[];
const cartButton=document.getElementById('cartButton');
const cartDrawer=document.getElementById('cartDrawer');
const cartBackdrop=document.getElementById('cartBackdrop');
const closeCart=document.getElementById('closeCart');
const cartCount=document.getElementById('cartCount');
const cartItems=document.getElementById('cartItems');

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

function renderCart(){
  cartCount.textContent=cart.length;
  cartItems.innerHTML=cart.length?cart.map((item,i)=>`<div class="cart-item"><span>${item}</span><button aria-label="Remove ${item}" data-remove="${i}">×</button></div>`).join(''):'<p>Your cart is gloriously empty.</p>';
  cartItems.querySelectorAll('[data-remove]').forEach(btn=>btn.addEventListener('click',()=>{cart.splice(Number(btn.dataset.remove),1);renderCart();}));
}
function openCart(){setMobileMenu(false);cartDrawer.classList.add('open');cartBackdrop.classList.add('show');cartDrawer.setAttribute('aria-hidden','false');}
function hideCart(){cartDrawer.classList.remove('open');cartBackdrop.classList.remove('show');cartDrawer.setAttribute('aria-hidden','true');}
cartButton.addEventListener('click',openCart);closeCart.addEventListener('click',hideCart);cartBackdrop.addEventListener('click',hideCart);
document.querySelectorAll('.add-cart').forEach(btn=>btn.addEventListener('click',()=>{cart.push(btn.dataset.product);renderCart();openCart();}));

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
const signupButton=signupForm.querySelector('button[type="submit"]');

if(signupForm&&!document.querySelector('.signup-privacy-note')){
  const privacyNote=document.createElement('p');
  privacyNote.className='signup-privacy-note';
  privacyNote.style.cssText='max-width:760px;margin:10px 0 0;color:#8f988b;font-size:11px;line-height:1.55;';
  privacyNote.innerHTML='By signing up, you agree to receive marketing emails from <strong style="color:#cfd5cb;">Rage Bait Apparel</strong> about new drops, products, offers and news. You can unsubscribe at any time. Read our <a href="privacy.html" style="color:var(--acid);font-weight:800;text-decoration:none;">Privacy Policy</a>.';
  signupForm.insertAdjacentElement('afterend',privacyNote);
}

signupForm.addEventListener('submit',async(e)=>{
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

  if(!footerLinks.querySelector('a[href="contact.html#business-information"]')){
    const businessLink=document.createElement('a');
    businessLink.href='contact.html#business-information';
    businessLink.textContent='Business Information';
    businessLink.style.cssText='color:#687066;text-decoration:none;font-size:9px;font-weight:600;letter-spacing:.06em;opacity:.72;text-transform:none;';
    footerLinks.appendChild(businessLink);
  }
}

renderCart();