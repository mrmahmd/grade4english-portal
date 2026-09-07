(function(root){
  'use strict';
  const empty=()=>({version:1,lessons:{},stations:{},answers:{},writing:{},activity:null});
  const object=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
  function clean(value){
    const raw=object(value),p=empty();
    for(const key of ['lessons','stations','answers','writing'])p[key]=object(raw[key]);
    p.activity=raw.activity&&typeof raw.activity==='object'?raw.activity:null;
    return p;
  }
  const later=(a,b)=>!a?b:!b?a:Number(a.at||0)>=Number(b.at||0)?a:b;
  function merge(a,b){
    a=clean(a);b=clean(b);const p=empty();
    for(const key of ['stations','answers'])p[key]={...a[key],...b[key]};
    for(const key of new Set([...Object.keys(a.lessons),...Object.keys(b.lessons)])){
      const x=a.lessons[key],y=b.lessons[key];
      p.lessons[key]=!x?y:!y?x:Number(x.percent)>Number(y.percent)?x:Number(y.percent)>Number(x.percent)?y:later(x,y);
    }
    for(const key of new Set([...Object.keys(a.writing),...Object.keys(b.writing)]))p.writing[key]=later(a.writing[key],b.writing[key]);
    p.activity=later(a.activity,b.activity);return p;
  }
  const stats=p=>({xp:Object.keys(p.answers).length*10+Object.keys(p.stations).length*20,stars:Object.values(p.lessons).reduce((sum,l)=>sum+(l.percent>=90?3:l.percent>=70?2:0),0),completed:Object.entries(p.lessons).filter(([key,l])=>/^\d-\d$/.test(key)&&l.percent>=70).length});
  const api={empty,clean,merge,stats};root.G2Progress=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
