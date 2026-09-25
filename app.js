(()=>{
  const current=document.currentScript?.src||'';
  let version='';
  try{version=new URL(current,window.location.href).search;}catch(_){/* no cache version */}

  const loadCurrency=()=>{
    const currencyScript=document.createElement('script');
    currencyScript.src=`currency.js${version}`;
    currencyScript.onerror=()=>console.error('Rage Bait currency selector failed to initialise');
    document.body.appendChild(currencyScript);
  };

  const loadOutlawHoodie=()=>{
    const outlawHoodieScript=document.createElement('script');
    outlawHoodieScript.src=`outlaw-hoodie.js${version}`;
    outlawHoodieScript.onload=loadCurrency;
    outlawHoodieScript.onerror=()=>{
      console.error('Outlaw Hoodie failed to initialise');
      loadCurrency();
    };
    document.body.appendChild(outlawHoodieScript);
  };

  const script=document.createElement('script');
  script.src=`app-core.js${version}`;
  script.onload=()=>{
    const duplicateBusinessLink=document.querySelector('footer .footer-links a[href="business-information.html"]');
    if(duplicateBusinessLink)duplicateBusinessLink.remove();

    document.dispatchEvent(new CustomEvent('ragebait:ready'));

    const hoodieScript=document.createElement('script');
    hoodieScript.src=`virtual-degenerate.js${version}`;
    hoodieScript.onload=loadOutlawHoodie;
    hoodieScript.onerror=()=>{
      console.error('Virtual Degenerate Hoodie failed to initialise');
      loadOutlawHoodie();
    };
    document.body.appendChild(hoodieScript);
  };
  script.onerror=()=>console.error('Rage Bait app failed to initialise');
  document.body.appendChild(script);
})();
