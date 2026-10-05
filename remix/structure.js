import {barActivity} from './adaptation.js?v=remix-6';
export function structurePlan(duration,s,profile){const bar=240/s.bpm,count=Math.ceil(duration/bar),metrics=Array.from({length:count},(_,b)=>{const start=b*bar,density=barActivity(profile,start,bar);let energy=0,n=0;if(profile)for(let i=Math.max(0,Math.floor(start*profile.rate));i<Math.min(profile.rms.length,(b+1)*bar*profile.rate);i++){energy+=profile.rms[i];n++;}const chroma=Array(12).fill(0);for(const p of profile?.pitches||[])if(p.time>=start&&p.time<start+bar)chroma[p.note]+=p.weight;const sum=chroma.reduce((a,b)=>a+b,0)||1;return {density,energy:n?energy/n:0,chroma:chroma.map(v=>v/sum)};});
 const segments=[];for(let start=0;start<count;start+=8){const chunk=metrics.slice(start,start+8);segments.push({start,end:Math.min(count,start+8),score:chunk.reduce((v,x)=>v+x.density*.5+x.energy/Math.max(.001,profile?.peak||1)*.5,0)/chunk.length});}const sorted=segments.map(x=>x.score).sort((a,b)=>a-b),high=sorted[Math.floor(sorted.length*.65)]||.5;
 const first=profile?.phrases[0]?.start??0,last=profile?.phrases.at(-1)?.end??duration,plan=[];
 for(let b=0;b<count;b++){let type='verse';if(b*bar+bar<=first)type='intro';else if(b*bar>=last&&b>=count-4)type='outro';else if(metrics[b].density<.12&&b>3&&b<count-3)type='break';else{const segment=segments.find(x=>b>=x.start&&b<x.end);if((segment.score>=high&&segment.start>=8)||(b>=8&&b%24>=16&&b%24<24))type='chorus';}if(!s.structure)type='verse';const edit=editAt(s,b*bar);if(edit&&edit.type!=='auto')type=edit.type;plan.push({bar:b,start:b*bar,end:Math.min(duration,(b+1)*bar),type});}
 return plan;
}
export function sectionAt(plan,time){return plan.find(p=>time>=p.start&&time<p.end)?.type||'intro';}
export function arrangeDynamics(events,plan,s){const gains={intro:{drum:.5,bass:.5,chord:.6,lead:.4},verse:{drum:.85,bass:.9,chord:.7,lead:.65},chorus:{drum:1,bass:1,chord:1,lead:1},break:{drum:.3,bass:.4,chord:.8,lead:.9},outro:{drum:.45,bass:.55,chord:.5,lead:.5}},character=s.character||'dense';const result=[];
 for(const e of events){const type=sectionAt(plan,e.when),role=e.kind==='drum'?'drum':e.kind==='lead'?'lead':e.role||'chord';if(s.structure&&type==='intro'&&e.kind==='drum'&&e.index===1)continue;if(character==='calm'&&e.kind==='drum'&&[2,4].includes(e.index))continue;const amount=(s.structure?gains[type][role]:1)*(character==='calm'?(role==='drum'?.72:.8):character==='experimental'?(role==='lead'?1.05:.92):1);result.push({...e,level:e.level*amount,section:type});}
 if(s.structure)for(let i=1;i<plan.length;i++)if(plan[i].type==='chorus'&&plan[i-1].type!=='chorus'){const when=plan[i].start-.12;if(when>=0)result.push({kind:'drum',index:4,when,level:.35,kit:'electro',section:'transition'});}
 return result;
}

export function editAt(settings,time){return settings.edits?.find(e=>time>=e.start&&time<e.end);}
export function applyPartEdits(events,settings){
 return events.flatMap(e=>{const role=e.kind==='drum'?'drum':e.kind==='lead'?'lead':e.role||'chord',edit=editAt(settings,e.when),gain=(settings.partGains?.[role]??1)*(edit?.gains?.[role]??1);return gain>0?[{...e,level:e.level*gain}]:[];});
}
