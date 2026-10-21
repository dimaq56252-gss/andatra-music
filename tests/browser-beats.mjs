import assert from 'node:assert/strict';
import {generationOptions,validateResult,durationFits,MODEL_BYTES} from '../browser-beats/core.js';
for(const style of ['boom','trap','gfunk','cinematic','lofi']){
 const s=generationOptions({style,bpm:92,duration:10,description:'warm bass'},42);
 assert.equal(s.lyrics,'');assert.equal(s.writeLyrics,false);assert.equal(s.semanticPlanning,false);assert.equal(s.plannerQuality,'turbo');assert.equal(s.audioQuality,'standard');assert.equal(s.durationSeconds,10);
 assert.ok(!Object.keys(s).some(k=>/audio_url|reference|inputAudio|apiKey/.test(k)));assert.match(s.prompt,/No singing/);assert.match(s.prompt,/warm bass/);
}
assert.throws(()=>generationOptions({style:'boom',bpm:5,duration:10,description:''},1));
assert.throws(()=>generationOptions({style:'boom',bpm:90,duration:300,description:''},1));
assert.equal(durationFits(10,1e6),false);assert.equal(durationFits(10,1e9),true);assert.equal(durationFits(120,128*1024*1024),false);
assert.equal(MODEL_BYTES,5747730175);
const result={instrumental:true,lyrics:'',wav:new Blob(['RIFF'],{type:'audio/wav'}),audioBuffer:{numberOfChannels:1,length:3,sampleRate:48000,getChannelData:()=>new Float32Array([.1,-.1,.1])}};
assert.ok(validateResult(result).rms>0);
assert.throws(()=>validateResult({...result,instrumental:false}));
assert.throws(()=>validateResult({...result,lyrics:'sung words'}));
assert.throws(()=>validateResult({...result,audioBuffer:{...result.audioBuffer,getChannelData:()=>new Float32Array([NaN,0,0])}}));
assert.throws(()=>validateResult({...result,audioBuffer:{...result.audioBuffer,getChannelData:()=>new Float32Array(3)}}));
console.log('PASS: browser-only instrumental settings, bounded durations, buffer limits, finite/non-silent audio checks. No model inference was run.');

const {fluidRequest}=await import('../browser-beats/engine.js');
const {assertAceGenerationRequest}=await import('../browser-beats/fluid/client.js');
for(const style of ['boom','trap','gfunk','cinematic','lofi']){const request=fluidRequest(generationOptions({style,bpm:92,duration:10,description:'a'.repeat(150)},42));assertAceGenerationRequest(request);assert.equal(request.seed,'000000000000002a');assert.equal(request.instrumental,true);assert.deepEqual(request.planner,{mode:'disabled'});assert.equal(request.metadata.bpm,92);assert.equal(request.lyrics,'');assert.ok(request.prompt.length<=512);}
console.log('PASS: actual FluidAudio request validator accepts all instrumental styles and maximum description.');
