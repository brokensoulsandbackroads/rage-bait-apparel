(()=>{
  const current=document.currentScript?.src||'';
  let version='';
  try{version=new URL(current,window.location.href).search;}catch(_){/* no cache version */}

  const HOME_NEW_ITEM_DAYS=14;
  const HOME_NEW_ITEM_LIMIT=8;
  const DAY_MS=24*60*60*1000;

  // Existing products pre-date the automatic homepage dating rule.
  // New product cards can simply set data-listed-date="YYYY-MM-DD" and the
  // homepage will automatically include them for 14 days, newest first.
  const LEGACY_LISTED_DATES={
    'Minorz Outlaw Tee':'2026-09-21',
    'Virtual Degenerate Hoodie':'2026-09-21',
    'Outlaw Hoodie':'2026-09-24',
    'Virtual Degenerate Tee':'2026-09-24',
    'Pretty Little Problem Hoodie':'2026-09-25',
    'Pretty Little Problem Cropped Tee':'2026-09-25',
    'KingPin Hoodie':'2026-09-27',
    'KingPin Outlaw Tee':'2026-09-27',
    'Rage Bait Keyring':'2026-09-27'
  };

  const utcDayStamp=date=>Date.UTC(date.getFullYear(),date.getMonth(),date.getDate());

  const listedStampForCard=card=>{
    const title=card.querySelector('.product-info h3')?.textContent.trim()||'';
    const listed=card.dataset.listedDate||LEGACY_LISTED_DATES[title];
    if(!listed||!/^\d{4}-\d{2}-\d{2}$/.test(listed)) return null;
    const [year,month,day]=listed.split('-').map(Number);
    return Date.UTC(year,month-1,day);
  };

  const applyHomepageNewItems=()=>{
    const grid=document.querySelector('#products .product-grid');
    if(!grid) return;

    const newItemsNav=Array.from(document.querySelectorAll('.desktop-nav a')).find(link=>link.textContent.trim().toLowerCase()==='new drops');
    if(newItemsNav){
      newItemsNav.textContent='New Items';
      newItemsNav.href='#products';
    }

    const eyebrow=document.querySelector('#products .section-heading .eyebrow');
    if(eyebrow) eyebrow.textContent='NEW ITEMS';
    const heading=document.querySelector('#products .section-heading h2');
    if(heading) heading.textContent='Fresh for 14 days.';
    const headingLink=document.querySelector('#products .section-heading a');
    if(headingLink){
      headingLink.textContent='View categories →';
      headingLink.href='#drops';
    }

    const cards=Array.from(grid.querySelectorAll('.product-card'));
    const todayStamp=utcDayStamp(new Date());

    const newest=cards
      .map((card,index)=>({card,index,listedStamp:listedStampForCard(card)}))
      .filter(item=>{
        if(item.listedStamp===null) return false;
        const ageDays=Math.floor((todayStamp-item.listedStamp)/DAY_MS);
        return ageDays>=0&&ageDays<HOME_NEW_ITEM_DAYS;
      })
      .sort((a,b)=>(b.listedStamp-a.listedStamp)||(b.index-a.index))
      .slice(0,HOME_NEW_ITEM_LIMIT);

    const keep=new Set(newest.map(item=>item.card));
    cards.forEach(card=>{
      if(!keep.has(card)) card.remove();
    });

    newest.forEach(item=>grid.appendChild(item.card));

    if(!newest.length){
      const empty=document.createElement('p');
      empty.className='new-items-empty';
      empty.textContent='No fresh drops right now. Check the Tees and Hoodies tabs for the full range.';
      empty.style.cssText='grid-column:1/-1;margin:0;padding:28px;border:1px solid var(--line);background:#0f110f;color:#9da598;text-align:center;font-weight:800;';
      grid.appendChild(empty);
    }
  };

  const loadCurrency=()=>{
    applyHomepageNewItems();
    const currencyScript=document.createElement('script');
    currencyScript.src=`currency.js${version}`;
    currencyScript.onerror=()=>console.error('Rage Bait currency selector failed to initialise');
    document.body.appendChild(currencyScript);
  };

  const loadRageBaitKeyring=()=>{
    const keyringScript=document.createElement('script');
    keyringScript.src=`rage-bait-keyring.js${version}`;
    keyringScript.onload=loadCurrency;
    keyringScript.onerror=()=>{
      console.error('Rage Bait Keyring failed to initialise');
      loadCurrency();
    };
    document.body.appendChild(keyringScript);
  };

  const loadKingpinOutlawTee=()=>{
    const kingpinOutlawTeeScript=document.createElement('script');
    kingpinOutlawTeeScript.src=`kingpin-outlaw-tee.js${version}`;
    kingpinOutlawTeeScript.onload=loadRageBaitKeyring;
    kingpinOutlawTeeScript.onerror=()=>{
      console.error('KingPin Outlaw Tee failed to initialise');
      loadRageBaitKeyring();
    };
    document.body.appendChild(kingpinOutlawTeeScript);
  };

  const loadVirtualDegenerateTee=()=>{
    const teeScript=document.createElement('script');
    teeScript.src=`virtual-degenerate-tee.js${version}`;
    teeScript.onload=loadKingpinOutlawTee;
    teeScript.onerror=()=>{
      console.error('Virtual Degenerate Tee failed to initialise');
      loadKingpinOutlawTee();
    };
    document.body.appendChild(teeScript);
  };

  const loadPrettyLittleProblemCroppedTee=()=>{
    const prettyLittleProblemTeeScript=document.createElement('script');
    prettyLittleProblemTeeScript.src=`pretty-little-problem-cropped-tee.js${version}`;
    prettyLittleProblemTeeScript.onload=loadVirtualDegenerateTee;
    prettyLittleProblemTeeScript.onerror=()=>{
      console.error('Pretty Little Problem Cropped Tee failed to initialise');
      loadVirtualDegenerateTee();
    };
    document.body.appendChild(prettyLittleProblemTeeScript);
  };

  const loadKingpinHoodie=()=>{
    const kingpinScript=document.createElement('script');
    kingpinScript.src=`kingpin-hoodie.js${version}`;
    kingpinScript.onload=loadPrettyLittleProblemCroppedTee;
    kingpinScript.onerror=()=>{
      console.error('KingPin Hoodie failed to initialise');
      loadPrettyLittleProblemCroppedTee();
    };
    document.body.appendChild(kingpinScript);
  };

  const loadPrettyLittleProblemHoodie=()=>{
    const prettyLittleProblemScript=document.createElement('script');
    prettyLittleProblemScript.src=`pretty-little-problem-hoodie.js${version}`;
    prettyLittleProblemScript.onload=loadKingpinHoodie;
    prettyLittleProblemScript.onerror=()=>{
      console.error('Pretty Little Problem Hoodie failed to initialise');
      loadKingpinHoodie();
    };
    document.body.appendChild(prettyLittleProblemScript);
  };

  const loadOutlawHoodie=()=>{
    const outlawHoodieScript=document.createElement('script');
    outlawHoodieScript.src=`outlaw-hoodie.js${version}`;
    outlawHoodieScript.onload=loadPrettyLittleProblemHoodie;
    outlawHoodieScript.onerror=()=>{
      console.error('Outlaw Hoodie failed to initialise');
      loadPrettyLittleProblemHoodie();
    };
    document.body.appendChild(outlawHoodieScript);
  };

  const script=document.createElement('script');
  script.src=`app-core.js${version}`;
  script.onload=()=>{
    const duplicateBusinessLink=document.querySelector('footer .footer-links a[href="business-information.html"]');
    if(duplicateBusinessLink)duplicateBusinessLink.remove();

    const teesLink=Array.from(document.querySelectorAll('.desktop-nav a')).find(link=>link.textContent.trim().toLowerCase()==='tees');
    if(teesLink) teesLink.href='tees.html';

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
