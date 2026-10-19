import {barActivity} from './adaptation.js?v=remix-6';
function baseStructurePlan(duration,s,profile){const bar=240/s.bpm,count=Math.ceil(duration/bar);if(!profile){const edge=Math.max(1,Math.min(4,Math.floor(count/8))),middle=count-edge*2;return Array.from({length:count},(_,b)=>{let type='verse';const phase=(b-edge)/Math.max(1,middle);if(b<edge)type='intro';else if(b>=count-edge)type='outro';else if(phase<.28)type='verse';else if(phase<.48)type='chorus';else if(phase<.65)type='verse';else if(phase<.75&&count>20)type='break';else type='chorus';return {bar:b,start:b*bar,end:Math.min(duration,(b+1)*bar),type:s.structure?type:'verse'};});}const metrics=Array.from({length:count},(_,b)=>{const start=b*bar,density=barActivity(profile,start,bar);let energy=0,n=0;if(profile)for(let i=Math.max(0,Math.floor(start*profile.rate));i<Math.min(profile.rms.length,(b+1)*bar*profile.rate);i++){energy+=profile.rms[i];n++;}const chroma=Array(12).fill(0);for(const p of profile?.pitches||[])if(p.time>=start&&p.time<start+bar)chroma[p.note]+=p.weight;const sum=chroma.reduce((a,b)=>a+b,0)||1;return {density,energy:n?energy/n:0,chroma:chroma.map(v=>v/sum)};});
 const segments=[];for(let start=0;start<count;start+=8){const chunk=metrics.slice(start,start+8);segments.push({start,end:Math.min(count,start+8),score:chunk.reduce((v,x)=>v+x.density*.5+x.energy/Math.max(.001,profile?.peak||1)*.5,0)/chunk.length});}const sorted=segments.map(x=>x.score).sort((a,b)=>a-b),high=sorted[Math.floor(sorted.length*.65)]||.5;
 const first=profile?.phrases[0]?.start??0,last=profile?.phrases.at(-1)?.end??duration,plan=[];
 for(let b=0;b<count;b++){let type='verse';if(b*bar+bar<=first)type='intro';else if(b*bar>=last&&b>=count-4)type='outro';else if(metrics[b].density<.12&&b>3&&b<count-3)type='break';else{const segment=segments.find(x=>b>=x.start&&b<x.end);if((segment.score>=high&&segment.start>=8)||(b>=8&&b%24>=16&&b%24<24))type='chorus';}if(!s.structure)type='verse';const edit=editAt(s,b*bar);if(edit&&edit.type!=='auto')type=edit.type;plan.push({bar:b,start:b*bar,end:Math.min(duration,(b+1)*bar),type});}
 return plan;
}
export function sectionAt(plan,time){return plan.find(p=>time>=p.start&&time<p.end)?.type||'intro';}
export function arrangeDynamics(events,plan,s){const gains={intro:{drum:.5,bass:.5,chord:.6,lead:.4},verse:{drum:.85,bass:.9,chord:.7,lead:.65},chorus:{drum:1,bass:1,chord:1,lead:1},break:{drum:.3,bass:.4,chord:.8,lead:.9},outro:{drum:.45,bass:.55,chord:.5,lead:.5}},character=s.character||'dense';const result=[];
 for(const e of events){const type=sectionAt(plan,e.when),role=e.kind==='drum'?'drum':e.kind==='lead'?'lead':e.role||'chord';if(s.structure&&type==='intro'&&e.kind==='drum'&&e.index===1)continue;if(character==='calm'&&e.kind==='drum'&&[2,4].includes(e.index))continue;const amount=(s.structure?gains[type][role]:1)*(character==='calm'?(role==='drum'?.72:.8):character==='experimental'?(role==='lead'?1.05:.92):1);result.push({...e,level:e.level*amount,section:type});}
 if(s.structure)for(let i=1;i<plan.length;i++)if(plan[i].type==='chorus'&&plan[i-1].type!=='chorus'){const when=plan[i].start-.12;if(when>=0){result.push({kind:'drum',index:4,when,level:.35,kit:'electro',section:'transition'});const step=60/s.bpm/4;for(let j=0;j<3;j++){const at=plan[i].start-(3-j)*step/2;if(at>=0)result.push({kind:'drum',index:1,when:at,level:.24+j*.12,kit:'classic',section:'transition'});}}}
 return result;
}

export function editAt(settings,time){return settings.edits?.find(e=>time>=e.start&&time<e.end);}
export function applyPartEdits(events,settings){
 return events.flatMap(e=>{const role=e.kind==='drum'?'drum':e.kind==='lead'?'lead':e.role||'chord',edit=editAt(settings,e.when),gain=(settings.partGains?.[role]??1)*(edit?.gains?.[role]??1);return gain>0?[{...e,level:e.level*gain}]:[];});
}



// Breakdowns are planned for the whole song, never separately for a preview slice.
export function breakdownPlan(duration,s,profile=null){
 if(!s.structure)return [];
 const bar=240/s.bpm,count=Math.floor(duration/bar),offset=s.offset||0;
 if(count<6)return [];
 const wanted=count>=18?2+((s.seed||0)%2):2,length=count>=28?2:1;
 const targets=wanted===3?[.28,.56,.80]:[.36,.72],base=baseStructurePlan(duration,s,profile);
 const hooks=base.filter((p,i)=>p.type==='chorus'&&i>0&&base[i-1].type!=='chorus').map(p=>p.start),chosen=[];
 for(const ratio of targets){
  const candidates=[];
  for(let endBar=length+1;endBar<=count+2;endBar++){
   const end=offset+endBar*bar,start=end-length*bar;
   if(start<bar||end>duration-bar||chosen.some(p=>start<p.end+bar*2&&end>p.start-bar*2))continue;
   const hook=hooks.some(t=>Math.abs(t-end)<bar*.6);
   candidates.push({start,end,score:Math.abs(end-duration*ratio)-(hook?bar*1.5:0)});
  }
  candidates.sort((a,b)=>a.score-b.score);if(candidates.length){const {start,end}=candidates[0];chosen.push({start,end});}
 }
 return chosen.sort((a,b)=>a.start-b.start);
}
export function structurePlan(duration,s,profile){
 const base=baseStructurePlan(duration,s,profile),breaks=breakdownPlan(duration,s,profile);
 if(!s.structure)return base;
 // Replace the old arbitrary long quiet section with exactly the planned short drops.
 const edges=[...new Set([0,duration,...base.flatMap(p=>[p.start,p.end]),...breaks.flatMap(p=>[p.start,p.end])])].sort((a,b)=>a-b);
 return edges.slice(0,-1).map((start,i)=>{const end=edges[i+1],middle=(start+end)/2,part=base.find(p=>middle>=p.start&&middle<p.end),drop=breaks.some(p=>middle>=p.start&&middle<p.end);return {bar:Math.floor(start/(240/s.bpm)),start,end,type:drop?'break':part?.type==='break'?'verse':part?.type||'verse'};});
}
export function applyBreakdowns(events,breaks,s){
 if(!breaks.length)return events;
 const step=60/s.bpm/4,result=[];
 for(const original of events){
  let e={...original},drop=breaks.find(p=>e.when>=p.start&&e.when<p.end),role=e.kind==='drum'?'drum':e.kind==='lead'?'lead':e.role;
  if(drop){
   // Full kick/sub removal, with only a quiet harmonic bed left under the vocal.
   if(role==='bass'||role==='drum'||e.kind==='fx')continue;
   if(role==='lead'){if(e.when-drop.start>step*2)continue;e.level*=.3;}
   else e.level*=.45;
   e.duration=Math.min(e.duration||step,drop.end-e.when);e.section='break';
  }else if(e.duration){
   const next=breaks.find(p=>e.when<p.start&&e.when+e.duration>p.start);
   if(next)e.duration=next.start-e.when;
  }
  if(!e.duration||e.duration>.015)result.push(e);
 }
 for(const drop of breaks){
  // A brief pickup and downbeat make the return audible instead of fading back in.
  for(let i=0;i<3;i++)result.push({kind:'drum',index:1,when:drop.end-(3-i)*step/2,level:.18+i*.09,kit:'classic',section:'transition'});
  if(!result.some(e=>e.kind==='drum'&&e.index===0&&Math.abs(e.when-drop.end)<.025))result.push({kind:'drum',index:0,when:drop.end,level:1.05,kit:'trap',section:'transition'});
  result.push({kind:'fx',role:'drum',rise:false,when:drop.end,duration:.8,level:.055,section:'transition'});
 }
 return result;
}
