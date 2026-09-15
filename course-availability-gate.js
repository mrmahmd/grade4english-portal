'use strict';
(function(){
  const script=document.currentScript;
  const appId=script?.dataset.app||'';
  const endpoint='https://flntfunjlwxjfjpwdrmm.supabase.co/rest/v1/platform_settings?id=eq.grade4&select=registration_enabled,login_enabled,connect_plus_visible,english4_visible';
  const apiKey='sb_publishable_0tDt8g40fK5lr7ybDGnWjQ_D5mEFHuR';
  const portalUrl=new URL('../index.html',script?.src||window.location.href).href;
  function ready(run){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run()}
  function hideRegistration(){ready(()=>{document.querySelectorAll('#createAccountBtn,#createAccountForm,.create-account-btn').forEach(element=>element.classList.add('hidden'));});}
  function blockCourse(message){
    ready(()=>{
      const overlay=document.createElement('section');
      overlay.setAttribute('role','alert');overlay.setAttribute('aria-live','assertive');
      overlay.style.cssText='position:fixed;z-index:2147483647;inset:0;display:grid;place-items:center;padding:24px;background:linear-gradient(145deg,#eef7ff,#f8f3ff);font-family:Arial,sans-serif;color:#21325d;text-align:center';
      overlay.innerHTML=`<div style="width:min(520px,100%);padding:36px 28px;border:1px solid #d7e4f4;border-radius:28px;background:#fff;box-shadow:0 24px 70px rgba(35,66,112,.16)"><div style="font-size:48px">⏸</div><h1 style="margin:12px 0 8px;font-size:30px">Course temporarily unavailable</h1><p style="margin:0 0 22px;color:#65748e;font-size:16px;line-height:1.7">${message}</p><a href="${portalUrl}" style="display:inline-block;padding:13px 20px;border-radius:14px;background:#6251df;color:#fff;text-decoration:none;font-weight:800">Return to Grade 4 Portal</a></div>`;
      document.body.appendChild(overlay);
    });
  }
  window.grade4GateReady=fetch(endpoint,{headers:{apikey:apiKey}}).then(response=>response.ok?response.json():Promise.reject(new Error('settings unavailable'))).then(rows=>{
    const settings=Array.isArray(rows)?rows[0]:null;if(!settings)return true;
    if(settings.registration_enabled===false)hideRegistration();
    const courseVisible=appId==='connect-plus-4'?settings.connect_plus_visible!==false:settings.english4_visible!==false;
    if(settings.login_enabled===false){blockCourse('Student access is paused by the teacher. Please try again later.');return false}
    if(!courseVisible){blockCourse('This course is hidden by the teacher at the moment.');return false}
    return true;
  }).catch(error=>{console.warn('Platform availability check could not run.',error.message||error);return true});
})();
