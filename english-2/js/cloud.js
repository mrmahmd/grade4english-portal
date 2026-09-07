(function(){
  'use strict';
  const APP_ID='english2-term1',P=window.G2Progress;
  let client,user,localKey,current=P.empty(),dirty=false,flushing=false,timer,allowCloud=false;
  const preview=['localhost','127.0.0.1','[::1]'].includes(location.hostname)&&new URLSearchParams(location.search).get('preview')==='1';
  let onChange=()=>{},onStatus=()=>{};
  function read(){try{return P.clean(JSON.parse(localStorage.getItem(localKey)||'{}'));}catch{return P.empty();}}
  function persist(){try{localStorage.setItem(localKey,JSON.stringify(current));return true;}catch{onStatus('Storage is full — keep this page open.','error');return false;}}
  function accept(remote){current=P.merge(current,remote);persist();onChange(current);}
  function status(text,kind=''){onStatus(text,kind);}
  async function flush(){
    clearTimeout(timer);if(preview){status('Preview · saved on this device');return true;}
    if(flushing||!dirty||!allowCloud)return false;
    flushing=true;status('Saving…');
    try{
      for(let attempt=0;attempt<5&&dirty;attempt++){
        const result=await client.from('course_progress').select('state,updated_at').eq('user_id',user.id).eq('app_id',APP_ID).maybeSingle();
        if(result.error)throw result.error;
        accept(result.data?.state);const snapshot=JSON.stringify(current),s=P.stats(current);
        const payload={user_id:user.id,app_id:APP_ID,state:current,xp:s.xp,stars:s.stars,answered_count:Object.keys(current.answers).length,updated_at:new Date().toISOString()};
        let written;
        if(result.data){written=await client.from('course_progress').update(payload).eq('user_id',user.id).eq('app_id',APP_ID).eq('updated_at',result.data.updated_at).select('updated_at');}
        else{written=await client.from('course_progress').insert(payload).select('updated_at');}
        if(written.error?.code==='23505')continue;
        if(written.error)throw written.error;
        if(!written.data?.length)continue;
        dirty=JSON.stringify(current)!==snapshot;
      }
      status(dirty?'Saved on device · syncing…':'Saved to your account',dirty?'pending':'');
      if(dirty)timer=setTimeout(flush,2000);return !dirty;
    }catch(error){console.warn('English 2 sync:',error.message||error);status('Saved on device · retry sync','pending');return false;}
    finally{flushing=false;}
  }
  async function init(change,notify){
    onChange=change;onStatus=notify;
    if(preview){user={id:'local-preview',fullName:'English Explorer'};localKey='alandalus:english2:preview';current=read();status('Preview · saved on this device');return {user,progress:current,preview};}
    if(!window.supabase)throw new Error('The account service could not load. Check your connection and retry.');
    client=window.supabase.createClient('https://flntfunjlwxjfjpwdrmm.supabase.co','sb_publishable_0tDt8g40fK5lr7ybDGnWjQ_D5mEFHuR');
    const auth=await client.auth.getUser();
    if(auth.error||!auth.data.user){location.replace('../index.html');return null;}
    user=auth.data.user;
    const profile=await client.from('profiles').select('full_name,grade_level').eq('id',user.id).maybeSingle();
    if(profile.error)throw profile.error;
    if(String(profile.data?.grade_level)!=='2'){throw new Error('English 2 is for Grade 2 accounts. Return to the portal to open your courses.');}
    user={id:user.id,fullName:profile.data.full_name};localKey=`alandalus:${APP_ID}:${user.id}`;current=read();
    const remote=await client.from('course_progress').select('state').eq('user_id',user.id).eq('app_id',APP_ID).maybeSingle();
    if(remote.error){status('Cloud could not be read · saved on device','pending');}
    else{accept(remote.data?.state);status('Saved to your account');}
    allowCloud=true;
    client.auth.onAuthStateChange((event,session)=>{
      if(event==='SIGNED_OUT'||(session&&session.user.id!==user.id)){allowCloud=false;clearTimeout(timer);location.replace('../index.html');}
    });
    return {user,progress:current,preview};
  }
  function save(p){current=P.merge(current,p);persist();dirty=true;clearTimeout(timer);status(preview?'Preview · saved on this device':'Saved on device · syncing…');timer=setTimeout(flush,650);}
  window.addEventListener('online',flush);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush();});
  window.addEventListener('beforeunload',e=>{if(dirty&&!preview){e.preventDefault();e.returnValue='';}});
  window.G2Cloud={init,save,flush,get key(){return localKey;},get preview(){return preview;}};
})();
