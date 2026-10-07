(() => {
  'use strict';
  const words=window.SpellArabiaWords,$=selector=>document.querySelector(selector),key='spellArbiaStudentPracticeV1';
  let state;
  try{state=JSON.parse(sessionStorage.getItem(key))}catch{}
  if(!state||!Array.isArray(state.used))state={used:[],current:null,draft:'',correct:0,firstTry:true,solved:false};
  let spinning=false,rotation=0;
  const save=()=>sessionStorage.setItem(key,JSON.stringify(state));
  const random=max=>{const value=new Uint32Array(1);crypto.getRandomValues(value);return value[0]%max};
  const currentWord=()=>Number.isInteger(state.current)?words[state.current]:null;
  function draw(angle=0){
    const canvas=$('#practiceWheel'),ctx=canvas.getContext('2d'),center=canvas.width/2,radius=center-12,slice=Math.PI*2/words.length;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let i=0;i<words.length;i++){
      const start=-Math.PI/2+angle+i*slice;
      ctx.beginPath();ctx.moveTo(center,center);ctx.arc(center,center,radius,start,start+slice);ctx.closePath();
      ctx.fillStyle=['#55cfd3','#397bb9','#a079d4','#b88adb','#6fa7d4','#6cc9e1'][i%6];ctx.fill();ctx.strokeStyle='#fff9';ctx.lineWidth=1.4;ctx.stroke();
      if(i%2===0){const label=start+slice/2;ctx.save();ctx.translate(center+Math.cos(label)*radius*.78,center+Math.sin(label)*radius*.78);ctx.rotate(label+Math.PI/2);ctx.fillStyle='#fff';ctx.font='800 17px Alexandria,Arial,sans-serif';ctx.textAlign='center';ctx.fillText(String(i+1),0,0);ctx.restore()}
    }
    ctx.beginPath();ctx.arc(center,center,radius,0,Math.PI*2);ctx.lineWidth=12;ctx.strokeStyle='#f7f5ff';ctx.stroke();
  }
  function feedback(text,type=''){const box=$('#feedback');box.textContent=text;box.className=`feedback ${type}`.trim()}
  function render(){
    const word=currentWord(),has=!!word;
    $('#wordMask').textContent=has?state.solved?word:word.replace(/[A-Za-z]/g,'•'):'Spin to begin';
    $('#wordHint').textContent=has?'Listen carefully, then type the spelling.':'Listen to the word, then type how you spell it.';
    for(const id of ['hearWord','showWord','answerInput','checkAnswer'])$('#'+id).disabled=!has||state.solved&&['answerInput','checkAnswer'].includes(id);
    $('#answerInput').value=state.draft||'';
    $('#practicedCount').textContent=String(state.used.length);$('#correctCount').textContent=String(state.correct||0);$('#remainingCount').textContent=String(words.length-state.used.length);
    $('#spinWord').disabled=spinning;draw(rotation);
  }
  function speak(){const word=currentWord();if(!word)return;if(!('speechSynthesis'in window)){feedback('Audio is unavailable here. Use Reveal word to practice.','try');return}speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(word);utterance.lang='en-GB';utterance.rate=.82;speechSynthesis.speak(utterance)}
  async function spin(){
    if(spinning)return;
    if(state.used.length>=words.length){state.used=[];state.correct=0;feedback('You finished all 50 words! Starting a new practice cycle.','good')}
    const choices=words.map((_,i)=>i).filter(i=>!state.used.includes(i));
    const selected=choices[random(choices.length)],start=rotation,slice=Math.PI*2/words.length;
    const desired=-(selected+.5)*slice,adjustment=((desired-start)%(Math.PI*2)+Math.PI*2)%(Math.PI*2),finish=start+Math.PI*2*5+adjustment;
    spinning=true;$('#spinWord').disabled=true;
    const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?100:1800,begun=performance.now();
    await new Promise(resolve=>{function frame(now){const t=Math.min(1,(now-begun)/duration);rotation=start+(finish-start)*(1-Math.pow(1-t,4));draw(rotation);if(t<1)requestAnimationFrame(frame);else resolve()}requestAnimationFrame(frame)});
    state.current=selected;state.used.push(selected);state.draft='';state.firstTry=true;state.solved=false;spinning=false;save();render();feedback('Tap “Hear the word”, then spell it in the box.');speak();$('#answerInput').focus();
  }
  $('#spinWord').addEventListener('click',spin);
  $('#hearWord').addEventListener('click',speak);
  $('#showWord').addEventListener('click',()=>{const word=currentWord();if(word){$('#wordMask').textContent=word;feedback('Look, remember, and try spelling it again.','try')}});
  $('#answerInput').addEventListener('input',event=>{state.draft=event.target.value;save()});
  $('#answerForm').addEventListener('submit',event=>{
    event.preventDefault();const word=currentWord();if(!word||state.solved)return;
    const answer=$('#answerInput').value.trim();if(!answer){feedback('Type your spelling first.','try');return}
    if(answer.toLocaleLowerCase('en')===word.toLocaleLowerCase('en')){if(state.firstTry)state.correct++;state.draft=answer;state.solved=true;state.firstTry=false;save();render();feedback('Excellent spelling! Spin again for another word.','good')}
    else{state.firstTry=false;state.draft=answer;save();feedback('Not quite. Keep your answer and try again, or reveal the word.','try')}
  });
  render();
})();
