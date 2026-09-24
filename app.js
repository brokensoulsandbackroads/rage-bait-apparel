(()=>{
  const current=document.currentScript?.src||'';
  let version='';
  try{version=new URL(current,window.location.href).search;}catch(_){/* no cache version */}

  const script=document.createElement('script');
  script.src=`app-core.js${version}`;
  script.onload=()=>{
    document.dispatchEvent(new CustomEvent('ragebait:ready'));

    const hoodieScript=document.createElement('script');
    hoodieScript.src=`virtual-degenerate.js${version}`;
    hoodieScript.onerror=()=>console.error('Virtual Degenerate Hoodie failed to initialise');
    document.body.appendChild(hoodieScript);
  };
  script.onerror=()=>console.error('Rage Bait app failed to initialise');
  document.body.appendChild(script);
})();
