import {melodyConfig} from './melodies.js?v=3';
export const voices=[['KICK','A','kick'],['SNARE','S','snare'],['CLAP','D','clap'],['HI-HAT','F','hat'],['OPEN HAT','G','open'],['808','H','bass'],['TOM','J','tom'],['RIM','K','rim']];
export function stepTime(step,bpm,swing=0){return (step+((step%2)?swing:0))*60/bpm/4;}
export function validateProject(value){
 if(![1,2].includes(value?.version)||!Array.isArray(value.patterns)||value.patterns.length!==4)throw Error('Это не проект ANDATRA Beat Maker.');
 const patterns=value.patterns.map(p=>{if(!Array.isArray(p)||p.length!==8||p.some(r=>!Array.isArray(r)||r.length!==16||r.some(v=>typeof v!=='number'||!Number.isFinite(v)||v<0||v>1)))throw Error('Повреждённый паттерн.');return p.map(r=>r.slice());});
 const clamp=(v,min,max,fallback)=>Number.isFinite(v)?Math.min(max,Math.max(min,v)):fallback;
 return {version:2,patterns,melodies:Array.from({length:4},(_,i)=>melodyConfig(value.melodies?.[i])),bpm:clamp(value.bpm,40,240,100),swing:clamp(value.swing,0,.65,0),kit:['classic','trap','electro'].includes(value.kit)?value.kit:'classic',volume:clamp(value.volume,0,1,.8),mix:voices.map((_,i)=>clamp(value.mix?.[i],0,1,1)),muted:voices.map((_,i)=>value.muted?.[i]===true)};
}
const noiseCache=new WeakMap();
export function bus(context,destination,volume=.8){const gain=context.createGain(),limiter=context.createDynamicsCompressor();gain.gain.value=volume;limiter.threshold.value=-6;limiter.ratio.value=12;gain.connect(limiter).connect(destination);return gain;}
export function trigger(c,destination,index,when,velocity=1,kit='classic'){
 const kind=voices[index][2],nodes=[];const gain=c.createGain();gain.gain.setValueAtTime(Math.max(.001,velocity*.65),when);gain.connect(destination);nodes.push(gain);
 const tonal=['kick','bass','tom','rim'].includes(kind);let duration=kind==='bass'?.8:kind==='open'?.35:kind==='tom'?.3:kind==='rim'?.045:.16;
 if(kit==='trap'&&kind==='bass')duration=1.2;
 if(tonal){const osc=c.createOscillator();osc.type=kit==='electro'&&kind==='bass'?'triangle':'sine';const initial={kick:kit==='trap'?170:150,bass:55,tom:170,rim:850}[kind];osc.frequency.setValueAtTime(initial,when);osc.frequency.exponentialRampToValueAtTime(kind==='rim'?500:kind==='bass'?41:45,when+Math.min(duration,.18));gain.gain.exponentialRampToValueAtTime(.001,when+duration);osc.connect(gain);osc.start(when);osc.stop(when+duration);nodes.push(osc);}
 else{let buffer=noiseCache.get(c);if(!buffer){buffer=c.createBuffer(1,c.sampleRate,c.sampleRate);const samples=buffer.getChannelData(0);let seed=173;for(let i=0;i<samples.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;samples[i]=seed/2147483648-1;}noiseCache.set(c,buffer);}
 const source=c.createBufferSource(),filter=c.createBiquadFilter();source.buffer=buffer;filter.type=kind==='snare'?'bandpass':'highpass';filter.frequency.value=kind==='snare'?1600:kit==='electro'?7000:5000;source.connect(filter).connect(gain);nodes.push(source,filter);
 if(kind==='clap'){gain.gain.setValueAtTime(.001,when);for(let n=0;n<3;n++){gain.gain.setValueAtTime(velocity*.55,when+n*.014);gain.gain.exponentialRampToValueAtTime(.01,when+n*.014+.012);}gain.gain.setValueAtTime(velocity*.35,when+.045);}
 gain.gain.exponentialRampToValueAtTime(.001,when+duration);source.start(when);source.stop(when+duration);
 if(kind==='snare'){const tone=c.createOscillator(),body=c.createGain();tone.frequency.value=180;body.gain.setValueAtTime(velocity*.18,when);body.gain.exponentialRampToValueAtTime(.001,when+.1);tone.connect(body).connect(destination);tone.start(when);tone.stop(when+.1);nodes.push(tone,body);}}
 const source=nodes.find(n=>typeof n.start==='function'); if(source)source.onended=()=>nodes.forEach(n=>{try{n.disconnect();}catch{}});
 return nodes;
}
export function wav(buffer){const channels=Math.min(2,buffer.numberOfChannels),frames=buffer.length,bytes=new ArrayBuffer(44+frames*channels*2),view=new DataView(bytes);const str=(at,s)=>[...s].forEach((c,i)=>view.setUint8(at+i,c.charCodeAt(0)));str(0,'RIFF');view.setUint32(4,bytes.byteLength-8,true);str(8,'WAVE');str(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,channels,true);view.setUint32(24,buffer.sampleRate,true);view.setUint32(28,buffer.sampleRate*channels*2,true);view.setUint16(32,channels*2,true);view.setUint16(34,16,true);str(36,'data');view.setUint32(40,frames*channels*2,true);const arrays=Array.from({length:channels},(_,c)=>buffer.getChannelData(c));let at=44;for(let i=0;i<frames;i++)for(let c=0;c<channels;c++){const s=Math.max(-1,Math.min(1,arrays[c][i]));view.setInt16(at,Math.round(s*(s<0?32768:32767)),true);at+=2;}return new Blob([bytes],{type:'audio/wav'});}

