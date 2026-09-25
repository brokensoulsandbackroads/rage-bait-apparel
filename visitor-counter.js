(()=>{
  const ENDPOINT='https://rage-bait-twofifteen.brokensoulsandbackroads.workers.dev/stats/visit';
  const STORAGE_KEY='ragebait:last-counted-visit';
  const DAY_MS=24*60*60*1000;

  const mount=()=>{
    const footer=document.querySelector('footer');
    if(!footer || document.getElementById('ragebaitVisitorCounter')) return;

    const counter=document.createElement('p');
    counter.id='ragebaitVisitorCounter';
    counter.setAttribute('aria-live','polite');
    counter.style.cssText='margin:0;color:var(--acid);font-weight:900;letter-spacing:.12em;font-size:12px;text-transform:uppercase;';
    counter.textContent='TROLLS THROUGH THE DOOR · ...';
    footer.appendChild(counter);

    let shouldCount=true;
    try{
      const last=Number(localStorage.getItem(STORAGE_KEY)||0);
      shouldCount=!last || (Date.now()-last)>=DAY_MS;
    }catch(_){/* storage unavailable: count this visit */}

    fetch(ENDPOINT,{
      method:shouldCount?'POST':'GET',
      headers:{'Content-Type':'application/json'},
      cache:'no-store'
    })
      .then(r=>r.ok?r.json():Promise.reject(new Error('counter unavailable')))
      .then(data=>{
        const count=Number(data.visitors||0);
        counter.textContent=`TROLLS THROUGH THE DOOR · ${count.toLocaleString('en-GB')}`;
        if(shouldCount){
          try{localStorage.setItem(STORAGE_KEY,String(Date.now()));}catch(_){}
        }
      })
      .catch(()=>{
        counter.textContent='TROLLS THROUGH THE DOOR';
      });
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();
