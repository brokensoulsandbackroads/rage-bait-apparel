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

  const loadVirtualDegenerateTee=()=>{
    const teeScript=document.createElement('script');
    teeScript.src=`virtual-degenerate-tee.js${version}`;
    teeScript.onload=loadCurrency;
    teeScript.onerror=()=>{
      console.error('Virtual Degenerate Tee failed to initialise');
      loadCurrency();
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

  const loadPrettyLittleProblemHoodie=()=>{
    const prettyLittleProblemScript=document.createElement('script');
    prettyLittleProblemScript.src=`pretty-little-problem-hoodie.js${version}`;
    prettyLittleProblemScript.onload=loadPrettyLittleProblemCroppedTee;
    prettyLittleProblemScript.onerror=()=>{
      console.error('Pretty Little Problem Hoodie failed to initialise');
      loadPrettyLittleProblemCroppedTee();
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
