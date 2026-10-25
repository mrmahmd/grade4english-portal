window.bookReady.then(() => {
'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const legacyKey='primary4-discovery-book-1437-v1';
const KEY=legacyKey+':'+window.bookUserId;
const empty=()=>({version:1,page:4,visited:[],bookmarks:[],notes:{},ink:{},text:{},lesson:{choices:{},gaps:['','','','',''],gardenChecked:false,writing:'',celebrated:false}});
let state=empty(),view='home',tool='read',zoom=100,stroke=null,toastTimer;
try{const saved=JSON.parse(localStorage.getItem(KEY)||(window.bookUserId==='preview'?localStorage.getItem(legacyKey):null)||'null');if(saved?.version===1){state={...empty(),...saved,lesson:{...empty().lesson,...saved.lesson}};state.page=Math.min(64,Math.max(1,Number(state.page)||4));}}catch{ $('#saveWarning').hidden=false; }
const units=[
 {n:'01',name:'The Five Senses',desc:'Lesson activities and reviews.',start:4,end:12,icon:'eye',bg:'#e8f2e8',ink:'#376a53'},
 {n:'02',name:'My Community',desc:'Community activities and grammar.',start:13,end:23,symbol:'⌂',bg:'#f6eddd',ink:'#a47d32'},
 {n:'03',name:'Animals in Our World',desc:'Animals, reading and comparisons.',start:24,end:32,symbol:'♧',bg:'#e9edf7',ink:'#637ba0'},
 {n:'04',name:'My Homeland',desc:'Places, positions and writing.',start:33,end:42,symbol:'◇',bg:'#f5e9e1',ink:'#ac8062'},
 {n:'05',name:'A Day at Work',desc:'Jobs and superlatives.',start:43,end:51,symbol:'✧',bg:'#ede9f5',ink:'#8a71a8'},
 {n:'06',name:'The Hundred Dresses',desc:'Story activities and review.',start:52,end:58,icon:'book',bg:'#e7f0ef',ink:'#598983'}
];
const sections=[{n:'↗',name:'Cover & introduction',start:1,end:3},...units,{n:'✓',name:'Model exams',start:59,end:64}];
const questions=[
 {q:'Our _____ help us stay safe and learn.',options:['books','neighbours','senses','toys'],answer:'senses',why:'Our senses help us learn about the world.'},
 {q:'If we smell smoke, we know there is a _____.',options:['tree','flower','fire','bird'],answer:'fire',why:'Smoke can warn us about a fire.'},
 {q:"We _____ the teacher’s voice in class.",options:['see','hear','taste','smell'],answer:'hear',why:'We use our ears to hear a voice.'},
 {q:'I can _____ soft things with my fingers.',options:['touch','hear','smell','see'],answer:'touch',why:'Our fingers help us feel soft things.'},
 {q:'You use your _____ to read a book.',options:['tongue','ears','eyes','nose'],answer:'eyes',why:'We use our eyes to see the words.'}
];
const gapAnswers=['butterflies','see','smells','flowers','hear'];
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=s=>String(s).trim().toLowerCase().replace(/[.!?]+$/,'');
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));$('#saveStatus').textContent='✓ Saved on this device';}catch{$('#saveWarning').hidden=false;$('#saveStatus').textContent='Export to keep your work';}}
function toast(text){clearTimeout(toastTimer);$('#toast').textContent=text;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,3500);}
function openView(next){const previous=view;view=next;$$('.view').forEach(el=>el.hidden=el.id!==next+'View');$$('nav [data-view]').forEach(el=>el.classList.toggle('active',el.dataset.view===next));history.replaceState(null,'','#'+next);if(next==='reader')setPage(state.page);if(next==='home')updateJourney();window.scrollTo({top:0,behavior:'instant'});document.dispatchEvent(new CustomEvent('book:view',{detail:{view:next,previous,page:state.page}}));}
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>openView(b.dataset.view)));
$('.brand').addEventListener('click',e=>{e.preventDefault();openView('home');});
$('#unitGrid').innerHTML=units.map(u=>`<button class="unit-card" data-page="${u.start}" style="--unit-bg:${u.bg};--unit-ink:${u.ink}"><div class="unit-card-top"><span class="unit-number">UNIT ${u.n}</span><span class="unit-symbol">${u.icon?`<svg><use href="#${u.icon}"/></svg>`:u.symbol}</span></div><h3>${u.name}</h3><p>${u.desc}</p><div class="unit-card-bottom"><small>Pages ${u.start}–${u.end}</small><span aria-hidden="true">↗</span></div></button>`).join('');
$('#contents').innerHTML=sections.map(u=>`<button class="contents-item" data-page="${u.start}" data-start="${u.start}" data-end="${u.end}"><span class="contents-number">${u.n}</span><span><b>${u.name}</b><small>Pages ${u.start}–${u.end}</small></span></button>`).join('');
$$('[data-page]').forEach(b=>b.addEventListener('click',()=>{state.page=Number(b.dataset.page);openView('reader');$('#contentsPanel').classList.remove('open');$('#contentsToggle').setAttribute('aria-expanded','false');}));
function updateJourney(){$('#readingSummary').textContent=state.visited.length?`${state.visited.length} of 64 pages opened · Your notes and answers are saved here.`:'Your last opened page will appear here.';$('#continueReading').textContent=state.visited.length?`Continue at page ${state.page} →`:'Start with page 4 →';}
$('#continueReading').addEventListener('click',()=>openView('reader'));$('#startReading').addEventListener('click',()=>openView('reader'));
$('#contentsToggle').addEventListener('click',()=>{const open=$('#contentsPanel').classList.toggle('open');$('#contentsToggle').setAttribute('aria-expanded',String(open));});
function setPage(n){if(!Number.isFinite(n))n=state.page;n=Math.max(1,Math.min(64,Math.round(n)));state.page=n;if(!state.visited.includes(n))state.visited.push(n);stroke=null;$('#pageNumber').value=n;$('#pageImage').src=`pages/${String(n).padStart(2,'0')}.webp`;$('#pageImage').alt=`Original English Language textbook, page ${n}`;$('#pageNote').value=state.notes[n]||'';$('#pageCaption').textContent=`Original textbook · page ${n}`;$('#prevPage').disabled=n===1;$('#nextPage').disabled=n===64;$('#lessonBanner').hidden=n<4;$('#lessonBanner span').innerHTML='<b>Practise this page interactively.</b> Check answers and save your writing.';$$('.contents-item').forEach(b=>b.classList.toggle('active',n>=Number(b.dataset.start)&&n<=Number(b.dataset.end)));$('#pageViewport').scrollTo(0,0);paintInk();paintText();updateBookmarks();save();}
$('#pageImage').addEventListener('error',()=>toast('This page could not load. Check that the pages folder is beside this file.'));
$('#prevPage').addEventListener('click',()=>setPage(state.page-1));$('#nextPage').addEventListener('click',()=>setPage(state.page+1));$('#pageNumber').addEventListener('change',e=>setPage(Number(e.target.value)));
document.addEventListener('keydown',e=>{if(view!=='reader'||e.target.closest('input,textarea,[contenteditable]'))return;if(e.key==='ArrowRight'){e.preventDefault();setPage(state.page+1);}if(e.key==='ArrowLeft'){e.preventDefault();setPage(state.page-1);}});
function setZoom(delta){zoom=Math.max(100,Math.min(220,zoom+delta));$('#pageStage').style.width=zoom+'%';$('#zoomLabel').textContent=zoom+'%';$('#zoomOut').disabled=zoom===100;$('#zoomIn').disabled=zoom===220;}
$('#zoomIn').addEventListener('click',()=>setZoom(20));$('#zoomOut').addEventListener('click',()=>setZoom(-20));setZoom(0);
function updateBookmarks(){const marked=state.bookmarks.includes(state.page);$('#bookmarkPage').setAttribute('aria-pressed',String(marked));$('#bookmarkPage').setAttribute('aria-label',marked?'Remove bookmark':'Bookmark this page');$('#bookmarks').replaceChildren();if(!state.bookmarks.length){const p=document.createElement('p');p.textContent='A page worth coming back to? Tap the bookmark above it.';$('#bookmarks').append(p);}for(const n of [...state.bookmarks].sort((a,b)=>a-b)){const b=document.createElement('button');b.className='bookmark-link';b.textContent=`◇ Page ${n}`;b.addEventListener('click',()=>setPage(n));$('#bookmarks').append(b);}}
$('#bookmarkPage').addEventListener('click',()=>{const i=state.bookmarks.indexOf(state.page);if(i<0)state.bookmarks.push(state.page);else state.bookmarks.splice(i,1);updateBookmarks();save();});
$('#pageNote').addEventListener('input',e=>{state.notes[state.page]=e.target.value;save();});
function chooseTool(next){tool=next;$$('[data-tool]').forEach(b=>b.classList.toggle('active',b.dataset.tool===next));$('#pageStage').classList.toggle('drawing',['pen','highlight'].includes(next));$('#pageStage').classList.toggle('typing',next==='text');const hints={read:'Read mode: scroll the page. Use Add answer to type anywhere, or Pen to write.',pen:'Pen: write with your finger, mouse or stylus. Switch to Read to scroll.',highlight:'Highlight: drag across a word or sentence. Switch to Read to scroll.',text:'Add answer: tap a blank space on the page, then type. Tap × to remove an answer.'};$('#toolHint').textContent=hints[next];}
$$('[data-tool]').forEach(b=>b.addEventListener('click',()=>chooseTool(b.dataset.tool)));
const NS='http://www.w3.org/2000/svg';
function pathFor(s){const p=document.createElementNS(NS,'path');p.setAttribute('d',s.points.map((pt,i)=>`${i?'L':'M'}${(pt[0]*1000).toFixed(1)},${(pt[1]*1400).toFixed(1)}`).join(' '));p.setAttribute('fill','none');p.setAttribute('stroke',s.color);p.setAttribute('stroke-width',s.kind==='highlight'?'19':'2.5');p.setAttribute('stroke-linecap','round');p.setAttribute('stroke-linejoin','round');if(s.kind==='highlight')p.setAttribute('opacity','.3');return p;}
function paintInk(){$('#inkLayer').replaceChildren();for(const s of state.ink[state.page]||[])$('#inkLayer').append(pathFor(s));}
function point(e){const r=$('#inkLayer').getBoundingClientRect();return[Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))];}
$('#inkLayer').addEventListener('pointerdown',e=>{if(!['pen','highlight'].includes(tool))return;e.preventDefault();$('#inkLayer').setPointerCapture(e.pointerId);stroke={color:tool==='highlight'?'#edbd28':$('#inkColor').value,kind:tool,points:[point(e)]};$('#inkLayer').append(pathFor(stroke));});
$('#inkLayer').addEventListener('pointermove',e=>{if(!stroke)return;e.preventDefault();stroke.points.push(point(e));$('#inkLayer').lastElementChild.replaceWith(pathFor(stroke));});
function finishStroke(){if(!stroke)return;if(stroke.points.length===1)stroke.points.push([stroke.points[0][0]+.0001,stroke.points[0][1]+.0001]);(state.ink[state.page]??=[]).push(stroke);stroke=null;paintInk();save();}
$('#inkLayer').addEventListener('pointerup',finishStroke);$('#inkLayer').addEventListener('pointercancel',finishStroke);
$('#undoInk').addEventListener('click',()=>{const lines=state.ink[state.page]||[];if(lines.length){lines.pop();paintInk();save();}else toast('No pen marks to undo on this page.');});
function paintText(){$('#textLayer').replaceChildren();for(const item of state.text[state.page]||[]){const box=document.createElement('div');box.className='page-answer';box.style.left=(item.x*100)+'%';box.style.top=(item.y*100)+'%';const input=document.createElement('textarea');input.value=item.value;input.rows=2;input.setAttribute('aria-label','Your answer on page '+state.page);input.addEventListener('input',()=>{item.value=input.value;save();});const remove=document.createElement('button');remove.textContent='×';remove.setAttribute('aria-label','Remove this answer');remove.addEventListener('click',e=>{e.stopPropagation();state.text[state.page]=state.text[state.page].filter(t=>t.id!==item.id);paintText();save();});box.append(input,remove);$('#textLayer').append(box);}}
$('#pageStage').addEventListener('click',e=>{if(tool!=='text'||e.target.closest('.page-answer'))return;const r=$('#pageStage').getBoundingClientRect();const item={id:Date.now()+'-'+Math.random(),x:Math.max(0,Math.min(.57,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(.93,(e.clientY-r.top)/r.height)),value:''};(state.text[state.page]??=[]).push(item);paintText();save();$('#textLayer').lastElementChild.querySelector('textarea').focus();});
window.BookReader={page:()=>state.page,open:openView,go:n=>{state.page=n;openView('reader');},legacyLesson:()=>state.lesson};
$('#exportWork').addEventListener('click',()=>{const data=JSON.stringify({book:'Primary 4 English Language - Performance Tasks and Assessment',exportedAt:new Date().toISOString(),...state,practice:window.WorkbookPractice?.export()||null},null,2);const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='my-discovery-book-work.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),500);toast('Your work has been exported as a backup file.');});
$('#restoreWork').addEventListener('click',()=>$('#restoreFile').click());
$('#restoreFile').addEventListener('change',async e=>{
 const file=e.target.files[0];if(!file)return;
 try{
  if(file.size>5e6)throw Error('The backup is too large.');
  const data=JSON.parse(await file.text());
  if(data.version!==1||!data.book?.startsWith('Primary 4 English Language')||!data.lesson||!Array.isArray(data.visited)||!Array.isArray(data.bookmarks))throw Error('This is not a backup for this book.');
  const restored=empty(),validPage=n=>Number.isInteger(n)&&n>=1&&n<=64;
  restored.page=validPage(data.page)?data.page:4;
  restored.visited=[...new Set(data.visited.filter(validPage))];restored.bookmarks=[...new Set(data.bookmarks.filter(validPage))];
  for(let n=1;n<=64;n++){
   if(typeof data.notes?.[n]==='string')restored.notes[n]=data.notes[n].slice(0,50000);
   if(Array.isArray(data.text?.[n]))restored.text[n]=data.text[n].slice(0,100).filter(t=>Number.isFinite(t.x)&&Number.isFinite(t.y)&&typeof t.value==='string').map((t,i)=>({id:String(n)+'-'+i,x:Math.max(0,Math.min(.57,t.x)),y:Math.max(0,Math.min(.93,t.y)),value:t.value.slice(0,5000)}));
   if(Array.isArray(data.ink?.[n]))restored.ink[n]=data.ink[n].slice(0,1000).filter(s=>Array.isArray(s.points)&&s.points.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite))).map(s=>({color:/^#[0-9a-f]{6}$/i.test(s.color)?s.color:'#146bca',kind:s.kind==='highlight'?'highlight':'pen',points:s.points.slice(0,10000).map(p=>p.map(v=>Math.max(0,Math.min(1,v))))}));
  }
  for(let i=0;i<5;i++){if(questions[i].options.includes(data.lesson.choices?.[i]))restored.lesson.choices[i]=data.lesson.choices[i];restored.lesson.gaps[i]=typeof data.lesson.gaps?.[i]==='string'?data.lesson.gaps[i].slice(0,100):'';}
  restored.lesson.gardenChecked=data.lesson.gardenChecked===true;restored.lesson.writing=String(data.lesson.writing||'').slice(0,50000);restored.lesson.celebrated=data.lesson.celebrated===true;
  if(!confirm('Restore this backup? It will replace the work saved in this browser for this book.'))return;
  state=restored;save();if(data.practice)window.WorkbookPractice?.restore(data.practice);openView('reader');toast('Your reading work has been restored.');
 }catch(err){toast('Could not restore: '+err.message);}finally{e.target.value='';}
});
updateJourney();updateBookmarks();
const initial=location.hash.slice(1);openView(['home','reader','activity'].includes(initial)?initial:'home');
});
