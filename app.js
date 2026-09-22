const cart=[];
const cartButton=document.getElementById('cartButton');
const cartDrawer=document.getElementById('cartDrawer');
const cartBackdrop=document.getElementById('cartBackdrop');
const closeCart=document.getElementById('closeCart');
const cartCount=document.getElementById('cartCount');
const cartItems=document.getElementById('cartItems');

function renderCart(){
  cartCount.textContent=cart.length;
  cartItems.innerHTML=cart.length?cart.map((item,i)=>`<div class="cart-item"><span>${item}</span><button aria-label="Remove ${item}" data-remove="${i}">×</button></div>`).join(''):'<p>Your cart is gloriously empty.</p>';
  cartItems.querySelectorAll('[data-remove]').forEach(btn=>btn.addEventListener('click',()=>{cart.splice(Number(btn.dataset.remove),1);renderCart();}));
}
function openCart(){cartDrawer.classList.add('open');cartBackdrop.classList.add('show');cartDrawer.setAttribute('aria-hidden','false');}
function hideCart(){cartDrawer.classList.remove('open');cartBackdrop.classList.remove('show');cartDrawer.setAttribute('aria-hidden','true');}
cartButton.addEventListener('click',openCart);closeCart.addEventListener('click',hideCart);cartBackdrop.addEventListener('click',hideCart);
document.querySelectorAll('.add-cart').forEach(btn=>btn.addEventListener('click',()=>{cart.push(btn.dataset.product);renderCart();openCart();}));

const CREW_ENDPOINT='https://rage-bait-crew-signup.brokensoulsandbackroads.workers.dev/';
const signupForm=document.getElementById('signupForm');
const signupEmail=document.getElementById('email');
const formStatus=document.getElementById('formStatus');
const signupButton=signupForm.querySelector('button[type="submit"]');

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
if(footer&&!footer.querySelector('a[href="shipping.html"]')){
  const shippingItem=document.createElement('p');
  shippingItem.innerHTML='<a href="shipping.html" style="color:var(--acid);text-decoration:none;font-weight:800;">SHIPPING & DELIVERY</a>';
  const stayProblematic=footer.lastElementChild;
  footer.insertBefore(shippingItem,stayProblematic);
}

renderCart();