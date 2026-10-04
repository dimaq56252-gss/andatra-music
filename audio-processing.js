export const MAX_DURATION = 600;
export const MAX_PCM_BYTES = 256 * 1024 * 1024;
export const PRESETS = {
  rap: {label:'Рэп · плотный', low:1.5, mud:-1.8, high:1.2, threshold:-20, ratio:3, target:-16},
  soft: {label:'Мягко · естественно', low:0, mud:-.8, high:.5, threshold:-16, ratio:1.8, target:-19},
  punch: {label:'Плотно · энергично', low:2, mud:-1.2, high:1.5, threshold:-24, ratio:4, target:-14}
};
export const db = value => 20 * Math.log10(Math.max(1e-9, value));
export function measure(buffer) {
  let peak=0, sum=0;
  for(let c=0;c<buffer.numberOfChannels;c++) {
    const a=buffer.getChannelData(c);
    for(let i=0;i<a.length;i++){const v=a[i];if(!Number.isFinite(v))throw Error('В аудио есть повреждённые значения.');peak=Math.max(peak,Math.abs(v));sum+=v*v;}
  }
  return {peak,rms:Math.sqrt(sum/(buffer.length*buffer.numberOfChannels)),seconds:buffer.duration};
}
export function fitGains(tracks, automatic=false) {
  const gains=tracks.map(t=>t.muted?0:t.gain);
  if(!automatic)return gains;
  const levels=tracks.map(t=>measure(t.buffer));
  const meaningful=levels.map((l,i)=>({rms:l.rms,index:i})).filter(l=>gains[l.index]>0&&l.rms>1e-5).sort((a,b)=>a.rms-b.rms);
  const reference=meaningful[Math.floor(meaningful.length/2)]?.rms||.1;
  // Keep original balance; only reduce extreme level differences, never more than 6 dB.
  return gains.map((g,i)=>g&&levels[i].rms>1e-5?g*Math.max(.5,Math.min(2,Math.sqrt(reference/levels[i].rms))):g);
}
export function projectDuration(tracks,echo=0) {
  const end=Math.max(0,...tracks.filter(t=>!t.muted).map(t=>Math.max(0,t.start+t.offset/1000+t.buffer.duration)));
  if(end>MAX_DURATION+.01)throw Error('Проект длиннее 10 минут.');
  return Math.min(MAX_DURATION,end+(echo>0?1.5:0));
}
export async function renderProject(tracks,{master=1,echo=0,automatic=false}={}) {
  const duration=projectDuration(tracks,echo);
  if(duration<.01)throw Error('Нет слышимых дорожек.');
  const context=new OfflineAudioContext(2,Math.ceil(duration*44100),44100),out=context.createGain();
  out.gain.value=master;out.connect(context.destination);
  const gains=fitGains(tracks,automatic);
  tracks.forEach((track,i)=>{
    if(!gains[i])return;
    const start=track.start+track.offset/1000,offset=Math.max(0,-start),when=Math.max(0,start);
    if(offset>=track.buffer.duration||when>=duration)return;
    const source=context.createBufferSource(),gain=context.createGain();source.buffer=track.buffer;gain.gain.value=gains[i];source.connect(gain).connect(out);
    if(track.kind==='voice'&&echo>0){const delay=context.createDelay(1),wet=context.createGain(),feedback=context.createGain();delay.delayTime.value=.22;wet.gain.value=echo;feedback.gain.value=.23;gain.connect(delay);delay.connect(wet).connect(out);delay.connect(feedback).connect(delay);}
    source.start(when,offset,Math.min(track.buffer.duration-offset,duration-when));
  });
  return context.startRendering();
}
export async function processAudio(input,preset='rap',strength=1) {
  const p=PRESETS[preset];if(!p)throw Error('Неизвестный режим обработки.');
  if(input.duration>MAX_DURATION+.01)throw Error('Трек длиннее 10 минут.');
  const original=measure(input);if(original.peak<1e-6)throw Error('Файл содержит тишину.');
  const amount=Math.max(0,Math.min(1,strength));
  if(amount===0)return {buffer:input,before:original,after:original};
  const offline=new OfflineAudioContext(Math.min(2,input.numberOfChannels),input.length,input.sampleRate);
  const source=offline.createBufferSource();source.buffer=input;
  const highpass=offline.createBiquadFilter();highpass.type='highpass';highpass.frequency.value=25;
  const low=offline.createBiquadFilter();low.type='lowshelf';low.frequency.value=110;low.gain.value=p.low*amount;
  const mud=offline.createBiquadFilter();mud.type='peaking';mud.frequency.value=320;mud.Q.value=.8;mud.gain.value=p.mud*amount;
  const high=offline.createBiquadFilter();high.type='highshelf';high.frequency.value=6000;high.gain.value=p.high*amount;
  const compressor=offline.createDynamicsCompressor();compressor.threshold.value=-8+(p.threshold+8)*amount;compressor.knee.value=12;compressor.ratio.value=1+(p.ratio-1)*amount;compressor.attack.value=.015;compressor.release.value=.18;
  source.connect(highpass).connect(low).connect(mud).connect(high).connect(compressor).connect(offline.destination);source.start();
  const result=await offline.startRendering();
  const beforeLimit=measure(result),target=Math.pow(10,p.target/20),gain=Math.max(.25,Math.min(2,target/Math.max(beforeLimit.rms,1e-6)));
  limitPeaks(result,gain,Math.pow(10,-1/20));
  return {buffer:result,before:original,after:measure(result)};
}
// Stereo-linked lookahead gain envelope: no independent channel clipping or hard saturation.
export function limitPeaks(buffer,makeup=1,ceiling=.89125094) {
  const arrays=Array.from({length:buffer.numberOfChannels},(_,c)=>buffer.getChannelData(c)),n=buffer.length;
  const look=Math.max(1,Math.round(buffer.sampleRate*.003)),queue=new Int32Array(look+3),peaks=new Float32Array(look+3);
  const capacity=queue.length;let head=0,tail=0,envelope=1;
  const release=1-Math.exp(-1/(buffer.sampleRate*.08));
  function push(i){let peak=0;for(const a of arrays)peak=Math.max(peak,Math.abs(a[i])*makeup);while(head!==tail&&peaks[(tail-1+capacity)%capacity]<=peak)tail=(tail-1+capacity)%capacity;queue[tail]=i;peaks[tail]=peak;tail=(tail+1)%capacity;}
  for(let j=0;j<Math.min(n,look+1);j++)push(j);
  for(let i=0;i<n;i++) {
    while(head!==tail&&queue[head]<i)head=(head+1)%capacity;
    const peak=head===tail?0:peaks[head],wanted=peak>ceiling?ceiling/peak:1;
    envelope=wanted<envelope?wanted:Math.min(wanted,envelope+(1-envelope)*release);
    for(const a of arrays)a[i]*=makeup*envelope;
    if(i+look+1<n)push(i+look+1);
  }
  return buffer;
}
export function wavBytes(buffer) {
  const channels=Math.min(2,buffer.numberOfChannels),frames=buffer.length,data=new ArrayBuffer(44+frames*channels*2),v=new DataView(data);
  const str=(at,s)=>[...s].forEach((c,i)=>v.setUint8(at+i,c.charCodeAt(0)));
  str(0,'RIFF');v.setUint32(4,data.byteLength-8,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,channels,true);v.setUint32(24,buffer.sampleRate,true);v.setUint32(28,buffer.sampleRate*channels*2,true);v.setUint16(32,channels*2,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,frames*channels*2,true);
  const arrays=Array.from({length:channels},(_,c)=>buffer.getChannelData(c));let at=44;
  for(let i=0;i<frames;i++)for(const a of arrays){const s=Math.max(-1,Math.min(1,a[i]));v.setInt16(at,Math.round(s*(s<0?32768:32767)),true);at+=2;}return data;
}
