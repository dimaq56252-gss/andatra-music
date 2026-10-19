// Original Web Audio voices: subtractive, FM, additive, wavetable and plucked-string synthesis.
export const SYNTHS={analog:'Аналоговый лид',supersaw:'SuperSaw · 7 голосов',fm:'FM · мягкие клавиши',bellfm:'FM · металлический колокол',glass:'Аддитивный · стекло',wavetable:'Волновой · движущийся спектр',acid:'Acid · резонансный фильтр',softpluck:'Синтезаторный плак',karplus:'Щипковая струна',shimmer:'Воздушный синтезатор',sublead:'Лид с субоктавой',hollow:'Полый цифровой тембр'};
export function renderSynth(c,out,e){
 if(!SYNTHS[e.instrument])return false;
 const t=e.when,d=Math.max(.035,e.duration),kind=e.instrument,held=['supersaw','shimmer','wavetable','analog','sublead','hollow'].includes(kind),attack=Math.min(held?.035:.006,d*.2),release=Math.min(held?.22:.12,d*.3),end=t+d,frequency=440*2**((e.note-69)/12),nodes=[];
 const amp=c.createGain(),filter=c.createBiquadFilter(),pan=c.createStereoPanner();nodes.push(amp,filter,pan);
 const peak=Math.max(.0001,e.level*.72);amp.gain.setValueAtTime(.0001,t);amp.gain.linearRampToValueAtTime(peak,t+attack);amp.gain.exponentialRampToValueAtTime(held?peak*.7:Math.max(.0001,peak*.22),Math.max(t+attack,end-release));amp.gain.exponentialRampToValueAtTime(.0001,end);
 filter.type='lowpass';filter.Q.value=kind==='acid'?7:.65;filter.frequency.setValueAtTime(Math.min(14000,kind==='acid'?frequency*12:kind==='shimmer'?6500:kind==='softpluck'?4800:8500),t);filter.frequency.exponentialRampToValueAtTime(Math.max(180,kind==='acid'?frequency*1.4:kind==='softpluck'?650:held?2800:1800),end);
 pan.pan.value=e.pan??0;filter.connect(amp).connect(pan).connect(out);
 const add=(ratio,wave,volume,detune=0)=>{const osc=c.createOscillator(),gain=c.createGain();osc.type=wave;osc.frequency.setValueAtTime(frequency*ratio,t);osc.detune.value=detune;gain.gain.value=volume;osc.connect(gain).connect(filter);nodes.push(osc,gain);return osc;};
 if(kind==='karplus'){
  // A decaying delay-line string, generated once per note; deterministic excitation.
  const n=Math.max(8,Math.round(c.sampleRate/frequency)),ring=new Float32Array(n),buffer=c.createBuffer(1,Math.ceil(d*c.sampleRate),c.sampleRate),data=buffer.getChannelData(0);let state=(e.note*1103515245+12345)>>>0;
  for(let i=0;i<n;i++){state=(Math.imul(state,1664525)+1013904223)>>>0;ring[i]=((state/4294967296)*2-1)*.7;}
  for(let i=0;i<data.length;i++){const k=i%n;data[i]=ring[k];ring[k]=.996*.5*(ring[k]+ring[(k+1)%n]);}
  const source=c.createBufferSource();source.buffer=buffer;source.connect(filter);nodes.push(source);
 }else if(kind==='fm'||kind==='bellfm'){
  const carrier=add(1,'sine',.8),mod=c.createOscillator(),index=c.createGain();mod.frequency.value=frequency*(kind==='bellfm'?2.76:2);index.gain.setValueAtTime(frequency*(kind==='bellfm'?3.2:1.5),t);index.gain.exponentialRampToValueAtTime(frequency*.025,end);mod.connect(index).connect(carrier.frequency);nodes.push(mod,index);
 }else if(kind==='wavetable'||kind==='hollow'){
  const osc=add(1,'sine',.7),real=new Float32Array(17),imag=new Float32Array(17);for(let i=1;i<17;i++)imag[i]=kind==='hollow'?(i%2?1/i:0):Math.sin(i*1.7)**2/i;osc.setPeriodicWave(c.createPeriodicWave(real,imag));
  const lfo=c.createOscillator(),depth=c.createGain();lfo.frequency.value=.23;depth.gain.value=1200;lfo.connect(depth).connect(filter.frequency);nodes.push(lfo,depth);
 }else if(kind==='supersaw')for(let i=-3;i<=3;i++)add(1,'sawtooth',.12,i*6);
 else if(kind==='glass')for(const [r,v]of [[1,.6],[2,.22],[3,.12],[5,.06]])add(r,'sine',v);
 else if(kind==='shimmer')for(const [r,v,dt]of [[1,.4,-7],[1,.3,7],[2,.16,3],[4,.06,-3]])add(r,'triangle',v,dt);
 else if(kind==='acid')add(1,'sawtooth',.7);
 else if(kind==='sublead'){add(1,'sawtooth',.35,-4);add(1,'square',.16,4);add(.5,'sine',.45);}
 else if(kind==='softpluck'){add(1,'triangle',.7);add(2,'sine',.18);}
 else{add(1,'sawtooth',.4,-6);add(1,'sawtooth',.4,6);}
 const sources=nodes.filter(n=>typeof n.start==='function');for(const source of sources){source.start(t);source.stop(end+.01);}sources.at(-1).onended=()=>nodes.forEach(n=>{try{n.disconnect();}catch{}});return true;
}
