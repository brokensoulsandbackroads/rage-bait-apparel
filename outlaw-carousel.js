(()=>{
  const outlawCard=document.querySelector('.product-grid .product-card');
  if(!outlawCard)return;

  const image=outlawCard.querySelector('.product-photo, .product-image');
  if(!image)return;

  const slides=[
    {src:'assets/outlaw-gallery-male-front.webp',alt:'Outlaw Tee front view on male model'},
    {src:'assets/outlaw-gallery-female-front.webp',alt:'Outlaw Tee front view on female model'},
    {src:'assets/outlaw-gallery-male-back.webp',alt:'Outlaw Tee back view on male model'},
    {src:'assets/outlaw-gallery-female-back.webp',alt:'Outlaw Tee back view on female model'}
  ];

  let activeSlide=0;
  let carouselTimer=null;
  let touchStartX=0;
  const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  image.className='product-photo outlaw-carousel';
  image.style.cssText='aspect-ratio:1/1;background:#080908;position:relative;overflow:hidden;touch-action:pan-y;';
  image.innerHTML=`
    <div class="outlaw-carousel-track" style="width:100%;height:100%;position:relative;"></div>
    <button type="button" class="outlaw-carousel-prev" aria-label="Previous Outlaw Tee image" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);z-index:3;width:36px;height:36px;border:1px solid rgba(255,255,255,.3);border-radius:999px;background:rgba(0,0,0,.62);color:#fff;font-size:23px;line-height:1;cursor:pointer;">‹</button>
    <button type="button" class="outlaw-carousel-next" aria-label="Next Outlaw Tee image" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);z-index:3;width:36px;height:36px;border:1px solid rgba(255,255,255,.3);border-radius:999px;background:rgba(0,0,0,.62);color:#fff;font-size:23px;line-height:1;cursor:pointer;">›</button>
    <div class="outlaw-carousel-dots" aria-label="Outlaw Tee image gallery" style="position:absolute;left:50%;bottom:10px;transform:translateX(-50%);z-index:3;display:flex;gap:7px;"></div>
  `;

  const track=image.querySelector('.outlaw-carousel-track');
  const dots=image.querySelector('.outlaw-carousel-dots');
  const prev=image.querySelector('.outlaw-carousel-prev');
  const next=image.querySelector('.outlaw-carousel-next');

  slides.forEach((slide,index)=>{
    const img=document.createElement('img');
    img.src=slide.src;
    img.alt=slide.alt;
    img.loading=index===0?'eager':'lazy';
    img.draggable=false;
    img.style.cssText=`position:absolute;inset:0;width:100%;height:100%;object-fit:contain;padding:8px;opacity:${index===0?'1':'0'};transition:opacity .45s ease;user-select:none;`;
    track.appendChild(img);

    const dot=document.createElement('button');
    dot.type='button';
    dot.setAttribute('aria-label',`Show Outlaw Tee image ${index+1}`);
    dot.style.cssText=`width:8px;height:8px;border:0;border-radius:999px;padding:0;background:${index===0?'var(--acid)':'rgba(255,255,255,.55)'};cursor:pointer;box-shadow:0 0 0 1px rgba(0,0,0,.35);`;
    dot.dataset.slide=String(index);
    dots.appendChild(dot);
  });

  const renderSlide=index=>{
    activeSlide=(index+slides.length)%slides.length;
    track.querySelectorAll('img').forEach((img,i)=>{img.style.opacity=i===activeSlide?'1':'0';});
    dots.querySelectorAll('button').forEach((dot,i)=>{dot.style.background=i===activeSlide?'var(--acid)':'rgba(255,255,255,.55)';});
  };

  const stopCarousel=()=>{
    if(carouselTimer){clearInterval(carouselTimer);carouselTimer=null;}
  };
  const startCarousel=()=>{
    stopCarousel();
    if(!reduceMotion)carouselTimer=setInterval(()=>renderSlide(activeSlide+1),4000);
  };
  const manualMove=delta=>{
    renderSlide(activeSlide+delta);
    startCarousel();
  };

  prev.addEventListener('click',event=>{event.stopPropagation();manualMove(-1);});
  next.addEventListener('click',event=>{event.stopPropagation();manualMove(1);});
  dots.querySelectorAll('button').forEach(dot=>dot.addEventListener('click',event=>{
    event.stopPropagation();
    renderSlide(Number(dot.dataset.slide));
    startCarousel();
  }));

  image.addEventListener('mouseenter',stopCarousel);
  image.addEventListener('mouseleave',startCarousel);
  image.addEventListener('focusin',stopCarousel);
  image.addEventListener('focusout',startCarousel);
  image.addEventListener('touchstart',event=>{
    stopCarousel();
    touchStartX=event.changedTouches[0]?.clientX??0;
  },{passive:true});
  image.addEventListener('touchend',event=>{
    const touchEndX=event.changedTouches[0]?.clientX??touchStartX;
    const delta=touchEndX-touchStartX;
    if(Math.abs(delta)>40)renderSlide(activeSlide+(delta<0?1:-1));
    startCarousel();
  },{passive:true});

  startCarousel();
})();
