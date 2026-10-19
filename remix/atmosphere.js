import {structurePlan,sectionAt} from './structure.js?v=catalog-36';
// Original sustained timbres and a damped stereo reverb; no additional sound downloads.
export function atmosphereEvents(duration,s,composition){
 if(!s.harmony||s.atmosphere<=0)return [];
 const bar=240/s.bpm,events=[],scale=composition.scale,plan=structurePlan(duration,s,composition.profile);
 const color=['trap','drill','phonk'].includes(s.style)?'dark':['lofi','rnb','boom'].includes(s.style)?'warm':s.style==='synth'?'wide':'air';
 for(let b=Math.floor(-s.offset/bar)-1;s.offset+b*bar<duration;b++){
  const when=s.offset+b*bar;if(when<0)continue;
  const degree=composition.plan.get(b)??0,chorus=sectionAt(plan,when)==='chorus',voices=chorus?[degree,degree+4,degree+9]:[degree,degree+4];
  for(const [voice,d]of voices.entries()){
   let note=48+s.root+scale[d%7]+12*Math.floor(d/7);while(note>72)note-=12;
   events.push({kind:'atmosphere',role:'chord',instrument:color,note,when,duration:Math.min(bar,duration-when),level:s.atmosphere*.075*(voice===2?.3:voice?.8:1)*(chorus?1.08:1),pan:voice===2?0:voice?(chorus?.8:.4):(chorus?-.8:-.4)});
  }
 }
 return events;
}
export function createSpace(c,out,s){
 const pad=c.createGain(),send=c.createGain(),hp=c.createBiquadFilter(),low=c.createBiquadFilter(),dry=c.createGain();
 hp.type='highpass';hp.frequency.value=180;low.type='lowpass';low.frequency.value=['trap','drill','phonk'].includes(s.style)?3400:5200;
 pad.connect(hp).connect(low).connect(dry).connect(out);dry.gain.value=.85;
 low.connect(send);send.gain.value=s.atmosphere;
 const input=c.createGain(),pre=c.createDelay(.1),cut=c.createBiquadFilter();input.gain.value=.13*s.atmosphere;input.connect(send);send.connect(pre).connect(cut);pre.delayTime.value=Math.round(.019*c.sampleRate)/c.sampleRate;cut.type='highpass';cut.frequency.value=220;
 // Four comb branches with different stereo positions and low-pass feedback diffuse the tail.
 for(const [i,t]of [.037,.053,.079,.113].entries()){
  const delay=c.createDelay(1),damp=c.createBiquadFilter(),feedback=c.createGain(),wet=c.createGain(),pan=c.createStereoPanner();
  delay.delayTime.value=Math.round(t*(1+(s.seed%13)*.003)*c.sampleRate)/c.sampleRate;damp.type='lowpass';damp.frequency.value=2500+i*650;
  feedback.gain.value=.66+i*.025;wet.gain.value=.17;pan.pan.value=[-.85,.7,-.45,.9][i];
  cut.connect(delay);delay.connect(damp).connect(feedback).connect(delay);damp.connect(wet).connect(pan).connect(out);
 }
 return {pad,send:input};
}
export function renderAtmosphere(c,out,e){
 const duration=e.duration;if(duration<=.015)return;
 const type=e.instrument,held=e.kind==='atmosphere'||['pad','strings'].includes(type),dark=type==='dark',warm=type==='warm';
 const attack=Math.min(held?(type==='strings'?.12:.65):.025,duration*.32),release=Math.min(held?.65:.16,duration*.3),end=e.when+duration;
 const gain=c.createGain(),filter=c.createBiquadFilter(),pan=c.createStereoPanner(),nodes=[gain,filter,pan];
 const level=Math.max(.0001,e.level*(held?.72:.8)),elapsed=e.elapsed||0;
 gain.gain.setValueAtTime(elapsed>=attack?level:.0001,e.when);
 if(elapsed<attack)gain.gain.linearRampToValueAtTime(level,e.when+attack);
 gain.gain.setValueAtTime(level,Math.max(e.when+attack,end-release));gain.gain.exponentialRampToValueAtTime(.0001,end);
 filter.type='lowpass';filter.Q.value=.55;const cutoff=dark?1350:warm?2100:type==='organ'?3600:3100;
 filter.frequency.setValueAtTime(cutoff*.65,e.when);filter.frequency.linearRampToValueAtTime(cutoff,Math.max(e.when+.01,end-duration*.25));
 pan.pan.value=e.pan??Math.sin(e.note*.7)*.3;filter.connect(gain).connect(pan).connect(out);
 const frequency=440*2**((e.note-69)/12),layers=type==='organ'?[[1,'sine',0,.6],[2,'sine',0,.24],[4,'sine',0,.1]]:held?[[1,'triangle',-8,.52],[1,'sawtooth',7,.2],[2,'sine',2,.14]]:[[1,'sawtooth',-5,.42],[1,'sawtooth',5,.32],[1,'sine',0,.3]];
 for(const [ratio,wave,detune,amount]of layers){const osc=c.createOscillator(),part=c.createGain();osc.type=wave;osc.frequency.value=frequency*ratio;osc.detune.value=detune;part.gain.value=amount;osc.connect(part).connect(filter);osc.start(e.when);osc.stop(end+.01);nodes.push(osc,part);}
 // A slow filter movement keeps sustained layers alive without adding another melody.
 const lfo=c.createOscillator(),movement=c.createGain();lfo.frequency.value=.07+(e.note%7)*.013;movement.gain.value=cutoff*.13;lfo.connect(movement).connect(filter.frequency);lfo.start(e.when);lfo.stop(end+.01);nodes.push(lfo,movement);
 nodes.find(n=>typeof n.start==='function').onended=()=>nodes.forEach(n=>{try{n.disconnect();}catch{}});
}
