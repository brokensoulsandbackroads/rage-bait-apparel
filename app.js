(()=>{
  const current=document.currentScript?.src||'';
  let version='';
  try{version=new URL(current,window.location.href).search;}catch(_){/* no cache version */}

  const loadScript=src=>new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src=`${src}${version}`;
    script.onload=resolve;
    script.onerror=()=>reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });

  loadScript('app-core.js')
    .then(()=>loadScript('outlaw-carousel.js'))
    .catch(error=>console.error('Rage Bait app failed to initialise:',error));
})();
