"use strict";

// Each question is grounded in Connect Plus 4, Unit 1, Lessons 1–5.
// This standalone game never calls the portal's authentication or database code.
const QUESTIONS = [
  {lesson:1,type:"choice",prompt:"We use our ___ to breathe.",options:["lungs","stomach","tongue","skin"],answer:"lungs",explain:"We use our lungs to breathe."},
  {lesson:1,type:"tf",prompt:"Food goes into our stomach after we swallow it.",answer:true,explain:"Food goes into the stomach after we swallow it."},
  {lesson:1,type:"fill",prompt:"The heart pumps ___ around the body.",answer:"blood",explain:"The heart pumps blood around the body."},
  {lesson:1,type:"drag",prompt:"Match each action to the body system we use.",pairs:[["When we eat","digestive system"],["When we breathe","respiratory system"],["When we move","bones and muscles"]],explain:"We use different body systems to eat, breathe, and move."},
  {lesson:1,type:"order",prompt:"Put the words in order.",words:["The","skeleton","protects","our","organs."],explain:"The skeleton protects our organs."},

  {lesson:2,type:"choice",prompt:"This mango is sweet. Which sense helps us know that?",options:["taste","hearing","sight","touch"],answer:"taste",explain:"Our sense of taste tells us that food is sweet."},
  {lesson:2,type:"tf",prompt:"People can read Braille by touching dots.",answer:true,explain:"Braille uses dots that people can feel."},
  {lesson:2,type:"fill",prompt:"I hear music with my ___.",answer:"ears",explain:"We use our ears to hear."},
  {lesson:2,type:"correct",prompt:"Write this sentence with the correct capital letters: youssef speaks arabic and english.",answer:"Youssef speaks Arabic and English.",caseSensitive:true,explain:"Names and languages start with capital letters: Youssef, Arabic, English."},
  {lesson:2,type:"order",prompt:"Put the words in order.",words:["We","can","feel","with","our","skin."],explain:"We can feel with our skin."},

  {lesson:3,type:"choice",prompt:"Noura ___ volleyball on Mondays.",options:["plays","play","playing","don't play"],answer:"plays",explain:"With Noura (she), use plays."},
  {lesson:3,type:"tf",prompt:"“We plays tennis after school” is correct English.",answer:false,explain:"Say: We play tennis after school."},
  {lesson:3,type:"fill",prompt:"She ___ like chocolate cake.",answer:"doesn't",accept:["does not"],explain:"With she, use doesn't."},
  {lesson:3,type:"correct",prompt:"Correct the mistake: They goes to school.",answer:"They go to school.",explain:"With they, use go, not goes."},
  {lesson:3,type:"drag",prompt:"Match each sentence with the correct verb.",pairs:[["I ___ a brother.","have"],["He ___ a brother.","has"],["We ___ art.","do"]],explain:"I have. He has. We do."},

  {lesson:4,type:"choice",prompt:"The White Rabbit said, “I'm ___!”",options:["late","hungry","sleepy","tall"],answer:"late",explain:"The rabbit said, “I'm late!”"},
  {lesson:4,type:"tf",prompt:"Alice followed the White Rabbit.",answer:true,explain:"Alice followed the rabbit into Wonderland."},
  {lesson:4,type:"fill",prompt:"Alice drank the liquid and became ___.",answer:"smaller",explain:"The drink made Alice smaller."},
  {lesson:4,type:"order",prompt:"Put the story events in order.",words:["Alice saw the rabbit.","Alice drank the liquid.","Alice ate the cake."],explain:"Alice saw the rabbit, drank the liquid, then ate the cake."},
  {lesson:4,type:"passage",prompt:"Complete Alice's story.",parts:["Alice found a "," marked Drink me. She became ",". Then she ate a "," and became taller."],blanks:[{options:["bottle","book","box"],answer:"bottle"},{options:["smaller","taller","faster"],answer:"smaller"},{options:["cake","apple","sandwich"],answer:"cake"}],explain:"The bottle made Alice smaller; the cake made her taller."},

  {lesson:5,type:"choice",prompt:"Eat fruit and vegetables. Drink lots of water. What is the best title?",options:["Tips for a healthy diet","A day at school","The White Rabbit","My favourite game"],answer:"Tips for a healthy diet",explain:"The title tells us the text is about healthy food and drink."},
  {lesson:5,type:"tf",prompt:"The topic sentence is usually the last sentence of a paragraph.",answer:false,explain:"The topic sentence comes first and introduces the idea."},
  {lesson:5,type:"drag",prompt:"Match each part of a paragraph to its job.",pairs:[["Topic sentence","introduces the idea"],["Main sentences","give details"],["Conclusion","finishes the paragraph"]],explain:"A paragraph has a beginning, details, and an ending."},
  {lesson:5,type:"order",prompt:"Put the sentences in order to make a paragraph.",words:["Exercise helps us stay healthy.","We can run or play a sport.","Let's be active every day."],explain:"Start with the idea, add a detail, and end the paragraph."},
  {lesson:5,type:"passage",prompt:"Complete this short text about exercise.",parts:["Exercise is good for us. We can "," or play a sport. It helps us stay ","."],blanks:[{options:["run","sleep","sit"],answer:"run"},{options:["healthy","small","late"],answer:"healthy"}],explain:"We can run for exercise, and exercise helps us stay healthy."},

  {lesson:6,type:"choice",prompt:"We use our lungs to take ___ from the air.",options:["oxygen","food","bones","water"],answer:"oxygen",explain:"Our lungs take oxygen from the air."},
  {lesson:6,type:"tf",prompt:"Sign language helps some people communicate.",answer:true,explain:"People can share ideas using sign language."},
  {lesson:6,type:"fill",prompt:"Hany ___ to school every day.",answer:"goes",explain:"With Hany (he), use goes."},
  {lesson:6,type:"correct",prompt:"Correct the mistake: He don't play football.",answer:"He doesn't play football.",accept:["He does not play football."],explain:"With he, use doesn't."},
  {lesson:6,type:"order",prompt:"Put the words in order.",words:["Alice","breathed","slowly","and","stayed","calm."],explain:"Alice breathed slowly and stayed calm."},
  {lesson:6,type:"drag",prompt:"Match each Unit 1 word to its meaning.",pairs:[["nutrients","help our bodies grow"],["Braille","dots for reading"],["conclusion","the end of a paragraph"]],explain:"These words come from the body, senses, and writing lessons."},
  {lesson:6,type:"passage",prompt:"Complete this short text.",parts:["We use our lungs to ",". We take "," from the air. Good food helps us ","."],blanks:[{options:["breathe","taste","sleep"],answer:"breathe"},{options:["oxygen","food","water"],answer:"oxygen"},{options:["grow","read","hear"],answer:"grow"}],explain:"We breathe in oxygen, and good food helps us grow."}
];

const LESSONS = ["Our Amazing Bodies","Our Senses","Present Simple","Literature Corner","Writing Paragraphs","Final Shootout"];
const TYPE_LABELS = {choice:"MULTIPLE CHOICE",tf:"TRUE OR FALSE",fill:"FILL THE BLANK",correct:"FIX THE ERROR",order:"ORDER THE SENTENCE",drag:"DRAG & MATCH",passage:"COMPLETE THE TEXT"};
const $ = id => document.getElementById(id);
const ui = {welcome:$("welcomeScreen"),game:$("gameScreen"),result:$("resultScreen"),name:$("playerName"),className:$("playerClass"),form:$("playerForm"),area:$("answerArea"),feedback:$("feedback"),check:$("checkButton"),next:$("nextButton"),pitch:$("pitch"),callout:$("pitchCallout")};
let player = {name:"",className:""};
let index = 0, correct = 0, xp = 0, streak = 0, answerState = null, locked = false;

function normalize(value,caseSensitive=false){const text=String(value).replace(/[’]/g,"'");return (caseSensitive?text:text.toLowerCase()).replace(/[^a-zA-Z0-9' ]/g," ").replace(/\s+/g," ").trim();}
function shuffle(items){const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
function show(screen){ui.welcome.classList.toggle("hidden",screen!=="welcome");ui.game.classList.toggle("hidden",screen!=="game");ui.result.classList.toggle("hidden",screen!=="result");window.scrollTo({top:0,behavior:"smooth"});}
function textNode(tag,text,className){const el=document.createElement(tag);el.textContent=text;if(className)el.className=className;return el;}

function startGame(){index=0;correct=0;xp=0;streak=0;locked=false;show("game");renderQuestion();}
function renderQuestion(){
  const q=QUESTIONS[index];locked=false;answerState=q.type==="order"?[]:q.type==="drag"?{}:null;
  ui.area.replaceChildren();ui.feedback.className="feedback hidden";ui.feedback.textContent="";ui.check.classList.remove("hidden");ui.next.classList.add("hidden");
  ui.pitch.classList.remove("goal-shot","save-shot");ui.callout.textContent="ANSWER TO TAKE YOUR SHOT";
  $("missionLabel").textContent=q.lesson===6?"THE FINAL SHOOTOUT":`ROUND ${q.lesson} OF 6`;
  $("missionTitle").textContent=LESSONS[q.lesson-1];$("missionSubtitle").textContent=q.lesson===6?"Seven skills. Seven final kicks.":"Answer correctly to score a goal!";
  $("playerBadge").textContent=`${player.name} · ${player.className}`;$("scoreLabel").textContent=`${xp} XP`;
  $("goalScore").textContent=String(correct);$("saveScore").textContent=String(index-correct);
  $("progressFill").style.width=`${index/QUESTIONS.length*100}%`;
  document.querySelector(".progress-track").setAttribute("aria-valuenow",String(index));
  $("questionCount").textContent=`Kick ${index+1} of ${QUESTIONS.length}`;$("streakLabel").textContent=`${streak} goal streak`;
  $("typeBadge").textContent=TYPE_LABELS[q.type];$("lessonBadge").textContent=q.lesson===6?"FINAL ROUND":`LESSON ${q.lesson}`;
  $("questionPrompt").textContent=q.prompt;
  $("questionHint").textContent=q.type==="order"?"Tap the words in order. Tap a placed word to move it back.":q.type==="drag"?"Drag a blue answer to a row, or tap an answer and then a row.":q.type==="passage"?"Choose a word for every gap.":q.type==="correct"?"Type the whole sentence correctly.":"Choose or type your answer.";
  if(q.type==="choice"||q.type==="tf")renderChoices(q);
  else if(q.type==="fill"||q.type==="correct")renderInput(q);
  else if(q.type==="order")renderOrder(q);
  else if(q.type==="drag")renderDrag(q);
  else renderPassage(q);
}
function renderChoices(q){const options=q.type==="tf"?["True","False"]:q.options;for(const value of options){const button=textNode("button",value,"option");button.type="button";button.addEventListener("click",()=>{if(locked)return;answerState=value;ui.area.querySelectorAll(".option").forEach(el=>el.classList.toggle("selected",el===button));});ui.area.append(button);}}
function renderInput(q){const input=document.createElement("input");input.className="answer-input";input.type="text";input.autocomplete="off";input.spellcheck=false;input.maxLength=q.type==="fill"?35:110;input.placeholder=q.type==="fill"?"Type the missing word":"Write the corrected sentence";input.setAttribute("aria-label",input.placeholder);input.addEventListener("input",()=>answerState=input.value);input.addEventListener("keydown",event=>{if(event.key==="Enter"&&!locked)checkAnswer();});ui.area.append(input);}
function renderOrder(q){const slots=textNode("div","","answer-slots");slots.setAttribute("aria-label","Your sentence");const bank=textNode("div","","word-bank");const entries=shuffle(q.words.map((word,id)=>({word,id})));function draw(){slots.replaceChildren();bank.replaceChildren();answerState.forEach(entry=>{const chip=textNode("button",entry.word,"word-chip");chip.type="button";chip.title="Remove word";chip.addEventListener("click",()=>{if(locked)return;answerState=answerState.filter(item=>item.id!==entry.id);draw();});slots.append(chip);});entries.filter(entry=>!answerState.some(item=>item.id===entry.id)).forEach(entry=>{const chip=textNode("button",entry.word,"word-chip");chip.type="button";chip.addEventListener("click",()=>{if(locked)return;answerState.push(entry);draw();});bank.append(chip);});}ui.area.append(slots,bank);draw();}
function renderDrag(q){const bank=textNode("div","","word-bank");const rows=textNode("div","","answer-area");let picked=null;const values=shuffle(q.pairs.map(pair=>pair[1]));function draw(){bank.replaceChildren();rows.replaceChildren();values.filter(value=>!Object.values(answerState).includes(value)).forEach(value=>{const chip=textNode("button",value,"word-chip");chip.type="button";chip.draggable=true;chip.setAttribute("aria-label",`Select ${value}`);chip.classList.toggle("selected",picked===value);chip.addEventListener("click",()=>{if(locked)return;picked=value;draw();});chip.addEventListener("dragstart",event=>event.dataTransfer.setData("text/plain",value));bank.append(chip);});q.pairs.forEach(([label],i)=>{const row=textNode("div","","match-row");row.append(textNode("strong",label));const target=textNode("button",answerState[i]||"Tap or drop an answer","option");target.type="button";target.addEventListener("click",()=>{if(locked)return;if(picked){answerState[i]=picked;picked=null;}else delete answerState[i];draw();});target.addEventListener("dragover",event=>event.preventDefault());target.addEventListener("drop",event=>{event.preventDefault();if(locked)return;const value=event.dataTransfer.getData("text/plain");if(values.includes(value)){for(const key of Object.keys(answerState)){if(answerState[key]===value)delete answerState[key];}answerState[i]=value;picked=null;draw();}});row.append(target);rows.append(row);});}ui.area.append(bank,rows);draw();}
function renderPassage(q){const box=textNode("div","","passage");q.parts.forEach((part,i)=>{box.append(document.createTextNode(part));if(i<q.blanks.length){const select=document.createElement("select");select.setAttribute("aria-label",`Blank ${i+1}`);select.append(new Option("Choose...",""));shuffle(q.blanks[i].options).forEach(value=>select.append(new Option(value,value)));box.append(select);}});ui.area.append(box);}
function hasAnswer(q){if(q.type==="order")return answerState.length===q.words.length;if(q.type==="drag")return Object.keys(answerState).length===q.pairs.length;if(q.type==="passage")return [...ui.area.querySelectorAll("select")].every(el=>el.value);return String(answerState??"").trim().length>0;}
function isCorrect(q){if(q.type==="choice")return answerState===q.answer;if(q.type==="tf")return (answerState==="True")===q.answer;if(q.type==="fill"||q.type==="correct")return [q.answer,...(q.accept||[])].some(value=>normalize(value,q.caseSensitive)===normalize(answerState,q.caseSensitive));if(q.type==="order")return answerState.every((entry,i)=>entry.id===i);if(q.type==="drag")return q.pairs.every((pair,i)=>answerState[i]===pair[1]);return [...ui.area.querySelectorAll("select")].every((select,i)=>select.value===q.blanks[i].answer);}
function checkAnswer(){if(locked)return;const q=QUESTIONS[index];if(!hasAnswer(q)){ui.feedback.textContent="Complete your answer before taking the shot.";ui.feedback.className="feedback incorrect";return;}locked=true;const won=isCorrect(q);if(won){correct++;streak++;xp+=10+(streak%3===0?5:0);}else streak=0;ui.pitch.classList.add(won?"goal-shot":"save-shot");ui.callout.textContent=won?"GOOOAL! ⚽":"SAVED! KEEP GOING";ui.feedback.textContent=`${won?"GOAL! +10 XP":"The goalkeeper saved it."} ${q.explain}`;ui.feedback.className=`feedback${won?"":" incorrect"}`;ui.check.classList.add("hidden");ui.next.classList.remove("hidden");ui.next.querySelector("span").textContent=index===QUESTIONS.length-1?"🏆":"→";ui.next.firstChild.textContent=index===QUESTIONS.length-1?"Final whistle ":"Next kick ";$("scoreLabel").textContent=`${xp} XP`;$("goalScore").textContent=String(correct);$("saveScore").textContent=String(index+1-correct);$("streakLabel").textContent=`${streak} goal streak`;ui.area.querySelectorAll("button,input,select").forEach(el=>el.disabled=true);}
function finish(){const stars=correct>=27?3:correct>=20?2:correct>=11?1:0;$("resultName").textContent=player.name;$("resultCorrect").textContent=`${correct}/${QUESTIONS.length}`;$("resultXp").textContent=xp;$("resultStars").textContent="★".repeat(stars)||"—";$("resultMessage").textContent=stars===3?"Hat-trick hero! Your Unit 1 skills are shining.":stars===2?"Great match! A little practice can take you even further.":"Every champion improves with practice. Take another shot!";show("result");}
ui.form.addEventListener("submit",event=>{event.preventDefault();const name=ui.name.value.trim().replace(/\s+/g," ");if(!name||!ui.className.value){ui.form.reportValidity();return;}player={name,className:ui.className.value};sessionStorage.setItem("unit1game-player",JSON.stringify(player));startGame();});
ui.check.addEventListener("click",checkAnswer);
ui.next.addEventListener("click",()=>{index++;if(index===QUESTIONS.length)finish();else{renderQuestion();window.scrollTo({top:0,behavior:"smooth"});}});
$("retryButton").addEventListener("click",startGame);
$("exitButton").addEventListener("click",()=>show("welcome"));
try{const saved=JSON.parse(sessionStorage.getItem("unit1game-player")||"null");if(saved&&typeof saved.name==="string"&&["4A","4B"].includes(saved.className)){ui.name.value=saved.name;ui.className.value=saved.className;}}catch{}
