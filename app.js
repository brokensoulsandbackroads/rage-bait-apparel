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

document.getElementById('signupForm').addEventListener('submit',(e)=>{
  e.preventDefault();
  const email=document.getElementById('email').value.trim();
  document.getElementById('formStatus').textContent=email?`You're on the list. ${email}`:'';
  if(email)e.target.reset();
});
renderCart();