(()=>{
  const current=document.currentScript?.src||'';
  let version='';
  try{version=new URL(current,window.location.href).search;}catch(_){/* no cache version */}

  const script=document.createElement('script');
  script.src=`app-core.js${version}`;
  script.onload=()=>document.dispatchEvent(new CustomEvent('ragebait:ready'));
  script.onerror=()=>console.error('Rage Bait app failed to initialise');
  document.body.appendChild(script);
})();
