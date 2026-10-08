(() => {
  'use strict';
  const url='https://flntfunjlwxjfjpwdrmm.supabase.co',key='sb_publishable_0tDt8g40fK5lr7ybDGnWjQ_D5mEFHuR',tokenKey='spell_arbia_teacher_pin_session';
  const client=window.supabase?.createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:'connectplus_teacher_auth_v1'}});
  const cloud={data:null,rosterIds:{A:[],B:[]},ready:false};
  const overlay=document.createElement('div');overlay.className='cloud-gate';
  overlay.innerHTML=`<div class="cloud-login"><img src="school-logo.webp" alt="Alandalus Private Schools"><span>ALANDALUS PRIVATE SCHOOLS · GRADE 4</span><h2>Teacher Entrance</h2><p>Enter the private six-digit teacher PIN to record Spell Arabia results.</p><form id="spellPinLogin"><label>TEACHER PIN<input id="spellPin" type="password" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="off" required></label><button type="submit">Open Teacher Page</button></form><button id="showPinSetup" class="setup-link" type="button">Set or change teacher PIN</button><form id="spellPinSetup" class="hidden"><p>To set a new PIN, verify your existing teacher dashboard account once.</p><label>TEACHER EMAIL<input id="setupEmail" type="email" autocomplete="username" required></label><label>ACCOUNT PASSWORD<input id="setupPassword" type="password" autocomplete="current-password" required></label><label>NEW SIX-DIGIT PIN<input id="setupPin" type="password" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="new-password" required></label><label>CONFIRM PIN<input id="setupPinConfirm" type="password" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="new-password" required></label><button type="submit">Save Teacher PIN</button></form><div id="spellAuthMessage" role="status">Checking your PIN session…</div></div>`;
  document.body.append(overlay);document.body.classList.add('cloud-locked');
  const $=selector=>overlay.querySelector(selector),message=text=>{$('#spellAuthMessage').textContent=text};
  function gate(text){cloud.ready=false;sessionStorage.removeItem(tokenKey);document.body.classList.add('cloud-locked');document.body.classList.remove('cloud-mode');document.body.append(overlay);message(text)}
  async function rawRequest(action,payload={},token=''){
    const response=await fetch(`${url}/functions/v1/spell-arabia`,{method:'POST',headers:{'Content-Type':'application/json','apikey':key,...(token?{'Authorization':`Bearer ${token}`}:{})},body:JSON.stringify({action,...payload})});
    const body=await response.json().catch(()=>({}));
    if(!response.ok||body.error){const error=new Error(body.error||`Competition request failed (${response.status}).`);error.status=response.status;throw error}
    return body;
  }
  async function request(action,payload={}){
    const token=sessionStorage.getItem(tokenKey);
    if(!token){gate('Enter the teacher PIN to continue.');throw new Error('Teacher PIN sign-in required.')}
    try{return await rawRequest(action,payload,token)}
    catch(error){if(error.status===401)gate('Your PIN session expired. Sign in again.');throw error}
  }
  function apply(data){
    if(!Array.isArray(data.roster)||!Array.isArray(data.attempts))throw new Error('Competition data is incomplete.');
    cloud.data=data;
    for(const classKey of ['A','B']){
      const rows=data.roster.filter(item=>item.class_key===classKey).sort((a,b)=>a.position-b.position);
      window.SpellArabiaData.rosters[classKey]=rows.map(item=>item.display_name);
      cloud.rosterIds[classKey]=rows.map(item=>item.id);
    }
    localStorage.setItem('spellArbiaProjectorRosterV1',JSON.stringify(window.SpellArabiaData.rosters));
    cloud.ready=true;document.body.classList.remove('cloud-locked');document.body.classList.add('cloud-mode');overlay.remove();
  }
  async function load(onReady){message('Loading the class lists and results…');const data=await request('load');apply(data);onReady(data)}
  cloud.init=async onReady=>{
    $('#spellPinLogin').onsubmit=async event=>{
      event.preventDefault();const button=$('#spellPinLogin button');button.disabled=true;message('Checking teacher PIN…');
      try{const data=await rawRequest('pin_login',{pin:$('#spellPin').value});sessionStorage.setItem(tokenKey,data.token);$('#spellPin').value='';await load(onReady)}
      catch(error){message(error.message);button.disabled=false}
    };
    $('#showPinSetup').onclick=()=>{$('#spellPinSetup').classList.toggle('hidden');message('Use your existing teacher dashboard account to set or change the PIN.')};
    $('#spellPinSetup').onsubmit=async event=>{
      event.preventDefault();const pin=$('#setupPin').value,confirm=$('#setupPinConfirm').value,button=$('#spellPinSetup button');
      if(!/^\d{6}$/.test(pin)){message('Choose a six-digit PIN.');return}if(pin!==confirm){message('The two PINs do not match.');return}
      if(!client){message('Secure account sign-in could not load. Refresh the page.');return}
      button.disabled=true;message('Verifying your teacher account…');
      try{
        const result=await client.auth.signInWithPassword({email:$('#setupEmail').value.trim(),password:$('#setupPassword').value});
        if(result.error)throw result.error;
        const session=result.data.session;
        if(!session)throw new Error('Teacher account sign-in failed.');
        await rawRequest('set_pin',{pin},session.access_token);
        const login=await rawRequest('pin_login',{pin});sessionStorage.setItem(tokenKey,login.token);
        $('#setupPassword').value='';$('#setupPin').value='';$('#setupPinConfirm').value='';await load(onReady);
      }catch(error){message(error.message);button.disabled=false}
    };
    const token=sessionStorage.getItem(tokenKey);
    if(token){try{await load(onReady);return}catch(error){gate(error.message)}}
    else message('Enter the teacher PIN. On first use, select Set or change teacher PIN.');
  };
  cloud.request=request;
  cloud.refresh=async onReady=>{const data=await request('load');apply(data);onReady?.(data);return data};
  cloud.save=(rosterId,attemptNo,wordIndex,correct,isRetry=false)=>request('save_attempt',{rosterId,attemptNo,wordIndex,correct,isRetry});
  cloud.setAbsent=(rosterId,absent)=>request('set_absent',{rosterId,absent});
  cloud.rename=(rosterId,name)=>request('rename_student',{rosterId,name});
  cloud.toState=()=>{
    const result={records:{A:[],B:[]},absent:{A:[],B:[]},completed:{A:[],B:[]},usedWords:{A:[],B:[]}};
    if(!cloud.data)return result;
    for(const classKey of ['A','B']){
      const rows=cloud.data.roster.filter(item=>item.class_key===classKey).sort((a,b)=>a.position-b.position);
      rows.forEach((row,index)=>{if(row.absent)result.absent[classKey].push(index)});
      for(const item of cloud.data.attempts.filter(item=>item.class_key===classKey)){
        const studentIndex=rows.findIndex(row=>row.id===item.roster_id);if(studentIndex<0)continue;
        result.records[classKey].push({studentIndex,wordIndex:item.word_index,correct:item.correct,isRetry:item.is_retry===true,time:Date.parse(item.created_at),attemptNo:item.attempt_no});
        result.usedWords[classKey].push(item.word_index);
      }
    }
    return result;
  };
  window.SpellArabiaCloud=cloud;
})();
