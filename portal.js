'use strict';

(function(){
  const SUPABASE_URL='https://flntfunjlwxjfjpwdrmm.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY='sb_publishable_0tDt8g40fK5lr7ybDGnWjQ_D5mEFHuR';
  const PORTAL_IDENTITY_KEY='alandalus_g4_portal_identity_v1';
  const PORTAL_URL_KEY='alandalus_g4_portal_url_v1';
  const config=window.ENGLISH_PORTAL_CONFIG||{};
  const client=window.supabase&&window.supabase.createClient
    ? window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}})
    : null;

  const $=selector=>document.querySelector(selector);
  const normalizeCode=value=>String(value||'').trim().toUpperCase().replace(/\s+/g,'');
  const emailForCode=code=>`cp4.${code.toLowerCase()}@students.connectplus.app`;
  const safeText=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let profile=null;
  let session=null;

  function setLoading(show,text='Opening your portal…'){
    $('#loadingText').textContent=text;
    $('#loadingLayer').classList.toggle('hidden',!show);
  }

  function showMessage(message,type='error'){
    const box=$('#authMessage');
    box.textContent=message;
    box.className=`message ${type}`;
  }

  function clearMessage(){
    $('#authMessage').className='message hidden';
    $('#authMessage').textContent='';
  }

  function switchAuth(mode){
    const create=mode==='create';
    $('#signInForm').classList.toggle('hidden',create);
    $('#createForm').classList.toggle('hidden',!create);
    $('#signInTab').classList.toggle('active',!create);
    $('#createTab').classList.toggle('active',create);
    $('#signInTab').setAttribute('aria-selected',String(!create));
    $('#createTab').setAttribute('aria-selected',String(create));
    clearMessage();
    setTimeout(()=>$(create?'#fullName':'#signInUsername').focus(),80);
  }

  async function readProfile(user){
    const result=await client.from('profiles').select('student_code,full_name,class_name,avatar_path').eq('id',user.id).maybeSingle();
    if(result.error)throw result.error;
    return result.data;
  }

  async function ensureProfile(user,identity){
    let row=await readProfile(user);
    if(!row){
      const created=await client.from('profiles').insert({id:user.id,student_code:identity.studentCode,full_name:identity.fullName,class_name:identity.className}).select('student_code,full_name,class_name,avatar_path').single();
      if(created.error)throw created.error;
      row=created.data;
    }
    return row;
  }

  function saveIdentity(user,row){
    const identity={
      userId:user.id,
      studentCode:normalizeCode(row.student_code||user.user_metadata?.student_code),
      fullName:row.full_name||user.user_metadata?.full_name||'Student',
      className:row.class_name||user.user_metadata?.class_name||'Primary 4',
      savedAt:Date.now()
    };
    localStorage.setItem(PORTAL_IDENTITY_KEY,JSON.stringify(identity));
    return identity;
  }

  function initials(name){
    return String(name||'Student').trim().split(/\s+/).slice(0,2).map(part=>part[0]||'').join('').toUpperCase()||'ST';
  }

  function showCourses(user,row){
    const identity=saveIdentity(user,row);
    profile=row;
    $('#studentInitials').textContent=initials(identity.fullName);
    $('#courseTitle').textContent=`Choose Your Course, ${identity.fullName.split(/\s+/)[0]}`;
    $('#studentLine').innerHTML=`Class <strong>${safeText(identity.className)}</strong> · Username <strong>${safeText(identity.studentCode)}</strong>`;
    $('#authPanel').classList.add('hidden');
    $('#coursePanel').classList.remove('hidden');
  }

  function showAuth(){
    $('#coursePanel').classList.add('hidden');
    $('#authPanel').classList.remove('hidden');
    switchAuth('signin');
  }

  function validateUsername(code){
    if(!/^[A-Z0-9_-]{3,30}$/.test(code))throw new Error('Use 3–30 English letters or numbers for the username.');
  }

  function validatePin(pin){
    if(!/^\d{6}$/.test(pin))throw new Error('Your PIN must contain exactly 6 numbers.');
  }

  async function signIn(event){
    event.preventDefault();
    if(!client){showMessage('Supabase could not load. Please check your internet connection.');return;}
    const studentCode=normalizeCode($('#signInUsername').value);
    const pin=$('#signInPin').value;
    try{
      validateUsername(studentCode);
      validatePin(pin);
      clearMessage();
      setLoading(true,'Checking your account…');
      const result=await client.auth.signInWithPassword({email:emailForCode(studentCode),password:pin});
      if(result.error)throw result.error;
      session=result.data.session;
      const row=await readProfile(result.data.user);
      if(!row)throw new Error('Your student profile is not ready yet. Please ask your teacher for help.');
      showCourses(result.data.user,row);
    }catch(error){
      await client.auth.signOut().catch(()=>{});
      const message=String(error?.message||'Sign in failed.');
      showMessage(message.toLowerCase().includes('invalid login credentials')?'The username or PIN is incorrect. Please try again.':message);
    }finally{setLoading(false);}
  }

  async function createAccount(event){
    event.preventDefault();
    if(!client){showMessage('Supabase could not load. Please check your internet connection.');return;}
    const fullName=$('#fullName').value.trim();
    const className=$('#className').value.trim();
    const studentCode=normalizeCode($('#newUsername').value);
    const pin=$('#newPin').value;
    const confirmation=$('#confirmPin').value;
    try{
      if(fullName.length<2)throw new Error('Please enter the student’s full name.');
      if(!className)throw new Error('Please choose the student’s class.');
      validateUsername(studentCode);
      validatePin(pin);
      if(pin!==confirmation)throw new Error('The two PIN entries do not match.');
      clearMessage();
      setLoading(true,'Creating your secure account…');
      const result=await client.auth.signUp({
        email:emailForCode(studentCode),
        password:pin,
        options:{data:{student_code:studentCode,full_name:fullName,class_name:className}}
      });
      if(result.error)throw result.error;
      if(!result.data.user)throw new Error('The account could not be created.');
      if(!result.data.session){
        const signed=await client.auth.signInWithPassword({email:emailForCode(studentCode),password:pin});
        if(signed.error)throw signed.error;
        session=signed.data.session;
      }else session=result.data.session;
      const row=await ensureProfile(result.data.user,{studentCode,fullName,className});
      showCourses(result.data.user,row);
    }catch(error){
      const raw=String(error?.message||'Account creation failed.');
      const message=raw.toLowerCase().includes('already registered')||raw.toLowerCase().includes('already been registered')
        ? 'This username is already used. Choose another username or sign in.'
        : raw;
      showMessage(message);
    }finally{setLoading(false);}
  }

  function courseUrl(key){
    return key==='connectPlus4'?config.connectPlus4Url:config.english4Url;
  }

  function openCourse(key){
    const url=String(courseUrl(key)||'').trim();
    if(!url){showMessage('This course link has not been connected yet.');return;}
    localStorage.setItem('alandalus_g4_last_course_v1',key);
    localStorage.setItem(PORTAL_URL_KEY,new URL('index.html',window.location.href).href);
    const separator=url.includes('?')?'&':'?';
    window.location.href=`${url}${separator}from=english-portal`;
  }

  async function signOut(){
    setLoading(true,'Signing out safely…');
    try{if(client)await client.auth.signOut();}finally{
      session=null;
      profile=null;
      localStorage.removeItem(PORTAL_IDENTITY_KEY);
      $('#signInPin').value='';
      showAuth();
      setLoading(false);
    }
  }

  async function init(){
    localStorage.setItem(PORTAL_URL_KEY,new URL('index.html',window.location.href).href);
    $('#signInTab').onclick=()=>switchAuth('signin');
    $('#createTab').onclick=()=>switchAuth('create');
    $('#signInForm').onsubmit=signIn;
    $('#createForm').onsubmit=createAccount;
    $('#signOutButton').onclick=signOut;
    document.querySelectorAll('[data-toggle-pin]').forEach(button=>button.onclick=()=>{
      const input=document.getElementById(button.dataset.togglePin);
      const show=input.type==='password';
      input.type=show?'text':'password';
      button.textContent=show?'Hide':'Show';
    });
    document.querySelectorAll('[data-course]').forEach(button=>button.onclick=()=>openCourse(button.dataset.course));
    if(!client){showMessage('The secure account service could not load. Check the internet connection.');return;}
    setLoading(true,'Restoring your secure session…');
    try{
      const result=await client.auth.getSession();
      session=result.data.session;
      if(session){
        const row=await readProfile(session.user);
        if(row)showCourses(session.user,row);else showAuth();
      }else showAuth();
    }catch(error){showAuth();}
    finally{setLoading(false);}
  }

  init();
})();
