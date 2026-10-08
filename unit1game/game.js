"use strict";

// Each question is grounded in Connect Plus 4, Unit 1, Lessons 1–5.
// This standalone game never calls the portal's authentication or database code.
const QUESTIONS = [
  {lesson:1,type:"choice",prompt:"Ali runs. What does he take from the air when he breathes?",options:["Oxygen","Food","Bones","Water"],answer:"Oxygen",explain:"We take oxygen from the air when we breathe."},
  {lesson:1,type:"tf",prompt:"Omar eats lunch. His body uses the food to help him grow.",answer:true,explain:"Food gives our bodies nutrients."},
  {lesson:1,type:"fill",prompt:"Omar eats an apple. It gives his body ___ to help him grow.",answer:"nutrients",explain:"Food gives our bodies nutrients."},
  {lesson:1,type:"drag",prompt:"Match what Ali does with what happens in his body.",pairs:[["Ali eats","food is broken down"],["Ali runs","he takes in oxygen"],["Ali jumps","his muscles move"]],explain:"Eating, breathing, and moving all help Ali."},
  {lesson:1,type:"order",prompt:"Ali runs. Put the words in order to say what his heart does.",words:["His","heart","pumps","blood","around","his","body."],explain:"His heart pumps blood around his body."},

  {lesson:2,type:"choice",prompt:"Ali reads by touching dots. What helps him read?",options:["Braille","A map","A clock","A camera"],answer:"Braille",explain:"Braille uses dots we can feel."},
  {lesson:2,type:"tf",prompt:"Ali closes his eyes. He can still hear a bell.",answer:true,explain:"We hear sounds with our ears."},
  {lesson:2,type:"fill",prompt:"This blanket is soft. I use my sense of ___ to feel it.",answer:"touch",explain:"We feel things with our sense of touch."},
  {lesson:2,type:"correct",prompt:"Correct the mistake: We sees flowers.",answer:"We see flowers",explain:"Say: We see flowers."},
  {lesson:2,type:"order",prompt:"Ali eats an orange. Put his words in order.",words:["I","can","taste","the","sweet","orange."],explain:"I can taste the sweet orange."},

  {lesson:3,type:"choice",prompt:"Hany ___ to school every day.",options:["goes","go","going","gone"],answer:"goes",explain:"Hany goes to school. With he, use goes."},
  {lesson:3,type:"tf",prompt:"“Omar don't play football” is correct English.",answer:false,explain:"Say: Omar doesn't play football."},
  {lesson:3,type:"fill",prompt:"Hany likes fruit. He ___ eat sweets every day.",answer:"doesn't",accept:["does not"],explain:"With he, use doesn't."},
  {lesson:3,type:"correct",prompt:"Correct the mistake: My brother have a bag.",answer:"My brother has a bag",explain:"Say: My brother has a bag."},
  {lesson:3,type:"drag",prompt:"Choose the right verb for each short sentence.",pairs:[["I ___ after school","play"],["He ___ after school","plays"],["They ___ homework","do"]],explain:"I play. He plays. They do."},

  {lesson:4,type:"choice",prompt:"Alice sees a White Rabbit. What does she do?",options:["She follows it.","She sleeps.","She swims.","She sings."],answer:"She follows it.",explain:"Alice follows the White Rabbit."},
  {lesson:4,type:"tf",prompt:"Alice drinks from a bottle and becomes smaller.",answer:true,explain:"The drink makes Alice smaller."},
  {lesson:4,type:"fill",prompt:"Alice eats cake and becomes ___.",answer:"taller",explain:"The cake makes Alice taller."},
  {lesson:4,type:"order",prompt:"What happens first, next, and last?",words:["Alice follows a rabbit.","Alice drinks and becomes smaller.","Alice eats cake and becomes taller."],explain:"Rabbit, drink, then cake."},
  {lesson:4,type:"passage",prompt:"Complete Alice's story.",parts:["Alice sees a White ",". A drink makes her ",". A cake makes her ","."],blanks:[{options:["Rabbit","Dolphin","Cat"],answer:"Rabbit"},{options:["smaller","taller","faster"],answer:"smaller"},{options:["taller","smaller","sleepy"],answer:"taller"}],explain:"Rabbit, smaller, then taller."},

  {lesson:5,type:"choice",prompt:"Salem writes about exercise. Which sentence starts his paragraph?",options:["Exercise helps us stay healthy.","My bag is blue.","I saw a rabbit.","The door is open."],answer:"Exercise helps us stay healthy.",explain:"The first sentence tells us the main idea."},
  {lesson:5,type:"tf",prompt:"A paragraph about healthy food can end with a sentence about football.",answer:false,explain:"The ending should be about healthy food, too."},
  {lesson:5,type:"drag",prompt:"Salem writes about healthy habits. Match each sentence to its place.",pairs:[["Start","Healthy habits help us feel good."],["Middle","We eat fruit and do exercise."],["End","These habits keep us strong."]],explain:"Start, detail, then end."},
  {lesson:5,type:"order",prompt:"Put the words in order for Salem's paragraph.",words:["Exercise","helps","our","bodies","stay","healthy."],explain:"Exercise helps our bodies stay healthy."},
  {lesson:5,type:"passage",prompt:"Complete Salem's short paragraph.",parts:["Good habits help us stay ",". We eat healthy food and do ",". These habits help our ","."],blanks:[{options:["healthy","smaller","noisy"],answer:"healthy"},{options:["exercise","homework","painting"],answer:"exercise"},{options:["bodies","books","desks"],answer:"bodies"}],explain:"Healthy habits help our bodies."},

  {lesson:6,type:"choice",prompt:"FINAL ROUND: Hassan runs. His heart beats faster. What does his heart do?",options:["Pumps blood","Breaks down food","Helps him taste","Helps him see"],answer:"Pumps blood",explain:"The heart pumps blood around the body."},
  {lesson:6,type:"tf",prompt:"FINAL ROUND: Two children use signs to share ideas. They can talk this way.",answer:true,explain:"Sign language helps people share ideas."},
  {lesson:6,type:"fill",prompt:"FINAL ROUND: My sister ___ to school every day. (go)",answer:"goes",explain:"My sister goes to school."},
  {lesson:6,type:"correct",prompt:"FINAL ROUND: Correct the mistake: They doesn't eat breakfast.",answer:"They don't eat breakfast",accept:["They do not eat breakfast"],explain:"Say: They don't eat breakfast."},
  {lesson:6,type:"order",prompt:"FINAL ROUND: Ali hears a bell. Put his words in order.",words:["I","can","hear","the","loud","bell."],explain:"I can hear the loud bell."},
  {lesson:6,type:"drag",prompt:"FINAL ROUND: Match each child with the right idea.",pairs:[["Samir reads dots","He uses Braille."],["Ali runs and breathes fast","He needs oxygen."],["Salem starts writing","He writes the main idea first."]],explain:"Braille, oxygen, and the main idea are all from Unit 1."},
  {lesson:6,type:"passage",prompt:"FINAL ROUND: Complete this short text.",parts:["Food gives us ",". We breathe in ",". Exercise helps us stay ","."],blanks:[{options:["nutrients","bones","dots"],answer:"nutrients"},{options:["oxygen","blood","sugar"],answer:"oxygen"},{options:["healthy","taller","small"],answer:"healthy"}],explain:"Food, breathing, and exercise help our bodies."}
];

const LESSONS = ["Our Amazing Bodies","Our Senses","Present Simple","Literature Corner","Writing Paragraphs","Final Shootout"];
const TYPE_LABELS = {choice:"MULTIPLE CHOICE",tf:"TRUE OR FALSE",fill:"FILL THE BLANK",correct:"FIX THE ERROR",order:"ORDER THE SENTENCE",drag:"DRAG & MATCH",passage:"COMPLETE THE TEXT"};
const $ = id => document.getElementById(id);
const ui = {welcome:$("welcomeScreen"),game:$("gameScreen"),result:$("resultScreen"),name:$("playerName"),className:$("playerClass"),form:$("playerForm"),area:$("answerArea"),feedback:$("feedback"),check:$("checkButton"),next:$("nextButton"),pitch:$("pitch"),callout:$("pitchCallout")};
let player = {name:"",className:""};
let index = 0, correct = 0, xp = 0, streak = 0, answerState = null, locked = false;

function normalize(value){return String(value).toLowerCase().replace(/[’]/g,"'").replace(/[^a-z0-9' ]/g," ").replace(/\s+/g," ").trim();}
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
function isCorrect(q){if(q.type==="choice")return answerState===q.answer;if(q.type==="tf")return (answerState==="True")===q.answer;if(q.type==="fill"||q.type==="correct")return [q.answer,...(q.accept||[])].some(value=>normalize(value)===normalize(answerState));if(q.type==="order")return answerState.every((entry,i)=>entry.id===i);if(q.type==="drag")return q.pairs.every((pair,i)=>answerState[i]===pair[1]);return [...ui.area.querySelectorAll("select")].every((select,i)=>select.value===q.blanks[i].answer);}
function checkAnswer(){if(locked)return;const q=QUESTIONS[index];if(!hasAnswer(q)){ui.feedback.textContent="Complete your answer before taking the shot.";ui.feedback.className="feedback incorrect";return;}locked=true;const won=isCorrect(q);if(won){correct++;streak++;xp+=10+(streak%3===0?5:0);}else streak=0;ui.pitch.classList.add(won?"goal-shot":"save-shot");ui.callout.textContent=won?"GOOOAL! ⚽":"SAVED! KEEP GOING";ui.feedback.textContent=`${won?"GOAL! +10 XP":"The goalkeeper saved it."} ${q.explain}`;ui.feedback.className=`feedback${won?"":" incorrect"}`;ui.check.classList.add("hidden");ui.next.classList.remove("hidden");ui.next.querySelector("span").textContent=index===QUESTIONS.length-1?"🏆":"→";ui.next.firstChild.textContent=index===QUESTIONS.length-1?"Final whistle ":"Next kick ";$("scoreLabel").textContent=`${xp} XP`;$("goalScore").textContent=String(correct);$("saveScore").textContent=String(index+1-correct);$("streakLabel").textContent=`${streak} goal streak`;ui.area.querySelectorAll("button,input,select").forEach(el=>el.disabled=true);}
function finish(){const stars=correct>=27?3:correct>=20?2:correct>=11?1:0;$("resultName").textContent=player.name;$("resultCorrect").textContent=`${correct}/${QUESTIONS.length}`;$("resultXp").textContent=xp;$("resultStars").textContent="★".repeat(stars)||"—";$("resultMessage").textContent=stars===3?"Hat-trick hero! Your Unit 1 skills are shining.":stars===2?"Great match! A little practice can take you even further.":"Every champion improves with practice. Take another shot!";show("result");}
ui.form.addEventListener("submit",event=>{event.preventDefault();const name=ui.name.value.trim().replace(/\s+/g," ");if(!name||!ui.className.value){ui.form.reportValidity();return;}player={name,className:ui.className.value};sessionStorage.setItem("unit1game-player",JSON.stringify(player));startGame();});
ui.check.addEventListener("click",checkAnswer);
ui.next.addEventListener("click",()=>{index++;if(index===QUESTIONS.length)finish();else{renderQuestion();window.scrollTo({top:0,behavior:"smooth"});}});
$("retryButton").addEventListener("click",startGame);
$("exitButton").addEventListener("click",()=>show("welcome"));
try{const saved=JSON.parse(sessionStorage.getItem("unit1game-player")||"null");if(saved&&typeof saved.name==="string"&&["4A","4B"].includes(saved.className)){ui.name.value=saved.name;ui.className.value=saved.className;}}catch{}
