'use strict';
window.bookReady=(async()=>{
  if(location.protocol==='file:'){window.bookUserId='preview';return;}
  const overlay=document.createElement('section');overlay.className='book-access';overlay.setAttribute('role','status');
  overlay.innerHTML='<div><span class="access-symbol">✦</span><h1>Opening your workbook…</h1><p>Checking your learning portal session.</p></div>';
  document.body.append(overlay);
  const block=(title,message)=>{overlay.querySelector('h1').textContent=title;overlay.querySelector('p').textContent=message;const a=document.createElement('a');a.href='../index.html';a.textContent='Go to the learning portal →';overlay.firstElementChild.append(a);return new Promise(()=>{});};
  try{
    if(!window.supabase?.createClient)return block('Connection needed','The account service could not load. Please connect to the internet and try again.');
    const client=window.supabase.createClient('https://flntfunjlwxjfjpwdrmm.supabase.co','sb_publishable_0tDt8g40fK5lr7ybDGnWjQ_D5mEFHuR',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
    const {data,error}=await client.auth.getUser();
    if(error||!data.user)return block('Welcome, English explorer!','Sign in to your Grade 4 learning portal to open your interactive workbook.');
    const [profile,settings]=await Promise.all([
      client.from('profiles').select('grade_level').eq('id',data.user.id).maybeSingle(),
      client.from('platform_settings').select('login_enabled,english4_visible').eq('id','grade4').maybeSingle()
    ]);
    if(profile.error||settings.error||!settings.data)return block('Unable to check access','Please return to the learning portal and try again.');
    if(String(profile.data?.grade_level)!=='4')return block('Grade 4 workbook','Please use your Grade 4 student account.');
    if(settings.data.login_enabled===false||settings.data.english4_visible===false)return block('Workbook temporarily unavailable','Student access or the English course is paused by the teacher.');
    window.bookUserId=data.user.id;
    client.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT')location.replace('../index.html');else if(event==='SIGNED_IN'&&session?.user?.id!==window.bookUserId)location.reload();});
    overlay.remove();
  }catch{return block('Connection needed','We could not verify your session. Return to the portal and try again.');}
})();
