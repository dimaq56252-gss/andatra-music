import {GROOVE_VOCABULARY,TEXTURE_SHAPES} from './vocabulary.js?v=catalog-36';
// Original arrangement and synthesis; no remote generation or borrowed song loops.
import {barActivity,activityAt,vocalAccentSteps} from './adaptation.js?v=remix-6';
import {structurePlan,sectionAt} from './structure.js?v=catalog-36';
export function randomSource(seed){let state=seed>>>0;return ()=>{state=(state+0x6D2B79F5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
export function songSeed(s,salt=0){return (Math.imul((s.seed||1)^(s.variation+1),2654435761)^Math.imul(salt+1,2246822519)^Array.from(s.style).reduce((a,c)=>Math.imul(a,31)+c.charCodeAt(0),0))>>>0;}
const choose=(rng,items)=>items[Math.floor(rng()*items.length)];
const fourFloor=new Set(['house','techno','synth']);
const rapStyles=new Set(['rap','boom','trap','drill','lofi','bounce','phonk','rnb']);
const halfTime=new Set(['trap','drill']);
export const PALETTES={
 rap:{chord:['pad','guitar','strings'],pad:'strings',bass:'round',comp:[0,6,10],length:3.8,perc:[3,7,11,15]},
 boom:{chord:['guitar','strings','organ'],pad:'strings',bass:'round',comp:[0,7,10],length:4.6,perc:[3,10,15]},
 trap:{chord:['pad','strings','lead'],pad:'pad',bass:'808',comp:[0,10],length:7,perc:[6,14]},
 drill:{chord:['strings','pad','guitar'],pad:'strings',bass:'808',comp:[0,7,12],length:5,perc:[3,11]},
 lofi:{chord:['guitar','pad','epiano'],pad:'pad',bass:'round',comp:[0,6,11],length:5.4,perc:[3,7,14]},
 house:{chord:['organ','pad','guitar'],pad:'pad',bass:'pulse',comp:[2,6,10,14],length:1.5,perc:[3,7,11,15]},
 synth:{chord:['pad','strings','organ'],pad:'pad',bass:'pulse',comp:[0,8],length:7.6,perc:[6,14]},
 bounce:{chord:['epiano','guitar','organ'],pad:'strings',bass:'funk',comp:[2,7,10,14],length:1.7,perc:[3,6,11,15]},
 phonk:{chord:['pad','organ','strings'],pad:'strings',bass:'808',comp:[0,6,8,14],length:2.5,perc:[3,7,11,15]},
 dnb:{chord:['pad','epiano','strings'],pad:'pad',bass:'reese',comp:[0,10],length:5.7,perc:[3,7,11,15]},
 techno:{chord:['organ','pad','strings'],pad:'pad',bass:'pulse',comp:[2,5,10,13],length:.9,perc:[1,3,7,9,11,15]},
 reggaeton:{chord:['guitar','pad','organ'],pad:'pad',bass:'round',comp:[0,3,6,8,11,14],length:1.1,perc:[2,5,10,13]},
 afro:{chord:['guitar','pad','strings'],pad:'strings',bass:'round',comp:[0,3,6,10,13],length:1.4,perc:[1,4,7,9,12,15]},
 rnb:{chord:['pad','guitar','epiano'],pad:'pad',bass:'round',comp:[0,7,10],length:5.5,perc:[3,6,11,14]}
};
// A song keeps one coherent texture; the hook adds layers instead of swapping its identity.
export function soundSet(s){
 const sets=['trap','drill','phonk'].includes(s.style)?[
  {chord:'pad',answer:'strings',brightness:.72,bassBody:.34},
  {chord:'strings',answer:'pluck',brightness:.9,bassBody:.28}
 ]:['lofi','rnb','boom'].includes(s.style)?[
  {chord:'guitar',answer:'pad',brightness:.65,bassBody:.22},
  {chord:'pad',answer:'guitar',brightness:.8,bassBody:.26}
 ]:[
  {chord:'pad',answer:'pluck',brightness:.9,bassBody:.3},
  {chord:'guitar',answer:'strings',brightness:1.1,bassBody:.25},
  {chord:'organ',answer:'pad',brightness:.8,bassBody:.28}
 ];
 const base=sets[(s.seed+s.variation)%sets.length],extra=['lofi','rnb','boom'].includes(s.style)?['rhodes','jazzguitar','vibes','nylon']:['trap','drill','phonk'].includes(s.style)?['choir','synthstrings','cello','shimmer']:['cleanguitar','drawbar','fm','softpluck'];
 const index=(s.seed+s.variation)%6,shape=TEXTURE_SHAPES[((s.seed>>>0)+s.variation)%TEXTURE_SHAPES.length],texture=index<2?base:{...base,chord:extra[(index-2)%extra.length]};
 return {...texture,brightness:rapStyles.has(s.style)?(texture.brightness+shape.brightness)/2:texture.brightness,bassBody:rapStyles.has(s.style)?shape.bassBody:texture.bassBody};
}
export function bassGroove(kicks,family,style){
 if(fourFloor.has(style)||['reggaeton','afro'].includes(style))return [...family];
 // Preserve kick anchors and one syncopated answer. Longer notes fill the gaps.
 const anchors=[...new Set(kicks)].sort((a,b)=>a-b);
 const answer=family.find(i=>i>0&&!anchors.includes(i)&&anchors.every(k=>Math.abs(k-i)>=2));
 return [...new Set([...anchors,...(answer===undefined?[]:[answer])])].sort((a,b)=>a-b);
}
const bassPatterns={
 rap:[[0,6,8,14],[0,3,8,11],[0,7,10,14],[0,6,10,15]],
 trap:[[0,7,10],[0,6,11,14],[0,3,10],[0,7,12,15]],
 drill:[[0,5,10,14],[0,3,9,14],[0,6,10,15],[0,5,11,14]],
 lofi:[[0,6,9],[0,7,10],[0,6,8,14]],
 house:[[0,3,6,8,11,14],[2,6,10,14],[0,2,6,8,10,14]],
 synth:[[0,2,4,6,8,10,12,14],[0,3,6,8,11,14]],
 bounce:[[0,3,6,8,10,14],[0,2,5,8,11,14]],
 phonk:[[0,3,7,8,11,14],[0,6,8,11,15]],
 dnb:[[0,6,10],[0,3,8,10,14],[0,7,10,15]],
 techno:[[2,6,10,14],[0,3,6,8,11,14]],
 reggaeton:[[0,6,8,14],[0,3,8,11,14]],
 afro:[[0,3,7,10,14],[0,6,8,11,14]],
 rnb:[[0,7,8,10],[0,6,10,14]]
};
// Two-bar syncopation joins the regular rap groove pool; tempo controls the backbeat spacing.
export function sharedRapGroove(s,bar,base){
 const family=((s.seed>>>0)+s.variation)%(GROOVE_VOCABULARY.length+2),odd=((bar%2)+2)%2===1;
 if(family===0)return base;
 if(family===1)return {...base,kick:odd?[6,12]:[0,12],snare:s.bpm>=120?(odd?[2,8]:[8,14]):base.snare};
 // Match beat spacing to the selected tempo; sample each component independently of song identity.
 const candidates=GROOVE_VOCABULARY.filter(g=>(g.bpm>=115)===(s.bpm>=115)),pool=candidates.length?candidates:GROOVE_VOCABULARY,g=pool[(family-2)%pool.length],offset=odd?16:0;
 const kick=g.kick.filter(i=>i>=offset&&i<offset+16).map(i=>i-offset),snare=g.snare.filter(i=>i>=offset&&i<offset+16).map(i=>i-offset);
 return {...base,kick:kick.length?kick:base.kick,snare:snare.length?snare:base.snare};
}
export function composeBacking(duration,s,profile,composition,style){
 const step=60/s.bpm/4,bar=step*16,scale=composition.scale,plan=structurePlan(duration,s,profile),palette=PALETTES[s.style]||PALETTES.rap,events=[],rng=randomSource(songSeed(s)),texture=soundSet(s),compInstrument=texture.chord,bassPool=bassPatterns[s.style]||bassPatterns.rap;
 const family=bassPool[s.variation%bassPool.length],alternate=bassPool[(s.variation+1)%bassPool.length],swing=s.swing,rapFocus=rapStyles.has(s.style);
 const pitch=(degree,octave)=>12*(octave+1)+s.root+scale[((degree%7)+7)%7]+12*Math.floor(degree/7);
 function add(e){if(e.when>=0&&e.when<duration&&(!e.duration||e.duration>.015)){if(e.duration)e.duration=Math.min(e.duration,duration-e.when);events.push(e);}}
 let previousVoicing=null;
 for(let b=Math.floor(-s.offset/bar)-1;s.offset+b*bar<duration;b++){
  const start=s.offset+b*bar,local=randomSource(songSeed(s,b+100)),phase=((b%8)+8)%8,section=sectionAt(plan,Math.max(0,start)),density=barActivity(profile,start,bar),degree=composition.plan.get(b)??0;
  const isBreak=s.structure&&section==='break',intro=s.structure&&section==='intro',outro=s.structure&&section==='outro',chorus=section==='chorus',nextSection=sectionAt(plan,start+bar),transition=s.structure&&nextSection!==section;
  const time=i=>start+i*step+(Math.floor(i)%2?swing*step:0);
  const accents=vocalAccentSteps(profile,start,step);
  const kickFamilies={rap:[[0,6,8,14],[0,3,8,11],[0,7,10,14],[0,5,8,15]],boom:[[0,6,8,11],[0,3,8,14],[0,7,10,15]],trap:[[0,7,10],[0,3,6,11],[0,5,10,14],[0,6,9,15]],drill:[[0,5,10,14],[0,3,9,14],[0,6,11,15]],lofi:[[0,6,9],[0,7,10],[0,3,8,14]],bounce:[[0,3,8,10,14],[0,6,8,11],[0,2,7,10,15]],phonk:[[0,3,7,8,11,14],[0,6,8,10,15],[0,2,7,10,14]],dnb:[[0,6,10],[0,3,10,14],[0,7,8,10]],afro:[[0,7,10],[0,3,8,14],[0,6,10,15]],rnb:[[0,7,10],[0,3,8,14],[0,6,10,15]]};
  const families=kickFamilies[s.style],baseKicks=families?families[(s.variation+(!rapFocus&&chorus?1:0))%families.length]:style.kick;
  const barStyle=rapFocus?sharedRapGroove(s,b,{...style,kick:baseKicks}):style,kicks=[...barStyle.kick];
  if(!fourFloor.has(s.style)&&!['reggaeton'].includes(s.style)){
   if(!rapFocus&&(phase===2||phase===6)){const movable=kicks.findIndex(k=>k%4!==0);if(movable>=0)kicks[movable]=Math.max(1,Math.min(15,kicks[movable]+(local()<.5?-1:1)));}
   if((!rapFocus&&phase===3)||phase===7)kicks.push(choose(local,[13,14,15]));
   if(profile&&density>.2&&(!rapFocus||phase===7))for(const a of accents.slice(0,2))if(!barStyle.snare.includes(a)&&!barStyle.clap.includes(a))kicks.push(a);
  }
  if(s.structure&&transition&&nextSection==='chorus'){const length=Math.min(bar*.65,2);add({kind:'fx',role:'drum',rise:true,when:start+bar-length,duration:length*.98,level:.052});add({kind:'fx',role:'drum',rise:false,when:start+bar,duration:1.1,level:.085});}
  if(transition&&nextSection==='chorus')add({kind:'drum',index:5,when:start+bar,level:.19,kit:style.kit});
  const silentTail=(transition||!rapFocus&&phase===7)&&!fourFloor.has(s.style)&&!isBreak;
  for(const [name,index] of [['kick',0],['snare',1],['clap',2],['hat',3],['open',4]]){
   if(isBreak&&(index<3||index===4))continue;
   if(intro&&(index===1||index===2||b%2===0&&index===0))continue;
   const rhythm=name==='kick'?[...new Set(kicks)]:name==='hat'&&chorus?[...new Set([...barStyle.hat,...(halfTime.has(s.style)?[3,7,11,15]:[3,11])])]:barStyle[name];
   for(const i of rhythm){
    if(silentTail&&i>=14&&index!==1)continue;
    if(intro&&index===3&&i%4!==0||outro&&index===3&&i%4!==0)continue;
    if(isBreak&&i%8!==0)continue;
    if(!rapFocus&&section==='verse'&&name==='hat'&&phase%2===1&&i%4===2)continue;
    const activity=activityAt(profile,time(i)),velocity=(index===0?1.08:index===1?.94:index===2?.52:index===3?.25:.30)*(i%4===0?1:choose(local,[.74,.83,.91]));
    const hatAccent=rapFocus&&index===3?(i%4===2?1:.65):1;
    const human=index>=3?(local()-.5)*Math.min(.012,step*.12):0;
    add({kind:'drum',index,when:time(i)+human,level:velocity*hatAccent*(index>=3?1-.25*activity*s.fit:1),kit:style.kit});
   }
  }
  // Ghost snares, hand percussion, and rolls support a groove without copying every bar.
  if(!intro&&!outro&&!isBreak){
   if(!fourFloor.has(s.style)&&(rapFocus?phase===3:phase%2===1))add({kind:'drum',index:1,when:time(halfTime.has(s.style)?7:11),level:.15,kit:style.kit});
   if(['afro','reggaeton','bounce'].includes(s.style))for(const i of [3,7,10,15])add({kind:'drum',index:phase%2?8:9,when:time(i),level:.12,kit:style.kit});
   for(const i of palette.perc)if((phase+i)%3!==0)add({kind:'drum',index:7,when:time(i)+.005,level:(s.style==='afro'?.28:.13)*(local()*.35+.8),kit:style.kit});
   if(halfTime.has(s.style)&&(phase===3||phase===7))for(const i of [13,13.5,14,14.5,15,15.5])add({kind:'drum',index:3,when:time(i),level:.16+(i-13)*.025,kit:style.kit});
   if(phase===7||transition){for(const i of (rapFocus?[14,15]:[13,14,14.5,15,15.5]))add({kind:'drum',index:i<14?6:1,when:time(i),level:.2+(i-13)*.11,kit:style.kit});}
  }
  const selected=chorus?alternate:(Math.floor(Math.max(0,b)/8)%2===1||phase===7)?alternate:family,pattern=bassGroove(kicks,selected,s.style),root=pitch(degree,1);
  if(!isBreak&&(!intro||b%2===1))for(let j=0;j<pattern.length;j++){
   const i=pattern[j];if(silentTail&&i>=14)continue;
   const next=pattern[j+1]??16,gap=next-i;
   // Root stays in the sub register; octave/fifth pickups lead into the next chord.
   const pickup=j===pattern.length-1&&(rapFocus?phase===7:phase%2===1),interval=pickup?choose(local,[0,7,12]):palette.bass==='funk'&&j%3===1?12:0;
   const length=step*Math.max(.5,gap*(palette.bass==='808'?.94:palette.bass==='round'?.84:.63))*(rapFocus?(chorus?1:.86):1);
   add({kind:'note',role:'bass',instrument:s.bassTone&&s.bassTone!=='auto'?s.bassTone:palette.bass,note:root+interval,when:time(i)+.003,duration:length,level:(palette.bass==='808'?.36:.30)*(j===0?1:.88),body:texture.bassBody,glide:s.style==='drill'&&pickup?root:undefined});
  }
  if(s.harmony){
   const extension=['lofi','rnb','afro','house'].includes(s.style),degrees=[degree,degree+2,degree+4,...(extension?[degree+6]:[])];
   let voicing=degrees.map(d=>pitch(d,3));
   // Keep comping in a stable middle register with connected inversions.
   const inversion=s.seed%3;voicing=voicing.map((n,i)=>i<inversion?n+12:n).sort((a,b)=>a-b);while(voicing[0]>62)voicing=voicing.map(n=>n-12);
   if(previousVoicing){voicing=voicing.map((n,i)=>[n-12,n,n+12].sort((a,b)=>Math.abs(a-previousVoicing[i%previousVoicing.length])-Math.abs(b-previousVoicing[i%previousVoicing.length]))[0]).sort((a,b)=>a-b);}previousVoicing=voicing;
   const compPatterns=[palette.comp,s.style==='house'?[2,5,10,13]:[0,5,11],s.style==='house'?[3,6,11,14]:[2,7,12],s.style==='synth'?[0]:[0,7,14]];
   const comp=compPatterns[(s.variation+(chorus?1:0))%compPatterns.length];
   const rhythm=isBreak?[0]:intro?[0,8]:rapFocus?(chorus?[0,8]:[0]):section==='verse'?comp.filter((_,i)=>i%2===0):comp;
   const sectionInstrument=compInstrument;
   for(const i of rhythm){
    if(density>.65&&i!==0&&activityAt(profile,time(i))>.6&&i%4!==2)continue;
    for(let n=0;n<voicing.length;n++)add({kind:'note',role:'chord',instrument:sectionInstrument,note:voicing[n],when:time(i)+n*.009,duration:step*(isBreak?14:rapFocus?(chorus?6:10):palette.length),level:(rapFocus?.038:.052)*(1-.3*activityAt(profile,time(i))*s.fit),pan:(n-(voicing.length-1)/2)*.13});
   }
   // Sparse upper answers occupy the gaps, leaving the main motif readable.
   if(chorus&&phase%2===1&&s.melody>0)for(const [j,i]of [6,14].entries()){if(activityAt(profile,time(i))>.55)continue;const leadNearby=composition.events.some(e=>Math.abs(e.when-time(i))<step*1.5);if(!leadNearby)add({kind:'note',role:'chord',instrument:texture.answer,note:j?voicing.at(-1):voicing[Math.max(0,voicing.length-2)]+12,when:time(i),duration:step*1.6,level:.025*s.melody,pan:j?.55:-.55});}
   // A slower bed in the hook contrasts with rhythmic comping in the verse.
   if(chorus||isBreak||s.style==='synth')for(const d of [degree,degree+4])add({kind:'note',role:'chord',instrument:palette.pad,note:pitch(d,3),when:start,duration:bar*.96,level:chorus?.032:.023,pan:d===degree?-.4:.4});
  }
 }
 return events;
}
export function createProductionBus(c,out,s){
 const drums=c.createGain(),bass=c.createGain(),music=c.createGain(),body=c.createGain(),high=c.createBiquadFilter(),delay=c.createDelay(1),feedback=c.createGain(),wet=c.createGain();
 const tone=c.createBiquadFilter(),texture=soundSet(s);tone.type='lowpass';tone.frequency.value=7500*texture.brightness;tone.Q.value=.45;
 high.type='highpass';high.frequency.value=155;body.gain.value=s.samples?4.5:2.5;music.connect(high).connect(tone).connect(body).connect(out);drums.connect(out);bass.connect(out);
 // Short tempo-locked stereo echo is restricted to harmony, leaving kick/sub clean.
 const left=c.createStereoPanner(),right=c.createStereoPanner();left.pan.value=-.55;right.pan.value=.55;
 delay.delayTime.value=Math.min(.8,60/s.bpm*.75);feedback.gain.value=.2;wet.gain.value=s.style==='lofi'?.12:.16;
 high.connect(delay);delay.connect(feedback).connect(delay);delay.connect(wet).connect(left).connect(out);wet.connect(right).connect(out);
 return {drums,bass,music};
}
export function renderBass(c,out,e){
 const amp=c.createGain(),filter=c.createBiquadFilter(),nodes=[amp,filter],end=e.when+e.duration,frequency=440*2**((e.note-69)/12),kind=e.instrument||'round';
 filter.type='lowpass';filter.Q.value=kind==='pulse'?1.1:.5;filter.frequency.setValueAtTime(kind==='808'?650:kind==='reese'?900:kind==='pulse'?1200:750,e.when);filter.frequency.exponentialRampToValueAtTime(kind==='reese'?350:180,end);filter.connect(amp).connect(out);
 amp.gain.setValueAtTime(.0001,e.when);amp.gain.linearRampToValueAtTime(Math.max(.0001,e.level*.4),e.when+.008);amp.gain.exponentialRampToValueAtTime(Math.max(.0001,e.level*(kind==='808'?.175:.31)),Math.max(e.when+.009,end-.035));amp.gain.exponentialRampToValueAtTime(.0001,end+.035);
 const layers=kind==='reese'?[[1,'sawtooth',-.08,.25],[1,'sawtooth',.08,.25],[1,'sine',0,.65]]:kind==='pulse'||kind==='funk'?[[1,'sawtooth',0,.3],[1,'sine',0,.8]]:[[1,'sine',0,1],[2,'triangle',0,e.body??.28],[3,'sine',0,.09]];
 for(const [ratio,type,detune,level]of layers){const osc=c.createOscillator(),gain=c.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency*ratio*(kind==='808'?1.035:1),e.when);osc.frequency.exponentialRampToValueAtTime(frequency*ratio,e.when+.06);if(e.glide!==undefined)osc.frequency.exponentialRampToValueAtTime(440*2**((e.glide-69)/12)*ratio,Math.max(e.when+.065,end-.015));osc.detune.value=detune*100;gain.gain.value=level;osc.connect(gain).connect(filter);osc.start(e.when);osc.stop(end+.04);nodes.push(osc,gain);}
 nodes.find(n=>typeof n.start==='function').onended=()=>nodes.forEach(n=>{try{n.disconnect();}catch{}});
}
const noiseBuffers=new WeakMap();
export function renderNoiseFx(c,out,e,seed){
 let buffer=noiseBuffers.get(c);if(!buffer){buffer=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const rng=randomSource(seed),a=buffer.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=rng()*2-1;noiseBuffers.set(c,buffer);}
 const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain(),end=e.when+e.duration;source.buffer=buffer;source.loop=true;filter.type='highpass';filter.frequency.setValueAtTime(e.rise?800:4500,e.when);filter.frequency.exponentialRampToValueAtTime(e.rise?8000:1500,end);gain.gain.setValueAtTime(e.rise?.0001:e.level,e.when);gain.gain.exponentialRampToValueAtTime(e.rise?Math.max(.0001,e.level):.0001,end);source.connect(filter).connect(gain).connect(out);source.start(e.when);source.stop(end);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
}
