(()=>{
  if(document.getElementById('rageMusicButton')) return;

  const TRACK='assets/rage-bait-theme.mp3';
  const STATE_KEY='ragebait-music-enabled-v1';
  const TIME_KEY='ragebait-music-time-v1';

  const style=document.createElement('style');
  style.textContent=`
    .rage-music-button{
      position:fixed;right:20px;bottom:20px;z-index:98;
      display:inline-flex;align-items:center;gap:9px;
      min-height:46px;padding:0 15px;
      border:1px solid rgba(140,255,0,.62);
      background:rgba(8,9,8,.94);color:#f4f6f0;
      box-shadow:0 0 0 1px rgba(0,0,0,.65),0 8px 28px rgba(0,0,0,.45),0 0 24px rgba(140,255,0,.10);
      backdrop-filter:blur(12px);
      font:900 11px/1 Inter,Arial,sans-serif;
      letter-spacing:.11em;text-transform:uppercase;
      cursor:pointer;transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease,color .16s ease,bottom .18s ease;
    }
    .rage-music-button:hover{transform:translateY(-2px);border-color:#8cff00;box-shadow:0 10px 30px rgba(0,0,0,.5),0 0 28px rgba(140,255,0,.18)}
    .rage-music-button:focus-visible{outline:2px solid #8cff00;outline-offset:3px}
    .rage-music-button .rage-music-dot{width:8px;height:8px;border-radius:50%;background:#5e6759;box-shadow:0 0 0 3px rgba(94,103,89,.12);transition:.16s ease}
    .rage-music-button.is-on{color:#8cff00;border-color:#8cff00}
    .rage-music-button.is-on .rage-music-dot{background:#8cff00;box-shadow:0 0 12px rgba(140,255,0,.85),0 0 0 3px rgba(140,255,0,.12)}
    .rage-music-button.is-unavailable{opacity:.48;cursor:not-allowed}
    @media(max-width:620px){.rage-music-button{right:12px;bottom:12px;min-height:42px;padding:0 12px;font-size:10px;letter-spacing:.08em}}
  `;
  document.head.appendChild(style);

  const audio=document.createElement('audio');
  audio.id='rageBackgroundMusic';
  audio.src=TRACK;
  audio.loop=true;
  audio.preload='metadata';
  audio.volume=.18;
  document.body.appendChild(audio);

  const button=document.createElement('button');
  button.id='rageMusicButton';
  button.className='rage-music-button';
  button.type='button';
  button.setAttribute('aria-label','Toggle Rage Bait background music');
  button.setAttribute('aria-pressed','false');
  button.innerHTML='<span class="rage-music-dot" aria-hidden="true"></span><span class="rage-music-label">RAGE MODE: OFF</span>';
  document.body.appendChild(button);

  const keepClearOfFooter=()=>{
    const footer=document.querySelector('footer');
    const base=window.innerWidth<=620?12:20;
    if(!footer){button.style.bottom=`${base}px`;return;}

    const rect=footer.getBoundingClientRect();
    const footerVisible=rect.top<window.innerHeight&&rect.bottom>0;
    if(!footerVisible){button.style.bottom=`${base}px`;return;}

    const clearance=12;
    const liftedBottom=(window.innerHeight-rect.top)+clearance;
    const maxBottom=Math.max(base,window.innerHeight-button.offsetHeight-clearance);
    button.style.bottom=`${Math.min(Math.max(base,liftedBottom),maxBottom)}px`;
  };

  let positionFrame=0;
  const schedulePosition=()=>{
    if(positionFrame) return;
    positionFrame=requestAnimationFrame(()=>{
      positionFrame=0;
      keepClearOfFooter();
    });
  };
  window.addEventListener('scroll',schedulePosition,{passive:true});
  window.addEventListener('resize',schedulePosition,{passive:true});
  schedulePosition();

  const label=button.querySelector('.rage-music-label');
  let wantedOn=false;
  let saveTimer=0;

  try{
    wantedOn=localStorage.getItem(STATE_KEY)==='on';
    const savedTime=Number(localStorage.getItem(TIME_KEY)||0);
    if(Number.isFinite(savedTime)&&savedTime>0) audio.currentTime=savedTime;
  }catch(_){/* storage unavailable */}

  const render=on=>{
    button.classList.toggle('is-on',on);
    button.setAttribute('aria-pressed',String(on));
    label.textContent=on?'RAGE MODE: ON':'RAGE MODE: OFF';
  };

  const persistState=()=>{
    try{localStorage.setItem(STATE_KEY,wantedOn?'on':'off');}catch(_){/* storage unavailable */}
  };

  const play=async()=>{
    try{
      await audio.play();
      wantedOn=true;
      persistState();
      render(true);
      return true;
    }catch(_){
      render(false);
      return false;
    }
  };

  const pause=()=>{
    wantedOn=false;
    audio.pause();
    persistState();
    render(false);
  };

  button.addEventListener('click',async()=>{
    if(button.classList.contains('is-unavailable')) return;
    if(audio.paused) await play();
    else pause();
  });

  audio.addEventListener('timeupdate',()=>{
    const now=Date.now();
    if(now-saveTimer<2000) return;
    saveTimer=now;
    try{localStorage.setItem(TIME_KEY,String(audio.currentTime||0));}catch(_){/* storage unavailable */}
  });

  audio.addEventListener('error',()=>{
    wantedOn=false;
    render(false);
    button.classList.add('is-unavailable');
    button.title='Rage Bait soundtrack file not uploaded yet';
  });

  if(wantedOn){
    render(true);
    play().then(started=>{
      if(started) return;
      wantedOn=true;
      render(true);
      const resume=()=>{
        if(!wantedOn) return;
        play();
      };
      document.addEventListener('pointerdown',resume,{once:true,capture:true});
      document.addEventListener('keydown',resume,{once:true,capture:true});
    });
  }else{
    render(false);
  }
})();
