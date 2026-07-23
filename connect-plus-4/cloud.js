'use strict';

(function(){
  const SUPABASE_URL='https://flntfunjlwxjfjpwdrmm.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY='sb_publishable_0tDt8g40fK5lr7ybDGnWjQ_D5mEFHuR';
  const STATE_VERSION=2;
  const HERO_REFRESH_MS=5*60*1000;
  const ACCESS_REFRESH_MS=60*1000;
  const client=window.supabase&&window.supabase.createClient
    ? window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}})
    : null;

  let hooks={};
  let session=null;
  let profile=null;
  let syncTimer=null;
  let heroTimer=null;
  let accessTimer=null;
  let syncBusy=false;
  let syncAgain=false;
  let status={type:'local',label:'Saved on this device'};

  const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const safeTime=value=>Number.isFinite(Number(value))?Number(value):0;
  const answerCount=activity=>Object.keys((activity&&activity.answers)||{}).length;
  const normalizeCode=value=>String(value||'').trim().toUpperCase().replace(/\s+/g,'');
  const emailForCode=code=>`cp4.${code.toLowerCase()}@students.connectplus.app`;
  const isLoginError=error=>{
    const code=String(error&&error.code||'').toLowerCase();
    const message=String(error&&error.message||'').toLowerCase();
    return code==='invalid_credentials'||message.includes('invalid login credentials');
  };

  function emitStatus(type,label){
    status={type,label};
    if(hooks.onStatus)hooks.onStatus({...status,signedIn:!!session});
  }

  function freshState(){
    return hooks.freshState?clone(hooks.freshState()):{};
  }

  function activityStrength(activity){
    if(!activity)return -1;
    return (activity.completed?1e12:0)+(answerCount(activity)*1e8)+((activity.score||0)*1e5)+safeTime(activity.updatedAt||activity.completedAt||activity.startedAt);
  }

  function mergeActivity(localActivity,remoteActivity){
    if(!localActivity)return clone(remoteActivity);
    if(!remoteActivity)return clone(localActivity);
    const localWins=activityStrength(localActivity)>=activityStrength(remoteActivity);
    const newer=localWins?localActivity:remoteActivity;
    const older=localWins?remoteActivity:localActivity;
    return {
      ...clone(older),
      ...clone(newer),
      answers:{...(older.answers||{}),...(newer.answers||{})},
      index:Math.max(localActivity.index||0,remoteActivity.index||0),
      score:Math.max(localActivity.score||0,remoteActivity.score||0),
      total:Math.max(localActivity.total||0,remoteActivity.total||0),
      percent:Math.max(localActivity.percent||0,remoteActivity.percent||0),
      completed:!!(localActivity.completed||remoteActivity.completed),
      xpEarned:Math.max(localActivity.xpEarned||0,remoteActivity.xpEarned||0),
      coinsEarned:Math.max(localActivity.coinsEarned||0,remoteActivity.coinsEarned||0),
      updatedAt:Math.max(safeTime(localActivity.updatedAt),safeTime(remoteActivity.updatedAt))||Date.now()
    };
  }

  function mergeStates(localState,remoteState,identity){
    const cleanLocal=clone(localState||{});
    const cleanRemote=clone(remoteState||{});
    const localTime=safeTime(cleanLocal.updatedAt);
    const remoteTime=safeTime(cleanRemote.updatedAt);
    const newer=localTime>=remoteTime?cleanLocal:cleanRemote;
    const older=localTime>=remoteTime?cleanRemote:cleanLocal;
    const merged={...freshState(),...older,...newer};

    merged.activities={};
    const activityIds=new Set([...Object.keys(cleanLocal.activities||{}),...Object.keys(cleanRemote.activities||{})]);
    activityIds.forEach(id=>{merged.activities[id]=mergeActivity((cleanLocal.activities||{})[id],(cleanRemote.activities||{})[id])});
    merged.rewards={...(cleanLocal.rewards||{}),...(cleanRemote.rewards||{})};
    merged.pointAwards={...(cleanLocal.pointAwards||{}),...(cleanRemote.pointAwards||{})};
    merged.badges=[...new Set([...(cleanLocal.badges||[]),...(cleanRemote.badges||[])])];

    let calculatedXP=Object.keys(merged.pointAwards).length*10;
    let calculatedCoins=Object.keys(merged.pointAwards).length*2;
    let calculatedStars=0;
    Object.keys(merged.rewards).filter(id=>merged.rewards[id]).forEach(id=>{
      const boss=id.startsWith('boss:');
      calculatedXP+=boss?100:25;
      calculatedCoins+=boss?50:10;
      const activity=merged.activities[id];
      calculatedStars+=Math.max(1,Math.round(((activity&&activity.percent)||0)/34));
    });
    merged.xp=Math.max(cleanLocal.xp||0,cleanRemote.xp||0,calculatedXP);
    merged.coins=Math.max(cleanLocal.coins||0,cleanRemote.coins||0,calculatedCoins);
    merged.stars=Math.max(cleanLocal.stars||0,cleanRemote.stars||0,calculatedStars);

    const localQuestion=cleanLocal.lastQuestion;
    const remoteQuestion=cleanRemote.lastQuestion;
    merged.lastQuestion=safeTime(localQuestion&&localQuestion.savedAt)>=safeTime(remoteQuestion&&remoteQuestion.savedAt)
      ? clone(localQuestion):clone(remoteQuestion);
    merged.lastPage=clone(newer.lastPage||older.lastPage||null);
    merged.nav=clone(newer.nav||older.nav||freshState().nav);
    merged.view=newer.view||older.view||'dashboard';
    merged.sound=cleanLocal.sound!==undefined?cleanLocal.sound:(cleanRemote.sound!==undefined?cleanRemote.sound:true);
    merged.profile={name:identity.name,className:identity.className};
    merged.account={studentCode:identity.studentCode,userId:identity.userId,cloud:true,resetVersion:Math.max(Number(cleanLocal.account&&cleanLocal.account.resetVersion||0),Number(cleanRemote.account&&cleanRemote.account.resetVersion||0),Number(identity.resetVersion||0))};
    merged.updatedAt=Math.max(localTime,remoteTime,Date.now());
    return merged;
  }

  function stateForStudent(localState,remoteState,identity){
    const localCode=normalizeCode(localState&&localState.account&&localState.account.studentCode);
    if(localCode&&localCode!==identity.studentCode){
      const base=remoteState&&Object.keys(remoteState).length?remoteState:freshState();
      return mergeStates(freshState(),base,identity);
    }
    return mergeStates(localState,remoteState||{},identity);
  }

  async function readProfile(user){
    const result=await client.from('profiles').select('student_code,full_name,class_name,avatar_path').eq('id',user.id).maybeSingle();
    if(result.error)throw result.error;
    return result.data;
  }

  async function ensureProfile(user,identity){
    let row=await readProfile(user);
    if(!row){
      const created=await client.from('profiles').insert({id:user.id,student_code:identity.studentCode,full_name:identity.name,class_name:identity.className}).select('student_code,full_name,class_name,avatar_path').single();
      if(created.error)throw created.error;
      row=created.data;
    }
    profile=row;
    return row;
  }

  async function readProgress(userId){
    const result=await client.from('student_progress').select('app_state,client_updated_at,updated_at').eq('user_id',userId).maybeSingle();
    if(result.error)throw result.error;
    return result.data;
  }

  async function pushProgress(){
    if(!client||!session||!hooks.getState)return false;
    if(syncBusy){syncAgain=true;return false}
    syncBusy=true;
    emitStatus('syncing','Saving to cloud…');
    try{
      const current=clone(hooks.getState());
      const metrics=hooks.metrics?hooks.metrics(current):{};
      const date=new Date(safeTime(current.updatedAt)||Date.now());
      const payload={
        user_id:session.user.id,
        app_state:current,
        answered_count:Math.max(0,metrics.answeredCount||0),
        points:Math.max(0,current.xp||0),
        last_page:current.lastPage||null,
        last_question:current.lastQuestion||null,
        state_version:STATE_VERSION,
        client_updated_at:date.toISOString()
      };
      const result=await client.from('student_progress').upsert(payload,{onConflict:'user_id'});
      if(result.error)throw result.error;
      emitStatus('synced','Cloud synced');
      return true;
    }catch(error){
      emitStatus('offline','Saved locally • cloud pending');
      return false;
    }finally{
      syncBusy=false;
      if(syncAgain){syncAgain=false;scheduleSync(300)}
    }
  }

  function scheduleSync(delay=1200){
    if(!session)return;
    clearTimeout(syncTimer);
    syncTimer=setTimeout(pushProgress,delay);
  }

  async function signedUrl(bucket,path,seconds=3600){
    if(!path)return '';
    const result=await client.storage.from(bucket).createSignedUrl(path,seconds);
    return result.error?'':result.data.signedUrl;
  }

  async function refreshAvatar(){
    if(!session||!profile){if(hooks.onAvatar)hooks.onAvatar('');return ''}
    const url=await signedUrl('student-avatars',profile.avatar_path,3600);
    if(hooks.onAvatar)hooks.onAvatar(url||'');
    return url;
  }

  async function refreshHero(){
    if(!session){if(hooks.onHero)hooks.onHero(null);return null}
    try{
      const result=await client.from('weekly_hero').select('week_label,student_name,class_name,message,image_path,published_at').eq('active',true).maybeSingle();
      if(result.error)throw result.error;
      if(!result.data){if(hooks.onHero)hooks.onHero(null);return null}
      const hero={...result.data,imageUrl:await signedUrl('weekly-hero',result.data.image_path,3600)};
      if(hooks.onHero)hooks.onHero(hero);
      return hero;
    }catch(error){
      return null;
    }
  }

  function startHeroRefresh(){
    clearInterval(heroTimer);
    heroTimer=setInterval(refreshHero,HERO_REFRESH_MS);
  }

  async function readStudentSettings(identity){
    const settings={resetVersion:0,student:{},class:{},className:String(identity.className||'')};
    try{
      let control=await client.from('course_controls').select('reset_version').eq('user_id',identity.userId).eq('app_id','connect-plus-4').maybeSingle();
      if(control.error)control=await client.from('student_controls').select('reset_version').eq('user_id',identity.userId).maybeSingle();
      if(!control.error&&control.data)settings.resetVersion=Math.max(0,Number(control.data.reset_version||0));
    }catch(error){}
    try{
      let access=await client.from('course_student_lesson_access').select('lesson_id,access_status').eq('user_id',identity.userId).eq('app_id','connect-plus-4');
      if(access.error)access=await client.from('student_lesson_access').select('lesson_id,access_status').eq('user_id',identity.userId);
      if(!access.error)(access.data||[]).forEach(row=>{settings.student[row.lesson_id]=row.access_status});
    }catch(error){}
    try{
      let classAccess=await client.from('course_class_lesson_access').select('lesson_id,access_status').eq('class_name',settings.className).eq('app_id','connect-plus-4');
      if(classAccess.error)classAccess=await client.from('class_lesson_access').select('lesson_id,access_status').eq('class_name',settings.className);
      if(!classAccess.error)(classAccess.data||[]).forEach(row=>{settings.class[row.lesson_id]=row.access_status});
    }catch(error){}
    return settings;
  }

  function cleanStateAfterTeacherReset(identity,resetVersion){
    const clean=freshState();
    clean.profile={name:identity.name,className:identity.className};
    clean.account={studentCode:identity.studentCode,userId:identity.userId,cloud:true,resetVersion};
    clean.updatedAt=Date.now();
    return clean;
  }

  function emitAccess(settings){
    if(hooks.onAccess)hooks.onAccess({student:clone(settings.student),class:clone(settings.class),className:settings.className,resetVersion:settings.resetVersion});
  }

  async function refreshStudentSettings(){
    if(!session||!profile)return null;
    try{
      const latestProfile=await readProfile(session.user);
      if(latestProfile)profile=latestProfile;
      const identity={studentCode:normalizeCode(profile.student_code),userId:session.user.id,name:profile.full_name,className:profile.class_name};
      const settings=await readStudentSettings(identity);
      identity.resetVersion=settings.resetVersion;
      const current=hooks.getState?hooks.getState():freshState();
      const localResetVersion=Number(current&&current.account&&current.account.resetVersion||0);
      const profileChanged=!current.profile||current.profile.name!==identity.name||current.profile.className!==identity.className;
      if(settings.resetVersion>localResetVersion){
        if(hooks.setState)hooks.setState(cleanStateAfterTeacherReset(identity,settings.resetVersion));
        emitStatus('syncing','Teacher reset applied • saving…');
        await pushProgress();
      }else if(profileChanged){
        const updated={...clone(current),profile:{name:identity.name,className:identity.className},account:{...(current.account||{}),studentCode:identity.studentCode,userId:identity.userId,cloud:true,resetVersion:Math.max(localResetVersion,settings.resetVersion)},updatedAt:Date.now()};
        if(hooks.setState)hooks.setState(updated);
      }
      emitAccess(settings);
      if(profileChanged&&hooks.onSession)hooks.onSession({signedIn:true,profile:clone(profile),studentCode:identity.studentCode});
      return settings;
    }catch(error){
      return null;
    }
  }

  function startAccessRefresh(){
    clearInterval(accessTimer);
    accessTimer=setInterval(refreshStudentSettings,ACCESS_REFRESH_MS);
  }

  async function loadCloudState(identity){
    const remote=await readProgress(identity.userId);
    const settings=await readStudentSettings(identity);
    identity.resetVersion=settings.resetVersion;
    let local=hooks.getState?hooks.getState():freshState();
    let remoteState=remote&&remote.app_state;
    if(settings.resetVersion>Number(local&&local.account&&local.account.resetVersion||0)){
      local=cleanStateAfterTeacherReset(identity,settings.resetVersion);
      remoteState={};
    }
    const merged=stateForStudent(local,remoteState,identity);
    if(hooks.setState)hooks.setState(merged);
    emitAccess(settings);
    await Promise.all([refreshAvatar(),refreshHero()]);
    startHeroRefresh();
    startAccessRefresh();
    await pushProgress();
    if(hooks.onSession)hooks.onSession({signedIn:true,profile:clone(profile),studentCode:identity.studentCode});
    return merged;
  }

  function validateCredentials(studentCode,pin){
    const code=normalizeCode(studentCode);
    if(!/^[A-Z0-9_-]{3,30}$/.test(code))throw new Error('Username must use 3–30 English letters or numbers.');
    if(!/^\d{6}$/.test(String(pin||'')))throw new Error('PIN must contain exactly 6 numbers.');
    return code;
  }

  async function finishStudentConnection(code,name,className){
    const currentCode=code||normalizeCode(session.user.user_metadata&&session.user.user_metadata.student_code);
    const identity={studentCode:currentCode,userId:session.user.id,name:String(name||'Student').trim(),className:String(className||'').trim()};
    const savedProfile=await ensureProfile(session.user,identity);
    identity.studentCode=normalizeCode(savedProfile.student_code);
    identity.name=savedProfile.full_name;
    identity.className=savedProfile.class_name;
    await loadCloudState(identity);
    return {signedIn:true,studentCode:identity.studentCode,profile:clone(savedProfile)};
  }

  async function leaveCurrentSession(){
    if(!session)return;
    await pushProgress();
    await client.auth.signOut();
    session=null;
    profile=null;
  }

  async function signInStudent({studentCode,pin,name,className}){
    if(!client)throw new Error('Cloud service could not load. Continue offline and try again later.');
    const requested=normalizeCode(studentCode||(profile&&profile.student_code));
    const active=normalizeCode(profile&&profile.student_code);
    if(session&&requested&&requested===active)return finishStudentConnection(active,name,className);
    const code=validateCredentials(requested,pin);
    if(session)await leaveCurrentSession();
    emitStatus('syncing','Signing in securely…');
    const auth=await client.auth.signInWithPassword({email:emailForCode(code),password:String(pin)});
    if(auth.error){
      if(isLoginError(auth.error))throw new Error('Username or PIN is incorrect. First time here? Choose Create New Account.');
      throw auth.error;
    }
    session=auth.data.session;
    return finishStudentConnection(code,name,className);
  }

  async function createStudent({studentCode,pin,name,className}){
    if(!client)throw new Error('Cloud service could not load. Continue offline and try again later.');
    const code=validateCredentials(studentCode,pin);
    if(session&&code===normalizeCode(profile&&profile.student_code))throw new Error('This account already exists on this device. Choose Sign In.');
    if(session)await leaveCurrentSession();
    emitStatus('syncing','Creating your account…');
    const auth=await client.auth.signUp({
      email:emailForCode(code),
      password:String(pin),
      options:{data:{student_code:code,full_name:name,class_name:className}}
    });
    if(auth.error){
      if(String(auth.error.message||'').toLowerCase().includes('already'))throw new Error('This Username already exists. Choose Sign In or create another Username.');
      throw auth.error;
    }
    if(!auth.data.session)throw new Error('Account could not start because email confirmation is enabled in Supabase.');
    session=auth.data.session;
    return finishStudentConnection(code,name,className);
  }

  async function restoreSession(){
    if(!client){emitStatus('local','Saved on this device');return {signedIn:false}}
    try{
      const result=await client.auth.getSession();
      session=result.data&&result.data.session;
      if(!session){emitStatus('local','Saved on this device');return {signedIn:false}}
      profile=await readProfile(session.user);
      if(!profile){
        const meta=session.user.user_metadata||{};
        const identity={studentCode:normalizeCode(meta.student_code),userId:session.user.id,name:String(meta.full_name||'Student'),className:String(meta.class_name||'')};
        if(!identity.studentCode)throw new Error('Student profile is incomplete.');
        profile=await ensureProfile(session.user,identity);
      }
      const identity={studentCode:normalizeCode(profile.student_code),userId:session.user.id,name:profile.full_name,className:profile.class_name};
      await loadCloudState(identity);
      return {signedIn:true,studentCode:identity.studentCode,profile:clone(profile)};
    }catch(error){
      emitStatus('offline','Saved locally • cloud pending');
      return {signedIn:!!session,error};
    }
  }

  async function optimizeAvatar(file){
    if(file.size>12582912)throw new Error('Please choose an image smaller than 12 MB.');
    const objectUrl=URL.createObjectURL(file);
    try{
      const image=new Image();
      await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('This image could not be opened.'));image.src=objectUrl});
      const maxSide=720,scale=Math.min(1,maxSide/Math.max(image.naturalWidth,image.naturalHeight));
      const canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));
      canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
      const context=canvas.getContext('2d');
      context.imageSmoothingEnabled=true;
      context.imageSmoothingQuality='high';
      context.drawImage(image,0,0,canvas.width,canvas.height);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.84));
      if(!blob)throw new Error('This image could not be prepared.');
      if(blob.size>2097152)throw new Error('Please choose a simpler or smaller image.');
      return blob;
    }finally{
      URL.revokeObjectURL(objectUrl);
    }
  }

  async function uploadAvatar(file){
    if(!client||!session)throw new Error('Sign in before choosing a profile picture.');
    if(!file||!/^image\/(jpeg|png|webp)$/.test(file.type))throw new Error('Choose a JPG, PNG, or WEBP image.');
    const optimized=await optimizeAvatar(file);
    emitStatus('syncing','Uploading picture…');
    const path=`${session.user.id}/avatar.webp`;
    if(profile&&profile.avatar_path&&profile.avatar_path!==path)await client.storage.from('student-avatars').remove([profile.avatar_path]);
    const uploaded=await client.storage.from('student-avatars').upload(path,optimized,{upsert:true,contentType:'image/webp',cacheControl:'3600'});
    if(uploaded.error)throw uploaded.error;
    const updated=await client.from('profiles').update({avatar_path:path}).eq('id',session.user.id).select('student_code,full_name,class_name,avatar_path').single();
    if(updated.error)throw updated.error;
    profile=updated.data;
    await refreshAvatar();
    emitStatus('synced','Cloud synced');
    return path;
  }

  async function signOut(){
    clearTimeout(syncTimer);
    clearInterval(heroTimer);
    clearInterval(accessTimer);
    if(session)await pushProgress();
    if(client)await client.auth.signOut();
    session=null;
    profile=null;
    if(hooks.onAvatar)hooks.onAvatar('');
    if(hooks.onHero)hooks.onHero(null);
    if(hooks.onAccess)hooks.onAccess({student:{},class:{},className:'',resetVersion:0});
    if(hooks.onSession)hooks.onSession({signedIn:false});
    emitStatus('local','Saved on this device');
  }

  window.ConnectCloud={
    configure(options){hooks=options||{};emitStatus(status.type,status.label)},
    available:()=>!!client,
    isSignedIn:()=>!!session,
    getStatus:()=>({...status,signedIn:!!session}),
    getStudentCode:()=>normalizeCode(profile&&profile.student_code),
    init:restoreSession,
    signInStudent,
    createStudent,
    scheduleSync,
    syncNow:pushProgress,
    refreshHero,
    refreshAccess:refreshStudentSettings,
    uploadAvatar,
    signOut
  };
})();
