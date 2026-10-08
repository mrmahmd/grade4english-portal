(() => {
  'use strict';
  const {words: WORDS, rosters: ROSTERS, storageKey: STORE} = window.SpellArabiaData;
  const cloud = window.SpellArabiaCloud;
  const $ = selector => document.querySelector(selector);
  const rand = max => {
    const values = new Uint32Array(1);
    if (window.crypto?.getRandomValues) { window.crypto.getRandomValues(values); return values[0] % max; }
    return Math.floor(Math.random() * max);
  };
  const fresh = () => ({classKey:'A',wordsPerStudent:1,absent:{A:[],B:[]},completed:{A:[],B:[]},usedWords:{A:[],B:[]},records:{A:[],B:[]},current:null,timer:{running:false,remaining:45,startedAt:null}});
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE));
      if (!saved || !ROSTERS[saved.classKey]) return fresh();
      const base = fresh();
      return {...base,...saved,absent:{...base.absent,...saved.absent},completed:{...base.completed,...saved.completed},usedWords:{...base.usedWords,...saved.usedWords},records:{...base.records,...saved.records},timer:{...base.timer,...saved.timer}};
    } catch { return fresh(); }
  }
  let state = load(), spinning = false, undoStack = [], toastTimer, channel;
  try { channel = new BroadcastChannel('spell-arabia-preview'); channel.onmessage = event => { if (event.data?.type === 'spin' && document.body.classList.contains('projector')) animateWheel(event.data.kind,event.data.index,event.data.count,true); if (event.data?.type === 'update') { state = load(); render(); } }; } catch {}
  const projector = new URLSearchParams(location.search).get('screen') === 'projector';
  document.body.classList.toggle('projector',projector);
  const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function save() { localStorage.setItem(STORE,JSON.stringify(state)); channel?.postMessage({type:'update'}); render(); }
  function snapshot() { undoStack.push(JSON.stringify(state)); if (undoStack.length > 30) undoStack.shift(); }
  function notify(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'),2600); }
  const roster = () => ROSTERS[state.classKey];
  const studentRecords = (classKey,index) => state.records[classKey].filter(item => item.studentIndex === index);
  const turnComplete = (classKey,index) => {
    const records=studentRecords(classKey,index);
    return records.some(item=>item.isRetry) || records.filter(item=>!item.isRetry).length>=state.wordsPerStudent;
  };
  const canRetry = (classKey,index) => {
    const records=studentRecords(classKey,index);
    return records.length>0 && turnComplete(classKey,index) && records.every(item=>!item.correct && !item.isRetry) && !state.absent[classKey].includes(index);
  };
  const availableStudents = () => roster().map((_,index) => index).filter(index => !state.absent[state.classKey].includes(index) && !state.completed[state.classKey].includes(index));
  const availableWords = () => WORDS.map((_,index) => index).filter(index => !state.usedWords[state.classKey].includes(index));
  function drawWheel(canvas,kind,rotation=0,count) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d'), n = count || (kind === 'student' ? roster().length : WORDS.length), size = canvas.width, radius = size/2-12, center=size/2;
    ctx.clearRect(0,0,size,size);
    const colors = kind === 'student' ? ['#46d1d5','#2d9fc2','#4d6fd1','#5a91ce','#34b5bb','#5977c7'] : ['#b983ee','#8567cb','#665eb9','#d795ba','#9670dd','#aa80cf'];
    for (let i=0;i<n;i++) {
      const start = -Math.PI/2 + rotation + i*2*Math.PI/n, end = start + 2*Math.PI/n;
      ctx.beginPath(); ctx.moveTo(center,center); ctx.arc(center,center,radius,start,end); ctx.closePath(); ctx.fillStyle=colors[i%colors.length]; ctx.fill();
      ctx.lineWidth=kind==='student'?3:1.4; ctx.strokeStyle='#ffffff9c'; ctx.stroke();
      // The PDF numbers its words, so even a number on the audience wheel would reveal the answer.
      if (canvas.id !== 'projectorWordWheel' && (n <= 24 || i%2===0)) {
        const angle=(start+end)/2;
        ctx.save(); ctx.translate(center+Math.cos(angle)*radius*.76,center+Math.sin(angle)*radius*.76);
        ctx.rotate(angle+Math.PI/2); ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.font=`800 ${kind==='student'?29:17}px Alexandria,Arial,sans-serif`;ctx.fillText(String(i+1),0,0);ctx.restore();
      }
    }
    ctx.beginPath();ctx.arc(center,center,radius,0,2*Math.PI);ctx.lineWidth=12;ctx.strokeStyle='#f0e9ff';ctx.stroke();
    ctx.beginPath();ctx.arc(center,center,radius-12,0,2*Math.PI);ctx.lineWidth=3;ctx.strokeStyle='#ffffff7a';ctx.stroke();
  }
  const wheelRotation={student:0,word:0};
  const ease=t=>1-Math.pow(1-t,4);
  function animateWheel(kind,index,count,audienceOnly=false) {
    const student = kind==='student', selectors = audienceOnly ? [student?'#projectorStudentWheel':'#projectorWordWheel'] : [student?'#studentWheel':'#wordWheel'];
    const canvases = selectors.map($).filter(Boolean), slice=2*Math.PI/count, start=wheelRotation[kind], desired=-(index+.5)*slice;
    const adjustment=((desired-start)%(2*Math.PI)+2*Math.PI)%(2*Math.PI), finish=start+6*2*Math.PI+adjustment, duration=2900;
    return new Promise(resolve=>{
      const begun=performance.now();
      function frame(now) {
        const t=Math.min(1,(now-begun)/duration),angle=start+(finish-start)*ease(t);
        canvases.forEach(canvas=>drawWheel(canvas,kind,angle,count));
        if(t<1)requestAnimationFrame(frame);else{wheelRotation[kind]=finish%(2*Math.PI);resolve();}
      }
      requestAnimationFrame(frame);
    });
  }
  function formatTimer() {
    const t=state.timer, seconds=t.running ? Math.max(0,t.remaining-Math.floor((Date.now()-t.startedAt)/1000)) : t.remaining;
    return `00:${String(seconds).padStart(2,'0')}`;
  }
  function setTimer(running,remaining=45){state.timer={running,remaining,startedAt:running?Date.now():null};save();}
  function updateTimerDisplay(){const value=formatTimer();if($('#timer'))$('#timer').textContent=value;if($('#projectorTimer'))$('#projectorTimer').textContent=value;if(state.timer.running&&value==='00:00'){state.timer={running:false,remaining:0,startedAt:null};save();notify('Time is up. The teacher decides the result.')}}
  function render() {
    const c=state.classKey, current=state.current, remaining=availableStudents().length;
    document.querySelectorAll('[data-class]').forEach(btn=>btn.classList.toggle('active',btn.dataset.class===c));
    document.querySelectorAll('[data-count]').forEach(btn=>btn.classList.toggle('active',Number(btn.dataset.count)===state.wordsPerStudent));
    $('#remainingStudents').textContent=remaining;$('#remainingWords').textContent=availableWords().length;$('#answeredCount').textContent=state.records[c].length;
    $('#wheelClass').textContent='4'+c;$('#projectorClassWheel').textContent='4'+c;$('#projectorClass').textContent='GRADE 4'+c;
    const student=current?roster()[current.studentIndex]:'';
    $('#chosenStudent').textContent=student||'Ready for the first spin';$('#judgeStudent').textContent=student||'No student selected';$('#projectorStudent').textContent=student||'Waiting for a student';
    $('#studentProgress').textContent=current?(current.retry?'Retry chance · new word':`Word ${current.results.length+1} of ${state.wordsPerStudent}`):'The name will appear after the spin';
    const wordIndex=current?.pendingWord;
    $('#judgeWord').textContent=wordIndex!==null&&wordIndex!==undefined?WORDS[wordIndex]:'—';
    $('#wordStatus').textContent=wordIndex!==null&&wordIndex!==undefined?`Word ${wordIndex+1} is ready`:current?'Ready to choose':'Choose a student first';
    $('#wordPosition').textContent=wordIndex!==null&&wordIndex!==undefined?`Word ${wordIndex+1} in the Round 1 list`:'Choose a word to begin spelling';
    $('#projectorPrompt').textContent=wordIndex!==null&&wordIndex!==undefined?'Listen to your teacher and spell with confidence':student?'Waiting for the word':'The teacher will choose a student and a word';
    $('#spinStudent').disabled=spinning||!!current||remaining===0;$('#spinWord').disabled=spinning||!current||wordIndex!==null&&wordIndex!==undefined||availableWords().length===0;
    $('#markCorrect').disabled=spinning||wordIndex===null||wordIndex===undefined;$('#markIncorrect').disabled=$('#markCorrect').disabled;
    $('#skipStudent').disabled=!current||spinning;$('#undoAction').disabled=undoStack.length===0||spinning;
    $('#timerToggle').textContent=state.timer.running?'Ⅱ':'▶';updateTimerDisplay();
    $('#rosterCount').textContent=cloud?.ready?`${roster().length} students`:`${roster().length} sample names`;
    $('#rosterList').innerHTML=roster().map((name,index)=>{
      const absent=state.absent[c].includes(index),done=state.completed[c].includes(index),retry=canRetry(c,index);
      return `<div class="roster-row ${absent?'absent':''} ${done?'done':''}"><span class="number">${String(index+1).padStart(2,'0')}</span><strong>${escapeHTML(name)}</strong>${retry?`<button type="button" class="retry-btn" data-retry="${index}" ${current||spinning||!availableWords().length?'disabled':''}>↻ Retry</button>`:''}<label><input type="checkbox" data-absent="${index}" ${absent?'checked':''} ${done||current?.studentIndex===index?'disabled':''}><span>${absent?'Absent':studentRecords(c,index).some(item=>item.correct)?'Qualified':done?'Done':'Present'}</span></label></div>`;
    }).join('');
    const records=state.records[c];
    $('#resultList').innerHTML=records.length?records.slice().reverse().map((item,i)=>`<div class="result-row"><span>#${records.length-i}${item.isRetry?' · Retry':''}</span><strong>${escapeHTML(roster()[item.studentIndex]||'Student')}</strong><b>${escapeHTML(WORDS[item.wordIndex]||'')}</b><i class="${item.correct?'ok':'no'}">${item.correct?'Correct':'Incorrect'}</i></div>`).join(''):'<div class="empty-state">No results yet.<br>Spin the student wheel to begin.</div>';
    if(!spinning){drawWheel($('#studentWheel'),'student',wheelRotation.student,roster().length);drawWheel($('#wordWheel'),'word',wheelRotation.word,WORDS.length);drawWheel($('#projectorStudentWheel'),'student',wheelRotation.student,roster().length);drawWheel($('#projectorWordWheel'),'word',wheelRotation.word,WORDS.length);}
  }
  async function spinStudent() {
    if(spinning||state.current)return;
    const choices=availableStudents();if(!choices.length){notify('Every present student has had a turn.');return;}
    snapshot();spinning=true;render();const index=choices[rand(choices.length)];channel?.postMessage({type:'spin',kind:'student',index,count:roster().length});
    await animateWheel('student',index,roster().length);
    state.current={studentIndex:index,pendingWord:null,results:state.records[state.classKey].filter(item=>item.studentIndex===index).map(item=>({wordIndex:item.wordIndex,correct:item.correct}))};spinning=false;save();notify('Student selected. Now spin for a word.');
  }
  function retryStudent(index) {
    const classKey=state.classKey;
    if(spinning||state.current||!canRetry(classKey,index)||!availableWords().length)return;
    snapshot();
    state.current={studentIndex:index,pendingWord:null,results:studentRecords(classKey,index).map(item=>({wordIndex:item.wordIndex,correct:item.correct,isRetry:!!item.isRetry})),retry:true};
    save();notify('Retry selected. Spin for a new word.');
    document.querySelector('.stage-grid')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  async function spinWord() {
    if(spinning||!state.current||state.current.pendingWord!==null)return;
    const choices=availableWords();if(!choices.length){notify('No unused words remain for this class.');return;}
    snapshot();spinning=true;render();const index=choices[rand(choices.length)];channel?.postMessage({type:'spin',kind:'word',index,count:WORDS.length});
    await animateWheel('word',index,WORDS.length);
    state.current.pendingWord=index;state.usedWords[state.classKey].push(index);spinning=false;state.timer={running:true,remaining:45,startedAt:Date.now()};save();notify('The word is visible only to the teacher. Read it aloud.');
  }
  async function mark(correct) {
    const current=state.current;if(!current||current.pendingWord===null||spinning)return;
    const wordIndex=current.pendingWord,studentIndex=current.studentIndex,attemptNo=current.results.length+1;
    let saved;
    if(cloud){
      spinning=true;render();
      try{saved=await cloud.save(cloud.rosterIds[state.classKey][studentIndex],attemptNo,wordIndex,correct,!!current.retry)}
      catch(error){spinning=false;render();notify(`Result was not saved: ${error.message}`);return}
      spinning=false;undoStack=[];
    }else snapshot();
    current.results.push({wordIndex,correct,isRetry:!!current.retry});state.records[state.classKey].push({studentIndex,wordIndex,correct,isRetry:!!current.retry,time:saved?.attempt?.created_at?Date.parse(saved.attempt.created_at):Date.now()});current.pendingWord=null;
    state.timer={running:false,remaining:45,startedAt:null};
    if(current.retry||current.results.filter(item=>!item.isRetry).length>=state.wordsPerStudent){state.completed[state.classKey]=[...new Set([...state.completed[state.classKey],studentIndex])];state.current=null;notify(correct?'This student qualifies for Round 1.':current.retry?'Retry recorded. The student did not qualify.':'Result recorded. This student can have one retry.');}
    else notify('Result recorded. Spin for this student’s second word.');
    save();
  }
  function switchClass(classKey){if(spinning)return;if(state.current){notify('Finish or skip the current turn before switching classes.');return;}state.classKey=classKey;state.timer={running:false,remaining:45,startedAt:null};save();}
  function setWordCount(count){if(spinning)return;if(state.current){notify('Finish the current turn before changing the word count.');return;}state.wordsPerStudent=count;for(const classKey of ['A','B'])state.completed[classKey]=ROSTERS[classKey].map((_,index)=>index).filter(index=>turnComplete(classKey,index));save();}
  function skipStudent(){if(!state.current||spinning)return;snapshot();const word=state.current.pendingWord;if(word!==null)state.usedWords[state.classKey]=state.usedWords[state.classKey].filter(index=>index!==word);state.current=null;state.timer={running:false,remaining:45,startedAt:null};save();notify('Student skipped and remains eligible for a later turn.');}
  function undo(){if(!undoStack.length||spinning)return;state=JSON.parse(undoStack.pop());save();notify('Last step undone.');}
  async function toggleAbsent(index,absent){if(state.current?.studentIndex===index)return;const classKey=state.classKey;if(cloud){try{await cloud.setAbsent(cloud.rosterIds[classKey][index],absent)}catch(error){notify(`Attendance was not saved: ${error.message}`);render();return}}else snapshot();const list=state.absent[classKey];state.absent[classKey]=absent?[...new Set([...list,index])]:list.filter(item=>item!==index);save();}
  document.querySelectorAll('[data-class]').forEach(btn=>btn.addEventListener('click',()=>switchClass(btn.dataset.class)));
  document.querySelectorAll('[data-count]').forEach(btn=>btn.addEventListener('click',()=>setWordCount(Number(btn.dataset.count))));
  $('#spinStudent').addEventListener('click',spinStudent);$('#spinWord').addEventListener('click',spinWord);
  $('#markCorrect').addEventListener('click',()=>mark(true));$('#markIncorrect').addEventListener('click',()=>mark(false));
  $('#skipStudent').addEventListener('click',skipStudent);$('#undoAction').addEventListener('click',undo);
  $('#rosterList').addEventListener('change',event=>{if(event.target.matches('[data-absent]'))toggleAbsent(Number(event.target.dataset.absent),event.target.checked);});
  $('#rosterList').addEventListener('click',event=>{const button=event.target.closest('[data-retry]');if(button)retryStudent(Number(button.dataset.retry));});
  $('#timerToggle').addEventListener('click',()=>{const t=state.timer;if(t.running){setTimer(false,Math.max(0,t.remaining-Math.floor((Date.now()-t.startedAt)/1000)));}else setTimer(true,t.remaining||45);});
  $('#timerReset').addEventListener('click',()=>setTimer(false,45));
  $('#resetPreview').addEventListener('click',()=>{if(confirm('Start a new preview and clear results saved on this device?')){state=fresh();undoStack=[];save();notify('New preview started.')}});
  $('#openProjector').addEventListener('click',()=>{const url=new URL(location.href);url.searchParams.set('screen','projector');window.open(url.href,'spell-arabia-projector');});
  $('#backToTeacher').addEventListener('click',()=>{const url=new URL(location.href);url.searchParams.delete('screen');location.href=url.href;});
  window.addEventListener('storage',event=>{if(event.key===STORE){state=load();render();}});
  setInterval(updateTimerDisplay,250);
  if(cloud)cloud.init(()=>{
    if(projector){state=load();render();return;}
    const saved=cloud.toState();
    state.current=null;state.timer={running:false,remaining:45,startedAt:null};
    state.records=saved.records;state.absent=saved.absent;state.usedWords=saved.usedWords;
    state.completed={A:[],B:[]};
    for(const classKey of ['A','B'])for(let i=0;i<ROSTERS[classKey].length;i++)if(turnComplete(classKey,i))state.completed[classKey].push(i);
    undoStack=[];save();notify('Roster and results loaded from the cloud.');
  });
  render();
})();
