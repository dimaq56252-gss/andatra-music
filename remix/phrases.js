// Seeded musical phrases: new note paths and durations, rather than rotated preset loops.
import {randomSource,songSeed} from './production.js?v=melody-25';
const pick=(rng,items)=>items[Math.floor(rng()*items.length)];
const bounds=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
export function inventPhrase(s,development=0,phraseBars=null){
 const rng=randomSource(songSeed(s,700+development)),family=((s.variation||0)+development)%8;
 const bars=phraseBars||(['trap','drill','rnb','dnb','synth'].includes(s.style)?4:pick(rng,[2,4])),total=bars*16;
 const sparse=['trap','drill','rnb','lofi','dnb'].includes(s.style),gaps=sparse?[3,4,5,6,7,8,10]:[2,3,4,5,6,8];
 const steps=[];let time=pick(rng,[0,0,1,2,4]);
 while(time<total-2){steps.push(time);time+=pick(rng,gaps);if(rng()<.16)time+=pick(rng,[2,4,6]);}
 if(steps.length<3)steps.push(Math.floor(total*.5),total-4);
 const unique=[...new Set(steps)].sort((a,b)=>a-b),anchor=pick(rng,[-1,0,0,2,4]),span=pick(rng,[3,4,5,7]),degrees=[];
 let previous=anchor;
 for(let i=0;i<unique.length;i++){
  const phase=i/Math.max(1,unique.length-1);let target;
  switch(family){
   case 0:target=anchor+phase*span;break;
   case 1:target=anchor+(1-phase)*span;break;
   case 2:target=anchor+Math.sin(Math.PI*phase)*span;break;
   case 3:target=anchor+(1-Math.sin(Math.PI*phase))*span;break;
   case 4:target=anchor+Math.sin(phase*Math.PI*3)*span*.6;break;
   case 5:target=i%3===0?anchor:anchor+pick(rng,[2,3,4,6]);break;
   case 6:target=anchor+pick(rng,[-3,-1,2,4,6]);break;
   default:target=anchor+(phase<.5?phase*2*span:(1-phase)*span)-1;break;
  }
  let next=Math.round(target)+(rng()<.3?pick(rng,[-1,1]):0);
  // Most motion is stepwise, with a few deliberate leaps followed by a resolution.
  if(i&&Math.abs(next-previous)>4&&family!==6)next=previous+Math.sign(next-previous)*pick(rng,[2,3,4]);
  next=bounds(next,-3,10);degrees.push(next);previous=next;
 }
 const resolution=pick(rng,[0,2,4]);degrees[degrees.length-1]=anchor+resolution;
 const lengths=unique.map((t,i)=>{const gap=(unique[i+1]??total)-t,legato=i===unique.length-1?.9:pick(rng,[.48,.62,.78,.92]);return Math.max(.65,gap*legato);});
 return {bars,steps:unique,degrees,lengths,family,anchor};
}
export function phraseSignature(events,bpm){
 if(!events.length)return '';
 const first=events[0],step=60/bpm/4;
 return JSON.stringify(events.map(e=>[Math.round((e.when-first.when)/step*100)/100,e.note-first.note,Math.round(e.duration/step*100)/100]));
}
