(() => {
  'use strict';
  const C=window.COURSE,P=window.G2Progress,cloud=window.G2Cloud,app=document.querySelector('#app');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const slug=v=>String(v).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const norm=v=>String(v).toLowerCase().replace(/[‘’]/g,"'").replace(/[.,!?]/g,'').replace(/\s+/g,' ').trim();
  const stations=[['vocab','01','Words','Listen, look & say'],['explain','02','Discover','Understand the lesson'],['phonics','03','Sounds','Listen & repeat'],['reading','04','Read & listen','Enjoy the story'],['writing','05','Write','Make it your own'],['practice','06','Play & practise','Your lesson challenge']];
  let progress=P.empty(),user=null,route={view:'home'},quiz=null,syncText='Opening…',syncKind='',toastTimer;
  const U=id=>C.units.find(u=>u.id===Number(id)),L=(u,l)=>U(u)?.lessons.find(x=>x.id===Number(l));
  const key=(u,l)=>`${u}-${l}`,passed=(u,l)=>Number(progress.lessons[key(u,l)]?.percent)>=70;
  const unlocked=(u,l)=>{const index=C.units.flatMap(x=>x.lessons.map(y=>[x.id,y.id])).findIndex(x=>x[0]===Number(u)&&x[1]===Number(l));if(index<0)return false;if(index===0)return true;const prev=C.units.flatMap(x=>x.lessons.map(y=>[x.id,y.id]))[index-1];return passed(...prev);};
  const button=(action,label,attrs='',style='button')=>`<button class="${style}" data-action="${action}" ${attrs}>${label}</button>`;
  const wordArt=(word)=>`<img class="word-art" src="assets/words/${slug(word)}.svg" alt="${esc(word)}" width="240" height="180" loading="lazy">`;
  const audio=(text,label='Listen')=>button('speak',`<span aria-hidden="true">◖))</span> ${esc(label)}`,`data-text="${esc(text)}"`,'audio');
  const note=en=>`<p class="helper">${esc(en)}</p>`;
  function toast(text){const el=document.querySelector('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3200);}
  function setSync(text,kind=''){syncText=text;syncKind=kind;const el=document.querySelector('#sync');if(el){el.textContent=text;el.dataset.kind=kind;}}
  function save(){cloud.save(progress);}
  function remember(){if(['lesson','quiz','result'].includes(route.view)){progress.activity={...route,quiz:quiz?JSON.parse(JSON.stringify(quiz)):null,at:Date.now()};save();}try{sessionStorage.setItem(`${cloud.key}:screen`,JSON.stringify({route,quiz}));}catch{toast('This browser could not save your place for refresh.');}}
  function speak(text){
    if(!('speechSynthesis' in window)){toast('Sound is unavailable on this browser. You can still read every word.');return;}
    speechSynthesis.cancel();const speech=new SpeechSynthesisUtterance(text);speech.lang='en-GB';speech.rate=.78;
    const voice=speechSynthesis.getVoices().find(v=>v.lang==='en-GB')||speechSynthesis.getVoices().find(v=>v.lang.startsWith('en'));if(voice)speech.voice=voice;
    speech.onerror=e=>{if(e.error!=='interrupted'&&e.error!=='canceled')toast('Sound could not play. Please tap Listen again.');};speechSynthesis.speak(speech);
  }
  async function portal(){await cloud.flush();location.href='../index.html';}
  function shell(content){
    const s=P.stats(progress),level=Math.floor(s.xp/250)+1;
    app.innerHTML=`<header class="topbar"><a class="brand" href="../index.html" data-action="portal"><img src="../alandalus-school-logo-transparent.png" alt="AlAndalus Schools"><span>ALANDALUS <b>English <em>2</em></b></span></a><nav aria-label="Main">${button('home','My adventure','',route.view==='home'?'nav active':'nav')}${button('reviews','Reviews','','nav')}${button('glossary','Word bank','','nav')}</nav><div class="learner"><span class="avatar">${esc(user.fullName.slice(0,1))}</span><span>${esc(user.fullName.split(' ')[0])}<small>LEVEL ${level} · ${s.xp} XP</small></span></div></header>
    <div class="statusline"><span>PRIMARY 2 <i> / </i> ENGLISH <i> / </i> TERM 1</span><button id="sync" data-action="sync" data-kind="${syncKind}" title="Retry saving">${esc(syncText)}</button></div>
    <main id="main" tabindex="-1">${content}</main><footer><span>Little steps. Wonderful discoveries.</span><span>Prepared &amp; Designed by <b>Mr. Mohamed Farid</b></span>${button('portal','Back to portal ↗','','text-button')}</footer>`;
    window.scrollTo({top:0,behavior:'instant'});
  }
  function go(next){
    if('speechSynthesis' in window)speechSynthesis.cancel();
    if(next.view==='lesson'&&!unlocked(next.u,next.l)){toast('Earn 70% in the previous lesson challenge to unlock this lesson.');return;}
    route=next;quiz=null;remember();render();document.querySelector('#main')?.focus({preventScroll:true});
  }
  function render(){
    if(route.view==='home')return home();if(route.view==='unit')return unitPage();if(route.view==='lesson')return lessonPage();if(route.view==='reviews')return reviews();if(route.view==='glossary')return glossary();if(route.view==='quiz')return quizPage();if(route.view==='result')return resultPage();go({view:'home'});
  }
  function home(){
    const s=P.stats(progress),next=C.units.flatMap(u=>u.lessons.map(l=>({u:u.id,l:l.id,title:l.title}))).find(l=>!passed(l.u,l.l))||{u:1,l:1,title:L(1,1).title};
    shell(`<section class="hero"><div class="hero-copy"><span class="eyebrow">A LITTLE CURIOSITY. A BIG ADVENTURE.</span><h1>Your world.<br>Your words.<br><em>Your adventure.</em></h1><p>Discover English, one happy little step at a time.</p>${button('lesson','Let’s begin <span>→</span>',`data-u="${next.u}" data-l="${next.l}" data-station="map"`,'button gold')}<span class="hero-foot">6 units <i>·</i> 24 lessons <i>·</i> Endless discoveries</span></div><img class="hero-art" src="assets/images/hero.webp" alt="Two boys discovering English through a magical storybook" width="1536" height="1024" fetchpriority="high"></section>
      <section class="overview" aria-label="Your progress"><div><span class="stat-icon">✦</span><b>${s.xp}<small>EXPLORER POINTS</small></b></div><div><span class="stat-icon">✓</span><b>${s.completed}<small>OF 24 LESSONS COMPLETE</small></b></div><div><span class="stat-icon">★</span><b>${s.stars}<small>STARS COLLECTED</small></b></div><div class="next-stop"><small>YOUR NEXT LITTLE STEP</small><strong>${esc(next.title)}</strong>${button('lesson','Continue →',`data-u="${next.u}" data-l="${next.l}" data-station="map"`,'text-button')}</div></section>
      ${progress.activity?`<div class="resume-strip"><span>Pick up where you left off.</span>${button('resume','Continue last activity →','','text-button')}</div>`:''}<section class="section-head"><div><span class="eyebrow">YOUR LEARNING MAP</span><h2>Where shall we go?</h2></div><p>Every unit is a new world to explore.</p></section><section class="units-grid">${C.units.map(u=>{const done=u.lessons.filter(l=>passed(u.id,l.id)).length;return `<article class="unit-card"><button class="unit-image" data-action="unit" data-u="${u.id}" aria-label="Explore Unit ${u.id}: ${esc(u.title)}"><img src="assets/images/unit${u.id}.webp" alt="${esc(u.title)} — boys learning together" width="1536" height="1024" loading="lazy"><span class="unit-label">UNIT 0${u.id}</span></button><div class="unit-copy"><span class="unit-meta">4 LESSONS <i>·</i> BOOK PAGES ${esc(u.pages)}</span><h3>${esc(u.title)}</h3><p>${esc(u.summary)}</p><div class="track"><span style="width:${done*25}%"></span></div><div class="unit-bottom"><small>${done} of 4 complete</small>${button('unit','Explore unit ↗',`data-u="${u.id}"`,'text-button')}</div></div></article>`;}).join('')}</section>
      <section class="encouragement"><span>✧</span><div><h2>You don’t have to know it all yet.</h2><p>Listen. Try. Learn. Every small step counts.</p></div>${audio('Listen. Try. Learn. Every small step counts.','Hear your encouragement')}</section>`);
  }
  const crumb=(u,l)=>`<div class="breadcrumbs">${button('home','My adventure','','text-button')}<span>/</span>${button('unit',`Unit ${u}`,`data-u="${u}"`,'text-button')}${l?`<span>/</span><span>Lesson ${l}</span>`:''}</div>`;
  function unitPage(){
    const u=U(route.u);if(!u)return go({view:'home'});
    shell(`${crumb(u.id)}<section class="unit-hero"><img src="assets/images/unit${u.id}.webp" alt="${esc(u.title)}" width="1536" height="1024"><div><span class="eyebrow">UNIT 0${u.id} · FOUR LITTLE ADVENTURES</span><h1>${esc(u.title)}</h1><p>${esc(u.summary)}</p>${note('Complete each challenge with 70% to open the next lesson.')}<span class="tag">Book pages ${esc(u.pages)}</span></div></section><section class="lesson-list">${u.lessons.map(l=>{const open=unlocked(u.id,l.id),record=progress.lessons[key(u.id,l.id)];return `<article class="lesson-row"><span class="lesson-number">0${l.id}</span><div><span class="eyebrow">LESSON ${l.id} · PAGES ${esc(l.pages)}</span><h2>${esc(l.title)}</h2><p>${esc(l.focus)}</p><small>${record?`Best challenge: ${record.percent}%`:'Six learning stations'}</small></div>${button('lesson',open?'Open lesson →':'Locked',`data-u="${u.id}" data-l="${l.id}" data-station="map" ${open?'':'disabled'}`)}</article>`;}).join('')}</section><section class="challenge-banner"><div><span class="eyebrow">PUT IT ALL TOGETHER</span><h2>Unit ${u.id} challenge</h2><p>30 questions. One great achievement.</p></div>${button('challenge','Start the challenge →',`data-u="${u.id}" ${u.lessons.every(l=>passed(u.id,l.id))?'':'disabled'}`)}</section>`);
  }
  const lessonAttrs=(st)=>`data-u="${route.u}" data-l="${route.l}" data-station="${st}"`;
  const finishStation=st=>`<div class="station-finish">${note('Ready? Mark this station complete and keep exploring.')} ${button('complete','I’m ready. Let’s go! →',`data-station="${st}"`)}</div>`;
  function explanation(pattern){
    const p=pattern.toLowerCase();
    if(p.startsWith('there are'))return 'Use “There are” for more than one thing.';
    if(p.startsWith('there is'))return 'Use “There is” for one thing.';
    if(p.startsWith('this is'))return 'Use “This is” for one person or thing near you.';
    if(p.startsWith('that is'))return 'Use “That is” for one thing farther away.';
    if(p.startsWith('how many'))return 'Ask “How many” when you want to count things.';
    if(p.startsWith('what color'))return 'Ask this question to find out a color.';
    if(p.startsWith('who'))return 'Use “Who” to ask about a person.';
    if(p.includes('my '))return '“My” tells us something belongs to me.';
    if(p.includes('your '))return '“Your” tells us something belongs to you.';
    return 'Listen to the sentence. Say it aloud, then try your own example.';
  }
  function lessonPage(){
    const u=U(route.u),l=L(route.u,route.l);if(!l)return go({view:'home'});const st=route.station||'map';
    let content='';
    if(st==='map'){content=`<section class="section-head"><div><span class="eyebrow">SIX SMALL STEPS</span><h2>Your lesson adventure</h2></div><p>Choose a station. Explore at your pace.</p></section><div class="station-grid">${stations.map(([id,num,title,sub])=>`<button class="station-card tone-${id}" data-action="lesson" ${lessonAttrs(id)}><span class="station-num">${num}</span><span class="station-title">${title}</span><span>${sub}</span><b>${id==='practice'?(passed(u.id,l.id)?'✓ Challenge passed':'25 questions →'):(progress.stations[`${key(u.id,l.id)}-${id}`]?'✓ Explored':'Explore →')}</b></button>`).join('')}</div>`;}
    if(st==='vocab')content=`<div class="section-head"><div><span class="eyebrow">LOOK. LISTEN. SAY.</span><h2>Your new words</h2></div><span class="tag">${l.vocab.length} words</span></div>${note('Tap Listen, then say the word aloud.')}<div class="word-grid">${l.vocab.map(v=>`<article class="word-card">${wordArt(v[0])}<h3>${esc(v[0])}</h3><p>${esc(v[2].replace('___',v[0]))}</p>${audio(v[0])}</article>`).join('')}</div>${finishStation(st)}`;
    if(st==='explain')content=`<div class="section-head"><div><span class="eyebrow">LET’S FIND OUT</span><h2>${esc(l.focus)}</h2></div></div><div class="patterns">${l.patterns.map((p,i)=>`<article class="pattern"><span class="lesson-number">${i+1}</span><div><h3>${esc(p)}</h3><p>${explanation(p)}</p></div>${audio(p)}</article>`).join('')}</div><div class="book-activities"><h3>Try it together</h3><ul>${l.activities.map(a=>`<li>${esc(a)}</li>`).join('')}</ul></div>${finishStation(st)}`;
    if(st==='phonics')content=`<section class="sound-intro"><span class="eyebrow">TUNE YOUR LISTENING EARS</span><h2>${esc(l.phonics.title)}</h2>${note('Listen to each word. Repeat it slowly. Notice the sound.')}<p class="small-print">The Listen buttons pronounce whole words.</p></section><div class="sound-grid">${l.phonics.words.map(w=>`<article><h3>${esc(w)}</h3>${audio(w,'Listen & repeat')}</article>`).join('')}</div>${finishStation(st)}`;
    if(st==='reading')content=`<section class="reading-layout"><aside><img src="assets/images/unit${u.id}.webp" alt="Unit ${u.id} illustration" width="1536" height="1024"><span class="eyebrow">READING & LISTENING</span><h2>A little story,<br>a new discovery.</h2>${audio(l.reading,'Listen to the story')}<p class="small-print">Practice text from the supplied learning project. Voice supplied by your browser.</p></aside><article class="story">${l.reading.match(/[^.!?]+[.!?]?/g)?.map(s=>`<div><p>${esc(s.trim())}</p>${audio(s.trim(),'Listen')}</div>`).join('')}</article></section>${finishStation(st)}`;
    if(st==='writing'){const saved=progress.writing[key(u.id,l.id)];content=`<section class="writing-layout"><aside><span class="eyebrow">YOUR WORDS MATTER</span><h2>Let’s write!</h2><p>${esc(l.writing)}</p>${audio(l.writing,'Hear the task')}<h3>Helpful words</h3><div class="word-chips">${l.vocab.map(v=>`<span>${esc(v[0])}</span>`).join('')}</div></aside><div class="writing-paper"><label for="writing">My writing</label><textarea id="writing" maxlength="6000" placeholder="Write your sentences here…" spellcheck="true">${esc(saved?.text||'')}</textarea><span id="writingStatus">Your writing saves automatically.</span>${button('save-writing','Save my writing ✓')}${note('Ask your teacher to read your writing with you.')}</div></section>${finishStation(st)}`;}
    if(st==='practice')return startQuiz(`lesson-${u.id}-${l.id}`);
    shell(`${crumb(u.id,l.id)}<div class="lesson-title"><span class="eyebrow">UNIT ${u.id} · LESSON ${l.id} · BOOK PAGES ${esc(l.pages)}</span><h1>${esc(l.title)}</h1></div><nav class="station-nav" aria-label="Lesson stations">${button('lesson','Overview',lessonAttrs('map'),st==='map'?'active':'')}${stations.map(([id,num,title])=>button('lesson',`${num} ${title}`,lessonAttrs(id),st===id?'active':'')).join('')}</nav>${content}`);
  }
  function resolveBank(id){
    const lessonMatch=/^lesson-(\d)-(\d)$/.exec(id);if(lessonMatch){const u=+lessonMatch[1],l=+lessonMatch[2];return {questions:L(u,l)?.questions,title:`Unit ${u} · Lesson ${l}`,u,l,allowed:unlocked(u,l)};}
    const unitMatch=/^unit-(\d)$/.exec(id);if(unitMatch){const u=U(+unitMatch[1]);return u?{questions:u.challenge,title:`Unit ${u.id} challenge`,u:u.id,allowed:u.lessons.every(l=>passed(u.id,l.id))}:null;}
    const r=C.reviews.find(x=>x.id===id);return r?{questions:r.questions,title:r.title,allowed:true}:null;
  }
  function readingText(q,bank){const source=/Unit (\d) - Lesson (\d)/.exec(q.source||'');return source?L(+source[1],+source[2])?.reading:bank.l?L(bank.u,bank.l)?.reading:'';}
  function startQuiz(id){const bank=resolveBank(id);if(!bank?.allowed||!bank.questions){toast('Complete the earlier lessons first.');return;}quiz={id,index:0,responses:{},order:[],finished:false};route={view:'quiz',bank:id};remember();quizPage();}
  function quizPage(){
    const bank=resolveBank(quiz?.id);if(!bank?.allowed||!quiz)return go({view:'home'});const q=bank.questions[quiz.index];if(!q)return finishQuiz();
    const answer=quiz.responses[quiz.index],answered=Boolean(answer);let input='';
    if(q.type==='order'){input=`<div class="sentence-answer" aria-live="polite">${quiz.order.map((i,n)=>button('remove-word',esc(q.words[i]),`data-index="${n}" ${answered?'disabled':''}`,'word-token')).join('')||'<span>Tap the words below…</span>'}</div><div class="word-options">${q.words.map((w,i)=>button('add-word',esc(w),`data-index="${i}" ${quiz.order.includes(i)||answered?'disabled':''}`,'word-token')).join('')}</div>${button('check-order','Check my sentence',answered?'disabled':'')}`;}
    else if(q.type==='spelling'){input=`<div class="scrambled">${esc(q.scrambled.split('').join(' · '))}</div><form id="spellingForm"><label for="spelling">Write the word</label><input id="spelling" autocomplete="off" value="${esc(answer?.choice||'')}" ${answered?'disabled':''}><button class="button" ${answered?'disabled':''}>Check my word</button></form>`;}
    else input=`<div class="options">${q.options.map((o,i)=>button('answer',`<span class="option-letter">${String.fromCharCode(65+i)}</span>${esc(o)}${answered&&norm(o)===norm(q.answer)?'<b>✓</b>':''}`,`data-choice="${esc(o)}" ${answered?'disabled':''}`,'option'+(answered&&norm(o)===norm(q.answer)?' correct':answered&&o===answer.choice?' incorrect':''))).join('')}</div>`;
    let visual='';if(q.type==='picture'){const word=q.answer;visual=`<div class="question-picture"><img src="assets/words/${slug(word)}.svg" alt="Question illustration" width="240" height="180"></div>`;}
    shell(`<div class="quiz-heading">${button('leave-quiz','← Back to learning','','text-button')}<span>${esc(bank.title)}</span><span>${quiz.index+1} / ${bank.questions.length}</span></div><div class="track quiz-track"><span style="width:${(quiz.index+1)/bank.questions.length*100}%"></span></div><section class="quiz-card"><span class="eyebrow">${esc(q.category||'YOUR CHALLENGE')}</span><h1>${esc(q.prompt)}</h1>${q.type==='listen'?audio(q.speak,'Play the question'):''}${q.category==='Reading'&&readingText(q,bank)?`<details class="reading-help"><summary>Read the lesson text</summary><p>${esc(readingText(q,bank))}</p></details>`:''}${visual}${input}${answered?`<div class="feedback ${answer.correct?'success':'try-again'}" role="status"><div><h2>${answer.correct?'Wonderful work!':'Good try. Let’s learn together.'}</h2><p>${answer.correct?esc(q.explanation):`The answer is <strong>${esc(q.answer)}</strong>.`}</p><small>${answer.correct?'Every step helps you learn.':'Read the answer, then continue at your own pace.'}</small></div>${button('next',quiz.index===bank.questions.length-1?'See my result →':'Next question →')}</div>`:note('Take your time. You can do this.')}<p class="small-print">Your answers and place are saved as you go.</p></section>`);
  }
  function answer(choice){
    const bank=resolveBank(quiz?.id),q=bank?.questions[quiz?.index];if(!q||quiz.responses[quiz.index])return;
    const correct=norm(choice)===norm(q.answer);quiz.responses[quiz.index]={choice,correct};
    if(correct)progress.answers[`${quiz.id}:${quiz.index}`]=true;
    remember();quizPage();
  }
  function finishQuiz(){
    const bank=resolveBank(quiz.id);const correct=Object.values(quiz.responses).filter(x=>x.correct).length,percent=Math.round(correct/bank.questions.length*100);
    const record={percent,correct,total:bank.questions.length,at:Date.now()};
    if(bank.l){progress=P.merge(progress,{lessons:{[key(bank.u,bank.l)]:record}});}else{progress=P.merge(progress,{lessons:{[quiz.id]:record}});}
    quiz.finished=true;route={view:'result',bank:quiz.id};remember();resultPage();
  }
  function resultPage(){
    if(!quiz)return go({view:'home'});const bank=resolveBank(quiz.id),correct=Object.values(quiz.responses).filter(x=>x.correct).length,percent=Math.round(correct/bank.questions.length*100),pass=percent>=70;
    shell(`<section class="result"><span class="result-badge">${pass?'★':'✦'}</span><span class="eyebrow">${esc(bank.title)}</span><h1>${pass?'Look how far you’ve come!':'A little more practice. You can do it!'}</h1><p>You answered <strong>${correct} of ${bank.questions.length}</strong> correctly.</p><div class="result-score">${percent}<small>%</small></div><p>${pass?'Wonderful! Your achievement is saved.':'Reach 70% to complete this challenge. Revisit the words and try again.'}</p><div class="result-actions">${button('retry','Try again')}${button('leave-quiz','Back to learning','','button secondary')}</div><p class="small-print">Your best score stays saved. Replaying a correct answer never adds duplicate points.</p></section>`);
  }
  function reviews(){shell(`<section class="page-intro"><span class="eyebrow">BRING YOUR LEARNING TOGETHER</span><h1>Ready for a little challenge?</h1><p>Revisit the words, sounds and sentences you’ve discovered.</p></section><div class="review-grid">${C.reviews.map((r,i)=>`<article class="review-card"><span class="review-number">0${i+1}</span><span class="eyebrow">50 QUESTIONS · BOOK PAGES ${esc(r.pages)}</span><h2>${esc(r.title)}</h2><p>Go at your own pace. Listen carefully and enjoy learning.</p>${button('review','Let’s practise →',`data-id="${r.id}"`)}${progress.lessons[r.id]?`<small>Best score: ${progress.lessons[r.id].percent}%</small>`:''}</article>`).join('')}</div>`);}
  function glossary(){shell(`<section class="page-intro"><span class="eyebrow">A POCKET FULL OF WORDS</span><h1>Your word bank</h1><p>Find a word. Hear it. Make it yours.</p><label class="search-label" for="wordSearch">Search words</label><input type="search" id="wordSearch" placeholder="Try: book, kitchen, hello…"></section><div class="glossary-grid">${C.glossary.map(([w,d])=>`<article data-word="${esc(w.toLowerCase())}"><div><h2>${esc(w)}</h2><p>${esc(d)}</p></div>${audio(w)}</article>`).join('')}</div><p id="noWords" hidden>No words found. Try another word.</p>`);}
  function write(){const el=document.querySelector('#writing');if(!el)return;progress.writing[key(route.u,route.l)]={text:el.value,at:Date.now()};save();document.querySelector('#writingStatus').textContent='Writing saved on this device.';}
  async function action(e){
    const el=e.target.closest('[data-action]');if(!el||el.disabled)return;e.preventDefault();const a=el.dataset.action;
    if(a==='resume'){const last=progress.activity;if(!last)return;route={...last};delete route.at;delete route.quiz;quiz=last.quiz?JSON.parse(JSON.stringify(last.quiz)):null;if(route.view==='lesson'&&!unlocked(route.u,route.l))return toast('Complete the earlier lesson first.');remember();return render();}
    if(a==='home')return go({view:'home'});if(a==='portal')return portal();if(a==='sync')return cloud.flush();if(a==='speak')return speak(el.dataset.text);
    if(a==='unit')return go({view:'unit',u:+el.dataset.u});if(a==='lesson')return go({view:'lesson',u:+el.dataset.u,l:+el.dataset.l,station:el.dataset.station});
    if(a==='reviews')return go({view:'reviews'});if(a==='glossary')return go({view:'glossary'});
    if(a==='complete'){if(route.station==='writing')write();progress.stations[`${key(route.u,route.l)}-${el.dataset.station}`]=true;save();const i=stations.findIndex(s=>s[0]===el.dataset.station);return go({...route,station:stations[i+1][0]});}
    if(a==='save-writing'){write();return toast('Your writing is saved.');}
    if(a==='challenge')return startQuiz(`unit-${el.dataset.u}`);if(a==='review')return startQuiz(el.dataset.id);
    if(a==='answer')return answer(el.dataset.choice);
    if(a==='add-word'){quiz.order.push(+el.dataset.index);remember();return quizPage();}
    if(a==='remove-word'){quiz.order.splice(+el.dataset.index,1);remember();return quizPage();}
    if(a==='check-order')return answer(quiz.order.map(i=>resolveBank(quiz.id).questions[quiz.index].words[i]).join(' '));
    if(a==='next'){if(!quiz.responses[quiz.index])return;quiz.index++;quiz.order=[];remember();return quizPage();}
    if(a==='retry')return startQuiz(quiz.id);
    if(a==='leave-quiz'){const b=resolveBank(quiz.id);return go(b.l?{view:'lesson',u:b.u,l:b.l,station:'map'}:b.u?{view:'unit',u:b.u}:{view:'reviews'});}
  }
  app.addEventListener('click',action);
  app.addEventListener('submit',e=>{if(e.target.id==='spellingForm'){e.preventDefault();answer(document.querySelector('#spelling').value);}});
  app.addEventListener('input',e=>{if(e.target.id==='writing')write();if(e.target.id==='wordSearch'){let count=0;document.querySelectorAll('[data-word]').forEach(el=>{el.hidden=!el.dataset.word.includes(e.target.value.toLowerCase().trim());if(!el.hidden)count++;});document.querySelector('#noWords').hidden=count>0;}});
  async function boot(){
    try{const loaded=await cloud.init(p=>{progress=P.merge(progress,p);},setSync);if(!loaded)return;user=loaded.user;progress=loaded.progress;
      const entered=new URLSearchParams(location.search).get('from')==='english-portal';
      if(entered){history.replaceState(null,'',location.pathname);sessionStorage.removeItem(`${cloud.key}:screen`);}
      else{try{const saved=JSON.parse(sessionStorage.getItem(`${cloud.key}:screen`));if(saved?.route){route=saved.route;quiz=saved.quiz;}}catch{}}
      if(route.view==='lesson'&&!unlocked(route.u,route.l)){route={view:'home'};quiz=null;}render();
      if('serviceWorker' in navigator&&!loaded.preview)navigator.serviceWorker.register('sw.js').catch(()=>{});
    }catch(error){app.innerHTML=`<main class="loading"><h1>Let’s reconnect</h1><p>${esc(error.message||'Your account could not load.')}</p><a class="button" href="../index.html">Back to portal</a><button class="button secondary" onclick="location.reload()">Retry</button></main>`;}
  }
  boot();
})();
