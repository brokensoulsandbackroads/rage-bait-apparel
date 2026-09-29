(()=>{
  const ENDPOINT='https://rage-bait-crew-signup.brokensoulsandbackroads.workers.dev/comments';
  const PAGE_SIZE=6;
  const MAX_COMMENTS=50;
  const REACTION_KEY='ragebait-banter-reactions-v1';
  const NAME_KEY='ragebait-banter-name-v1';

  const ensureStyles=()=>{
    if(document.querySelector('link[data-ragebait-banter-css]'))return;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='banter.css?v=20260929-banter1';
    link.dataset.ragebaitBanterCss='true';
    document.head.appendChild(link);
  };

  const ensureNav=()=>{
    const desktop=document.querySelector('.desktop-nav');
    if(desktop&&!desktop.querySelector('a[href="#banter"]')){
      const link=document.createElement('a');
      link.href='#banter';
      link.textContent='Banter';
      const about=Array.from(desktop.querySelectorAll('a')).find(a=>a.textContent.trim().toLowerCase()==='about');
      if(about)desktop.insertBefore(link,about);
      else desktop.appendChild(link);
    }

    const mobile=document.querySelector('.mobile-nav');
    if(mobile&&!mobile.querySelector('a[href="#banter"]')){
      const link=document.createElement('a');
      link.href='#banter';
      link.textContent='Banter';
      link.addEventListener('click',()=>{
        const toggle=document.querySelector('.mobile-menu-toggle');
        if(toggle)toggle.click();
      });
      const about=Array.from(mobile.querySelectorAll('a')).find(a=>a.textContent.trim().toLowerCase()==='about');
      if(about)mobile.insertBefore(link,about);
      else mobile.appendChild(link);
    }
  };

  const ensureMarkup=()=>{
    if(document.getElementById('banter'))return;
    const story=document.getElementById('story');
    if(!story)return;

    const section=document.createElement('section');
    section.className='banter-section section';
    section.id='banter';
    section.innerHTML=`
      <div class="section-heading">
        <div class="banter-heading-copy">
          <span class="eyebrow">COMMENT SECTION COWBOYS</span>
          <h2>BEST TROLLING BANTA</h2>
          <p>Think you're funny? Prove it. Drop your finest nonsense, questionable wisdom or completely unnecessary opinion below.</p>
        </div>
      </div>

      <div class="banter-grid">
        <div class="banter-compose">
          <span class="banter-kicker">🔥 ENTER AT YOUR OWN RISK</span>
          <h3>Feed the comment section.</h3>
          <p>No account. No essay. Pick a name and make the internet slightly worse.</p>

          <form class="banter-form" id="banterForm">
            <label class="banter-field">
              <span>Display name</span>
              <input id="banterName" name="name" type="text" minlength="2" maxlength="32" autocomplete="nickname" placeholder="ProfessionalInstigator" required>
            </label>

            <label class="banter-field">
              <span>Your finest nonsense</span>
              <textarea id="banterMessage" name="message" minlength="3" maxlength="500" placeholder="Type something unnecessarily confident…" required></textarea>
            </label>

            <label class="banter-honeypot" aria-hidden="true">
              Website
              <input id="banterWebsite" name="website" type="text" tabindex="-1" autocomplete="off">
            </label>

            <div class="banter-form-footer">
              <small id="banterCharCount">0 / 500</small>
              <button class="banter-submit" type="submit">🎤 SAY SOMETHING STUPID</button>
            </div>
            <p class="banter-status" id="banterStatus" aria-live="polite"></p>
          </form>

          <p class="banter-rules"><strong>Keep it funny.</strong> No threats, doxxing, hate, spam or personal information. Links are blocked. Posts can be removed if they cross the line.</p>
        </div>

        <div class="banter-wall">
          <div class="banter-toolbar">
            <div class="banter-sort" id="banterSort" aria-label="Sort comments">
              <button class="active" type="button" data-sort="newest">Newest</button>
              <button type="button" data-sort="liked">Most Liked</button>
              <button type="button" data-sort="chaotic">Most Chaotic</button>
            </div>
            <span class="banter-toolbar-note">👑 Highest reaction score = Top Troll</span>
          </div>

          <div class="banter-comments" id="banterComments" aria-live="polite">
            <div class="banter-loading">Rummaging through the comment section…</div>
          </div>

          <div class="banter-more-wrap">
            <button class="banter-more" id="banterShowMore" type="button" hidden>SHOW MORE NONSENSE</button>
          </div>
        </div>
      </div>
    `;
    story.parentNode.insertBefore(section,story);
  };

  let banterOnline=false;
  ensureStyles();
  ensureMarkup();
  const banterSection=document.getElementById('banter');
  if(banterSection)banterSection.hidden=true;
  document.addEventListener('ragebait:ready',()=>{
    if(banterOnline)ensureNav();
  },{once:true});

  const form=document.getElementById('banterForm');
  const nameInput=document.getElementById('banterName');
  const messageInput=document.getElementById('banterMessage');
  const websiteInput=document.getElementById('banterWebsite');
  const charCount=document.getElementById('banterCharCount');
  const status=document.getElementById('banterStatus');
  const commentsEl=document.getElementById('banterComments');
  const sortBar=document.getElementById('banterSort');
  const showMore=document.getElementById('banterShowMore');
  const submitButton=form?.querySelector('button[type="submit"]');

  if(!form||!nameInput||!messageInput||!commentsEl)return;

  let comments=[];
  let topTrollId=null;
  let visibleCount=PAGE_SIZE;
  let activeSort='newest';
  let loading=false;

  try{
    const savedName=localStorage.getItem(NAME_KEY);
    if(savedName)nameInput.value=savedName;
  }catch(_){/* storage unavailable */}

  const getReactions=()=>{
    try{
      const value=JSON.parse(localStorage.getItem(REACTION_KEY)||'{}');
      return value&&typeof value==='object'?value:{};
    }catch(_){
      return {};
    }
  };

  const saveReaction=(id,reaction)=>{
    try{
      const reactions=getReactions();
      reactions[id]=reaction;
      localStorage.setItem(REACTION_KEY,JSON.stringify(reactions));
    }catch(_){/* storage unavailable */}
  };

  const plural=(n,word)=>`${n} ${word}${n===1?'':'s'}`;

  const formatDate=value=>{
    if(!value)return '';
    const parsed=new Date(String(value).replace(' ','T')+'Z');
    if(Number.isNaN(parsed.getTime()))return '';
    const diffMs=Date.now()-parsed.getTime();
    const diffMinutes=Math.max(0,Math.floor(diffMs/60000));
    if(diffMinutes<1)return 'just now';
    if(diffMinutes<60)return `${plural(diffMinutes,'min')} ago`;
    const hours=Math.floor(diffMinutes/60);
    if(hours<24)return `${plural(hours,'hour')} ago`;
    const days=Math.floor(hours/24);
    if(days<14)return `${plural(days,'day')} ago`;
    return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric'}).format(parsed);
  };

  const reactionButton=(comment,reaction,icon,label,count)=>{
    const button=document.createElement('button');
    button.type='button';
    button.className='banter-reaction';
    button.dataset.reaction=reaction;
    button.dataset.commentId=comment.id;
    button.setAttribute('aria-label',`${label} this comment`);
    const prior=getReactions()[String(comment.id)];
    if(prior===reaction)button.classList.add('reacted');
    button.innerHTML=`<span aria-hidden="true">${icon}</span> <span>${count}</span>`;
    return button;
  };

  const render=()=>{
    commentsEl.innerHTML='';

    if(!comments.length){
      const empty=document.createElement('div');
      empty.className='banter-empty';
      empty.innerHTML='<strong>No casualties yet.</strong><span>Be the first person to make the comment section regret existing.</span>';
      commentsEl.appendChild(empty);
      if(showMore)showMore.hidden=true;
      return;
    }

    const visible=comments.slice(0,visibleCount);
    visible.forEach(comment=>{
      const card=document.createElement('article');
      card.className='banter-comment';
      card.dataset.commentId=comment.id;

      const head=document.createElement('div');
      head.className='banter-comment-head';

      const identity=document.createElement('div');
      identity.className='banter-identity';

      const name=document.createElement('strong');
      name.textContent=comment.name;

      const meta=document.createElement('span');
      meta.textContent=formatDate(comment.created_at);

      identity.append(name,meta);
      head.appendChild(identity);

      if(Number(comment.id)===Number(topTrollId)){
        const badge=document.createElement('span');
        badge.className='top-troll-badge';
        badge.textContent='👑 TOP TROLL';
        head.appendChild(badge);
      }

      const message=document.createElement('p');
      message.className='banter-message';
      message.textContent=comment.message;

      const reactions=document.createElement('div');
      reactions.className='banter-reactions';
      reactions.append(
        reactionButton(comment,'like','👍','Like',Number(comment.likes)||0),
        reactionButton(comment,'laugh','😂','Laugh at',Number(comment.laughs)||0),
        reactionButton(comment,'chaos','🔥','Add chaos to',Number(comment.chaos)||0)
      );

      card.append(head,message,reactions);
      commentsEl.appendChild(card);
    });

    if(showMore){
      showMore.hidden=visibleCount>=comments.length;
      showMore.textContent=`SHOW MORE NONSENSE (${comments.length-visibleCount})`;
    }
  };

  const setLoading=value=>{
    loading=value;
    if(sortBar)sortBar.querySelectorAll('button').forEach(btn=>btn.disabled=value);
  };

  const loadComments=async(sort=activeSort)=>{
    if(loading)return;
    setLoading(true);
    activeSort=sort;
    visibleCount=PAGE_SIZE;

    if(sortBar){
      sortBar.querySelectorAll('button').forEach(btn=>{
        btn.classList.toggle('active',btn.dataset.sort===sort);
      });
    }

    commentsEl.innerHTML='<div class="banter-loading">Rummaging through the comment section…</div>';
    if(showMore)showMore.hidden=true;

    try{
      const response=await fetch(`${ENDPOINT}?sort=${encodeURIComponent(sort)}&limit=${MAX_COMMENTS}`,{
        headers:{'Accept':'application/json'}
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw new Error(data.error||'Could not load the banter.');
      comments=Array.isArray(data.comments)?data.comments:[];
      topTrollId=data.topTrollId??null;
      banterOnline=true;
      if(banterSection)banterSection.hidden=false;
      ensureNav();
      render();
    }catch(error){
      console.error('Banter load failed:',error);
      document.querySelectorAll('.desktop-nav a[href="#banter"], .mobile-nav a[href="#banter"]').forEach(link=>link.remove());
      if(banterSection)banterSection.remove();
    }finally{
      setLoading(false);
    }
  };

  const react=async(button)=>{
    const id=button.dataset.commentId;
    const reaction=button.dataset.reaction;
    if(!id||!reaction||button.disabled)return;

    const prior=getReactions()[String(id)];
    if(prior){
      if(status)status.textContent=prior===reaction?'You already gave that one some love.':'One reaction per comment. Choose wisely.';
      return;
    }

    button.disabled=true;
    try{
      const response=await fetch(`${ENDPOINT}/${encodeURIComponent(id)}/react`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({reaction})
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw new Error(data.error||'Reaction failed.');

      saveReaction(String(id),reaction);
      const comment=comments.find(item=>String(item.id)===String(id));
      if(comment&&data.counts){
        comment.likes=Number(data.counts.likes)||0;
        comment.laughs=Number(data.counts.laughs)||0;
        comment.chaos=Number(data.counts.chaos)||0;
      }
      topTrollId=data.topTrollId??topTrollId;
      render();
    }catch(error){
      console.error('Banter reaction failed:',error);
      if(status)status.textContent='That reaction bounced off the internet. Try again.';
    }finally{
      button.disabled=false;
    }
  };

  commentsEl.addEventListener('click',event=>{
    const button=event.target.closest('.banter-reaction');
    if(button)react(button);
  });

  if(sortBar)sortBar.addEventListener('click',event=>{
    const button=event.target.closest('button[data-sort]');
    if(button&&!button.disabled)loadComments(button.dataset.sort);
  });

  if(showMore)showMore.addEventListener('click',()=>{
    visibleCount=Math.min(visibleCount+PAGE_SIZE,comments.length);
    render();
  });

  messageInput.addEventListener('input',()=>{
    if(charCount)charCount.textContent=`${messageInput.value.length} / ${messageInput.maxLength}`;
  });

  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(!submitButton||submitButton.disabled)return;

    const name=nameInput.value.trim();
    const message=messageInput.value.trim();
    const website=websiteInput?.value.trim()||'';

    if(name.length<2||name.length>32){
      if(status)status.textContent='Give us a display name between 2 and 32 characters.';
      nameInput.focus();
      return;
    }

    if(message.length<3||message.length>500){
      if(status)status.textContent='Banter needs between 3 and 500 characters.';
      messageInput.focus();
      return;
    }

    const original=submitButton.textContent;
    submitButton.disabled=true;
    submitButton.textContent='POSTING…';
    if(status)status.textContent='';

    try{
      const response=await fetch(ENDPOINT,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({name,message,website})
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw new Error(data.error||'Comment failed.');

      try{localStorage.setItem(NAME_KEY,name);}catch(_){/* storage unavailable */}
      messageInput.value='';
      if(charCount)charCount.textContent='0 / 500';
      if(status)status.textContent=data.message||'Posted. The internet is worse now.';
      await loadComments(activeSort);
    }catch(error){
      console.error('Banter post failed:',error);
      if(status)status.textContent=error.message||'Could not post that. Try again.';
    }finally{
      submitButton.disabled=false;
      submitButton.textContent=original;
    }
  });

  loadComments();
})();