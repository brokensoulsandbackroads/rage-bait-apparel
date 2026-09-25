(()=>{
  const CART_KEY='ragebait-cart-v1';
  const apiBase=(document.querySelector('meta[name="checkout-api"]')?.content||'').replace(/\/$/,'');
  const form=document.getElementById('checkoutForm');
  const itemsEl=document.getElementById('checkoutItems');
  const subtotalEl=document.getElementById('subtotal');
  const shippingEl=document.getElementById('shipping');
  const totalEl=document.getElementById('grandTotal');
  const statusEl=document.getElementById('checkoutStatus');
  const successEl=document.getElementById('checkoutSuccess');
  const successMessage=document.getElementById('successMessage');
  const checkoutGrid=document.querySelector('.checkout-grid');

  const EU_CODES=new Set(['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE']);
  const SHIPPING={UK:3.59,EU:9.54,ROW:11.16};
  const PRODUCT_MAP={
    'Outlaw Tee':{slug:'outlaw-tee',priceBySize:{S:29.99,M:29.99,L:29.99,XL:29.99,'2XL':29.99,'3XL':29.99,'4XL':29.99}},
    'Virtual Degenerate Tee':{slug:'virtual-degenerate-tee',priceBySize:{S:29.99,M:29.99,L:29.99,XL:29.99,'2XL':29.99,'3XL':29.99,'4XL':29.99}},
    'Pretty Little Problem Cropped Tee':{slug:'pretty-little-problem-cropped-tee',priceBySize:{XS:24.99,S:24.99,M:24.99,L:24.99,XL:24.99}},
    'Virtual Degenerate Hoodie':{slug:'virtual-degenerate-hoodie',priceBySize:{XS:44.99,S:44.99,M:44.99,L:44.99,XL:44.99,'2XL':44.99,'3XL':45.99,'4XL':45.99,'5XL':45.99}},
    'Outlaw Hoodie':{slug:'outlaw-hoodie',priceBySize:{XS:44.99,S:44.99,M:44.99,L:44.99,XL:44.99,'2XL':44.99,'3XL':45.99,'4XL':45.99,'5XL':45.99}},
    'Pretty Little Problem Hoodie':{slug:'pretty-little-problem-hoodie',priceBySize:{XS:39.99,S:39.99,M:39.99,L:39.99,XL:39.99,'2XL':39.99}}
  };

  const money=value=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(Number(value)||0);

  function readCart(){
    try{
      const parsed=JSON.parse(localStorage.getItem(CART_KEY)||'[]');
      return Array.isArray(parsed)?parsed:[];
    }catch(_){return [];}
  }

  function normaliseCart(raw){
    const grouped=new Map();
    for(const item of raw){
      const product=PRODUCT_MAP[item?.name];
      const size=String(item?.size||'').toUpperCase();
      if(!product||!product.priceBySize[size])continue;
      const key=`${product.slug}|${size}`;
      const existing=grouped.get(key)||{product:product.slug,name:item.name,size,quantity:0,unitPrice:product.priceBySize[size]};
      existing.quantity+=1;
      grouped.set(key,existing);
    }
    return [...grouped.values()];
  }

  const cart=normaliseCart(readCart());

  function currentShipping(){
    const code=form?.elements.countryCode?.value||'GB';
    if(code==='GB')return SHIPPING.UK;
    if(EU_CODES.has(code))return SHIPPING.EU;
    return SHIPPING.ROW;
  }

  function renderSummary(serverSummary=null){
    if(!itemsEl)return;
    if(!cart.length){
      itemsEl.innerHTML='<div class="checkout-empty">Your cart is empty. <a href="index.html#products">Go back and cause a problem →</a></div>';
      subtotalEl.textContent=money(0);
      shippingEl.textContent=money(0);
      totalEl.textContent=money(0);
      return;
    }

    itemsEl.innerHTML=cart.map(item=>`
      <div class="checkout-line">
        <div><h3>${item.name}</h3><p>${item.size}${item.quantity>1?` · Qty ${item.quantity}`:''}</p></div>
        <strong>${money(item.unitPrice*item.quantity)}</strong>
      </div>`).join('');

    const localSubtotal=cart.reduce((sum,item)=>sum+(item.unitPrice*item.quantity),0);
    const shipping=currentShipping();
    subtotalEl.textContent=money(serverSummary?.subtotal??localSubtotal);
    shippingEl.textContent=money(serverSummary?.shipping??shipping);
    totalEl.textContent=money(serverSummary?.total??(localSubtotal+shipping));
  }

  function shippingPayload(){
    const data=new FormData(form);
    return {
      firstName:String(data.get('firstName')||'').trim(),
      lastName:String(data.get('lastName')||'').trim(),
      address1:String(data.get('address1')||'').trim(),
      address2:String(data.get('address2')||'').trim(),
      city:String(data.get('city')||'').trim(),
      county:String(data.get('county')||'').trim(),
      postcode:String(data.get('postcode')||'').trim(),
      countryCode:String(data.get('countryCode')||'').trim().toUpperCase(),
      phone1:String(data.get('phone')||'').trim(),
      phone2:''
    };
  }

  function buyerEmail(){return String(new FormData(form).get('email')||'').trim();}
  function orderItems(){return cart.map(({product,size,quantity})=>({product,size,quantity}));}

  function setStatus(message,type=''){
    statusEl.textContent=message;
    statusEl.className=`checkout-status${type?` ${type}`:''}`;
  }

  async function api(path,options={}){
    const response=await fetch(`${apiBase}${path}`,{
      ...options,
      headers:{'Content-Type':'application/json',...(options.headers||{})}
    });
    let data={};
    try{data=await response.json();}catch(_){/* non-json response */}
    if(!response.ok){
      const error=new Error(data.error||`Checkout request failed (${response.status})`);
      error.data=data;
      error.status=response.status;
      throw error;
    }
    return data;
  }

  function loadPayPal(clientId){
    return new Promise((resolve,reject)=>{
      if(window.paypal)return resolve();
      const script=document.createElement('script');
      script.src=`https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=GBP&intent=capture&components=buttons`;
      script.async=true;
      script.onload=()=>resolve();
      script.onerror=()=>reject(new Error('PayPal could not be loaded. Please check your connection and try again.'));
      document.head.appendChild(script);
    });
  }

  async function init(){
    renderSummary();
    form?.elements.countryCode?.addEventListener('change',()=>renderSummary());

    if(!cart.length){
      setStatus('Add a product to your cart before checking out.','error');
      return;
    }
    if(!apiBase){
      setStatus('Checkout service is not configured yet.','error');
      return;
    }

    try{
      const config=await api('/checkout/config',{method:'GET',headers:{}});
      if(!config.enabled){
        setStatus(config.message||'Checkout is being connected. No payment can be taken yet.','error');
        return;
      }
      if(!config.paypalClientId)throw new Error('PayPal client ID is not configured.');

      await loadPayPal(config.paypalClientId);
      setStatus('Enter your delivery details, then choose PayPal or an available PayPal payment option.');

      window.paypal.Buttons({
        style:{layout:'vertical',shape:'rect',label:'paypal',height:45},
        onClick(_data,actions){
          if(!form.reportValidity()){
            setStatus('Please complete the delivery details before paying.','error');
            return actions.reject();
          }
          if(!form.elements.terms.checked){
            setStatus('Please accept the store terms before paying.','error');
            return actions.reject();
          }
          setStatus('Opening secure PayPal checkout…');
          return actions.resolve();
        },
        async createOrder(){
          const result=await api('/checkout/create',{method:'POST',body:JSON.stringify({
            buyerEmail:buyerEmail(),
            shippingAddress:shippingPayload(),
            items:orderItems()
          })});
          renderSummary(result.summary);
          return result.paypalOrderId;
        },
        async onApprove(data){
          setStatus('Payment approved. Confirming it securely…');
          try{
            const result=await api('/checkout/capture',{method:'POST',body:JSON.stringify({paypalOrderId:data.orderID})});
            localStorage.removeItem(CART_KEY);
            if(checkoutGrid)checkoutGrid.hidden=true;
            if(successEl)successEl.hidden=false;
            if(successMessage)successMessage.textContent=`Your order number is ${result.orderNumber}. Payment has been confirmed and the order has been queued for fulfilment.`;
            window.scrollTo({top:0,behavior:'smooth'});
          }catch(error){
            if(error.data?.paymentCaptured){
              setStatus('Your payment was received, but automatic fulfilment needs attention. Do not pay again. Please contact crew@ragebaitapparel.co.uk with your PayPal order ID.','error');
            }else{
              setStatus(error.message||'Payment could not be completed. Please try again.','error');
            }
          }
        },
        onCancel(){setStatus('Payment cancelled. Nothing has been charged.');},
        onError(error){
          console.error('PayPal checkout error:',error);
          setStatus('PayPal hit a problem. Nothing has been submitted to fulfilment. Please try again.','error');
        }
      }).render('#paypal-button-container');
    }catch(error){
      console.error('Checkout initialisation failed:',error);
      setStatus(error.message||'Secure checkout is temporarily unavailable.','error');
    }
  }

  init();
})();