// Original arrangement and synthesis; no remote generation or borrowed song loops.
import {barActivity,activityAt,vocalAccentSteps} from './adaptation.js?v=remix-6';
import {structurePlan,sectionAt} from './structure.js?v=production-20';
export function randomSource(seed){let state=seed>>>0;return ()=>{state=(state+0x6D2B79F5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
export function songSeed(s,salt=0){return (Math.imul((s.seed||1)^(s.variation+1),2654435761)^Math.imul(salt+1,2246822519)^Array.from(s.style).reduce((a,c)=>Math.imul(a,31)+c.charCodeAt(0),0))>>>0;}
const choose=(rng,items)=>items[Math.floor(rng()*items.length)];
const fourFloor=new Set(['house','techno','synth']);
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
export function composeBacking(duration,s,profile,composition,style){
 const step=60/s.bpm/4,bar=step*16,scale=composition.scale,plan=structurePlan(duration,s,profile),palette=PALETTES[s.style]||PALETTES.rap,events=[],rng=randomSource(songSeed(s)),compInstrument=palette.chord[s.variation%palette.chord.length],bassPool=bassPatterns[s.style]||bassPatterns.rap;
 const family=bassPool[s.variation%bassPool.length],alternate=bassPool[(s.variation+1)%bassPool.length],swing=s.swing;
 const pitch=(degree,octave)=>12*(octave+1)+s.root+scale[((degree%7)+7)%7]+12*Math.floor(degree/7);
 function add(e){if(e.when>=0&&e.when<duration&&(!e.duration||e.duration>.015)){if(e.duration)e.duration=Math.min(e.duration,duration-e.when);events.push(e);}}
 for(let b=Math.floor(-s.offset/bar)-1;s.offset+b*bar<duration;b++){
  const start=s.offset+b*bar,local=randomSource(songSeed(s,b+100)),phase=((b%8)+8)%8,section=sectionAt(plan,Math.max(0,start)),density=barActivity(profile,start,bar),degree=composition.plan.get(b)??0;
  const isBreak=s.structure&&section==='break',intro=s.structure&&section==='intro',outro=s.structure&&section==='outro',chorus=section==='chorus',nextSection=sectionAt(plan,start+bar),transition=s.structure&&nextSection!==section;
  const time=i=>start+i*step+(Math.floor(i)%2?swing*step:0);
  const accents=vocalAccentSteps(profile,start,step);
  const kickFamilies={rap:[[0,6,8,14],[0,3,8,11],[0,7,10,14],[0,5,8,15]],boom:[[0,6,8,11],[0,3,8,14],[0,7,10,15]],trap:[[0,7,10],[0,3,6,11],[0,5,10,14],[0,6,9,15]],drill:[[0,5,10,14],[0,3,9,14],[0,6,11,15]],lofi:[[0,6,9],[0,7,10],[0,3,8,14]],bounce:[[0,3,8,10,14],[0,6,8,11],[0,2,7,10,15]],phonk:[[0,3,7,8,11,14],[0,6,8,10,15],[0,2,7,10,14]],dnb:[[0,6,10],[0,3,10,14],[0,7,8,10]],afro:[[0,7,10],[0,3,8,14],[0,6,10,15]],rnb:[[0,7,10],[0,3,8,14],[0,6,10,15]]};
  const families=kickFamilies[s.style],kicks=[...(families?families[s.variation%families.length]:style.kick)];
  if(!fourFloor.has(s.style)&&!['reggaeton'].includes(s.style)){
   if(phase===2||phase===6){const movable=kicks.findIndex(k=>k%4!==0);if(movable>=0)kicks[movable]=Math.max(1,Math.min(15,kicks[movable]+(local()<.5?-1:1)));}
   if(phase===3||phase===7)kicks.push(choose(local,[13,14,15]));
   if(profile&&density>.2)for(const a of accents.slice(0,2))if(!style.snare.includes(a)&&!style.clap.includes(a))kicks.push(a);
  }
  if(s.structure&&transition&&nextSection==='chorus'){const length=Math.min(bar*.65,2);add({kind:'fx',role:'drum',rise:true,when:start+bar-length,duration:length*.98,level:.052});add({kind:'fx',role:'drum',rise:false,when:start+bar,duration:1.1,level:.085});}
  const silentTail=(transition||phase===7)&&!fourFloor.has(s.style)&&!isBreak;
  for(const [name,index] of [['kick',0],['snare',1],['clap',2],['hat',3],['open',4]]){
   if(isBreak&&(index<3||index===4))continue;
   if(intro&&(index===1||index===2||b%2===0&&index===0))continue;
   const rhythm=name==='kick'?[...new Set(kicks)]:style[name];
   for(const i of rhythm){
    if(silentTail&&i>=14&&index!==1)continue;
    if(intro&&index===3&&i%4!==0||outro&&index===3&&i%4!==0)continue;
    if(isBreak&&i%8!==0)continue;
    const activity=activityAt(profile,time(i)),velocity=(index===0?1.08:index===1?.94:index===2?.52:index===3?.25:.30)*(i%4===0?1:choose(local,[.74,.83,.91]));
    const human=index>=3?(local()-.5)*Math.min(.012,step*.12):0;
    add({kind:'drum',index,when:time(i)+human,level:velocity*(index>=3?1-.25*activity*s.fit:1),kit:style.kit});
   }
  }
  // Ghost snares, hand percussion, and rolls support a groove without copying every bar.
  if(!intro&&!outro&&!isBreak){
   if(!fourFloor.has(s.style)&&phase%2===1)add({kind:'drum',index:1,when:time(halfTime.has(s.style)?7:11),level:.15,kit:style.kit});
   for(const i of palette.perc)if((phase+i)%3!==0)add({kind:'drum',index:7,when:time(i)+.005,level:(s.style==='afro'?.28:.13)*(local()*.35+.8),kit:style.kit});
   if(halfTime.has(s.style)&&(phase===3||phase===7))for(const i of [13,13.5,14,14.5,15,15.5])add({kind:'drum',index:3,when:time(i),level:.16+(i-13)*.025,kit:style.kit});
   if(phase===7||transition){for(const i of [13,14,14.5,15,15.5])add({kind:'drum',index:i<14?6:1,when:time(i),level:.2+(i-13)*.11,kit:style.kit});}
  }
  const pattern=phase>=4?alternate:family,root=pitch(degree,1);
  if(!isBreak&&(!intro||b%2===1))for(let j=0;j<pattern.length;j++){
   const i=pattern[j];if(silentTail&&i>=14)continue;
   const next=pattern[j+1]??16,gap=next-i;
   // Root stays in the sub register; octave/fifth pickups lead into the next chord.
   const pickup=j===pattern.length-1&&phase%2===1,interval=pickup?choose(local,[0,7,12]):palette.bass==='funk'&&j%3===1?12:0;
   const length=step*Math.max(.5,gap*(palette.bass==='808'?.94:palette.bass==='round'?.84:.63));
   add({kind:'note',role:'bass',instrument:palette.bass,note:root+interval,when:time(i)+.003,duration:length,level:(palette.bass==='808'?.28:.24)*(j===0?1:.88),glide:s.style==='drill'&&pickup?root:undefined});
  }
  if(s.harmony){
   const extension=['lofi','rnb','afro','house'].includes(s.style),degrees=[degree,degree+2,degree+4,...(extension?[degree+6]:[])];
   let voicing=degrees.map(d=>pitch(d,3));
   // Keep comping in a stable middle register with connected inversions.
   const inversion=(Math.floor(Math.max(0,b)/4)+s.seed)%3;voicing=voicing.map((n,i)=>i<inversion?n+12:n).sort((a,b)=>a-b);while(voicing[0]>62)voicing=voicing.map(n=>n-12);
   const compPatterns=[palette.comp,s.style==='house'?[2,5,10,13]:[0,5,11],s.style==='house'?[3,6,11,14]:[2,7,12],s.style==='synth'?[0]:[0,7,14]];
   const rhythm=isBreak?[0]:intro?[0,8]:compPatterns[s.variation%compPatterns.length];
   for(const i of rhythm){
    if(density>.65&&i!==0&&activityAt(profile,time(i))>.6&&i%4!==2)continue;
    for(let n=0;n<voicing.length;n++)add({kind:'note',role:'chord',instrument:compInstrument,note:voicing[n],when:time(i)+n*.009,duration:step*(isBreak?14:palette.length),level:.052*(1-.3*activityAt(profile,time(i))*s.fit),pan:(n-(voicing.length-1)/2)*.13});
   }
   // A slower bed in the hook contrasts with rhythmic comping in the verse.
   if(chorus||isBreak||s.style==='synth')for(const d of [degree,degree+4])add({kind:'note',role:'chord',instrument:palette.pad,note:pitch(d,3),when:start,duration:bar*.96,level:chorus?.032:.023,pan:d===degree?-.4:.4});
  }
 }
 return events;
}
export function createProductionBus(c,out,s){
 const drums=c.createGain(),bass=c.createGain(),music=c.createGain(),body=c.createGain(),high=c.createBiquadFilter(),delay=c.createDelay(1),feedback=c.createGain(),wet=c.createGain();
 high.type='highpass';high.frequency.value=155;body.gain.value=s.samples?4.5:2.5;music.connect(high).connect(body).connect(out);drums.connect(out);bass.connect(out);
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
 const layers=kind==='reese'?[[1,'sawtooth',-.08,.25],[1,'sawtooth',.08,.25],[1,'sine',0,.65]]:kind==='pulse'||kind==='funk'?[[1,'sawtooth',0,.3],[1,'sine',0,.8]]:[[1,'sine',0,1],[2,'triangle',0,.2]];
 for(const [ratio,type,detune,level]of layers){const osc=c.createOscillator(),gain=c.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency*ratio*(kind==='808'?1.035:1),e.when);osc.frequency.exponentialRampToValueAtTime(frequency*ratio,e.when+.06);if(e.glide!==undefined)osc.frequency.exponentialRampToValueAtTime(440*2**((e.glide-69)/12)*ratio,Math.max(e.when+.065,end-.015));osc.detune.value=detune*100;gain.gain.value=level;osc.connect(gain).connect(filter);osc.start(e.when);osc.stop(end+.04);nodes.push(osc,gain);}
 nodes.find(n=>typeof n.start==='function').onended=()=>nodes.forEach(n=>{try{n.disconnect();}catch{}});
}
const noiseBuffers=new WeakMap();
export function renderNoiseFx(c,out,e,seed){
 let buffer=noiseBuffers.get(c);if(!buffer){buffer=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const rng=randomSource(seed),a=buffer.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=rng()*2-1;noiseBuffers.set(c,buffer);}
 const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain(),end=e.when+e.duration;source.buffer=buffer;source.loop=true;filter.type='highpass';filter.frequency.setValueAtTime(e.rise?800:4500,e.when);filter.frequency.exponentialRampToValueAtTime(e.rise?8000:1500,end);gain.gain.setValueAtTime(e.rise?.0001:e.level,e.when);gain.gain.exponentialRampToValueAtTime(e.rise?Math.max(.0001,e.level):.0001,end);source.connect(filter).connect(gain).connect(out);source.start(e.when);source.stop(end);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
}
