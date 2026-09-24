(()=>{
  const REGIONS={
    GB:{label:'UK · GBP (£)',currency:'GBP',locale:'en-GB'},
    US:{label:'USA · USD ($)',currency:'USD',locale:'en-US'},
    EU:{label:'Europe · EUR (€)',currency:'EUR',locale:'en-IE'},
    CA:{label:'Canada · CAD ($)',currency:'CAD',locale:'en-CA'},
    AU:{label:'Australia · AUD ($)',currency:'AUD',locale:'en-AU'}
  };

  const STORE_KEY='ragebait-region';
  const FX_CACHE_PREFIX='ragebait-fx-';
  const grid=document.querySelector('.product-grid');
  const cartItems=document.getElementById('cartItems');
  const header=document.querySelector('.site-header');
  const cartButton=document.getElementById('cartButton');
  let painting=false;

  let regionKey=localStorage.getItem(STORE_KEY);
  if(!REGIONS[regionKey])regionKey='GB';
  let activeRegion=REGIONS[regionKey];
  let activeRate=activeRegion.currency==='GBP'?1:null;

  const parseAmount=value=>{
    if(value==null)return NaN;
    const match=String(value).replace(/,/g,'').match(/-?\d+(?:\.\d+)?/);
    return match?Number(match[0]):NaN;
  };

  const formatGBP=amount=>{
    const base=Number(amount);
    if(!Number.isFinite(base))return '';
    if(activeRegion.currency!=='GBP'&&!(activeRate>0)){
      return new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(base);
    }
    const converted=base*(activeRate||1);
    return new Intl.NumberFormat(activeRegion.locale,{
      style:'currency',
      currency:activeRegion.currency,
      currencyDisplay:'narrowSymbol',
      minimumFractionDigits:2,
      maximumFractionDigits:2
    }).format(converted);
  };

  function seedProductPrices(){
    document.querySelectorAll('.product-card').forEach(card=>{
      const strong=card.querySelector('.product-info strong');
      const button=card.querySelector('.add-cart');
      if(!strong)return;

      let base=Number(button?.dataset.price);
      if(!(base>0))base=Number(strong.dataset.gbp);
      if(!(base>0))base=parseAmount(strong.textContent);
      if(!(base>0))return;

      strong.dataset.gbp=base.toFixed(2);
      if(button&&!(Number(button.dataset.price)>0))button.dataset.price=base.toFixed(2);
    });
  }

  function paintProducts(){
    seedProductPrices();
    document.querySelectorAll('.product-card').forEach(card=>{
      const strong=card.querySelector('.product-info strong');
      const button=card.querySelector('.add-cart');
      if(!strong)return;

      const buttonPrice=Number(button?.dataset.price);
      const stored=Number(strong.dataset.gbp);
      const base=buttonPrice>0?buttonPrice:stored;
      if(!(base>0))return;

      strong.dataset.gbp=base.toFixed(2);
      const rendered=formatGBP(base);
      if(strong.textContent!==rendered)strong.textContent=rendered;
    });

    const hoodieCard=Array.from(document.querySelectorAll('.product-card')).find(card=>card.querySelector('.product-info h3')?.textContent.trim()==='Virtual Degenerate Hoodie');
    if(hoodieCard){
      const note=hoodieCard.querySelector('.product-info p span');
      const noteText=`VAT included · shipping extra · 3XL–5XL +${formatGBP(1)}`;
      if(note&&note.textContent!==noteText)note.textContent=noteText;

      hoodieCard.querySelectorAll('.hoodie-size-picker option').forEach(option=>{
        if(['3XL','4XL','5XL'].includes(option.value)){
          const label=`${option.value} (+${formatGBP(1)})`;
          if(option.textContent!==label)option.textContent=label;
        }
      });
    }
  }

  function paintCart(){
    if(!cartItems)return;
    cartItems.querySelectorAll('.cart-item strong').forEach(strong=>{
      let base=Number(strong.dataset.gbp);
      if(!(base>0))base=parseAmount(strong.textContent);
      if(!(base>0))return;
      strong.dataset.gbp=base.toFixed(2);
      const rendered=formatGBP(base);
      if(strong.textContent!==rendered)strong.textContent=rendered;
    });
  }

  function paint(){
    if(painting)return;
    painting=true;
    try{
      paintProducts();
      paintCart();
    }finally{
      painting=false;
    }
  }

  function addStyles(){
    if(document.getElementById('ragebaitCurrencyStyles'))return;
    const style=document.createElement('style');
    style.id='ragebaitCurrencyStyles';
    style.textContent=`
      .currency-picker{display:flex;align-items:center;gap:7px;margin-left:auto;margin-right:10px;color:#aeb6aa;font:800 10px/1 Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
      .currency-picker select{appearance:auto;background:#090b09;color:#fff;border:1px solid #394038;border-radius:2px;padding:9px 28px 9px 9px;font:800 11px/1 Inter,sans-serif;cursor:pointer;outline:none}
      .currency-picker select:focus{border-color:var(--acid);box-shadow:0 0 0 1px var(--acid)}
      @media(max-width:980px){.currency-picker{margin-left:0;margin-right:6px}.currency-picker>span{display:none}.currency-picker select{max-width:112px;padding:8px 22px 8px 8px;font-size:10px}}
      @media(max-width:560px){.currency-picker select{max-width:88px}.currency-picker option{font-size:12px}}
    `;
    document.head.appendChild(style);
  }

  function buildSelector(){
    if(!header||!cartButton||document.getElementById('currencyRegion'))return;
    addStyles();
    const label=document.createElement('label');
    label.className='currency-picker';
    label.innerHTML='<span>Region</span>';

    const select=document.createElement('select');
    select.id='currencyRegion';
    select.setAttribute('aria-label','Choose region and display currency');
    select.title='Choose region and display currency';
    select.innerHTML=Object.entries(REGIONS).map(([key,region])=>`<option value="${key}">${region.label}</option>`).join('');
    select.value=regionKey;
    label.appendChild(select);
    header.insertBefore(label,cartButton);

    select.addEventListener('change',()=>setRegion(select.value));
  }

  function readCachedRate(code){
    try{
      const cached=JSON.parse(localStorage.getItem(`${FX_CACHE_PREFIX}${code}`)||'null');
      return cached&&Number(cached.rate)>0?cached:null;
    }catch(_){return null;}
  }

  function saveRate(code,rate,date){
    try{
      localStorage.setItem(`${FX_CACHE_PREFIX}${code}`,JSON.stringify({rate:Number(rate),date:date||'',savedAt:Date.now()}));
    }catch(_){/* Storage may be blocked */}
  }

  async function setRegion(nextKey,{persist=true}={}){
    if(!REGIONS[nextKey])nextKey='GB';
    regionKey=nextKey;
    activeRegion=REGIONS[regionKey];
    const selector=document.getElementById('currencyRegion');
    if(selector&&selector.value!==regionKey)selector.value=regionKey;
    if(persist){
      try{localStorage.setItem(STORE_KEY,regionKey);}catch(_){/* Storage may be blocked */}
    }

    if(activeRegion.currency==='GBP'){
      activeRate=1;
      paint();
      document.dispatchEvent(new CustomEvent('ragebait:currencychange',{detail:{region:regionKey,currency:'GBP',rate:1}}));
      return;
    }

    const cached=readCachedRate(activeRegion.currency);
    activeRate=cached?.rate||null;
    if(activeRate)paint();

    try{
      const code=activeRegion.currency.toLowerCase();
      const response=await fetch(`https://api.frankfurter.dev/v2/rate/gbp/${code}`,{headers:{Accept:'application/json'}});
      if(!response.ok)throw new Error(`FX request failed: ${response.status}`);
      const data=await response.json();
      if(!(Number(data.rate)>0))throw new Error('FX response did not contain a valid rate');
      activeRate=Number(data.rate);
      saveRate(activeRegion.currency,activeRate,data.date);
      paint();
      document.dispatchEvent(new CustomEvent('ragebait:currencychange',{detail:{region:regionKey,currency:activeRegion.currency,rate:activeRate,date:data.date||''}}));
    }catch(error){
      console.warn('Currency conversion unavailable:',error);
      if(!activeRate){
        regionKey='GB';
        activeRegion=REGIONS.GB;
        activeRate=1;
        if(selector)selector.value='GB';
        try{localStorage.setItem(STORE_KEY,'GB');}catch(_){/* Storage may be blocked */}
        paint();
      }
    }
  }

  window.RageBaitCurrency={
    formatGBP,
    refresh:paint,
    get region(){return regionKey;},
    get currency(){return activeRegion.currency;},
    get rate(){return activeRate;}
  };

  buildSelector();
  seedProductPrices();

  if(grid){
    const productObserver=new MutationObserver(()=>{
      if(!painting)queueMicrotask(paintProducts);
    });
    productObserver.observe(grid,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-price']});
  }

  if(cartItems){
    const cartObserver=new MutationObserver(()=>{
      if(!painting)queueMicrotask(paintCart);
    });
    cartObserver.observe(cartItems,{subtree:true,childList:true,characterData:true});
  }

  document.addEventListener('change',event=>{
    if(event.target?.matches?.('.hoodie-size-picker select,.outlaw-size-picker select'))queueMicrotask(paintProducts);
  });

  setRegion(regionKey,{persist:false});
})();
